import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Appointments from '../pages/student/Appointments';
import useStudentServices from '../hooks/useStudentServices';
import { studentQueueRequest } from '../utils/studentQueueApi';
const JoinQueue = () => {
    const [activeTab, setActiveTab]=useState('sameday'); // 'future appointment' or 'sameday queue'


// Set up for Same day 
const [params] = useSearchParams();
const [selectedServiceId, setSelectedServiceId] = useState(Number(params.get('service')) || 1);
const { services, loading, error } = useStudentServices();
const [joining, setJoining] = useState(false);
const [joinError, setJoinError] = useState('');

//Set up future appointments
const[queueResult,setResult]=useState(null);
const handleJoinSameDay = async () => {
    setJoining(true);
    setJoinError('');
    try {
        const data = await studentQueueRequest('/api/queue/join', {
            method: 'POST',
            body: JSON.stringify({ serviceID: selectedServiceId, priority: 'Standard' })
        });
        setResult(data.queueData);
    } catch (err) {
        setJoinError(err.message);
    } finally {
        setJoining(false);
    }
};
return (
    <div style={{maxWidth:'800px',margin: '0 auto', padding: '20px', fontFamily: 'sans-serif'}}>
    <h2 style={{ color: '#000080', marginBottom: '10px'}}>Schedule and Join Queue</h2>
    <p style={{color:'#6D8195',marginBottom:'20px'}}>Select any option for Financial aid assistance</p>

    {loading && <p role="status">Loading services...</p>}
    {(error || joinError) && <p role="alert" style={{color: '#b91c1c'}}>{error || joinError}</p>}
    {/*Tab Navigation */}
    <div style={{ display: 'flex', borderBottom:'5px solid #82C8E5', marginBottom: '20px'}}>
        <button
        onClick ={() => setActiveTab('sameday')}
        style={{
            flex:1,
            padding:'10px',
            backgroundColor: activeTab==='sameday'? '#0047AB':'transparent',
            color: activeTab==='sameday' ? 'white' : '#000080',
            border: 'none',
            fontWeight:'bold',
            fontSize:'13px',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0',
        }}
        >
            Same-Day Queue
        </button>
        <button
          onClick={() => setActiveTab('appointment')}
          style={{
            flex:1,
            padding: '10px',
            backgroundColor: activeTab==='appointment' ? '#0047AB':'transparent',
            color: activeTab==='appointment' ? 'white':'#000080',
            border: 'none',
            fontWeight:'bold',
            fontSize: '13px',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0', 
          }}
          >
            Make a Future Appointment
          </button>
    </div>
    {/*Tab 1: Same Day Queue */}
    {activeTab==='sameday'&&(
        <div style={{ backgroundColor: '#ffffff', border: '2px solid #6D8196', borderRadius: '10px', padding: '20px'}}>
        <h3 style={{ color: '#000080', marginTop: 0}}>Select a Service</h3>
        <div role="radiogroup" aria-label="Service" style={{ display: 'flex', flexDirection:'column', gap: '10px', marginBottom: '25px'}}>
        {services.map((service) =>(
            <div
             key={service.id}
             onClick={()=>{ if (service.open) setSelectedServiceId(service.id); }}
             role="radio"
             aria-checked={selectedServiceId === service.id}
             aria-disabled={!service.open}
             tabIndex={service.open ? 0 : -1}
             onKeyDown={(event) => {
                if (service.open && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault(); setSelectedServiceId(service.id);
                }
             }}
             style={{
                border: selectedServiceId===service.id ? '3px solid #0047AB' : '2px solid #ccc',
                backgroundColor: selectedServiceId=== service.id ? '#f0f7fc': '#fff',
                borderRadius: '6px',
                padding: '10px 15px',
                cursor: service.open ? 'pointer' : 'not-allowed',
                opacity: service.open ? 1 : 0.6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
             }}
            >
             <div>
                <strong style={{ color: '#000080', fontSize: '15px', display: 'block', marginBottom: '5px'}}>{service.name}</strong>
                <span style={{ fontSize: '14px',  color: '#6D8196'}}>{service.open ? `People in line: ${service.people}` : 'Queue closed'}</span>
            </div>
            <div style={{ textAlign: 'right'}}>
                <span style={{ fontSize: '15px', fontWeight: 'bold',color:'#0047AB'}}>Estimated wait time: {service.waitMinutes} min</span>
            </div>
            </div>
                
        ))}
        </div>
        <button 
         onClick={handleJoinSameDay}
         disabled={loading || joining || Boolean(queueResult) || !services.find((service) => service.id === selectedServiceId)?.open}
        style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#0047AB',
            color: 'white',
            border:'none',
            borderRadius:'5px',
            fontSize:'15px',
            fontWeight:'bold',
            cursor:'pointer',
        }}
        >
            {joining ? 'Joining...' : 'Join Queue'}
        </button>
        {queueResult&&(
            <div style={{marginTop:'14px',padding:'14px',background:'#e6f4ea',borderRadius:'7px',border:'2px solid #34a853'}}>
                <h4 style={{margin: '0 0 4px 0',color:'#137333'}}>You joined the queue!</h4>
                <p style={{margin:'3px 0'}}><strong>Queue ID:</strong> {queueResult.queueID}</p>
                <p style={{margin:'3px 0'}}><strong>Position:</strong> {queueResult.position}</p>
                <p style={{ margin:'3px 0'}}><strong>Estimated Wait Time:</strong> {queueResult.estWaitMinutes} minutes</p>
                <Link to="/queue-status">View Queue Status</Link>
                </div>
        )}
        </div>

    )}
    {/*Tab 2: Future Appointment */}
    {activeTab==='appointment'&&(
        <Appointments />
    )}
    </div>
);
};
export default JoinQueue;
