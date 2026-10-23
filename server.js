import express from 'express';
import cors from 'cors';

const app= express();
const PORT=process.env.PORT || 5001;

app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());
let queue=[
    {
        queueID: 'q-101',
        userID:'user-1',
        userName:'Jane Doe',
        serviceID: 'financial-aid',
        priority:'Standard',
        joinedAt: new Date(Date.now()-15*60000).toISOString(),
    },
    {
        queueID:'q-102',
        userID:'user-2',
        userName:'John Smith',
        serviceID:'financial-aid',
        priority:'High',
        joinedAt: new Date(Date.now()-5*60000).toISOString(),
    }
];
const AVG_SERVICE_TIME_MIN=5;
app.post('/api/queue/join',(req,res)=> {
    const{userID,userName,serviceID,priority }=req.body;
    if (!userID||!userName||!serviceID)
    {
        return res.status(400).json({
            success:false,
            message: 'Error: userID,userName, and serviceID must be filled.'
        });
    }

    const NewQueueItem={
        queueID:`q-${Date.now()}`,
        userID,
        userName,
        serviceID,
        priority: priority||'Standard',
        joinedAt: new Date().toISOString(),
    };

    queue.push(NewQueueItem);

    const position=queue.length;
    const estWait=position*AVG_SERVICE_TIME_MIN;

    return res.status(201).json({
        success:true,
        message:'Successfully joined queue',
        queueData:{
            ...NewQueueItem,
            position,
            estWaitMinutes: estWait
        }
    });
});
app.post('/api/queue/leave',(req,res)=>{
    const{userID,serviceID}=req.body;
    if(!userID||!serviceID)
    {
        return res.status(400).json({
            success:false,
            message: 'Error: userID and/or serviceID are empty.'
        });
    }
    const index=queue.findIndex(
        item=>item.userID===userID&&item.serviceID===serviceID
    );

    if (index===-1)
    {
        return res.status(404).json({
            success:false,
            message:'Cannot find active queue for user.'
        });
    }

    const removedItem=queue.splice(index,1)[0];
    return res.status(200).json({
        success:true,
        message:'Success! you have left the queue.',
        removed:removedItem
    });
});

app.get('/api/queue/status/:userID',(req,res)=>
{
    const{userID}=req.params;
    const userIndex=queue.findIndex(item=>item.userID===userID);
    if(userIndex===-1)
    {
        return res.status(200).json({
            success:true,
            inQueue:false,
            message:'User is not in a queue.'
        });
    }

    const userEntry=queue[userIndex];
    const position=userIndex + 1;
    const estWaitMinutes=position*AVG_SERVICE_TIME_MIN;
    return res.status(200).json({
        success:true,
        inQueue:true,
        status:{
            ...userEntry,
            position,
            aheadPeople: userIndex,
            estWaitMinutes
        }
    });
});

app.get('/api/queue',(req,res)=>
{
    res.status(200).json({
        success:true,
        count:queue.length,
        queue
    });
});

app.listen(PORT,()=>
{
    console.log(`Server running on http://localhost:${PORT}`);
});
setInterval(()=>{},10000);