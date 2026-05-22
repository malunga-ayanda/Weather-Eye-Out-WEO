'use client';

import { useEffect, useState } from 'react';

import {
  AreaChart as RAMChart,
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
    usage: 0,
  }));
};

const AreaChartComponent = () => {

  const [ramChartData, setRamChartData] = useState(createInitialData());

  useEffect(() => {

    const updateRAMData = async () => {

      try {

        const response = await fetch('/api');

        const data = await response.json();

        const ramUsage = Number(data.memory_usage);

        setRamChartData((prevData) => {

          // remove oldest value
          const trimmed = prevData.slice(1);

          // shift timestamps
          const shifted = trimmed.map((item) => ({
            ...item,
            time: item.time + 1,
          }));

          // add newest ram value
          shifted.push({
            time: 0,
            usage: ramUsage,
          });

          return shifted;

        });

      } catch (err) {
        console.error('Failed to fetch RAM data:', err);
      }

    };

    // initial fetch
    updateRAMData();

    // repeat every second
    const interval = setInterval(updateRAMData, 1000);

    return () => clearInterval(interval);

  }, []);

  return ( <div style={{ width: '100%', height: 300, textAlign: 'center' }}>
      <h3 style={{ fontFamily: 'sans-serif', color: '#ffffff' }}>Memory Usage</h3> <RAMChart width={745} height={300} data={ramChartData}>
        <YAxis domain={[0, 100]} dataKey="usage"/>
        <XAxis dataKey="time"/>
        <Area dataKey="usage" isAnimationActive={false}/>
        <CartesianGrid/>
        <Tooltip/>
        <legend/>
    </RAMChart> </div>
)};

export default AreaChartComponent;