import { capitalize } from '../../../utils/formatters';

export default function ArrivalsPanel({ panelTab, setPanelTab, arrivals, departures, setSelectedRoom, setCheckInData, resetCheckInForm, setShowCheckInModal, setCheckOutData, resetCheckOutForm, setShowCheckOutModal }) {
  return (
    <div className="col-lg-4">
      <div className="fd-panel">
        <div className="fd-panel-tabs">
          <button
            className={`fd-panel-tab ${panelTab === 'arrivals' ? 'active' : ''}`}
            onClick={() => setPanelTab('arrivals')}
          >
            <i className="bi bi-box-arrow-in-right"></i> Arrivals ({arrivals.length})
          </button>
          <button
            className={`fd-panel-tab ${panelTab === 'departures' ? 'active' : ''}`}
            onClick={() => setPanelTab('departures')}
          >
            <i className="bi bi-box-arrow-right"></i> Departures ({departures.length})
          </button>
        </div>
        <div className="fd-panel-content">
          {(panelTab === 'arrivals' ? arrivals : departures).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              No {panelTab} today
            </div>
          ) : (
            (panelTab === 'arrivals' ? arrivals : departures).map((item, i) => {
              const g = item.guest || item.Guest || {};
              const r = item.room || item.Room || {};
              return (
                <div key={i} className="fd-guest" onClick={() => {
                  setSelectedRoom(r);
                  if (panelTab === 'arrivals') {
                    setCheckInData(item);
                    resetCheckInForm(item);
                    setShowCheckInModal(true);
                  } else {
                    setCheckOutData(item);
                    resetCheckOutForm();
                    setShowCheckOutModal(true);
                  }
                }} style={{ cursor: 'pointer' }}>
                  <div className="fd-guest-avatar">
                    {(g.first_name?.[0] || 'G')}{(g.last_name?.[0] || '')}
                  </div>
                  <div className="fd-guest-info">
                    <p className="fd-guest-name">{g.first_name} {g.last_name}</p>
                    <p className="fd-guest-meta">{capitalize(r.room_type)} &middot; {item.source || 'Walk-in'}{item.group_id ? ' · GRP' : ''}</p>
                  </div>
                  <div className="fd-guest-room">
                    <div className="fd-guest-room-num">{r.room_number}</div>
                    <div className="fd-guest-room-type">
                      {panelTab === 'arrivals' ? (
                        <button className="btn btn-checkin btn-sm" onClick={(e) => { e.stopPropagation(); setCheckInData(item); setSelectedRoom(r); resetCheckInForm(item); setShowCheckInModal(true); }}>Check In</button>
                      ) : (
                        <button className="btn btn-checkout btn-sm" onClick={(e) => { e.stopPropagation(); setCheckOutData(item); setSelectedRoom(r); resetCheckOutForm(); setShowCheckOutModal(true); }}>Check Out</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
