import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';
import api from '../services/api';

const ChannelManagerPage = () => {
  useDocumentTitle('Channel Manager');

  const [activeTab, setActiveTab] = useState('channels');
  const [channels, setChannels] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Channel form
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelForm, setChannelForm] = useState({
    name: '', code: '', api_url: '', hotel_id_on_ota: '',
    commission_percentage: '', webhook_secret: '', contact_email: '', notes: '',
    api_credentials: { api_key: '', api_secret: '' },
  });

  // API Key form
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyForm, setKeyForm] = useState({ name: '', channel_id: '', rate_limit: 1000 });
  const [newKeyDisplay, setNewKeyDisplay] = useState(null);

  // Rate mapping
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingChannelId, setMappingChannelId] = useState(null);
  const [rateMappings, setRateMappings] = useState([]);
  const [ratePlans, setRatePlans] = useState([]);
  const [mappingForm, setMappingForm] = useState({
    rate_plan_id: '', ota_room_code: '', ota_rate_code: '', markup_type: 'percentage', markup_value: '',
  });

  // Sync logs
  const [selectedLogChannel, setSelectedLogChannel] = useState(null);

  const fetchChannels = useCallback(async () => {
    try {
      const { data } = await api.get('/channels');
      setChannels(data);
    } catch (err) {
      toast.error('Failed to load channels');
    }
  }, []);

  const fetchApiKeys = useCallback(async () => {
    try {
      const { data } = await api.get('/channels/api-keys/list');
      setApiKeys(data);
    } catch (err) {
      toast.error('Failed to load API keys');
    }
  }, []);

  const fetchSyncLogs = useCallback(async (channelId) => {
    try {
      const { data } = await api.get(`/channels/${channelId}/logs`);
      setSyncLogs(data.data || []);
    } catch (err) {
      toast.error('Failed to load sync logs');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchChannels();
      await fetchApiKeys();
      setLoading(false);
    };
    load();
  }, [fetchChannels, fetchApiKeys]);

  // Channel CRUD
  const openChannelModal = (channel = null) => {
    if (channel) {
      setSelectedChannel(channel);
      setChannelForm({
        name: channel.name, code: channel.code, api_url: channel.api_url || '',
        hotel_id_on_ota: channel.hotel_id_on_ota || '', commission_percentage: channel.commission_percentage || '',
        webhook_secret: channel.webhook_secret || '', contact_email: channel.contact_email || '',
        notes: channel.notes || '', api_credentials: { api_key: '', api_secret: '' },
      });
    } else {
      setSelectedChannel(null);
      setChannelForm({
        name: '', code: '', api_url: '', hotel_id_on_ota: '', commission_percentage: '',
        webhook_secret: '', contact_email: '', notes: '', api_credentials: { api_key: '', api_secret: '' },
      });
    }
    setShowChannelModal(true);
  };

  const saveChannel = async () => {
    try {
      const payload = { ...channelForm };
      if (!payload.api_credentials.api_key && !payload.api_credentials.api_secret) {
        delete payload.api_credentials;
      }
      if (selectedChannel) {
        await api.put(`/channels/${selectedChannel.id}`, payload);
        toast.success('Channel updated');
      } else {
        await api.post('/channels', payload);
        toast.success('Channel created');
      }
      setShowChannelModal(false);
      fetchChannels();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save channel');
    }
  };

  const toggleChannel = async (channel) => {
    try {
      await api.put(`/channels/${channel.id}`, { is_active: !channel.is_active });
      toast.success(`Channel ${channel.is_active ? 'deactivated' : 'activated'}`);
      fetchChannels();
    } catch (err) {
      toast.error('Failed to update channel');
    }
  };

  const testConnection = async (channelId) => {
    try {
      const { data } = await api.post(`/channels/${channelId}/test`);
      if (data.success) toast.success(data.message);
      else toast.error(data.message);
    } catch (err) {
      toast.error('Connection test failed');
    }
  };

  const triggerSync = async (channelId) => {
    try {
      await api.post(`/channels/${channelId}/sync`);
      toast.success('Full sync triggered');
    } catch (err) {
      toast.error('Failed to trigger sync');
    }
  };

  // API Key management
  const createApiKey = async () => {
    try {
      const { data } = await api.post('/channels/api-keys', keyForm);
      setNewKeyDisplay(data.raw_key);
      toast.success('API key created');
      fetchApiKeys();
      setShowKeyModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create API key');
    }
  };

  const revokeKey = async (keyId) => {
    if (!window.confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await api.put(`/channels/api-keys/${keyId}/revoke`);
      toast.success('API key revoked');
      fetchApiKeys();
    } catch (err) {
      toast.error('Failed to revoke key');
    }
  };

  // Rate mappings
  const openMappings = async (channelId) => {
    setMappingChannelId(channelId);
    try {
      const [mappingRes, rateRes] = await Promise.all([
        api.get(`/channels/${channelId}/rate-mappings`),
        api.get('/rates/plans'),
      ]);
      setRateMappings(mappingRes.data);
      setRatePlans(rateRes.data?.data || rateRes.data || []);
      setShowMappingModal(true);
    } catch (err) {
      toast.error('Failed to load rate mappings');
    }
  };

  const saveMapping = async () => {
    try {
      await api.post(`/channels/${mappingChannelId}/rate-mappings`, mappingForm);
      toast.success('Mapping created');
      const { data } = await api.get(`/channels/${mappingChannelId}/rate-mappings`);
      setRateMappings(data);
      setMappingForm({ rate_plan_id: '', ota_room_code: '', ota_rate_code: '', markup_type: 'percentage', markup_value: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create mapping');
    }
  };

  const deleteMapping = async (mappingId) => {
    try {
      await api.delete(`/channels/${mappingChannelId}/rate-mappings/${mappingId}`);
      toast.success('Mapping deleted');
      const { data } = await api.get(`/channels/${mappingChannelId}/rate-mappings`);
      setRateMappings(data);
    } catch (err) {
      toast.error('Failed to delete mapping');
    }
  };

  // Sync logs tab
  const viewLogs = async (channelId) => {
    setSelectedLogChannel(channelId);
    setActiveTab('logs');
    await fetchSyncLogs(channelId);
  };

  if (loading) {
    return <div className="d-flex justify-content-center p-5"><div className="spinner-border" /></div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-diagram-3 me-2" />Channel Manager</h2>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {['channels', 'apiKeys', 'logs'].map((tab) => (
          <li className="nav-item" key={tab}>
            <button className={`nav-link ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab === 'channels' ? 'Channels' : tab === 'apiKeys' ? 'API Keys' : 'Sync Logs'}
            </button>
          </li>
        ))}
      </ul>

      {/* Channels Tab */}
      {activeTab === 'channels' && (
        <div>
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-primary" onClick={() => openChannelModal()}>
              <i className="bi bi-plus-lg me-1" />Add Channel
            </button>
          </div>

          <div className="row g-3">
            {channels.map((ch) => (
              <div className="col-md-6 col-xl-4" key={ch.id}>
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">{ch.name}</h5>
                      <span className={`badge ${ch.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {ch.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-muted small mb-1">Code: <code>{ch.code}</code></p>
                    <p className="text-muted small mb-1">Hotel ID: {ch.hotel_id_on_ota || '—'}</p>
                    <p className="text-muted small mb-1">Commission: {ch.commission_percentage}%</p>
                    <p className="text-muted small mb-3">
                      Last Sync: {ch.last_sync_at ? new Date(ch.last_sync_at).toLocaleString() : 'Never'}
                    </p>
                    <div className="d-flex flex-wrap gap-1">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openChannelModal(ch)}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn btn-sm btn-outline-info" onClick={() => testConnection(ch.id)}>
                        <i className="bi bi-wifi" /> Test
                      </button>
                      <button className="btn btn-sm btn-outline-success" onClick={() => triggerSync(ch.id)}>
                        <i className="bi bi-arrow-repeat" /> Sync
                      </button>
                      <button className="btn btn-sm btn-outline-warning" onClick={() => openMappings(ch.id)}>
                        <i className="bi bi-link-45deg" /> Rates
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => viewLogs(ch.id)}>
                        <i className="bi bi-journal-text" /> Logs
                      </button>
                      <button className={`btn btn-sm ${ch.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => toggleChannel(ch)}>
                        {ch.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {channels.length === 0 && (
              <div className="col-12 text-center text-muted py-5">
                <i className="bi bi-diagram-3 display-4 d-block mb-2" />
                No channels configured. Add MakeMyTrip or Goibibo to get started.
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'apiKeys' && (
        <div>
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-primary" onClick={() => {
              setKeyForm({ name: '', channel_id: channels[0]?.id || '', rate_limit: 1000 });
              setShowKeyModal(true);
            }}>
              <i className="bi bi-key me-1" />Create API Key
            </button>
          </div>

          {newKeyDisplay && (
            <div className="alert alert-warning alert-dismissible">
              <strong>New API Key (copy now, shown only once):</strong>
              <code className="d-block mt-1 user-select-all">{newKeyDisplay}</code>
              <button type="button" className="btn-close" onClick={() => setNewKeyDisplay(null)} />
            </div>
          )}

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th><th>Prefix</th><th>Channel</th><th>Rate Limit</th>
                  <th>Last Used</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.id}>
                    <td>{k.name}</td>
                    <td><code>{k.key_prefix}...</code></td>
                    <td>{k.channel?.name || '—'}</td>
                    <td>{k.rate_limit}/15min</td>
                    <td>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</td>
                    <td>
                      <span className={`badge ${k.is_active ? 'bg-success' : 'bg-danger'}`}>
                        {k.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td>
                      {k.is_active && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => revokeKey(k.id)}>
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {apiKeys.length === 0 && (
                  <tr><td colSpan="7" className="text-center text-muted py-4">No API keys created</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sync Logs Tab */}
      {activeTab === 'logs' && (
        <div>
          <div className="d-flex align-items-center gap-3 mb-3">
            <select className="form-select" style={{ maxWidth: 250 }}
              value={selectedLogChannel || ''}
              onChange={(e) => { setSelectedLogChannel(e.target.value); fetchSyncLogs(e.target.value); }}>
              <option value="">Select channel...</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>

          <div className="table-responsive">
            <table className="table table-sm table-hover">
              <thead>
                <tr>
                  <th>Time</th><th>Direction</th><th>Operation</th><th>Status</th>
                  <th>Code</th><th>Duration</th><th>Error</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="small">{new Date(log.created_at).toLocaleString()}</td>
                    <td><span className={`badge ${log.direction === 'inbound' ? 'bg-info' : 'bg-primary'}`}>{log.direction}</span></td>
                    <td>{log.operation}</td>
                    <td>
                      <span className={`badge ${log.status === 'success' ? 'bg-success' : log.status === 'failed' ? 'bg-danger' : 'bg-warning'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td>{log.status_code || '—'}</td>
                    <td>{log.duration_ms ? `${log.duration_ms}ms` : '—'}</td>
                    <td className="small text-danger">{log.error_message || ''}</td>
                  </tr>
                ))}
                {syncLogs.length === 0 && (
                  <tr><td colSpan="7" className="text-center text-muted py-4">No sync logs</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Channel Modal */}
      {showChannelModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedChannel ? 'Edit Channel' : 'Add Channel'}</h5>
                <button className="btn-close" onClick={() => setShowChannelModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Name</label>
                    <input className="form-control" value={channelForm.name}
                      onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Code</label>
                    <select className="form-select" value={channelForm.code}
                      onChange={(e) => setChannelForm({ ...channelForm, code: e.target.value })}
                      disabled={!!selectedChannel}>
                      <option value="">Select...</option>
                      <option value="mmt">MakeMyTrip (mmt)</option>
                      <option value="goibibo">Goibibo</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">API URL</label>
                    <input className="form-control" value={channelForm.api_url}
                      onChange={(e) => setChannelForm({ ...channelForm, api_url: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Hotel ID on OTA</label>
                    <input className="form-control" value={channelForm.hotel_id_on_ota}
                      onChange={(e) => setChannelForm({ ...channelForm, hotel_id_on_ota: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Commission %</label>
                    <input type="number" className="form-control" value={channelForm.commission_percentage}
                      onChange={(e) => setChannelForm({ ...channelForm, commission_percentage: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Webhook Secret</label>
                    <input className="form-control" value={channelForm.webhook_secret}
                      onChange={(e) => setChannelForm({ ...channelForm, webhook_secret: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Contact Email</label>
                    <input type="email" className="form-control" value={channelForm.contact_email}
                      onChange={(e) => setChannelForm({ ...channelForm, contact_email: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">API Credentials</label>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <input className="form-control" placeholder="API Key"
                          value={channelForm.api_credentials.api_key}
                          onChange={(e) => setChannelForm({
                            ...channelForm,
                            api_credentials: { ...channelForm.api_credentials, api_key: e.target.value },
                          })} />
                      </div>
                      <div className="col-md-6">
                        <input type="password" className="form-control" placeholder="API Secret"
                          value={channelForm.api_credentials.api_secret}
                          onChange={(e) => setChannelForm({
                            ...channelForm,
                            api_credentials: { ...channelForm.api_credentials, api_secret: e.target.value },
                          })} />
                      </div>
                    </div>
                    <small className="text-muted">Leave empty to keep existing credentials</small>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" rows="2" value={channelForm.notes}
                      onChange={(e) => setChannelForm({ ...channelForm, notes: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowChannelModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveChannel}>
                  {selectedChannel ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create API Key</h5>
                <button className="btn-close" onClick={() => setShowKeyModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input className="form-control" value={keyForm.name}
                    onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Channel</label>
                  <select className="form-select" value={keyForm.channel_id}
                    onChange={(e) => setKeyForm({ ...keyForm, channel_id: e.target.value })}>
                    <option value="">Select...</option>
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Rate Limit (per 15 min)</label>
                  <input type="number" className="form-control" value={keyForm.rate_limit}
                    onChange={(e) => setKeyForm({ ...keyForm, rate_limit: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowKeyModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={createApiKey}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate Mapping Modal */}
      {showMappingModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Rate Mappings</h5>
                <button className="btn-close" onClick={() => setShowMappingModal(false)} />
              </div>
              <div className="modal-body">
                <table className="table table-sm mb-4">
                  <thead>
                    <tr><th>Rate Plan</th><th>OTA Room</th><th>OTA Rate</th><th>Markup</th><th></th></tr>
                  </thead>
                  <tbody>
                    {rateMappings.map((m) => (
                      <tr key={m.id}>
                        <td>{m.ratePlan?.name || m.rate_plan_id}</td>
                        <td><code>{m.ota_room_code}</code></td>
                        <td><code>{m.ota_rate_code}</code></td>
                        <td>{m.markup_value}{m.markup_type === 'percentage' ? '%' : ' INR'}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteMapping(m.id)}>
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h6>Add Mapping</h6>
                <div className="row g-2 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label small">Rate Plan</label>
                    <select className="form-select form-select-sm" value={mappingForm.rate_plan_id}
                      onChange={(e) => setMappingForm({ ...mappingForm, rate_plan_id: e.target.value })}>
                      <option value="">Select...</option>
                      {ratePlans.map((rp) => (
                        <option key={rp.id} value={rp.id}>{rp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">OTA Room Code</label>
                    <input className="form-control form-control-sm" value={mappingForm.ota_room_code}
                      onChange={(e) => setMappingForm({ ...mappingForm, ota_room_code: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">OTA Rate Code</label>
                    <input className="form-control form-control-sm" value={mappingForm.ota_rate_code}
                      onChange={(e) => setMappingForm({ ...mappingForm, ota_rate_code: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small">Markup</label>
                    <div className="input-group input-group-sm">
                      <input type="number" className="form-control" value={mappingForm.markup_value}
                        onChange={(e) => setMappingForm({ ...mappingForm, markup_value: e.target.value })} />
                      <select className="form-select" value={mappingForm.markup_type}
                        onChange={(e) => setMappingForm({ ...mappingForm, markup_type: e.target.value })}>
                        <option value="percentage">%</option>
                        <option value="fixed">INR</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-1">
                    <button className="btn btn-sm btn-primary" onClick={saveMapping}>Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelManagerPage;
