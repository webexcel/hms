import React from 'react';

const GenerateReportModal = ({
  showModal,
  closeModal,
  reportType,
  setReportType,
  reportFormat,
  setReportFormat,
  dateRange,
  setDateRange,
  comparisonPeriod,
  setComparisonPeriod,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  sections,
  handleSectionToggle,
  notes,
  setNotes,
  handleGenerateReport
}) => {
  if (!showModal) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title"><i className="bi bi-file-earmark-text me-2"></i>Generate Report</h5>
            <button type="button" className="btn-close" onClick={closeModal}></button>
          </div>
          <div className="modal-body">
            <form>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Report Type</label>
                  <select className="form-select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                    <option>Revenue Report</option>
                    <option>Occupancy Report</option>
                    <option>Daily Operations</option>
                    <option>Guest Demographics</option>
                    <option>Housekeeping Summary</option>
                    <option>Inventory Report</option>
                    <option>Staff Performance</option>
                    <option>Financial Summary</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Format</label>
                  <select className="form-select" value={reportFormat} onChange={(e) => setReportFormat(e.target.value)}>
                    <option>PDF Document</option>
                    <option>Excel Spreadsheet</option>
                    <option>CSV File</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date Range</label>
                  <select className="form-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Comparison Period</label>
                  <select className="form-select" value={comparisonPeriod} onChange={(e) => setComparisonPeriod(e.target.value)}>
                    <option>None</option>
                    <option>Previous Period</option>
                    <option>Same Period Last Year</option>
                  </select>
                </div>
                {dateRange === 'custom' && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label">Start Date</label>
                      <input type="date" className="form-control" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">End Date</label>
                      <input type="date" className="form-control" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                    </div>
                  </>
                )}
                <div className="col-12">
                  <label className="form-label">Include Sections</label>
                  <div className="row g-2">
                    {[
                      { key: 'summary', id: 'incSummary', label: 'Executive Summary' },
                      { key: 'charts', id: 'incCharts', label: 'Charts & Graphs' },
                      { key: 'tables', id: 'incTables', label: 'Data Tables' },
                      { key: 'comparison', id: 'incComparison', label: 'Period Comparison' },
                      { key: 'breakdown', id: 'incBreakdown', label: 'Detailed Breakdown' },
                      { key: 'recommendations', id: 'incRecommendations', label: 'Recommendations' }
                    ].map(({ key, id, label }) => (
                      <div className="col-md-4" key={key}>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id={id} checked={sections[key]} onChange={() => handleSectionToggle(key)} />
                          <label className="form-check-label" htmlFor={id}>{label}</label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label">Additional Notes</label>
                  <textarea className="form-control" rows="2" placeholder="Add any notes to include in the report..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                </div>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="button" className="btn btn-outline-primary">
              <i className="bi bi-eye me-2"></i>Preview
            </button>
            <button type="button" className="btn btn-primary" onClick={handleGenerateReport}>
              <i className="bi bi-download me-2"></i>Generate &amp; Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateReportModal;
