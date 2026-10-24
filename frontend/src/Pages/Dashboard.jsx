import { Link, useNavigate } from 'react-router-dom';
import useStudentServices from '../hooks/useStudentServices';

const Dashboard = () => {
    const { services, loading, error } = useStudentServices();
    const navigate = useNavigate();
    const openServices = services.filter((service) => service.open);
    const waiting = services.reduce((total, service) => total + service.people, 0);
    const averageWait = openServices.length
        ? Math.round(openServices.reduce((total, service) => total + service.waitMinutes, 0) / openServices.length)
        : 0;

    return(
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '25px', fontFamily: 'sans-serif'}}>
            {/* Top Header & Office Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',flexWrap:'wrap',gap:'10px', marginBottom: '25px'}}>
                <div>
                    <h2 style={{ color: '#000080', margin: '0 0 4px 0'}}>Student Dashboard</h2>
                    <p style={{ color: '#6D8196',margin: 0, fontWeight: '500'}}>Financial Aid and Scholarship Office</p>
                </div>
                <div style={{ textAlign: 'right'}}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#000080', marginRight: '6px'}}>Today's Office Status: </span>
                    <span style={{backgroundColor: openServices.length ? '#28a745' : '#6D8196', color: 'white', padding: '6px 12px', borderRadius:'20px', fontWeight: 'bold', fontSize: '14px'}}>
                        {loading ? 'Loading...' : error ? 'Unavailable' : openServices.length ? 'Open' : 'Closed'}
                    </span>
                </div>
            </div>
            {/* Notification Banner */}
            <div style={{ backgroundColor: '#eef7fc', borderLeft: '6px solid #0047AB', padding: '14px 20px', marginBottom: '28px', borderRadius:'6px', color: '#000080' }}>
                <Link to="/notifications">View your queue notifications</Link>
            </div>
            {loading && <p role="status">Loading services...</p>}
            {error && <p role="alert" style={{color: '#b91c1c'}}>{error}</p>}
            {/* Queue Overview Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap:'15px', marginBottom: '30px'}}>
                <div style={{ background: '#f4f8fb', border: '2px solid #82C8E5', padding: '16px', borderRadius:'10px', textAlign:'center'}}>
                    <h3 style={{margin: '0 0 6px 0', color: '#000080', fontSize: '25px'}}>{openServices.length}</h3>
                    <span style={{ color: '#000080', fontWeight:'600'}}>Active Services</span>
                </div>
                <div style={{background: '#f4f8fb', border:'2px solid #82C8E5', padding: '15px', borderRadius: '10px', textAlign:'center'}}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#000080', fontSize: '28px' }}>{waiting}</h3>
                    <span style={{color: '#000080', fontWeight: '600' }}>Students Waiting</span>
                </div>
                <div style={{ background: '#f4f8fb', border: '3px solid #82C8E5', padding: '16px', borderRadius: '10px', textAlign: 'center'}}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#000080', fontSize: '25px'}}>{averageWait} min</h3>
                    <span style={{ color: '#000080', fontWeight: '600'}}>Estimated Average Wait</span>
                </div>
            </div>
            {/* Availible Service Section */}
            <h3 style={{ color: '#000080', marginBottom: '16px'}}>Services and Same day Queue:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '18px' }}>
                {services.map((service) => (
                    <div
                    key={service.id}
                    style={{
                        border: '1.5px solid #6D8196',
                        borderRadius: '15px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 3px 5px rgba(0,0,0,0.05)'
                    }}
                >
                    <div>
                        <h4 style={{ margin: '0 0 6px 0', color: '#000080', fontSize: '18px'}}>{service.name}</h4>    
                        <p style={{ color: '#555', fontSize: '15px', lineHeight: '1.5', marginBottom: '15px'}}>{service.description}</p>
                        <div style={{ fontSize: '14px', color:'#000080', marginBottom: '18px', backgroundColor: '#f0f7fc', padding:'10px', borderRadius: '5px'}}>
                            <div><strong>Estimated Wait Time: </strong>{service.open ? `${service.waitMinutes} minutes` : 'Closed'}</div>
                            <div><strong>People Currently Waiting: </strong>{service.people}</div>
                        </div>
                    </div>
                    <button
                     onClick={() => navigate(`/join-queue?service=${service.id}`)}
                     disabled={!service.open}
                     style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#0047AB',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '15px'
                     }}
                    >
                        {service.open ? 'Enter Same-Day Queue' : 'Queue Closed'}
                    </button>
                </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
