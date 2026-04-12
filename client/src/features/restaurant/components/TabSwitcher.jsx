import React from 'react';

const TabSwitcher = ({ activeTab, setActiveTab }) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
    <button
      className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline-primary'}`}
      onClick={() => setActiveTab('orders')}
      style={{ borderRadius: 8, fontWeight: 700, fontSize: 13, padding: '8px 20px' }}
    >
      <i className="bi bi-receipt me-1"></i> Orders to Room
    </button>
    <button
      className={`btn ${activeTab === 'bills' ? 'btn-primary' : 'btn-outline-primary'}`}
      onClick={() => setActiveTab('bills')}
      style={{ borderRadius: 8, fontWeight: 700, fontSize: 13, padding: '8px 20px' }}
    >
      <i className="bi bi-cash-stack me-1"></i> Walk-in Bills
    </button>
    <button
      className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-outline-primary'}`}
      onClick={() => setActiveTab('menu')}
      style={{ borderRadius: 8, fontWeight: 700, fontSize: 13, padding: '8px 20px' }}
    >
      <i className="bi bi-journal-text me-1"></i> Menu Master
    </button>
  </div>
);

export default TabSwitcher;
