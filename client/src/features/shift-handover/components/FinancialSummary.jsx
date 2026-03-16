import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const FinancialSummary = ({ latestHandover, onShowDiscounts }) => (
  <div className="sh-section">
    <div className="sh-section-header">
      <h2 className="sh-section-title">
        <i className="bi bi-currency-rupee financial"></i>
        Financial Summary
      </h2>
    </div>
    <div className="sh-section-body">
      <table className="sh-financial-table">
        <tbody>
          <tr>
            <td>Opening Cash Balance</td>
            <td>{formatCurrency(latestHandover?.cash_in_hand || 0)}</td>
          </tr>
          <tr className="subtotal">
            <td><strong>Collections</strong></td>
            <td></td>
          </tr>
          <tr>
            <td>&nbsp;&nbsp;&nbsp;&nbsp;Room Charges</td>
            <td>{formatCurrency(latestHandover?.room_charges || 0)}</td>
          </tr>
          <tr>
            <td>&nbsp;&nbsp;&nbsp;&nbsp;Advance Payments</td>
            <td>{formatCurrency(latestHandover?.advance_payments || 0)}</td>
          </tr>
          <tr>
            <td>&nbsp;&nbsp;&nbsp;&nbsp;Restaurant &amp; Services</td>
            <td>{formatCurrency(latestHandover?.restaurant_services || 0)}</td>
          </tr>
          <tr>
            <td><strong>Total Collections</strong></td>
            <td className="text-success"><strong>{formatCurrency(latestHandover?.total_collections || 0)}</strong></td>
          </tr>
          <tr>
            <td>Refunds Issued</td>
            <td className="text-danger">- {formatCurrency(latestHandover?.refunds || 0)}</td>
          </tr>
          <tr>
            <td>
              <span
                style={{ cursor: 'pointer', borderBottom: '1px dashed #64748b' }}
                onClick={onShowDiscounts}
              >
                Discounts Given <i className="bi bi-info-circle" style={{ fontSize: '12px', color: '#64748b' }}></i>
              </span>
            </td>
            <td className="text-danger">- {formatCurrency(latestHandover?.discounts || 0)}</td>
          </tr>
          <tr className="total">
            <td>Closing Cash Balance</td>
            <td>{formatCurrency(latestHandover?.closing_balance || 0)}</td>
          </tr>
        </tbody>
      </table>

      <div className="sh-payment-grid">
        <div className="sh-payment-item cash">
          <i className="bi bi-cash-stack"></i>
          <span className="sh-payment-item-value">{formatCurrency(latestHandover?.cash_payments || 0)}</span>
          <span className="sh-payment-item-label">Cash</span>
        </div>
        <div className="sh-payment-item card">
          <i className="bi bi-credit-card"></i>
          <span className="sh-payment-item-value">{formatCurrency(latestHandover?.card_payments || 0)}</span>
          <span className="sh-payment-item-label">Card</span>
        </div>
        <div className="sh-payment-item upi">
          <i className="bi bi-phone"></i>
          <span className="sh-payment-item-value">{formatCurrency(latestHandover?.upi_payments || 0)}</span>
          <span className="sh-payment-item-label">UPI</span>
        </div>
        <div className="sh-payment-item bank">
          <i className="bi bi-bank"></i>
          <span className="sh-payment-item-value">{formatCurrency(latestHandover?.bank_payments || 0)}</span>
          <span className="sh-payment-item-label">Bank Transfer</span>
        </div>
      </div>
    </div>
  </div>
);

export default FinancialSummary;
