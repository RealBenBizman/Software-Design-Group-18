import React,{useState} from 'react';
import Dashboard from './Pages/Dashboard';
import JoinQueue from './Pages/JoinQueue';
import QueueStatus from './Pages/QueueStatus';

function App(){
  const[currScreen, SetCurrScreen]=useState('dashboard');

  return (
    <div style={{minHeight:'100vh',backgroundColor:'f8f9fa',fontFamily:'sans-serif'}}>

      {/*Switch Pages */}
      <nav style={{
        backgroundColor:'#000080',
        paddingTop: '14px',
        paddingBottom: '14px',
        paddingRight: '28px',
        paddingLeft: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 3px 6px rgba(0,0,0,0.1)'
      }}>
        {/* Program Name */}
        <div style={{
          color: '#ffffff',
          fontSize:'25px',
          fontWeight:'bold',
          letterSpacing: '1px',
          marginLeft: '0px'
        }}> NEBB Queue</div>

        {/*Top Of Page Button Navigation */}
      <div style={{ display:'flex', gap:'12px'}}>
        <button
        onClick={()=>SetCurrScreen('dashboard')}
        style={{
          padding: '8px 15px',
          backgroundColor: currScreen==='dashboard'? '#82C8E5' : 'transparent',
          color: currScreen==='dashboard' ? '#000080' : 'white',
          border: '2px solid #82C8E5',
          borderRadius: '5px',
          fontWeight: 'bold',
          cursor:'pointer'

        }}
        >Dashboard</button>

        <button
        onClick={()=>SetCurrScreen('join')}
        style={{
          padding: '8px 15px',
          backgroundColor: currScreen==='join' ? '#82C8E5' : 'transparent',
          color: currScreen==='join' ? '#000080' : 'white',
          border: '2px solid #82C8E5',
          borderRadius:'5px',
          fontWeight: 'bold',
          cursor:'pointer'
        }}
        >Join Queue</button>

        <button
        onClick={()=>SetCurrScreen('status')}
        style={{
          padding:'8px 15px',
          backgroundColor: currScreen ==='status'? '#82C8E5':'transparent',
          color: currScreen==='status' ? '#000080':'white',
          border: '2px solid #82C8E5',
          borderRadius: '5px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
        >Queue Status</button>
        </div>
      </nav>
      {/*Go to Clicked Screen */}
      <main style={{padding:'18px'}}>
        {currScreen==='dashboard' && <Dashboard />}
        {currScreen==='join' && <JoinQueue />}
        {currScreen==='status' && <QueueStatus />}
      </main>
    </div>

  
  );
}

export default App;