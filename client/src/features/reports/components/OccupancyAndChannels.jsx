import React from 'react';
import { Bar } from 'react-chartjs-2';

const OccupancyAndChannels = ({ dailySummary, handleQuickRange }) => (
  <div className="row g-3 mb-4">
    {/* Occupancy Chart */}
    <div className="col-lg-6">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Occupancy by Room Type</h5>
          <select className="form-select form-select-sm" style={{ width: 'auto' }} onChange={(e) => handleQuickRange(e.target.value)}>
            <option value="month">This Month</option>
            <option value="week">Last Month</option>
            <option value="year">Last 3 Months</option>
          </select>
        </div>
        <div className="card-body">
          <div style={{ height: '250px' }}>
            <Bar
              data={{
                labels: dailySummary.room_type_labels || [],
                datasets: [{
                  label: 'Occupancy %',
                  data: dailySummary.room_type_occupancy || [],
                  backgroundColor: '#3498db',
                  borderRadius: 4
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } }
              }}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Booking Channels */}
    <div className="col-lg-6">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Booking Channels</h5>
          <select className="form-select form-select-sm" style={{ width: 'auto' }}>
            <option>This Month</option>
            <option>Last Month</option>
            <option>Last 3 Months</option>
          </select>
        </div>
        <div className="card-body">
          <div style={{ height: '250px' }}>
            <Bar
              data={{
                labels: dailySummary.channel_labels || [],
                datasets: [{
                  label: 'Bookings',
                  data: dailySummary.channel_values || [],
                  backgroundColor: ['#3498db', '#27ae60', '#f39c12', '#9b59b6', '#e74c3c'],
                  borderRadius: 4
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: { x: { beginAtZero: true } }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default OccupancyAndChannels;
