import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const EMPTY_CHANNEL_FORM = {
  name: '', code: '', api_url: '', hotel_id_on_ota: '', commission_percentage: '',
  webhook_secret: '', contact_email: '', notes: '',
  api_credentials: { api_key: '', api_secret: '' },
};

const EMPTY_MAPPING_FORM = {
  rate_plan_id: '', ota_room_code: '', ota_rate_code: '',
  markup_type: 'percentage', markup_value: '',
};

export default function useChannelManager() {
  const [activeTab, setActiveTab] = useState('channels');
  const [channels, setChannels] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Channel form
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelForm, setChannelForm] = useState({ ...EMPTY_CHANNEL_FORM });

  // API Key form
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyForm, setKeyForm] = useState({ name: '', channel_id: '', rate_limit: 1000 });
  const [newKeyDisplay, setNewKeyDisplay] = useState(null);

  // Rate mapping
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingChannelId, setMappingChannelId] = useState(null);
  const [rateMappings, setRateMappings] = useState([]);
  const [ratePlans, setRatePlans] = useState([]);
  const [mappingForm, setMappingForm] = useState({ ...EMPTY_MAPPING_FORM });

  // Sync logs
  const [selectedLogChannel, setSelectedLogChannel] = useState(null);

  // --- Fetch ---

  const fetchChannels = useCallback(async () => {
    try {
      const { data } = await api.get('/channels');
      setChannels(data);
    } catch {
      toast.error('Failed to load channels');
    }
  }, []);

  const fetchApiKeys = useCallback(async () => {
    try {
      const { data } = await api.get('/channels/api-keys/list');
      setApiKeys(data);
    } catch {
      toast.error('Failed to load API keys');
    }
  }, []);

  const fetchSyncLogs = useCallback(async (channelId) => {
    try {
      const { data } = await api.get(`/channels/${channelId}/logs`);
      setSyncLogs(data.data || []);
    } catch {
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

  // --- Channel CRUD ---

  const openChannelModal = (channel = null) => {
    if (channel) {
      setSelectedChannel(channel);
      setChannelForm({
        name: channel.name, code: channel.code, api_url: channel.api_url || '',
        hotel_id_on_ota: channel.hotel_id_on_ota || '',
        commission_percentage: channel.commission_percentage || '',
        webhook_secret: channel.webhook_secret || '',
        contact_email: channel.contact_email || '',
        notes: channel.notes || '',
        api_credentials: { api_key: '', api_secret: '' },
      });
    } else {
      setSelectedChannel(null);
      setChannelForm({ ...EMPTY_CHANNEL_FORM, api_credentials: { api_key: '', api_secret: '' } });
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
    } catch {
      toast.error('Failed to update channel');
    }
  };

  const testConnection = async (channelId) => {
    try {
      const { data } = await api.post(`/channels/${channelId}/test`);
      if (data.success) toast.success(data.message);
      else toast.error(data.message);
    } catch {
      toast.error('Connection test failed');
    }
  };

  const triggerSync = async (channelId) => {
    try {
      await api.post(`/channels/${channelId}/sync`);
      toast.success('Full sync triggered');
    } catch {
      toast.error('Failed to trigger sync');
    }
  };

  // --- API Key management ---

  const openKeyModal = () => {
    setKeyForm({ name: '', channel_id: channels[0]?.id || '', rate_limit: 1000 });
    setShowKeyModal(true);
  };

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
    } catch {
      toast.error('Failed to revoke key');
    }
  };

  // --- Rate mappings ---

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
    } catch {
      toast.error('Failed to load rate mappings');
    }
  };

  const saveMapping = async () => {
    try {
      await api.post(`/channels/${mappingChannelId}/rate-mappings`, mappingForm);
      toast.success('Mapping created');
      const { data } = await api.get(`/channels/${mappingChannelId}/rate-mappings`);
      setRateMappings(data);
      setMappingForm({ ...EMPTY_MAPPING_FORM });
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
    } catch {
      toast.error('Failed to delete mapping');
    }
  };

  // --- Sync logs tab ---

  const viewLogs = async (channelId) => {
    setSelectedLogChannel(channelId);
    setActiveTab('logs');
    await fetchSyncLogs(channelId);
  };

  const onLogChannelChange = (channelId) => {
    setSelectedLogChannel(channelId);
    fetchSyncLogs(channelId);
  };

  return {
    // State
    activeTab, setActiveTab,
    channels, apiKeys, syncLogs, loading,

    // Channel modal
    showChannelModal, setShowChannelModal,
    selectedChannel, channelForm, setChannelForm,
    openChannelModal, saveChannel, toggleChannel,
    testConnection, triggerSync,

    // API key modal
    showKeyModal, setShowKeyModal,
    keyForm, setKeyForm, newKeyDisplay, setNewKeyDisplay,
    openKeyModal, createApiKey, revokeKey,

    // Rate mapping modal
    showMappingModal, setShowMappingModal,
    rateMappings, ratePlans,
    mappingForm, setMappingForm,
    openMappings, saveMapping, deleteMapping,

    // Sync logs
    selectedLogChannel, onLogChannelChange, viewLogs,
  };
}
