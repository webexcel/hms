import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const ConfirmHandoverModal = ({ show, user, latestHandover, onClose, onConfirm }) => {
  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog">
        <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
            <h5 className="modal-title"><i className="bi bi-check-circle me-2"></i>Confirm Handover</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ padding: '24px' }}>
            <div className="text-center mb-4">
              <div style={{ width: '80px', height: '80px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="bi bi-arrow-left-right" style={{ fontSize: '32px', color: '#10b981' }}></i>
              </div>
              <h4 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Complete Shift Handover?</h4>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Please ensure both parties have reviewed and confirmed the handover details.</p>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Outgoing OM</span>
                <span style={{ color: '#1a1a2e', fontWeight: 600 }}>{user?.full_name || user?.username || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Incoming OM</span>
                <span style={{ color: '#1a1a2e', fontWeight: 600 }}>{latestHandover?.to_user?.full_name || latestHandover?.to_user?.username || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Cash Handover</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(latestHandover?.cash_in_hand || 0)}</span>
              </div>
            </div>

            <div className="alert alert-warning" style={{ borderRadius: '10px', fontSize: '13px' }}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              This action cannot be undone. A record will be created for audit purposes.
            </div>
          </div>
          <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: '10px' }} onClick={onClose}>Cancel</button>
            <button type="button" className="btn" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', borderRadius: '10px', padding: '10px 24px' }} onClick={onConfirm}>
              <i className="bi bi-check-lg me-1"></i> Confirm Handover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmHandoverModal;
