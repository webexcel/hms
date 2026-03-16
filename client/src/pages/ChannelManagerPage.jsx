import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  useChannelManager,
  ChannelsTab, ApiKeysTab, SyncLogsTab,
  ChannelModal, ApiKeyModal, RateMappingModal,
} from '../features/channel-manager';

const TABS = [
  { key: 'channels', label: 'Channels' },
  { key: 'apiKeys', label: 'API Keys' },
  { key: 'logs', label: 'Sync Logs' },
];

const ChannelManagerPage = () => {
  useDocumentTitle('Channel Manager');
  const cm = useChannelManager();

  if (cm.loading) {
    return <div className="d-flex justify-content-center p-5"><div className="spinner-border" /></div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-diagram-3 me-2" />Channel Manager</h2>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {TABS.map(({ key, label }) => (
          <li className="nav-item" key={key}>
            <button
              className={`nav-link ${cm.activeTab === key ? 'active' : ''}`}
              onClick={() => cm.setActiveTab(key)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>

      {cm.activeTab === 'channels' && (
        <ChannelsTab
          channels={cm.channels}
          openChannelModal={cm.openChannelModal}
          testConnection={cm.testConnection}
          triggerSync={cm.triggerSync}
          openMappings={cm.openMappings}
          viewLogs={cm.viewLogs}
          toggleChannel={cm.toggleChannel}
        />
      )}

      {cm.activeTab === 'apiKeys' && (
        <ApiKeysTab
          apiKeys={cm.apiKeys}
          newKeyDisplay={cm.newKeyDisplay}
          setNewKeyDisplay={cm.setNewKeyDisplay}
          openKeyModal={cm.openKeyModal}
          revokeKey={cm.revokeKey}
        />
      )}

      {cm.activeTab === 'logs' && (
        <SyncLogsTab
          channels={cm.channels}
          syncLogs={cm.syncLogs}
          selectedLogChannel={cm.selectedLogChannel}
          onLogChannelChange={cm.onLogChannelChange}
        />
      )}

      <ChannelModal
        show={cm.showChannelModal}
        onClose={() => cm.setShowChannelModal(false)}
        selectedChannel={cm.selectedChannel}
        channelForm={cm.channelForm}
        setChannelForm={cm.setChannelForm}
        onSave={cm.saveChannel}
      />

      <ApiKeyModal
        show={cm.showKeyModal}
        onClose={() => cm.setShowKeyModal(false)}
        channels={cm.channels}
        keyForm={cm.keyForm}
        setKeyForm={cm.setKeyForm}
        onSave={cm.createApiKey}
      />

      <RateMappingModal
        show={cm.showMappingModal}
        onClose={() => cm.setShowMappingModal(false)}
        rateMappings={cm.rateMappings}
        ratePlans={cm.ratePlans}
        mappingForm={cm.mappingForm}
        setMappingForm={cm.setMappingForm}
        onSave={cm.saveMapping}
        onDelete={cm.deleteMapping}
      />
    </div>
  );
};

export default ChannelManagerPage;
