import React from 'react';

const ShiftHeader = ({ onPrint, onStartNewShift }) => (
  <div className="sh-header">
    <h2 className="sh-title">Shift Handover Report</h2>
    <div className="sh-actions">
      <button className="btn-print" onClick={onPrint}>
        <i className="bi bi-printer me-2"></i>Print Report
      </button>
      <button className="btn-start-shift" onClick={onStartNewShift}>
        <i className="bi bi-play-fill me-2"></i>Start New Shift
      </button>
    </div>
  </div>
);

export default ShiftHeader;
