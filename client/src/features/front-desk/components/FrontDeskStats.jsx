export default function FrontDeskStats({ arrivals, departures, bs, occupancyRate, dashboard }) {
  return (
    <div className="fd-stats">
      <div className="fd-stat">
        <div className="fd-stat-icon arrivals"><i className="bi bi-box-arrow-in-right"></i></div>
        <div className="fd-stat-content">
          <h3>{arrivals.length}</h3>
          <p>Arrivals Today</p>
        </div>
      </div>
      <div className="fd-stat">
        <div className="fd-stat-icon departures"><i className="bi bi-box-arrow-right"></i></div>
        <div className="fd-stat-content">
          <h3>{departures.length}</h3>
          <p>Departures Today</p>
        </div>
      </div>
      <div className="fd-stat">
        <div className="fd-stat-icon available"><i className="bi bi-door-open"></i></div>
        <div className="fd-stat-content">
          <h3>{bs.available || 0}</h3>
          <p>Available Rooms</p>
        </div>
      </div>
      <div className="fd-stat">
        <div className="fd-stat-icon occupied"><i className="bi bi-door-closed"></i></div>
        <div className="fd-stat-content">
          <h3>{bs.occupied || 0}</h3>
          <p>Occupied Rooms</p>
        </div>
      </div>
      <div className="fd-stat">
        <div className="fd-stat-icon occupancy"><i className="bi bi-pie-chart"></i></div>
        <div className="fd-stat-content">
          <h3>{occupancyRate}%</h3>
          <p>Occupancy Rate</p>
        </div>
      </div>
      <div className="fd-stat">
        <div className="fd-stat-icon revenue"><i className="bi bi-currency-rupee"></i></div>
        <div className="fd-stat-content">
          <h3>{dashboard.total}</h3>
          <p>Total Rooms</p>
        </div>
      </div>
    </div>
  );
}
