import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const RevenueBySource = ({ occupancyData, occupancyChartOptions }) => (
  <div className="col-lg-4">
    <div className="card h-100">
      <div className="card-header">
        <h5 className="mb-0">Revenue by Source</h5>
      </div>
      <div className="card-body">
        <div style={{ height: '220px' }}>
          <Doughnut data={occupancyData} options={occupancyChartOptions} />
        </div>
        <div className="source-legend mt-3">
          {(occupancyData.labels || []).map((label, idx) => (
            <div className="legend-item" key={label}>
              <span className="legend-color" style={{ background: occupancyData.datasets[0]?.backgroundColor[idx] || '#ccc' }}></span>
              <span>{label}</span>
              <strong>{occupancyData.datasets[0]?.data[idx] || 0}%</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default RevenueBySource;
