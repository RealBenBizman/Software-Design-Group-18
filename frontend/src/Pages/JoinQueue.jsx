import React, {useState} from 'react';
const JoinQueue = () => {
    const [activeTab, setActiveTab]=useState('sameday'); // 'future appointment' or 'sameday queue'


// Set up for Same day 
const[selectedServiceId, setSelectedServiceId]= useState(1);

//Set up future appointments
const[appointService, setAppointService]=useState('');
const[appointDate, setAppointDate]=useState('');
const[appointTime, setAppointTime]=useState('');
const[formError, setFormError]=useState('');

const services =[
    { id:1, name: 'FAFSA and Application assistance',wait:'40 min',people: 7},
    {id: 2, name: 'Scholarships and Grants', wait:'35 min',people: 6},
    {id: 3, name: 'Loans and visiting Counselors', wait:'27 min',people:4},
    {id: 4, name: 'Awards and Disbursement', wait: '30 min', people: 5},
];
const handleJoinSameDay = () => {
    const service = services.find((s) => s.id ===selectedServiceId);
    alert( `You're in the queue for: ${service.name}.`);
};
const handleAppointBooking = (e) => {
    e.preventDefault();
    if (!appointService || !appointDate || !appointTime) {
        setFormError('Required fields left empty.');
        return;
    }
    setFormError('')
    alert(`Success! Appointment scheduled for '${appointService}' on ${appointDate} at ${appointTime}.`);

};

return (
    <div style={{maxWIdth:'800px',margin: '0 auto', padding: '20px', fontFamily: 'sans-serif'}}>
    <h2 style={{ color: '#000080', marginBottom: '10px'}}>Schedule and Join Queue</h2>
    <p style={{color:'#6D8195',marginBottom:'20px'}}>Select any option for Financial aid assistance</p>

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
        <div style={{ display: 'flex', flexDirection:'column', gap: '10px', marginBottom: '25px'}}>
        {services.map((service) =>(
            <div
             key={service.id}
             onClick={()=>setSelectedServiceId(service.id)}
             style={{
                border: selectedServiceId===service.id ? '3px solid #0047AB' : '2px solid #ccc',
                backgroundColor: selectedServiceId=== service.id ? '#f0f7fc': '#fff',
                borderRadius: '6px',
                padding: '10px 15px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
             }}
            >
             <div>
                <strong style={{ color: '#000080', fontSize: '15px', display: 'block', marginBottom: '5px'}}>{service.name}</strong>
                <span style={{ fontSize: '14px',  color: '#6D8196'}}>People in line: {service.people}</span>
            </div>
            <div style={{ textAlign: 'right'}}>
                <span style={{ fontSize: '15px', fontWeight: 'bold',color:'#0047AB'}}>Estimated wait time: {service.wait}</span>
            </div>
            </div>
                
        ))}
        </div>
        <button 
         onClick={handleJoinSameDay}
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
            Join Queue
        </button>
        </div>
    )}
    {/*Tab 2: Future Appointment */}
    {activeTab==='appointment'&&(
        <form onSubmit={handleAppointBooking} style={{ backgroundColor: '#ffffff', border: '2ppx solid #6D8196', borderRadius: '10px', padding: '25px'}}>
            <h3 style={{ color: '#000080', marginTop: 0}} >Schedule an Appointment</h3>
            <p style={{fontSize: '15px', color: '#6D8196', marginBottom:'20px'}}>Schedule an appointment for a future date.</p>

            {formError && (
                <div style={{ backgroundColor:'#6D8196', color:'#721c24', padding: '10px',borderRadius: '5px', marginBottom: '15px', fontSie:'15px'}}>
                    {formError}
                    </div>
            )}
            {/* Select a Service */}
            <div style={{ marginBottom: '15px'}}>
                <label style={{ display: 'block', fontWeight:'bold',color: '#000080',marginBottom:'5px'}}>Select A Service:</label>
                <select
                value={appointService}
                onChange={(e) => setAppointService(e.target.value)}
                style={{width:'100%', padding:'10px', borderRadius:'5px',border:'2px solid #ccc',fontSize:'14px'}}
                >
                    <option value="">--Choose A Service --</option>
                    {services.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/*Select a Date */}
            <div style={{ marginBottom: '15px'}}>
                <label style={{ display: 'block', fontWeight:'bold', color:'#000090', marginBottom: '5px'}}>Select Date:</label>
                <input
                type="date"
                value={appointDate}
                onChange={(e)=>setAppointDate(e.target.value)}
                style={{ width:'100%',padding:'12px',borderRadius:'5px',border:'2px solid #ccc',fontSize: '14px'}}
                />
            </div>
            {/* Select a Time Slot */}
            <div style={{marginBottom:'25px'}}>
                <label style={{ display: 'block',fontWeight:'bold',color:'#000080',marginBottom:'5px'}}>Select a Time:</label>
                <select
                   value={appointTime}
                onChange={(e)=>setAppointTime(e.target.value)}
                style={{width:'100%',padding:'10px',borderRadius:'5px',border:'2px solid #ccc',fontSize:'15px'}}
                >
              <option value="">--Choose A Time Slot --</option>
              <option value="9:00AM">9:00am</option>
              <option value="10:30AM">10:30am</option>
              <option value="12:30PM">12:30pm</option>
              <option value="2:00PM">2:00pm</option>
              </select>

            </div>
            <button
            type="submit"
            style={{
                width:'100%',
                padding:'15px',
                backgroundColor:'#0047AB',
                color:'white',
                border:'none',
                borderRadius:'5px',
                fontSize:'15px',
                fontWeight:'bold',
                cursor:'pointer',
            }}
            >
                Confirm Your Appointment
            </button>
        </form>
    )}
    </div>
);
};
export default JoinQueue;
