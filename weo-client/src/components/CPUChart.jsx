'use client';

import { useEffect, useState } from 'react';

import {
  AreaChart as CPUChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const MAX_POINTS = 31;

const createInitialData = () => {
  return Array.from({ length: MAX_POINTS }, (_, i) => ({
    time: MAX_POINTS - 1 - i,
    speed: 0,
  }));
};

const AreaChartComponent = () => {

  const [cpuChartData, setCpuChartData] = useState(createInitialData());

  useEffect(() => {

    const updateCPUData = async () => {

      try {

        const response = await fetch('/api');

        const data = await response.json();

        const cpuUsage = Number(data.cpu_usage);

        setCpuChartData((prevData) => {

          // remove oldest value
          const trimmed = prevData.slice(1);

          // shift timestamps
          const shifted = trimmed.map((item) => ({
            ...item,
            time: item.time + 1,
          }));

          // add newest cpu value
          shifted.push({
            time: 0,
            speed: cpuUsage,
          });

          return shifted;

        });

      } catch (err) {
        console.error('Failed to fetch CPU data:', err);
      }

    };

    // initial fetch
    updateCPUData();

    // repeat every second
    const interval = setInterval(updateCPUData, 1000);

    return () => clearInterval(interval);

  }, []);

  return ( <div style={{ width: '100%', height: 300, textAlign: 'center' }}> 
      <h3 style={{ fontFamily: 'sans-serif', color: '#ffffff' }}>CPU Usage</h3> <CPUChart margin={0} width={745} height={300} data={cpuChartData}>
        <YAxis domain={[0, 100]} dataKey="speed"/>
        <XAxis dataKey="time"/>
        <Area dataKey="speed" isAnimationActive={false}/>
        <CartesianGrid/>
        <Tooltip/>
        <legend/>
    </CPUChart> </div>
  );
};

export default AreaChartComponent;