import React from 'react';
import { formatCurrency, capitalize } from '../../../utils/formatters';
import { getRoomTypeIcon, getRoomTypeClass } from '../hooks/useRates';

const PackagesTab = ({
  packages,
  loading,
  openEditPackage,
  resetPackageForm,
  setShowPackageModal,
}) => {
  return (
    <div className="tab-pane fade show active" role="tabpanel">
      <div className="row g-3">
        {packages.map((pkg) => (
          <div className="col-md-6 col-lg-4" key={pkg.id}>
            <div className="package-card">
              {pkg.badge && (
                <div className={`package-badge ${pkg.badge === 'Most Popular' ? 'popular' : 'new'}`}>{pkg.badge}</div>
              )}
              <div className="package-header">
                <div className={`package-icon ${getRoomTypeClass(pkg.room_type)}`}>
                  <i className={`bi ${getRoomTypeIcon(pkg.room_type)}`}></i>
                </div>
                <h5>{pkg.name}</h5>
                <p className="text-muted">{pkg.description}</p>
              </div>
              <div className="package-price">
                <span className="price">{formatCurrency(pkg.price)}</span>
                <span className="period">/{pkg.nights} {Number(pkg.nights) === 1 ? 'night' : 'nights'}</span>
              </div>
              <ul className="package-features">
                <li><i className="bi bi-check2 text-success"></i>{capitalize(pkg.room_type)} Room</li>
                {(Array.isArray(pkg.inclusions) ? pkg.inclusions : (pkg.inclusions || '').split('\n').filter(i => i.trim())).map((item, idx) => (
                  <li key={idx}><i className="bi bi-check2 text-success"></i>{item}</li>
                ))}
              </ul>
              <div className="package-footer">
                <span className="text-muted"><i className="bi bi-tag me-1"></i>{pkg.savings ? `Save ${formatCurrency(pkg.savings)}` : capitalize(pkg.room_type)}</span>
                <div>
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditPackage(pkg)}>Edit</button>
                  <span className="badge bg-success">Active</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {packages.length === 0 && !loading && (
          <div className="col-12">
            <p className="text-muted text-center py-4">No packages found</p>
          </div>
        )}

        {/* Add Package Card */}
        <div className="col-md-6 col-lg-4">
          <div className="package-card add-package" onClick={() => { resetPackageForm(); setShowPackageModal(true); }}>
            <div className="add-package-content">
              <div className="add-icon">
                <i className="bi bi-plus-lg"></i>
              </div>
              <h5>Create New Package</h5>
              <p className="text-muted">Design custom packages for guests</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackagesTab;
