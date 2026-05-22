import { useEffect, useState } from 'react';
import './App.css';
import CPUChart from './components/CPUChart';
import RAMChart from './components/RAMChart';
import DiskChart from './components/DiskChart';
const startHandler = async (containerId) => {
  try {
    const response = await fetch(`/api/containers?containerId=${containerId}&action=start`, {
      method: 'POST'
    });

    if (response.ok) {
      console.log(`Container ${containerId} started successfully`);
    }
  } catch (err) {
    console.error("Failed to start container", err);
  }
};

const stopHandler = async (containerId) => {
  try {
    const response = await fetch(`/api/containers?containerId=${containerId}&action=stop`, {
      method: 'POST'
    });

    if (response.ok) {
      console.log(`Container ${containerId} stopped successfully`);
    }
  } catch (err) {
    console.error("Failed to stop container", err);
  }
};

const restartHandler = async (containerId) => {
  try {
    const response = await fetch(`/api/containers?containerId=${containerId}&action=restart`, {
      method: 'POST'
    });

    if (response.ok) {
      console.log(`Container ${containerId} restarted successfully`);
    }
  } catch (err) {
    console.error("Failed to restart container", err);
  }
};

function App() {
  const [backendData, setBackendData] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  //load data from server API
  useEffect(() => {
    let isMounted = true;

    async function updateData() {
      try {
        const response = await fetch('/api');
        if (response.ok && isMounted) {
          const data = await response.json();
          setBackendData(data);
        }
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        // Wait 1 second AFTER the request completes before trying again
        if (isMounted) {
          setTimeout(updateData, 1000);
        }
      }
    }
    updateData(); // Start the loop
    return () => { isMounted = false; }; // Cleanup
  }, [])

  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="main">
      <h1 className="caption"> {backendData.operating_system} </h1>

      <div className="container">
        <div> <h1 className="text"> Server Time </h1> <h4 className="invis_text"> S </h4> <div className="server_time"> <h1 className="text"> {backendData.time_stamp} (GMT+{backendData.time_zone})</h1> <h3 className="text"> {backendData.date} </h3> </div> </div>
        <div> <h1 className="invis_text"> S </h1> <h4 className="invis_text"> S </h4> <div className="time_awake"> <div className="containerinner"> <div> <div className="time_icon"> <h3 className="text">| | </h3> </div> </div> <div> <h4 className="text"> Time Awake </h4> <h5 className="text"> {backendData.up_time} </h5> </div> </div> </div> </div>
        <div> <div className="cpu_graph"> <CPUChart> </CPUChart> </div> </div>
        <div> <div className="ram_graph"> <RAMChart> </RAMChart> </div> </div>
        <div> <div className="disk_graph"> <DiskChart totalGB={backendData.disk_total} usedGB={backendData.used_disk}> </DiskChart> </div> </div>
        <div> </div>
      </div>
      <div className="docker_control">
        <h1 className="text"> Docker Container Manager </h1>

        <div className="dockercontrol_inner">
          <div className="dockertable">
            <div>
              <h3 className="text"> Name </h3>
            </div>

            <div>
              <h3 className="text"> Image </h3>
            </div>

            <div>
              <h3 className="text"> Id </h3>
            </div>

            <div>
              <h3 className="text"> Ports </h3>
            </div>

            <div>
              <h3 className="text"> Actions </h3>
            </div>
          </div>
          <div className="docker-container-list">
            {backendData?.containers && backendData.containers.length > 0 ? (
              backendData.containers.map((container) => {
                // Clean up the container name (removes '/')
                const rawName = container.Names && container.Names[0] ? container.Names[0] : 'Unnamed';
                const containerName = rawName.replace(/^\//, '');

                // Shortening the id like in docker CLI
                const shortId = container.Id ? container.Id.substring(0, 12) : 'N/A';

                return (
                  /* Useing the containers unique ID as the key */
                  <div key={container.Id || Math.random()} className="dockertable">
                    <div>
                      <h3 className="text">{containerName}</h3>
                    </div>

                    <div>
                      <h3 className="text">{container.Image || 'N/A'}</h3>
                    </div>

                    <div>
                      <h3 className="text">{shortId}</h3>
                    </div>

                    <div>
                      <h3 className="text">
                        {/* Loop through ports if they exist, or show 'None' */}
                        {container.Ports && container.Ports.length > 0
                          ? container.Ports.map((p, idx) => (
                            <span key={idx}>
                              {p.PublicPort}:{p.PrivatePort}/{p.Type}{' '}
                            </span>
                          ))
                          : 'None'}
                      </h3>
                    </div>

                    <div>
                      {container.State === 'running' ?
                        <button className="docker_button" onClick={() => stopHandler(container.Id)}>
                          <h4 className="text">Stop</h4>
                        </button>
                        : <h7></h7>}

                      {container.State === 'running' ?
                        <button className="docker_button" onClick={() => restartHandler(container.Id)}>
                          <h4 className="text">Restart</h4>
                        </button>
                        : <h7></h7>}

                      {container.State === 'exited' ?
                        <button className="docker_button" onClick={() => startHandler(container.Id)}>
                          <h4 className="text">Start</h4>
                        </button>
                        : <h7></h7>}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text" style={{ padding: '20px', textAlign: 'center' }}>
                <h3>No containers found or loading data...</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loginHandler = async (username, password) => {
    if (username && password) {
      console.log(username + password)
      try {
        const info = { username: username, password: password }
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(info)
        });
        if (response.ok) {
          onLoginSuccess();
        } else {
          alert("Login failed: ");
        }
      } catch (err) {
        console.log('couldnt pass login info to login API' + err)
      }
    } else {
      alert('Please input Username and Password')
    }
  }

  return (<div className="loginmain">
    <div className="login_container">
      <br></br>
      <h2 className="text">Waether Eye Out</h2>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <h3 className='text'>Please Login</h3>
      <br></br>
      <input
        type="text"
        className='username_textarea'
        placeholder='Username'
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <br></br>
      <br></br>
      <input
        type="password"
        className='password_textarea'
        placeholder='Password'
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br></br>
      <br></br>
      <button className='login_button' onClick={() => loginHandler(username, password)}> <h3 className='text'>Login</h3> </button>
    </div>
  </div>
  );
}

export default App