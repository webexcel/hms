import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const DiscountsModal = ({ show, latestHandover, user, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog">
        <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
            <h5 className="modal-title"><i className="bi bi-percent me-2"></i>Discounts Given This Shift</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              {(latestHandover?.discount_details || []).length > 0 ? (
                latestHandover.discount_details.map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8fafc', borderRadius: '10px', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ color: '#1a1a2e' }}>{d.room} - {d.guest}</strong>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>{d.reason}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#7c3aed' }}>- {formatCurrency(d.amount)}</span>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>{d.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted" style={{ fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                  No discount details available
                </p>
              )}
            </div>
            <div style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#6d28d9' }}>Total Discounts</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#7c3aed' }}>{formatCurrency(latestHandover?.discounts || 0)}</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px', textAlign: 'center' }}>
              <i className="bi bi-shield-check me-1"></i>All discounts authorized by: {user?.full_name || user?.username || 'Operations Manager'}
            </p>
          </div>
          <div className="modal-footer" style={{ border: 'none', padding: '12px 24px' }}>
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: '10px' }} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountsModal;
