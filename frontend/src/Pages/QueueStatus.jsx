import React, {useState,useEffect} from 'react';
const QueueStatus =() => {
    const [inQueue,setInQueue]=useState(true);
    const[showCancelModal,setShowCancelModal]=useState(false);

    const[currentSpot, setCurrentSpot]=useState(1);
    const[notif,setNotif]=useState([
        {id: 1, text:'You are in the queue for FAFSA and Application Assistance.', time: '1:30 PM',type:'info'},
        {id: 2, text:'Your spot has moved up! you are now #3 in line.',time:'1:40 PM',type:'update'}
    ]);
    const steps=['Joined','Waiting','Coming Up','It Is Your Turn'];

    // Tickets and Queue Info
    const queueData ={
        ticketNum: 'A-104',
        serviceNam:'FAFSA and Application Assistance',
        spotInLine: 3,
        estWait: '20 minutes',
        advisorNam: 'Paula Wilson',
        advisorOffice: 'Room 106A',
        timeJoin: '1:30 PM',
    };

    const handleQueueLeave =()=> {
        setInQueue(false);
        setShowCancelModal(false);
    };

    if (!inQueue){
        return (
            <div style={{maxWidth:'500px',margin:'35px auto',padding:'25px',textAlign:'center',fontFamily:'sans-serif'}}>
                <div style={{backgroundColor: '#ffffff',border:'2px solid #82C8E5', borderRadius: '10px',padding:'30px'}}>
                <h2 style={{color:'#000080', marginTop:0}}>You are no longer in the queue</h2>
                <p style={{color:'#6D8196',fontSize:'15px'}}>You no longer have your spot, for further assistance, please rejoin the queue.</p>
                <button
                onClick={()=>setInQueue(true)}
                style={{
                    marginTop: '15px',
                    padding: '10px 20px',
                    backgroundColor: '#0047AB',
                    color: 'white',
                    border:'none',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    cursor:'pointer',
                    fontSize:'15px',
                }}
                >
                    Rejoin Queue
                </button>
            </div>
            </div>
        );
    }
    return(
        <div style={{ maxWidth:'700px', margin: '0 auto',padding:'25px', fontFamily:'sans-serif'}}>
            <h2 style={{color:'#000080',marginBottom:'5px'}}>Live Queue: </h2>
            <p style={{color: '#6D8196',marginBottom: '25px'}}>Track your spot in line</p>
            {/* Queue Notifications */}
            <div style={{ backgroundColor: '$ffffff', border: '1.3px solid #6D8196',borderRadius:'8px',padding:'18px',marginBottom:'20px'}}>
                <h3 style={{color: '#000080',marginTop:0,fontSize:'15px', marginBottom:'12px'}}>Queue Notifications</h3>
                <div style={{display:'flex',flexDirection:'column',gap: '8px'}}>
                    {notif.slice().reverse().map((note)=>(
                        <div key={note.id} style={{padding:'10px 12px',backgroundColor: '#f0f7fc',borderRadius:'5px',borderLeft: '3px solid #0047AB',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:'14px',color:'#000080'}}>{note.text}</span>
                            <span style={{fontSize:'12px', color: '#6D8196',marginLeft:'8px'}}>{note.time}</span>
                            </div>
                    ))}
                </div>
            </div>

            {/* Main Status Ticket */}
            <div style={{backgroundColor:'#ffffff',border:'2px solid #0047AB',borderRadius:'10px',padding:'25px',boxShadow:'0 5px 12px rgba(0,0,0,0.5)',marginBottom: '25px'}}>
                {/* Ticket Header */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'2px solid #82C8E5',paddingBottom:'15px',marginBottom:'20px',flexWrap:'wrap',gap:'10px'}}>
                    <div>
                        <span style={{fontSize:'14px',color:'#6D8196',textTransform: 'uppercase',fontWeight:'bold'}}>Ticket Number</span>
                        <h1 style={{color:'#000080',margin:'4px 0 0',fontSize:'35px'}}>{queueData.ticketNum}</h1>
                    </div>
                    <div style={{backgrooundColor:'#82C8E5',color:'#000080',padding:'6px 12px',borderRadius:'18px',fontWeight:'bold',fontSize:'12px'}}>Active In Line</div>
                </div>
                {/*Track your status */}
                <div style={{marginBottom:'25px'}}>
                    <span style={{fontSize:'14px',color:'#6D8196',fontWeight:'bold',textTransform:'uppercase',display:'block',marginBottom:'13px'}}>
                        Queue Progress
                    </span>
                    <div style={{display:'flex', justifyContent:'space-between',position:'relative'}}>
                        {steps.map((step,idx)=>{
                            const isComplete=idx<=currentSpot;
                            const isCurrent = idx ===currentSpot;
                            return (
                                <div 
                                key={step}
                                onClick={()=>setCurrentSpot(idx)}
                                style={{flex:1, textAlign:'center',cursor:'pointer',position:'relative',zIndex:1}}
                                >
                                    <div style={{
                                        width:'30px',
                                        height:'30px',
                                        borderRadius:'50%',
                                        backgroundColor: isComplete ? '#0047AB': '#e0e0e0',
                                        color: isComplete ? 'white' : '#6D8196',
                                        display: 'flex',
                                        alignItems:'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 8px auto',
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                        border: isCurrent ? '3px solid #82C8E5' : 'none',
                                        boxShadow: isCurrent ? '0 0 8px rgba(0,71,171,0.4)' : 'none'
                                    }}>
                                        {idx +1}
                                        </div>
                                        <span style={{
                                            fontSize:'10px',
                                            fontWeight: isCurrent ? 'bold' : 'normal',
                                            color: isComplete ? '#000080': '#6D8196'
                                        }}>
                                            {step}
                                        </span>
                                        </div>
                            );
                        })}
                    </div>
                </div>
                {/* Queue Metrics */}
                <div style={{display:'flex',gap:'15px',marginBottom:'25px',flexWrap:'wrap'}}>
                    <div style={{ flex: '1 1 200px',backgroundColor:'#f0f7fc',padding:'15px',borderRadius:'8px',borderLeft:'5px solid #0047AB'}}>
                        <span style={{fontSize:'15px', color: '#6D8196',display:'block'}}>Your Position In Line:</span>
                        <strong style={{fontSize:'25px',color:'#000080'}}>{queueData.spotInLine}</strong>
                        <span style={{fontSize:'12px',color:'#6D8196',display:'block',marginTop:'2px'}}> People Ahead </span>
                    </div>
                    <div style={{flex:'1 1 200px',backgroundColor:'#f0f7fc',padding:'15px',borderRadius:'8px',borderLeft:'4px solid #82C8E5'}}>
                        <span style={{fontSize:'15px',color:'#6D8196',display:'block'}}>Estimated Wait:</span>
                        <strong style={{fontSize:'25px',color:'#0047AB'}}>{queueData.estWait}</strong>
                        <span style={{fontSize:'12px',color:'#6D8196',display:'block',marginTop:'2px'}}>*subject to change*</span>
                    </div>
                </div>
                {/* Service Details */}
                <div style={{borderTop:'2px solid #eee',paddingTop:'15px',marginBottom:'20px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px',fontSize:'12px'}}>
                        <span style={{color:'#6D8196'}}>Selected Service:</span>
                        <strong style={{color:'#000080'}}>{queueData.serviceNam}</strong>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px',fontSize:'12px'}}>
                        <span style={{color: '#6D8196'}}>Location:</span>
                        <strong style={{color:'#000080'}}>{queueData.advisorOffice}</strong>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px',fontSize:'12px'}}>
                        <span style={{color:'#6D8196'}}>Queue Joined At:</span>
                        <strong style={{color:'#000080'}}>{queueData.timeJoin}</strong>
                    </div>
                </div>
                {/* Leave Queue Button */}
                <button
                onClick={()=> setShowCancelModal(true)}
                style={{
                    width:'100%',
                    padding:'12px',
                    backgroundColor:'transparent',
                    color:'#6D8196',
                    border: '3px solid #6D8196',
                    borderRadius:'4px',
                    fontWeight:'bold',
                    fontSize:'14px',
                    cursor:'pointer',
                   
                }}
                >
                    Leave Queue
                </button>
            </div>
            
            {/* Confirmation Modal overlay */}
            {showCancelModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left:0, right: 0, bottom:0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display:'flex',
                    justifyContent: 'center',
                    alignItems:'center',
                    zIndex:1000,
                    padding:'15px',
                }}>
            <div style={{backgroundColor: '#ffffff',padding:'25px',borderRadius:'10px',maxWidth:'400px',width:'100%',textAlign:'center'}}>
                <h3 style={{color:'#000080',marginTop:0}}>Do You Want To Leave The Queue?</h3>
                <p style={{color:'#6D8196',fontSize:'12px',marginBottom:'22px'}}>Are you sure? You will lose your ticket <strong>{queueData.ticketNum}</strong> and your spot in line</p>
                <div style={{display:'flex',gap:'12px'}}>
                    <button
                    onClick={handleQueueLeave}
                    style={{flex:1,padding:'8px',backgroundColor:'#6D8196',color:'white',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'bold'}}
                    > Yes i'm sure</button>
                    <button
                    onClick={()=>setShowCancelModal(false)}
                    style={{flex:1,padding:'8px',backgroundColor:'#eee',color:'#000080',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:'bold'}}>
                        No, keep my spot
                    </button>
                </div>
        </div>
        </div>
        )}
        </div>
        
    );
};

export default QueueStatus;