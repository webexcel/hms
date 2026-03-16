import React from 'react';
import LoadingSpinner from '../components/atoms/LoadingSpinner';
import {
  useSettings,
  GeneralTab,
  HotelInfoTab,
  RoomConfigTab,
  UsersTab,
  NotificationsTab,
  BillingTab,
  IntegrationsTab,
  BackupSecurityTab,
  AddUserModal,
  AddRoomModal,
  AddTaxModal,
} from '../features/settings';
import '../assets/css/settings.css';

const SettingsPage = () => {
  const s = useSettings();

  if (s.loading) return <LoadingSpinner />;

  const tabComponents = {
    general: <GeneralTab {...s} />,
    hotelInfo: <HotelInfoTab {...s} />,
    rooms: <RoomConfigTab {...s} />,
    users: <UsersTab {...s} />,
    notifications: <NotificationsTab {...s} />,
    billing: <BillingTab {...s} />,
    integrations: <IntegrationsTab {...s} />,
    backup: <BackupSecurityTab {...s} />,
  };

  return (
    <div className="page-content">
      <div className="row">
        <div className="col-lg-3 mb-4">
          <div className="card settings-nav-card">
            <div className="card-body p-0">
              <nav className="settings-nav">
                {s.navItems.map(item => (
                  <a
                    key={item.key}
                    href={`#${item.key}`}
                    className={`settings-nav-item${s.activeTab === item.key ? ' active' : ''}`}
                    onClick={(e) => { e.preventDefault(); s.setActiveTab(item.key); }}
                  >
                    <i className={`bi ${item.icon}`}></i>
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="tab-content">
            {tabComponents[s.activeTab]}
          </div>
        </div>
      </div>

      <AddUserModal {...s} />
      <AddRoomModal {...s} />
      <AddTaxModal {...s} />
    </div>
  );
};

export default SettingsPage;
