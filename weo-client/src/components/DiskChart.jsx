'use client';

import React from 'react';
import { PieChart as DiskChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const DiskChartData = ({ usedGB = 450, totalGB = 1000 }) => {
  const freeGB = totalGB - usedGB;

  // Data structure for Recharts
  const data = [
    { name: 'Used Storage', value: usedGB },
    { name: 'Free Storage', value: freeGB },
  ];

  //colours of the chart | refer to recharts documentation
  const COLORS = ['#3b82f6', '#949494'];

  return (
    <div style={{ width: '100%', height: 300, textAlign: 'center' }}>
      <h3 style={{ fontFamily: 'sans-serif', color: '#ffffff' }}>Disk Usage</h3>
      <ResponsiveContainer width="100%" height="100%">
        <DiskChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}  // Makes it a donut chart
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${value} GB`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </DiskChart>
      </ResponsiveContainer>
      <p style={{ fontFamily: 'sans-serif', fontSize: '14px', color: '#666' }}>
        {((usedGB / totalGB) * 100).toFixed(1)}% Capacity Reached
      </p>
    </div>
  );
};

export default DiskChartData;