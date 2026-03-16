import React from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { capitalize } from '../../../utils/formatters';
import { SEASONS, getRoomTypeIcon, getRoomTypeClass } from '../hooks/useRates';

const RatePlansTab = ({
  filteredRatePlans,
  seasonFilter,
  setSeasonFilter,
  avgRate,
  openEditRatePlan,
}) => {
  return (
    <div className="tab-pane fade show active" role="tabpanel">
      <div className="row">
        {/* Room Rates Table */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Room Type Rates</h5>
              <div className="d-flex gap-2">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={seasonFilter}
                  onChange={(e) => setSeasonFilter(e.target.value)}
                >
                  <option value="all">All Seasons</option>
                  {SEASONS.map(s => (
                    <option key={s} value={s.toLowerCase()}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover rates-table mb-0">
                  <thead>
                    <tr>
                      <th>Room Type</th>
                      <th>Rooms</th>
                      <th>Base Rate</th>
                      <th>Weekend</th>
                      <th>Extra Person</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRatePlans.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-4">No rate plans found</td>
                      </tr>
                    )}
                    {filteredRatePlans.map((plan) => (
                      <tr key={plan.id}>
                        <td>
                          <div className="room-type-info">
                            <div className={`room-type-icon ${getRoomTypeClass(plan.room_type)}`}>
                              <i className={`bi ${getRoomTypeIcon(plan.room_type)}`}></i>
                            </div>
                            <div>
                              <div className="room-type-name">{capitalize(plan.room_type)}</div>
                              <small className="text-muted">{plan.description || ''}</small>
                            </div>
                          </div>
                        </td>
                        <td>{plan.room_count || '--'}</td>
                        <td><strong>{formatCurrency(plan.base_rate)}</strong>/night</td>
                        <td>{formatCurrency(plan.weekend_rate)}</td>
                        <td>{plan.extra_person_rate ? formatCurrency(plan.extra_person_rate) : 'N/A'}</td>
                        <td>
                          <span className={`badge ${plan.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              title="Edit"
                              onClick={() => openEditRatePlan(plan)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              title="History"
                            >
                              <i className="bi bi-clock-history"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-lg-4">
          {/* Seasonal Pricing Summary */}
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0"><i className="bi bi-calendar-range me-2"></i>Seasonal Pricing</h6>
            </div>
            <div className="card-body">
              <div className="season-item">
                <div className="season-info">
                  <span className="season-name">Peak Season</span>
                  <small className="text-muted">Jun 1 - Aug 31</small>
                </div>
                <span className="season-modifier text-danger">+25%</span>
              </div>
              <div className="season-item">
                <div className="season-info">
                  <span className="season-name">Holiday Season</span>
                  <small className="text-muted">Dec 20 - Jan 5</small>
                </div>
                <span className="season-modifier text-danger">+35%</span>
              </div>
              <div className="season-item">
                <div className="season-info">
                  <span className="season-name">Off Season</span>
                  <small className="text-muted">Nov 1 - Dec 19</small>
                </div>
                <span className="season-modifier text-success">-15%</span>
              </div>
              <div className="season-item">
                <div className="season-info">
                  <span className="season-name">Regular Season</span>
                  <small className="text-muted">Rest of year</small>
                </div>
                <span className="season-modifier text-muted">Base Rate</span>
              </div>
            </div>
          </div>

          {/* Extra Services */}
          <div className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0"><i className="bi bi-plus-circle me-2"></i>Extra Services</h6>
              <button className="btn btn-sm btn-outline-primary">
                <i className="bi bi-plus"></i>
              </button>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-egg-fried me-2 text-warning"></i>Breakfast</span>
                  <strong>Rs 18/person</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-car-front me-2 text-info"></i>Parking</span>
                  <strong>Rs 15/day</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-wifi me-2 text-primary"></i>Premium WiFi</span>
                  <strong>Rs 10/day</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-clock me-2 text-success"></i>Early Check-in</span>
                  <strong>Rs 35</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-clock-history me-2 text-danger"></i>Late Check-out</span>
                  <strong>Rs 35</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-person-plus me-2 text-secondary"></i>Extra Bed</span>
                  <strong>Rs 45/night</strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Rate Analysis */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0"><i className="bi bi-bar-chart me-2"></i>Rate Analysis</h6>
            </div>
            <div className="card-body">
              <div className="rate-analysis-item">
                <span>Your ADR</span>
                <div className="d-flex align-items-center">
                  <strong className="me-2">{avgRate > 0 ? formatCurrency(avgRate) : '--'}</strong>
                  <span className="badge bg-success-subtle text-success">+5.2%</span>
                </div>
              </div>
              <div className="rate-analysis-item">
                <span>Market Average</span>
                <strong>Rs 135</strong>
              </div>
              <div className="rate-analysis-item">
                <span>RevPAR</span>
                <div className="d-flex align-items-center">
                  <strong className="me-2">Rs 106</strong>
                  <span className="badge bg-success-subtle text-success">+12%</span>
                </div>
              </div>
              <hr />
              <small className="text-muted">Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatePlansTab;
