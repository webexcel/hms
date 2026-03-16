import React from 'react';
import { formatDate } from '../../../utils/formatters';

const RecentReports = ({ recentReports }) => (
  <div className="col-lg-4">
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0"><i className="bi bi-clock-history me-2"></i>Recent Reports</h5>
        <a href="#" className="btn btn-sm btn-link">View All</a>
      </div>
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {(recentReports || []).map((report, idx) => (
            <div className="list-group-item" key={idx}>
              <div className="d-flex align-items-center gap-3">
                <div className={`file-icon ${report.format === 'pdf' ? 'pdf' : 'excel'}`}>
                  <i className={`bi ${report.format === 'pdf' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-excel'}`}></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-medium">{report.name}</div>
                  <small className="text-muted">Generated {formatDate(report.generated_at)}</small>
                </div>
                <button className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-download"></i>
                </button>
              </div>
            </div>
          ))}
          {(!recentReports || recentReports.length === 0) && (
            <div className="list-group-item text-center text-muted py-4">
              No recent reports generated
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default RecentReports;
