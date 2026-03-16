import React from 'react';

const RatesTabs = ({ activeTab, setActiveTab }) => {
  return (
    <ul className="nav nav-tabs rates-tabs mb-4" role="tablist">
      <li className="nav-item" role="presentation">
        <button
          className={`nav-link${activeTab === 'ratePlans' ? ' active' : ''}`}
          type="button"
          role="tab"
          onClick={() => setActiveTab('ratePlans')}
        >
          <i className="bi bi-door-closed me-2"></i>Room Rates
        </button>
      </li>
      <li className="nav-item" role="presentation">
        <button
          className={`nav-link${activeTab === 'packages' ? ' active' : ''}`}
          type="button"
          role="tab"
          onClick={() => setActiveTab('packages')}
        >
          <i className="bi bi-gift me-2"></i>Packages
        </button>
      </li>
      <li className="nav-item" role="presentation">
        <button
          className={`nav-link${activeTab === 'rateCalendar' ? ' active' : ''}`}
          type="button"
          role="tab"
          onClick={() => setActiveTab('rateCalendar')}
        >
          <i className="bi bi-calendar3 me-2"></i>Rate Calendar
        </button>
      </li>
      <li className="nav-item" role="presentation">
        <button
          className={`nav-link${activeTab === 'promotions' ? ' active' : ''}`}
          type="button"
          role="tab"
          onClick={() => setActiveTab('promotions')}
        >
          <i className="bi bi-percent me-2"></i>Promotions
        </button>
      </li>
    </ul>
  );
};

export default RatesTabs;
