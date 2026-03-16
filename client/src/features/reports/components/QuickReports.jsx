import React from 'react';

const QuickReports = ({ quickReports, openModalWithReport }) => (
  <div className="col-lg-4">
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0"><i className="bi bi-file-earmark-text me-2"></i>Quick Reports</h5>
      </div>
      <div className="card-body p-0">
        <div className="list-group list-group-flush report-list">
          {quickReports.map((report) => (
            <a
              href="#"
              className="list-group-item list-group-item-action d-flex align-items-center"
              key={report.name}
              onClick={(e) => {
                e.preventDefault();
                openModalWithReport(report.name);
              }}
            >
              <div className={`report-icon bg-${report.color}-subtle`}>
                <i className={`bi ${report.icon} text-${report.color}`}></i>
              </div>
              <div className="report-info">
                <div className="report-name">{report.name}</div>
                <small className="text-muted">{report.desc}</small>
              </div>
              <i className="bi bi-chevron-right ms-auto"></i>
            </a>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default QuickReports;
