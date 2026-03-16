import React from 'react';
import { formatCurrency, formatDate, capitalize } from '../../../utils/formatters';

const RecentHandovers = ({ handovers, user, handleAccept, handleReject }) => (
  <div className="sh-section">
    <div className="sh-section-header">
      <h2 className="sh-section-title">
        <i className="bi bi-clock-history notes"></i>
        Recent Handovers
      </h2>
    </div>
    <div className="sh-section-body">
      {handovers.length > 0 ? handovers.slice(0, 5).map((h) => (
        <div key={h.id} className={`sh-task ${h.status === 'pending' ? 'request' : h.status === 'accepted' ? 'info' : 'maintenance'}`}>
          <div className="sh-task-icon">
            <i className={`bi ${h.status === 'pending' ? 'bi-clock' : h.status === 'accepted' ? 'bi-check-circle' : 'bi-x-circle'}`}></i>
          </div>
          <div className="sh-task-content">
            <p className="sh-task-title">
              {h.from_user?.full_name || h.from_user?.username || 'Unknown'} → {h.to_user?.full_name || h.to_user?.username || 'Unknown'}
            </p>
            <p className="sh-task-meta">
              {capitalize(h.shift)} | {formatDate(h.created_at)} | {formatCurrency(h.cash_in_hand)}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
            <span className="sh-task-badge">{capitalize(h.status)}</span>
            {h.status === 'pending' && h.to_user_id === user?.id && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <button
                  className="btn btn-sm btn-success"
                  style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}
                  onClick={() => handleAccept(h.id)}
                >
                  Accept
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}
                  onClick={() => handleReject(h.id)}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )) : (
        <p className="text-muted" style={{ fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
          No handover history
        </p>
      )}
    </div>
  </div>
);

export default RecentHandovers;
