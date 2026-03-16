import React from 'react';
import { Line } from 'react-chartjs-2';

const RevenueChart = ({ revenueData, revenueChartOptions, chartView, setChartView }) => (
  <div className="col-lg-8">
    <div className="card h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Revenue Overview</h5>
        <div className="btn-group btn-group-sm">
          {['daily', 'weekly', 'monthly'].map((view) => (
            <button
              key={view}
              className={`btn btn-outline-secondary ${chartView === view ? 'active' : ''}`}
              onClick={() => setChartView(view)}
            >{view.charAt(0).toUpperCase() + view.slice(1)}</button>
          ))}
        </div>
      </div>
      <div className="card-body">
        <div style={{ height: '300px' }}>
          <Line data={revenueData} options={revenueChartOptions} />
        </div>
      </div>
    </div>
  </div>
);

export default RevenueChart;
