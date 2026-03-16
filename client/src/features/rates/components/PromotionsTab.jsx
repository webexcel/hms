import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const PromotionsTab = ({
  promotions,
  openEditPromo,
  togglePromoActive,
  resetPromoForm,
  setShowPromoModal,
}) => {
  return (
    <div className="tab-pane fade show active" role="tabpanel">
      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Active Promotions</h5>
              <button className="btn btn-sm btn-primary" onClick={() => { resetPromoForm(); setShowPromoModal(true); }}>
                <i className="bi bi-plus-lg me-1"></i>Add Promotion
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Promotion</th>
                      <th>Code</th>
                      <th>Discount</th>
                      <th>Valid Period</th>
                      <th>Usage</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-4">No promotions found</td>
                      </tr>
                    )}
                    {promotions.map((promo) => (
                      <tr key={promo.id} className={!promo.is_active ? 'table-light' : ''}>
                        <td>
                          <div className="promo-name">
                            <strong>{promo.name}</strong>
                            <small className="text-muted d-block">
                              {promo.description || (promo.discount_type === 'percentage' ? `${promo.discount_value}% off` : `${formatCurrency(promo.discount_value)} off`)}
                            </small>
                          </div>
                        </td>
                        <td><code>{promo.code}</code></td>
                        <td>
                          <span className="badge bg-success">
                            {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `Rs ${promo.discount_value} OFF`}
                          </span>
                        </td>
                        <td>{promo.valid_from && promo.valid_until ? `${formatDate(promo.valid_from)} - ${formatDate(promo.valid_until)}` : 'All Year'}</td>
                        <td>{promo.times_used || 0} / {promo.max_uses || 'Unlimited'}</td>
                        <td>
                          <span className={`badge ${promo.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {promo.is_active ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td>
                          {promo.is_active ? (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openEditPromo(promo)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => togglePromoActive(promo)}
                            >
                              <i className="bi bi-arrow-repeat"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Promotion Stats */}
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0"><i className="bi bi-graph-up me-2"></i>Promotion Performance</h6>
            </div>
            <div className="card-body">
              <div className="promo-stat-item">
                <div className="promo-stat-info">
                  <span className="promo-stat-label">Total Redemptions</span>
                  <span className="promo-stat-value">
                    {promotions.reduce((sum, p) => sum + (p.times_used || 0), 0)}
                  </span>
                </div>
                <small className="text-success">+18% vs last month</small>
              </div>
              <div className="promo-stat-item">
                <div className="promo-stat-info">
                  <span className="promo-stat-label">Revenue Impact</span>
                  <span className="promo-stat-value">-Rs 8,450</span>
                </div>
                <small className="text-muted">Discount value</small>
              </div>
              <div className="promo-stat-item">
                <div className="promo-stat-info">
                  <span className="promo-stat-label">Bookings Generated</span>
                  <span className="promo-stat-value">+Rs 45,200</span>
                </div>
                <small className="text-success">From promo bookings</small>
              </div>
            </div>
          </div>

          {/* Top Codes */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0"><i className="bi bi-trophy me-2"></i>Top Performing Codes</h6>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {promotions
                  .filter(p => (p.times_used || 0) > 0)
                  .sort((a, b) => (b.times_used || 0) - (a.times_used || 0))
                  .slice(0, 3)
                  .map((promo) => (
                    <li key={promo.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <code>{promo.code}</code>
                        <small className="text-muted d-block">{promo.name}</small>
                      </div>
                      <span className="badge bg-primary rounded-pill">{promo.times_used} uses</span>
                    </li>
                  ))}
                {promotions.filter(p => (p.times_used || 0) > 0).length === 0 && (
                  <li className="list-group-item text-center text-muted py-3">No usage data yet</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionsTab;
