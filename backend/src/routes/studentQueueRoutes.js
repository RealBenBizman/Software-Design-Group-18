import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import{ getDb } from "../db.js";

const router = express.Router();
router.use(requireAuth, requireRole("student"));

router.get("/services", async (req,res) =>
{ const db=await getDb();
  try{
    const services=await db.all(`SELECT * FROM Service`);
    const serviceAndCounts=await Promise.all(
      services.map(async(service) =>
      {
        const countResult =await db.get(
          `SELECT COUNT(*) as count FROM QueueEntry WHERE serviceID = ? AND status = 'waiting'`,
          [service.serviceID]
        );
        const count=countResult ? countResult.count:0;
        const estWait=count * (service.expectedDuration || 5);

        return{
          ...service,
          id: service.serviceID,
          people: count,
          waitMinutes:estWait
        };
      })
    );
    return res.json({
      success:true,
      services: serviceAndCounts
    });
  } catch (error){
    console.error("Error getting services:",error);

    return res.status(500).json({ success: false,message: "Database error getting services"});
  }
});

router.post("/join", async(req,res)=>
{
  const{serviceID,priority}=req.body;
  const userID=req.user.userID;

  if(!serviceID)
  {
    return res.status(400).json({ success:false,message:"serviceID is required."});
  }

  try{ const db=await getDb();
    const service=await db.get(`SELECT * FROM Service WHERE serviceID=?`,[serviceID]);
    if(!service)
    {
      return res.status(404).json({success:false, message:"Could not find service."});
    }
    const existingEntry=await db.get(
      `SELECT * FROM QueueEntry WHERE userID=? AND status='waiting'`,
      [userID]
    );

    if (existingEntry)
    {
      return res.status(409).json({success:false, message:"You already have an active queue entry."});
    }
    const joinTime=new Date().toISOString();
    const queueID=`q-${serviceID}`;

    await db.run(
      `INSERT OR IGNORE INTO Queue (queueID,serviceID,status,createdAt) VALUES (?,?,?,?)`,
      [queueID,serviceID,'open',joinTime]
    );
    const result=await db.run(
      `INSERT INTO QueueEntry (queueID, userID,serviceID,priority,joinTime,status) VALUES(?,?,?,?,?,?)`,
      [queueID,userID,serviceID,priority||'Standard',joinTime,'waiting']
    );
    const positionResult=await db.get(
      `SELECT COUNT(*) as count FROM QueueEntry WHERE serviceID=? AND status='waiting' AND entryID <= ?`,
      [serviceID, result.lastID]
    );

    const position=positionResult.count;
    const estWaitMinutes=position*(service.expectedDuration ||5);

    return res.status(201).json({
      success:true,
      message:"Successfully joined queue!",
      queueData:{
        entryID: result.lastID,
        userID,
        serviceID,
        serviceName:service.serviceName,
        priority:priority||'Standard',
        joinedAt: joinTime,
        position,
        estWaitMinutes,
        queueStatus:'waiting'
      }
    });
  } catch (error) {
    console.error("Error joining queue:",error);
    return res.status(500).json({success:false, message: "error with Database joining queue."});
  }
});

router.post("/leave", async(req,res)=>{
 
  const userID=req.user.userID;

  try{ const db= await getDb();
    const activeEntry=await db.get(
      `SELECT * FROM QueueEntry WHERE userId=? AND status = 'waiting'`,
      [userID]
    );

    if(!activeEntry)
    {
      return res.status(404).json({ success:false, message: "Could not find active queue entry."});
    }
    await db.run(
      `UPDATE QueueEntry SET status='canceled' WHERE entryID=?`,
      [activeEntry.entryID]
    );

    return res.json({
      success:true,
      message: "You have left the queue.",
      removed: activeEntry
    });
  } catch (error){
    console.error("Error leaving the queue:",error);
    return res.status(500).json({success:false, message: "Database error leaving the queue."});
  }
});

router.get("/status/:userID",async(req,res)=>{
  
  const targetUserID=req.params.userID;

  if (targetUserID !== "me" && targetUserID !== String(req.user.userID))
  {return res.status(403).json({success: false, message:"You are not authorized to view this status."});
}
const userID=req.user.userID;
try{ const db=await getDb();
  const activeEntry=await db.get(
    `SELECT qe.*, s.serviceName, s.expectedDuration
    FROM QueueEntry qe
    JOIN Service s ON qe.serviceID=s.serviceID
    WHERE qe.userID= ? AND qe.status ='waiting'`,
    [userID]
  );

  if(!activeEntry)
  {
    return res.json({
      success: true,
      inQueue: false,
      message: "You are not in a queue."
    });
  }
const aheadResult = await db.get(
  `SELECT COUNT(*) as count FROM QueueEntry
  WHERE serviceID =? AND status='waiting' AND entryID <?`,
  [activeEntry.serviceID, activeEntry.entryID]
);

const aheadPeople= aheadResult.count;
const position=aheadPeople +1;
const estWaitMinutes=position*(activeEntry.expectedDuration ||5);

return res.json({
  success: true,
  inQueue:true,
  status:{
    entryID: activeEntry.entryID,
    userID: activeEntry.userID,
    serviceID: activeEntry.serviceID,
    serviceName:activeEntry.serviceName,
    priority:activeEntry.priority,
    joinedsAt:activeEntry.joinTime,
    position,
    aheadPeople,
    estWaitMinutes,
    queueStatus:activeEntry.status
  }
});
} catch (error){
  console.error("Error retrieving queue status:",error);
  return res.sendStatus(500).json({success:false,message:"Database error checking status."});
}
});

export default router;
