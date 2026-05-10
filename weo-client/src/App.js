import react, {useEffect, useState} from 'react';
import './App.css';
import CPUChart from './components/CPUChart';
import RAMChart from './components/RAMChart';
import DiskChart from './components/DiskChart';

function App() {
  const [backendData, setBackendData] = useState([{}]);
  //load datta from server API
    useEffect(() =>{
    function updateData(){
        fetch('/api').then(
        response => response.json()
        ).then(
        data => setBackendData(data)
        )
    }
    const interval = setInterval(updateData, 1000);

    return () => clearInterval(interval);
  }, [])

  return (
    <div class="main">
        <h1 class ="caption"> {backendData.operating_system} </h1>

        <div class="container">
          <div> <h1 class="text"> Server Time </h1> <h4 class="invis_text"> S </h4> <div class = "server_time"> <h1 class="text"> {backendData.time_stamp} (GMT+{backendData.time_zone})</h1> <h3 class="text"> {backendData.date} </h3> </div> </div>
          <div> <h1 class="invis_text"> S </h1> <h4 class="invis_text"> S </h4> <div class="time_awake"> <div class="containerinner"> <div> <div class="time_icon"> <h3 class="text">| | </h3> </div> </div> <div> <h4 class="text"> Time Awake </h4> <h5 class="text"> {backendData.up_time} </h5> </div> </div> </div> </div>
          <div> <div class="cpu_graph"> <CPUChart> </CPUChart> </div> </div>
          <div> <div class="ram_graph"> <RAMChart> </RAMChart> </div> </div>
          <div> <div class="disk_graph"> <DiskChart totalGB={backendData.disk_total} usedGB={backendData.used_disk}> </DiskChart> </div> </div>
          <div> <div class="docker_control"> </div> </div>
        </div>
    </div>
  )
}

export default App