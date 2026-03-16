import React from 'react';

const HandoverNotes = ({ latestHandover, notes, onNotesChange }) => (
  <div className="sh-section">
    <div className="sh-section-header">
      <h2 className="sh-section-title">
        <i className="bi bi-journal-text notes"></i>
        Handover Notes
      </h2>
    </div>
    <div className="sh-section-body">
      {latestHandover?.notes && (
        <div className="sh-notes-previous">
          <span className="sh-notes-previous-label">
            Previous Shift Notes ({latestHandover.from_user?.full_name || latestHandover.from_user?.username || 'Previous Staff'})
          </span>
          <p className="sh-notes-previous-text">{latestHandover.notes}</p>
        </div>
      )}
      <label className="sh-notes-previous-label">Your Notes for Incoming OM</label>
      <textarea
        className="sh-notes-textarea"
        placeholder="Add any important notes, observations, or instructions for the incoming Operations Manager..."
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
      ></textarea>
    </div>
  </div>
);

export default HandoverNotes;
