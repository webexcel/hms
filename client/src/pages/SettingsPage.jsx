import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import FormModal from '../components/organisms/FormModal';
import LoadingSpinner from '../components/atoms/LoadingSpinner';
import { formatCurrency, formatDate, capitalize } from '../utils/formatters';
import toast from 'react-hot-toast';
import '../assets/css/settings.css';

// GST helpers
const GST_RATE = 0.12; // 12% for rooms < ₹7500/night
const GST_RATE_LUXURY = 0.18; // 18% for rooms >= ₹7500/night
const getGstRate = (baseRate) => (parseFloat(baseRate) || 0) >= 7500 ? GST_RATE_LUXURY : GST_RATE;
const gstInclusiveRate = (baseRate) => {
  const rate = parseFloat(baseRate) || 0;
  return Math.round(rate * (1 + getGstRate(rate)));
};
const getGstPercent = (baseRate) => Math.round(getGstRate(baseRate) * 100);

const SettingsPage = () => {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    system_language: 'English',
    timezone: 'Asia/Kolkata',
    date_format: 'DD/MM/YYYY',
    currency: 'INR',
    check_in_time: '14:00',
    check_out_time: '11:00'
  });

  // Appearance
  const [appearance, setAppearance] = useState({
    theme: 'light',
    sidebar_style: 'Expanded',
    compact_mode: false
  });

  // Hotel info
  const [hotelInfo, setHotelInfo] = useState({
    hotel_name: '',
    hotel_type: 'Luxury',
    star_rating: '4',
    total_rooms: '58',
    hotel_address: '',
    hotel_phone: '',
    hotel_email: '',
    hotel_website: '',
    hotel_gstin: ''
  });

  // Room Configuration
  const [roomTypes, setRoomTypes] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null); // { type, base_rate, hourly_rates: { '1': x, '2': y, '3': z, default: d } }
  const [savingRate, setSavingRate] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [addRoomForm, setAddRoomForm] = useState({
    room_number: '',
    floor: '1',
    room_type: 'standard',
    base_rate: '',
    hourly_rate: '',
    max_occupancy: '2',
    description: ''
  });
  const [addingRoom, setAddingRoom] = useState(false);

  const amenities = [
    { icon: 'bi-wifi', name: 'WiFi' },
    { icon: 'bi-tv', name: 'TV' },
    { icon: 'bi-snow', name: 'AC' },
    { icon: 'bi-cup-hot', name: 'Mini Bar' },
    { icon: 'bi-safe', name: 'Safe' },
    { icon: 'bi-telephone', name: 'Phone' },
    { icon: 'bi-droplet', name: 'Hot Water' },
    { icon: 'bi-wind', name: 'Hair Dryer' },
    { icon: 'bi-brightness-high', name: 'Room Service' },
    { icon: 'bi-door-open', name: 'Balcony' }
  ];

  // Users
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'front_desk'
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    new_reservations: true,
    cancellations: true,
    checkin_reminders: true,
    low_inventory: true,
    payment_alerts: false,
    daily_reports: false,
    browser_notifications: true,
    sound_alerts: false
  });

  // Billing & Taxes
  const [billingSettings, setBillingSettings] = useState({
    invoice_prefix: 'INV-',
    starting_number: '1001',
    invoice_footer: 'Thank you for choosing Udhayam International. We hope to see you again!',
    terms_conditions: '1. Check-out time is 11:00 AM\n2. Early check-in subject to availability\n3. Cancellation charges may apply'
  });

  // Meal Plan Rates
  const [mealSettings, setMealSettings] = useState({
    breakfast_rate: '250',
    dinner_rate: '400',
  });

  const [taxes, setTaxes] = useState([]);
  const [editingTax, setEditingTax] = useState(null); // { index, name, rate, applies_to, status }
  const [showAddTaxModal, setShowAddTaxModal] = useState(false);
  const [addTaxForm, setAddTaxForm] = useState({ name: '', rate: '', applies_to: 'Room Charges', status: 'Active' });

  // Integrations
  const defaultIntegrations = [
    { icon: 'bi-credit-card-2-front', name: 'Payment Gateway', desc: 'Razorpay integration for online payments', connected: false },
    { icon: 'bi-envelope', name: 'Email Service', desc: 'SMTP configuration for sending emails', connected: false },
    { icon: 'bi-chat-dots', name: 'SMS Gateway', desc: 'Send SMS notifications to guests', connected: false },
    { icon: 'bi-calendar-check', name: 'Booking.com', desc: 'Sync reservations with Booking.com', connected: false },
    { icon: 'bi-globe', name: 'Google Analytics', desc: 'Track website traffic and bookings', connected: false }
  ];
  const [integrations, setIntegrations] = useState(defaultIntegrations);

  // Backup & Security
  const [backupSettings, setBackupSettings] = useState({
    frequency: 'Daily',
    backup_time: '03:00',
    keep_30_days: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    two_factor: false,
    session_timeout: '30 minutes',
    password_requirements: true,
    login_attempt_limit: '5 attempts'
  });

  const roles = ['admin', 'manager', 'front_desk', 'housekeeping', 'restaurant', 'staff'];
  const languages = ['English', 'Hindi', 'Tamil', 'Telugu'];
  const timezones = ['Asia/Kolkata (IST)', 'Asia/Dubai (GST)', 'Europe/London (GMT)', 'America/New_York (EST)'];
  const dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
  const currencies = ['INR (Rs)', 'USD ($)', 'EUR (€)', 'GBP (£)'];

  const roleDescriptions = {
    admin: { icon: 'text-danger', label: 'Administrator', desc: 'Full system access including settings and user management' },
    manager: { icon: 'text-warning', label: 'Manager', desc: 'Access to reports, staff management, and operations' },
    front_desk: { icon: 'text-primary', label: 'Front Desk', desc: 'Reservations, check-in/out, and guest management' },
    housekeeping: { icon: 'text-info', label: 'Housekeeping', desc: 'Room status updates and housekeeping tasks' },
    restaurant: { icon: 'text-success', label: 'Restaurant', desc: 'Restaurant orders, menu management, and F&B operations' },
    staff: { icon: 'text-secondary', label: 'Staff', desc: 'Basic staff access with limited permissions' }
  };

  useEffect(() => {
    fetchSettings();
    fetchUsers();
    fetchRoomTypes();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const grouped = res.data || {};

      // Convert grouped arrays { general: [{key,value},...], billing: [...] } to flat map
      const flat = {};
      Object.values(grouped).forEach(arr => {
        if (Array.isArray(arr)) arr.forEach(s => { flat[s.key] = s.value; });
      });

      setGeneralSettings(prev => ({
        ...prev,
        system_language: flat.system_language || prev.system_language,
        timezone: flat.timezone || prev.timezone,
        date_format: flat.date_format || prev.date_format,
        currency: flat.currency || prev.currency,
        check_in_time: flat.check_in_time || prev.check_in_time,
        check_out_time: flat.check_out_time || prev.check_out_time
      }));

      setAppearance(prev => ({
        ...prev,
        theme: flat.theme || prev.theme,
        sidebar_style: flat.sidebar_style || prev.sidebar_style,
        compact_mode: flat.compact_mode === 'true' || prev.compact_mode
      }));

      setHotelInfo(prev => ({
        ...prev,
        hotel_name: flat.hotel_name || prev.hotel_name,
        hotel_type: flat.hotel_type || prev.hotel_type,
        star_rating: flat.star_rating || prev.star_rating,
        total_rooms: flat.total_rooms || prev.total_rooms,
        hotel_address: flat.hotel_address || prev.hotel_address,
        hotel_phone: flat.hotel_phone || prev.hotel_phone,
        hotel_email: flat.hotel_email || prev.hotel_email,
        hotel_website: flat.hotel_website || prev.hotel_website,
        hotel_gstin: flat.hotel_gstin || prev.hotel_gstin
      }));

      setNotifications(prev => ({
        ...prev,
        ...(flat.new_reservations !== undefined && { new_reservations: flat.new_reservations === 'true' }),
        ...(flat.cancellations !== undefined && { cancellations: flat.cancellations === 'true' }),
        ...(flat.checkin_reminders !== undefined && { checkin_reminders: flat.checkin_reminders === 'true' }),
        ...(flat.low_inventory !== undefined && { low_inventory: flat.low_inventory === 'true' }),
        ...(flat.payment_alerts !== undefined && { payment_alerts: flat.payment_alerts === 'true' }),
        ...(flat.daily_reports !== undefined && { daily_reports: flat.daily_reports === 'true' }),
        ...(flat.browser_notifications !== undefined && { browser_notifications: flat.browser_notifications === 'true' }),
        ...(flat.sound_alerts !== undefined && { sound_alerts: flat.sound_alerts === 'true' })
      }));

      setBillingSettings(prev => ({
        ...prev,
        invoice_prefix: flat.invoice_prefix || prev.invoice_prefix,
        starting_number: flat.starting_number || prev.starting_number,
        invoice_footer: flat.invoice_footer || prev.invoice_footer,
        terms_conditions: flat.terms_conditions || prev.terms_conditions
      }));

      setMealSettings(prev => ({
        ...prev,
        breakfast_rate: flat.breakfast_rate || prev.breakfast_rate,
        dinner_rate: flat.dinner_rate || prev.dinner_rate,
      }));

      if (flat.taxes) {
        try {
          setTaxes(JSON.parse(flat.taxes));
        } catch (e) {
          console.error('Failed to parse taxes', e);
        }
      }

      if (flat.integrations) {
        try {
          const saved = JSON.parse(flat.integrations);
          setIntegrations(prev => prev.map(intg => {
            const match = saved.find(s => s.name === intg.name);
            return match ? { ...intg, connected: match.connected } : intg;
          }));
        } catch (e) {
          console.error('Failed to parse integrations', e);
        }
      }

      setBackupSettings(prev => ({
        ...prev,
        frequency: flat.backup_frequency || prev.frequency,
        backup_time: flat.backup_time || prev.backup_time,
        keep_30_days: flat.keep_30_days === 'true' || prev.keep_30_days
      }));

      setSecuritySettings(prev => ({
        ...prev,
        two_factor: flat.two_factor === 'true' || prev.two_factor,
        session_timeout: flat.session_timeout || prev.session_timeout,
        password_requirements: flat.password_requirements !== undefined ? flat.password_requirements === 'true' : prev.password_requirements,
        login_attempt_limit: flat.login_attempt_limit || prev.login_attempt_limit
      }));
    } catch (err) {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await api.get('/rooms?limit=100');
      const rooms = res.data?.data || res.data || [];
      setAllRooms(rooms);

      const grouped = {};
      rooms.forEach(room => {
        const type = room.room_type;
        if (!grouped[type]) {
          grouped[type] = { rooms: [], base_rate: Number(room.base_rate), hourly_rate: Number(room.hourly_rate || 0), hourly_rates: room.hourly_rates || null, max_occupancy: Number(room.max_occupancy || 2), extra_bed_charge: Number(room.extra_bed_charge || 0), max_extra_beds: Number(room.max_extra_beds || 1) };
        }
        grouped[type].rooms.push(room);
      });

      const types = Object.entries(grouped).map(([type, data]) => ({
        type,
        name: capitalize(type),
        capacity: `${data.max_occupancy} Guest${data.max_occupancy > 1 ? 's' : ''}`,
        base_rate: data.base_rate,
        hourly_rate: data.hourly_rate,
        hourly_rates: data.hourly_rates,
        extra_bed_charge: data.extra_bed_charge,
        max_extra_beds: data.max_extra_beds,
        total: data.rooms.length,
        status: 'Active'
      }));
      setRoomTypes(types);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  };

  const handleSaveRate = async () => {
    if (!editingRoom) return;
    try {
      setSavingRate(true);
      const roomsOfType = allRooms.filter(r => r.room_type === editingRoom.type);
      const hourlyEnabled = editingRoom.hourly_enabled !== false;
      await Promise.all(
        roomsOfType.map(room => api.put(`/rooms/${room.id}`, {
          base_rate: editingRoom.base_rate,
          hourly_rate: hourlyEnabled ? (editingRoom.hourly_rates?.['2'] || editingRoom.hourly_rate || null) : null,
          hourly_rates: hourlyEnabled ? (editingRoom.hourly_rates || null) : null,
          extra_bed_charge: editingRoom.extra_bed_enabled !== false ? (editingRoom.extra_bed_charge || null) : null,
          max_extra_beds: editingRoom.extra_bed_enabled !== false ? (editingRoom.max_extra_beds || 1) : 0,
        }))
      );
      toast.success(`Rates updated for all ${capitalize(editingRoom.type)} rooms`);
      setEditingRoom(null);
      await fetchRoomTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update base rate');
    } finally {
      setSavingRate(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!addRoomForm.room_number || !addRoomForm.base_rate) {
      toast.error('Room number and base rate are required');
      return;
    }
    try {
      setAddingRoom(true);
      await api.post('/rooms', {
        room_number: addRoomForm.room_number,
        floor: parseInt(addRoomForm.floor),
        room_type: addRoomForm.room_type,
        base_rate: parseFloat(addRoomForm.base_rate),
        hourly_rate: addRoomForm.hourly_2 ? parseFloat(addRoomForm.hourly_2) : null,
        hourly_rates: (addRoomForm.hourly_2 || addRoomForm.hourly_3 || addRoomForm.hourly_4) ? {
          '2': parseFloat(addRoomForm.hourly_2) || 0,
          '3': parseFloat(addRoomForm.hourly_3) || 0,
          '4': parseFloat(addRoomForm.hourly_4) || 0,
          default: parseFloat(addRoomForm.hourly_default) || 0,
        } : null,
        max_occupancy: parseInt(addRoomForm.max_occupancy),
        description: addRoomForm.description || undefined
      });
      toast.success(`Room ${addRoomForm.room_number} added successfully`);
      setShowAddRoomModal(false);
      setAddRoomForm({ room_number: '', floor: '1', room_type: 'standard', base_rate: '', hourly_rate: '', hourly_2: '', hourly_3: '', hourly_4: '', hourly_default: '', max_occupancy: '2', description: '' });
      await fetchRoomTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add room');
    } finally {
      setAddingRoom(false);
    }
  };

  const saveTaxes = async (updatedTaxes) => {
    try {
      setSaving(true);
      await api.put('/settings', {
        settings: [{ key: 'taxes', value: JSON.stringify(updatedTaxes), category: 'billing' }]
      });
      setTaxes(updatedTaxes);
      toast.success('Tax configuration saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save taxes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTax = async (e) => {
    e.preventDefault();
    if (!addTaxForm.name || !addTaxForm.rate) {
      toast.error('Tax name and rate are required');
      return;
    }
    const updatedTaxes = [...taxes, { ...addTaxForm }];
    await saveTaxes(updatedTaxes);
    setShowAddTaxModal(false);
    setAddTaxForm({ name: '', rate: '', applies_to: 'Room Charges', status: 'Active' });
  };

  const handleSaveTaxEdit = async () => {
    if (!editingTax) return;
    const updatedTaxes = taxes.map((t, i) =>
      i === editingTax.index ? { name: editingTax.name, rate: editingTax.rate, applies_to: editingTax.applies_to, status: editingTax.status } : t
    );
    await saveTaxes(updatedTaxes);
    setEditingTax(null);
  };

  const handleDeleteTax = async (index) => {
    const updatedTaxes = taxes.filter((_, i) => i !== index);
    await saveTaxes(updatedTaxes);
  };

  const toggleIntegration = async (index) => {
    const updated = integrations.map((intg, i) =>
      i === index ? { ...intg, connected: !intg.connected } : intg
    );
    setIntegrations(updated);
    try {
      const toSave = updated.map(({ name, connected }) => ({ name, connected }));
      await api.put('/settings', {
        settings: [{ key: 'integrations', value: JSON.stringify(toSave), category: 'integrations' }]
      });
      const action = updated[index].connected ? 'connected' : 'disconnected';
      toast.success(`${updated[index].name} ${action}`);
    } catch (err) {
      setIntegrations(integrations);
      toast.error('Failed to update integration');
    }
  };

  const saveSettings = async (section, data, category = 'general') => {
    try {
      setSaving(true);
      const payload = {
        settings: Object.entries(data).map(([key, value]) => ({
          key,
          value: String(value),
          category
        }))
      };
      await api.put('/settings', payload);
      toast.success(`${section} settings saved successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    try {
      await api.post('/users', userForm);
      toast.success('User created successfully');
      setShowUserModal(false);
      setUserForm({ username: '', password: '', full_name: '', email: '', role: 'front_desk' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const toggleUserActive = async (userItem) => {
    try {
      await api.patch(`/users/${userItem.id}/toggle`);
      toast.success(`User ${userItem.is_active ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'bg-danger';
      case 'manager': return 'bg-warning text-dark';
      case 'front_desk': return 'bg-primary';
      case 'housekeeping': return 'bg-info';
      case 'restaurant': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const navItems = [
    { key: 'general', icon: 'bi-gear', label: 'General' },
    { key: 'hotelInfo', icon: 'bi-building', label: 'Hotel Information' },
    { key: 'rooms', icon: 'bi-door-closed', label: 'Room Configuration' },
    { key: 'users', icon: 'bi-people', label: 'Users & Permissions' },
    { key: 'notifications', icon: 'bi-bell', label: 'Notifications' },
    { key: 'billing', icon: 'bi-credit-card', label: 'Billing & Taxes' },
    { key: 'integrations', icon: 'bi-plug', label: 'Integrations' },
    { key: 'backup', icon: 'bi-cloud-arrow-up', label: 'Backup & Security' }
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-content">
      <div className="row">
        {/* Settings Navigation */}
        <div className="col-lg-3 mb-4">
          <div className="card settings-nav-card">
            <div className="card-body p-0">
              <nav className="settings-nav">
                {navItems.map(item => (
                  <a
                    key={item.key}
                    href={`#${item.key}`}
                    className={`settings-nav-item${activeTab === item.key ? ' active' : ''}`}
                    onClick={(e) => { e.preventDefault(); setActiveTab(item.key); }}
                  >
                    <i className={`bi ${item.icon}`}></i>
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="col-lg-9">
          <div className="tab-content">
            {/* General Settings */}
            <div className={`tab-pane fade${activeTab === 'general' ? ' show active' : ''}`} id="general">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bi bi-gear me-2"></i>General Settings</h5>
                </div>
                <div className="card-body">
                  <form>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">System Language</label>
                        <select
                          className="form-select"
                          value={generalSettings.system_language}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, system_language: e.target.value })}
                        >
                          {languages.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Timezone</label>
                        <select
                          className="form-select"
                          value={generalSettings.timezone}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                        >
                          {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Date Format</label>
                        <select
                          className="form-select"
                          value={generalSettings.date_format}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, date_format: e.target.value })}
                        >
                          {dateFormats.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Currency</label>
                        <select
                          className="form-select"
                          value={generalSettings.currency}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                        >
                          {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Check-in Time</label>
                        <input
                          type="time"
                          className="form-control"
                          value={generalSettings.check_in_time}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, check_in_time: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Check-out Time</label>
                        <input
                          type="time"
                          className="form-control"
                          value={generalSettings.check_out_time}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, check_out_time: e.target.value })}
                        />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary" onClick={() => saveSettings('General', generalSettings, 'general')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Appearance */}
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bi bi-palette me-2"></i>Appearance</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Theme</label>
                      <div className="theme-options">
                        {['light', 'dark', 'auto'].map(t => (
                          <label key={t} className={`theme-option${appearance.theme === t ? ' active' : ''}`}>
                            <input
                              type="radio"
                              name="theme"
                              checked={appearance.theme === t}
                              onChange={() => setAppearance({ ...appearance, theme: t })}
                            />
                            <span className={`theme-preview ${t}`}></span>
                            <span className="theme-name">{capitalize(t)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Sidebar Style</label>
                      <select
                        className="form-select"
                        value={appearance.sidebar_style}
                        onChange={(e) => setAppearance({ ...appearance, sidebar_style: e.target.value })}
                      >
                        <option>Expanded</option>
                        <option>Collapsed</option>
                        <option>Auto-hide</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="compactMode"
                          checked={appearance.compact_mode}
                          onChange={(e) => setAppearance({ ...appearance, compact_mode: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="compactMode">Enable compact mode (reduce spacing)</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel Information */}
            <div className={`tab-pane fade${activeTab === 'hotelInfo' ? ' show active' : ''}`} id="hotel-info">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bi bi-building me-2"></i>Hotel Information</h5>
                </div>
                <div className="card-body">
                  <form>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Hotel Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={hotelInfo.hotel_name}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_name: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Hotel Type</label>
                        <select
                          className="form-select"
                          value={hotelInfo.hotel_type}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_type: e.target.value })}
                        >
                          <option>Budget</option>
                          <option>Business</option>
                          <option>Luxury</option>
                          <option>Resort</option>
                          <option>Boutique</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Star Rating</label>
                        <select
                          className="form-select"
                          value={hotelInfo.star_rating}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, star_rating: e.target.value })}
                        >
                          <option value="1">1 Star</option>
                          <option value="2">2 Star</option>
                          <option value="3">3 Star</option>
                          <option value="4">4 Star</option>
                          <option value="5">5 Star</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Total Rooms</label>
                        <input
                          type="number"
                          className="form-control"
                          value={hotelInfo.total_rooms}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, total_rooms: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Address</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={hotelInfo.hotel_address}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_address: e.target.value })}
                        ></textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={hotelInfo.hotel_phone}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_phone: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={hotelInfo.hotel_email}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_email: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Website</label>
                        <input
                          type="url"
                          className="form-control"
                          value={hotelInfo.hotel_website}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_website: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">GST Number</label>
                        <input
                          type="text"
                          className="form-control"
                          value={hotelInfo.hotel_gstin}
                          onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_gstin: e.target.value })}
                          placeholder="e.g., 33ABGPA3200K1ZD"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Hotel Logo</label>
                        <div className="logo-upload">
                          <div className="current-logo">
                            <i className="bi bi-building"></i>
                          </div>
                          <div className="upload-info">
                            <button type="button" className="btn btn-outline-primary btn-sm">Upload New Logo</button>
                            <small className="text-muted d-block mt-1">PNG, JPG up to 2MB. Recommended: 200x200px</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary" onClick={() => saveSettings('Hotel info', hotelInfo, 'general')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>

            {/* Room Configuration */}
            <div className={`tab-pane fade${activeTab === 'rooms' ? ' show active' : ''}`} id="rooms">
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><i className="bi bi-door-closed me-2"></i>Room Types</h5>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddRoomModal(true)}>
                    <i className="bi bi-plus-lg me-1"></i>Add Room
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Room Type</th>
                          <th>Capacity</th>
                          <th>Base Rate</th>
                          <th>Hourly Rate</th>
                          <th>Extra Bed</th>
                          <th>GST</th>
                          <th>Rate (incl. GST)</th>
                          <th>Total Rooms</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomTypes.map((rt, idx) => {
                          const editRate = editingRoom?.type === rt.type ? editingRoom.base_rate : rt.base_rate;
                          const gstPct = getGstPercent(editRate);
                          const inclRate = gstInclusiveRate(editRate);
                          const editRates = editingRoom?.type === rt.type ? editingRoom.hourly_rates : (rt.hourly_rates || {});
                          return (
                          <tr key={idx}>
                            <td><strong>{rt.name}</strong></td>
                            <td>{rt.capacity}</td>
                            <td>
                              {editingRoom && editingRoom.type === rt.type ? (
                                <div className="d-flex align-items-center gap-2">
                                  <div className="input-group input-group-sm" style={{ width: '150px' }}>
                                    <span className="input-group-text">Rs</span>
                                    <input
                                      type="number"
                                      className="form-control"
                                      value={editingRoom.base_rate}
                                      onChange={(e) => setEditingRoom({ ...editingRoom, base_rate: Number(e.target.value) })}
                                      min="0"
                                      step="0.01"
                                      autoFocus
                                    />
                                  </div>
                                </div>
                              ) : (
                                <>{formatCurrency(rt.base_rate)}/night</>
                              )}
                            </td>
                            <td>
                              {editingRoom && editingRoom.type === rt.type ? (
                                <div>
                                  <div className="form-check form-switch mb-2">
                                    <input className="form-check-input" type="checkbox" id={`hourly-toggle-${rt.type}`}
                                      checked={editingRoom.hourly_enabled !== false}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setEditingRoom({ ...editingRoom, hourly_enabled: true, hourly_rates: editingRoom.hourly_rates || { '2': 0, '3': 0, '4': 0, default: 0 } });
                                        } else {
                                          setEditingRoom({ ...editingRoom, hourly_enabled: false, hourly_rates: null });
                                        }
                                      }}
                                    />
                                    <label className="form-check-label" htmlFor={`hourly-toggle-${rt.type}`} style={{ fontSize: 11, fontWeight: 700, color: editingRoom.hourly_enabled !== false ? '#92400e' : '#94a3b8' }}>
                                      {editingRoom.hourly_enabled !== false ? 'Enabled' : 'Disabled'}
                                    </label>
                                  </div>
                                  {editingRoom.hourly_enabled !== false && (
                                    <>
                                      {['2', '3', '4'].map(h => (
                                        <div key={h} className="d-flex align-items-center gap-1 mb-1">
                                          <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', minWidth: 24 }}>{h}h</span>
                                          <div className="input-group input-group-sm" style={{ width: '120px' }}>
                                            <span className="input-group-text" style={{ padding: '2px 6px', fontSize: 11 }}>₹</span>
                                            <input type="number" className="form-control"
                                              value={editingRoom.hourly_rates?.[h] || ''}
                                              onChange={(e) => setEditingRoom({ ...editingRoom, hourly_rates: { ...editingRoom.hourly_rates, [h]: Number(e.target.value) || 0 } })}
                                              min="0" step="1" placeholder="0" style={{ padding: '2px 6px', fontSize: 12 }} />
                                          </div>
                                        </div>
                                      ))}
                                      <div className="d-flex align-items-center gap-1 mt-1">
                                        <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', minWidth: 24 }}>5h+</span>
                                        <div className="input-group input-group-sm" style={{ width: '120px' }}>
                                          <span className="input-group-text" style={{ padding: '2px 6px', fontSize: 11 }}>₹</span>
                                          <input type="number" className="form-control"
                                            value={editingRoom.hourly_rates?.default || ''}
                                            onChange={(e) => setEditingRoom({ ...editingRoom, hourly_rates: { ...editingRoom.hourly_rates, default: Number(e.target.value) || 0 } })}
                                            min="0" step="1" placeholder="per extra hr" style={{ padding: '2px 6px', fontSize: 12 }} />
                                        </div>
                                        <span style={{ fontSize: 9, color: '#94a3b8' }}>/hr</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                editRates && (editRates['2'] || editRates['3'] || editRates['4'])
                                  ? <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                                      <span className="badge bg-success mb-1" style={{ fontSize: 9 }}>Enabled</span>
                                      {['2', '3', '4'].map(h => editRates[h] ? (
                                        <div key={h}><span style={{ color: '#92400e', fontWeight: 700 }}>{h}h:</span> <span style={{ fontWeight: 600 }}>{formatCurrency(editRates[h])}</span></div>
                                      ) : null)}
                                      {editRates.default ? <div style={{ color: '#64748b' }}>5h+: {formatCurrency(editRates.default)}/hr</div> : null}
                                    </div>
                                  : <span className="badge bg-secondary" style={{ fontSize: 10 }}>Disabled</span>
                              )}
                            </td>
                            <td>
                              {editingRoom && editingRoom.type === rt.type ? (
                                <div>
                                  <div className="form-check form-switch mb-2">
                                    <input className="form-check-input" type="checkbox" id={`extrabed-toggle-${rt.type}`}
                                      checked={editingRoom.extra_bed_enabled !== false}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setEditingRoom({ ...editingRoom, extra_bed_enabled: true, extra_bed_charge: editingRoom.extra_bed_charge || 0, max_extra_beds: editingRoom.max_extra_beds || 1 });
                                        } else {
                                          setEditingRoom({ ...editingRoom, extra_bed_enabled: false, extra_bed_charge: 0, max_extra_beds: 0 });
                                        }
                                      }}
                                    />
                                    <label className="form-check-label" htmlFor={`extrabed-toggle-${rt.type}`} style={{ fontSize: 11, fontWeight: 700, color: editingRoom.extra_bed_enabled !== false ? '#92400e' : '#94a3b8' }}>
                                      {editingRoom.extra_bed_enabled !== false ? 'Enabled' : 'Disabled'}
                                    </label>
                                  </div>
                                  {editingRoom.extra_bed_enabled !== false && (
                                    <>
                                      <div className="input-group input-group-sm mb-1" style={{ width: '120px' }}>
                                        <span className="input-group-text" style={{ padding: '2px 6px', fontSize: 11 }}>₹</span>
                                        <input type="number" className="form-control" value={editingRoom.extra_bed_charge || ''}
                                          onChange={(e) => setEditingRoom({ ...editingRoom, extra_bed_charge: Number(e.target.value) || 0 })}
                                          min="0" step="1" placeholder="charge/night" style={{ padding: '2px 6px', fontSize: 12 }} />
                                      </div>
                                      <div className="input-group input-group-sm" style={{ width: '120px' }}>
                                        <span className="input-group-text" style={{ padding: '2px 6px', fontSize: 10 }}>Max</span>
                                        <input type="number" className="form-control" value={editingRoom.max_extra_beds || 1}
                                          onChange={(e) => setEditingRoom({ ...editingRoom, max_extra_beds: Number(e.target.value) || 1 })}
                                          min="1" max="3" style={{ padding: '2px 6px', fontSize: 12 }} />
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                rt.extra_bed_charge > 0
                                  ? <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                                      <span className="badge bg-success mb-1" style={{ fontSize: 9 }}>Enabled</span>
                                      <div><span style={{ color: '#92400e', fontWeight: 700 }}>{formatCurrency(rt.extra_bed_charge)}</span>/night</div>
                                      <div style={{ color: '#64748b' }}>Max: {rt.max_extra_beds || 1}</div>
                                    </div>
                                  : <span className="badge bg-secondary" style={{ fontSize: 10 }}>Disabled</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${gstPct === 18 ? 'bg-warning text-dark' : 'bg-info text-white'}`}>
                                {gstPct}%
                              </span>
                              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                                CGST {gstPct / 2}% + SGST {gstPct / 2}%
                              </div>
                            </td>
                            <td>
                              <strong style={{ color: '#059669' }}>{formatCurrency(inclRate)}</strong>
                              <span style={{ fontSize: 11, color: '#6b7280' }}>/night</span>
                            </td>
                            <td>{rt.total}</td>
                            <td><span className="badge bg-success">{rt.status}</span></td>
                            <td>
                              {editingRoom && editingRoom.type === rt.type ? (
                                <div className="d-flex gap-1">
                                  <button className="btn btn-sm btn-success" onClick={handleSaveRate} disabled={savingRate}>
                                    <i className={`bi ${savingRate ? 'bi-hourglass-split' : 'bi-check-lg'}`}></i>
                                  </button>
                                  <button className="btn btn-sm btn-secondary" onClick={() => setEditingRoom(null)} disabled={savingRate}>
                                    <i className="bi bi-x-lg"></i>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => setEditingRoom({ type: rt.type, base_rate: rt.base_rate, hourly_rate: rt.hourly_rate || 0, hourly_enabled: !!(rt.hourly_rates && (rt.hourly_rates['2'] || rt.hourly_rates['3'] || rt.hourly_rates['4'])), hourly_rates: rt.hourly_rates || null, extra_bed_enabled: rt.extra_bed_charge > 0, extra_bed_charge: rt.extra_bed_charge || 0, max_extra_beds: rt.max_extra_beds || 1 })}
                                  disabled={editingRoom !== null}
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-footer" style={{ background: '#fffbeb', borderTop: '1px solid #fde68a', padding: '12px 16px' }}>
                  <div className="d-flex align-items-start gap-2" style={{ fontSize: 12, color: '#92400e' }}>
                    <i className="bi bi-info-circle-fill mt-1" style={{ flexShrink: 0 }}></i>
                    <div>
                      <strong>GST Slab Rules (SAC 9963):</strong>
                      <ul className="mb-0 mt-1" style={{ paddingLeft: 16 }}>
                        <li>Room tariff <strong>below ₹7,500/night</strong> — GST at <strong>12%</strong> (CGST 6% + SGST 6%)</li>
                        <li>Room tariff <strong>₹7,500 and above/night</strong> — GST at <strong>18%</strong> (CGST 9% + SGST 9%)</li>
                      </ul>
                      <div className="mt-1" style={{ color: '#78716c' }}>Base rate is stored internally. Guests always see the GST-inclusive rate.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room Amenities */}
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><i className="bi bi-stars me-2"></i>Room Amenities</h5>
                  <button className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-plus-lg me-1"></i>Add Amenity
                  </button>
                </div>
                <div className="card-body">
                  <div className="amenities-grid">
                    {amenities.map((a, idx) => (
                      <div key={idx} className="amenity-tag">
                        <i className={`bi ${a.icon}`}></i> {a.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Users & Permissions */}
            <div className={`tab-pane fade${activeTab === 'users' ? ' show active' : ''}`} id="users">
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><i className="bi bi-people me-2"></i>System Users</h5>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setUserForm({ username: '', password: '', full_name: '', email: '', role: 'front_desk' }); setShowUserModal(true); }}
                  >
                    <i className="bi bi-plus-lg me-1"></i>Add User
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Last Active</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length > 0 ? users.map(u => (
                          <tr key={u.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className={`user-avatar-sm ${getRoleBadgeClass(u.role)}`}>
                                  {(u.full_name || u.username || '?').charAt(0).toUpperCase()}
                                </div>
                                <strong>{u.full_name || u.username}</strong>
                              </div>
                            </td>
                            <td>{u.email || '-'}</td>
                            <td>
                              <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                                {capitalize(u.role?.replace('_', ' '))}
                              </span>
                            </td>
                            <td>{u.last_active || '-'}</td>
                            <td>
                              <span className={`badge ${u.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                {u.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary me-1"><i className="bi bi-pencil"></i></button>
                              {u.role !== 'admin' && (
                                <button className="btn btn-sm btn-outline-danger" onClick={() => toggleUserActive(u)}>
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="6" className="text-center text-muted">No users found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bi bi-shield-lock me-2"></i>User Roles</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {Object.entries(roleDescriptions).map(([key, role]) => {
                      const count = users.filter(u => u.role === key).length;
                      return (
                        <div key={key} className="col-md-6">
                          <div className="role-card">
                            <div className="role-header">
                              <h6><i className={`bi bi-shield-fill ${role.icon} me-2`}></i>{role.label}</h6>
                              <span className="badge bg-light text-dark">{count} user{count !== 1 ? 's' : ''}</span>
                            </div>
                            <p className="text-muted small mb-0">{role.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className={`tab-pane fade${activeTab === 'notifications' ? ' show active' : ''}`} id="notifications">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bi bi-bell me-2"></i>Notification Settings</h5>
                </div>
                <div className="card-body">
                  <h6 className="mb-3">Email Notifications</h6>
                  <div className="notification-settings">
                    {[
                      { key: 'new_reservations', label: 'New Reservations', desc: 'Get notified when a new reservation is made' },
                      { key: 'cancellations', label: 'Cancellations', desc: 'Get notified when a reservation is cancelled' },
                      { key: 'checkin_reminders', label: 'Check-in Reminders', desc: 'Daily summary of expected arrivals' },
                      { key: 'low_inventory', label: 'Low Inventory Alerts', desc: 'Alert when inventory items are running low' },
                      { key: 'payment_alerts', label: 'Payment Alerts', desc: 'Notifications for payment confirmations' },
                      { key: 'daily_reports', label: 'Daily Reports', desc: 'Receive daily summary reports via email' }
                    ].map(item => (
                      <div key={item.key} className="notification-item">
                        <div className="notification-info">
                          <strong>{item.label}</strong>
                          <small className="text-muted d-block">{item.desc}</small>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={notifications[item.key]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr className="my-4" />

                  <h6 className="mb-3">System Notifications</h6>
                  <div className="notification-settings">
                    {[
                      { key: 'browser_notifications', label: 'Browser Notifications', desc: 'Show desktop notifications in browser' },
                      { key: 'sound_alerts', label: 'Sound Alerts', desc: 'Play sound for important notifications' }
                    ].map(item => (
                      <div key={item.key} className="notification-item">
                        <div className="notification-info">
                          <strong>{item.label}</strong>
                          <small className="text-muted d-block">{item.desc}</small>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={notifications[item.key]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary" onClick={() => saveSettings('Notification', notifications, 'notifications')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>

            {/* Billing & Taxes */}
            <div className={`tab-pane fade${activeTab === 'billing' ? ' show active' : ''}`} id="billing-settings">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bi bi-receipt me-2"></i>Invoice Settings</h5>
                </div>
                <div className="card-body">
                  <form>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Invoice Prefix</label>
                        <input
                          type="text"
                          className="form-control"
                          value={billingSettings.invoice_prefix}
                          onChange={(e) => setBillingSettings({ ...billingSettings, invoice_prefix: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Starting Number</label>
                        <input
                          type="number"
                          className="form-control"
                          value={billingSettings.starting_number}
                          onChange={(e) => setBillingSettings({ ...billingSettings, starting_number: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Invoice Footer Text</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={billingSettings.invoice_footer}
                          onChange={(e) => setBillingSettings({ ...billingSettings, invoice_footer: e.target.value })}
                        ></textarea>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Terms &amp; Conditions</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={billingSettings.terms_conditions}
                          onChange={(e) => setBillingSettings({ ...billingSettings, terms_conditions: e.target.value })}
                        ></textarea>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary" onClick={() => saveSettings('Invoice', billingSettings, 'billing')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Invoice Settings'}
                  </button>
                </div>
              </div>

              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bi bi-cup-hot me-2"></i>Complimentary Meal Rates</h5>
                </div>
                <div className="card-body">
                  <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                    Set per-person per-night rates for complimentary meals. These rates are added to the room base rate when a meal plan is selected during booking.
                  </p>
                  <form>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Breakfast Rate (per person/night)</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={mealSettings.breakfast_rate}
                            onChange={(e) => setMealSettings({ ...mealSettings, breakfast_rate: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Dinner Rate (per person/night)</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={mealSettings.dinner_rate}
                            onChange={(e) => setMealSettings({ ...mealSettings, dinner_rate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary" onClick={() => saveSettings('Meal Plan', mealSettings, 'billing')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Meal Rates'}
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><i className="bi bi-percent me-2"></i>Tax Configuration</h5>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => setShowAddTaxModal(true)}>
                    <i className="bi bi-plus-lg me-1"></i>Add Tax
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Tax Name</th>
                          <th>Rate</th>
                          <th>Applies To</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxes.length === 0 && (
                          <tr><td colSpan="5" className="text-center text-muted py-3">No taxes configured</td></tr>
                        )}
                        {taxes.map((tax, idx) => (
                          <tr key={idx}>
                            {editingTax && editingTax.index === idx ? (
                              <>
                                <td>
                                  <input type="text" className="form-control form-control-sm" value={editingTax.name}
                                    onChange={(e) => setEditingTax({ ...editingTax, name: e.target.value })} />
                                </td>
                                <td>
                                  <input type="text" className="form-control form-control-sm" value={editingTax.rate} placeholder="e.g., 6%"
                                    onChange={(e) => setEditingTax({ ...editingTax, rate: e.target.value })} />
                                </td>
                                <td>
                                  <select className="form-select form-select-sm" value={editingTax.applies_to}
                                    onChange={(e) => setEditingTax({ ...editingTax, applies_to: e.target.value })}>
                                    <option>Room Charges</option>
                                    <option>F&B Services</option>
                                    <option>All Services</option>
                                  </select>
                                </td>
                                <td>
                                  <select className="form-select form-select-sm" value={editingTax.status}
                                    onChange={(e) => setEditingTax({ ...editingTax, status: e.target.value })}>
                                    <option>Active</option>
                                    <option>Inactive</option>
                                  </select>
                                </td>
                                <td>
                                  <button className="btn btn-sm btn-success me-1" onClick={handleSaveTaxEdit} disabled={saving}>
                                    <i className="bi bi-check-lg"></i>
                                  </button>
                                  <button className="btn btn-sm btn-secondary" onClick={() => setEditingTax(null)} disabled={saving}>
                                    <i className="bi bi-x-lg"></i>
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td><strong>{tax.name}</strong></td>
                                <td>{tax.rate}</td>
                                <td>{tax.applies_to}</td>
                                <td><span className={`badge ${tax.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>{tax.status}</span></td>
                                <td>
                                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setEditingTax({ index: idx, ...tax })} disabled={editingTax !== null}>
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTax(idx)} disabled={saving}>
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Integrations */}
            <div className={`tab-pane fade${activeTab === 'integrations' ? ' show active' : ''}`} id="integrations">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bi bi-plug me-2"></i>Third-Party Integrations</h5>
                </div>
                <div className="card-body">
                  <div className="integration-list">
                    {integrations.map((item, idx) => (
                      <div key={idx} className="integration-item">
                        <div className="integration-icon">
                          <i className={`bi ${item.icon}`}></i>
                        </div>
                        <div className="integration-info">
                          <h6>{item.name}</h6>
                          <small className="text-muted">{item.desc}</small>
                        </div>
                        <span className={`badge ${item.connected ? 'bg-success' : 'bg-secondary'}`}>
                          {item.connected ? 'Connected' : 'Not Connected'}
                        </span>
                        <button
                          className={`btn btn-sm ${item.connected ? 'btn-outline-danger' : 'btn-primary'}`}
                          onClick={() => toggleIntegration(idx)}
                        >
                          {item.connected ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Backup & Security */}
            <div className={`tab-pane fade${activeTab === 'backup' ? ' show active' : ''}`} id="backup">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bi bi-cloud-arrow-up me-2"></i>Data Backup</h5>
                </div>
                <div className="card-body">
                  <div className="backup-status mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">Last Backup</h6>
                        <p className="text-muted mb-0">February 3, 2026 at 03:00 AM</p>
                      </div>
                      <span className="badge bg-success-subtle text-success fs-6">
                        <i className="bi bi-check-circle me-1"></i>Successful
                      </span>
                    </div>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Backup Frequency</label>
                      <select
                        className="form-select"
                        value={backupSettings.frequency}
                        onChange={(e) => setBackupSettings({ ...backupSettings, frequency: e.target.value })}
                      >
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Backup Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={backupSettings.backup_time}
                        onChange={(e) => setBackupSettings({ ...backupSettings, backup_time: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={backupSettings.keep_30_days}
                          onChange={(e) => setBackupSettings({ ...backupSettings, keep_30_days: e.target.checked })}
                        />
                        <label className="form-check-label">Keep backups for 30 days</label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button className="btn btn-outline-primary me-2">
                      <i className="bi bi-cloud-arrow-up me-1"></i>Backup Now
                    </button>
                    <button className="btn btn-outline-secondary">
                      <i className="bi bi-cloud-arrow-down me-1"></i>Restore Backup
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bi bi-shield-check me-2"></i>Security Settings</h5>
                </div>
                <div className="card-body">
                  <div className="security-settings">
                    <div className="security-item">
                      <div className="security-info">
                        <strong>Two-Factor Authentication</strong>
                        <small className="text-muted d-block">Add an extra layer of security to your account</small>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={securitySettings.two_factor}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, two_factor: e.target.checked })}
                        />
                      </div>
                    </div>
                    <div className="security-item">
                      <div className="security-info">
                        <strong>Session Timeout</strong>
                        <small className="text-muted d-block">Auto logout after inactivity</small>
                      </div>
                      <select
                        className="form-select"
                        style={{ width: '150px' }}
                        value={securitySettings.session_timeout}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout: e.target.value })}
                      >
                        <option>15 minutes</option>
                        <option>30 minutes</option>
                        <option>1 hour</option>
                        <option>4 hours</option>
                      </select>
                    </div>
                    <div className="security-item">
                      <div className="security-info">
                        <strong>Password Requirements</strong>
                        <small className="text-muted d-block">Minimum 8 characters with uppercase, lowercase, and numbers</small>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={securitySettings.password_requirements}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, password_requirements: e.target.checked })}
                        />
                      </div>
                    </div>
                    <div className="security-item">
                      <div className="security-info">
                        <strong>Login Attempt Limit</strong>
                        <small className="text-muted d-block">Lock account after failed login attempts</small>
                      </div>
                      <select
                        className="form-select"
                        style={{ width: '150px' }}
                        value={securitySettings.login_attempt_limit}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, login_attempt_limit: e.target.value })}
                      >
                        <option>3 attempts</option>
                        <option>5 attempts</option>
                        <option>10 attempts</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary" onClick={() => saveSettings('Security', securitySettings, 'operations')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Security Settings'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <FormModal
        show={showUserModal}
        onHide={() => setShowUserModal(false)}
        title="Add User"
        onSubmit={handleAddUser}
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={userForm.full_name}
              onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            />
          </div>
          <div className="col-12">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              required
            >
              {roles.map(r => (
                <option key={r} value={r}>{capitalize(r.replace('_', ' '))}</option>
              ))}
            </select>
          </div>
        </div>
      </FormModal>

      <FormModal
        show={showAddRoomModal}
        onHide={() => setShowAddRoomModal(false)}
        title="Add Room"
        onSubmit={handleAddRoom}
        loading={addingRoom}
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Room Number</label>
            <input
              type="text"
              className="form-control"
              value={addRoomForm.room_number}
              onChange={(e) => setAddRoomForm({ ...addRoomForm, room_number: e.target.value })}
              placeholder="e.g., 101"
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Floor</label>
            <input
              type="number"
              className="form-control"
              value={addRoomForm.floor}
              onChange={(e) => setAddRoomForm({ ...addRoomForm, floor: e.target.value })}
              min="1"
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Room Type</label>
            <select
              className="form-select"
              value={addRoomForm.room_type}
              onChange={(e) => setAddRoomForm({ ...addRoomForm, room_type: e.target.value })}
              required
            >
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="suite">Suite</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Base Rate (Rs/night)</label>
            <input
              type="number"
              className="form-control"
              value={addRoomForm.base_rate}
              onChange={(e) => setAddRoomForm({ ...addRoomForm, base_rate: e.target.value })}
              min="0"
              step="0.01"
              placeholder="e.g., 2500"
              required
            />
            {addRoomForm.base_rate > 0 && (
              <div className="mt-2 p-2 rounded" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12 }}>
                <div className="d-flex justify-content-between">
                  <span style={{ color: '#6b7280' }}>GST ({getGstPercent(addRoomForm.base_rate)}%)</span>
                  <span style={{ color: '#6b7280' }}>{formatCurrency(gstInclusiveRate(addRoomForm.base_rate) - parseFloat(addRoomForm.base_rate))}</span>
                </div>
                <div className="d-flex justify-content-between" style={{ fontWeight: 700 }}>
                  <span style={{ color: '#059669' }}>Guest pays (incl. GST)</span>
                  <span style={{ color: '#059669' }}>{formatCurrency(gstInclusiveRate(addRoomForm.base_rate))}/night</span>
                </div>
              </div>
            )}
          </div>
          <div className="col-md-6">
            <label className="form-label">Hourly Rates <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>— tiered short stay pricing</span></label>
            <div className="d-flex flex-column gap-1">
              {['2', '3', '4'].map(h => (
                <div key={h} className="input-group input-group-sm">
                  <span className="input-group-text" style={{ minWidth: 36, fontSize: 11, fontWeight: 700 }}>{h}h</span>
                  <span className="input-group-text" style={{ fontSize: 11 }}>₹</span>
                  <input
                    type="number"
                    className="form-control"
                    value={addRoomForm[`hourly_${h}`] || ''}
                    onChange={(e) => setAddRoomForm({ ...addRoomForm, [`hourly_${h}`]: e.target.value })}
                    min="0"
                    placeholder="0"
                  />
                </div>
              ))}
              <div className="input-group input-group-sm">
                <span className="input-group-text" style={{ minWidth: 36, fontSize: 11, fontWeight: 600 }}>5h+</span>
                <span className="input-group-text" style={{ fontSize: 11 }}>₹</span>
                <input
                  type="number"
                  className="form-control"
                  value={addRoomForm.hourly_default || ''}
                  onChange={(e) => setAddRoomForm({ ...addRoomForm, hourly_default: e.target.value })}
                  min="0"
                  placeholder="per extra hr"
                />
                <span className="input-group-text" style={{ fontSize: 10 }}>/hr</span>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label">Max Occupancy</label>
            <input
              type="number"
              className="form-control"
              value={addRoomForm.max_occupancy}
              onChange={(e) => setAddRoomForm({ ...addRoomForm, max_occupancy: e.target.value })}
              min="1"
              max="10"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-control"
              value={addRoomForm.description}
              onChange={(e) => setAddRoomForm({ ...addRoomForm, description: e.target.value })}
              placeholder="Optional"
            />
          </div>
        </div>
      </FormModal>

      <FormModal
        show={showAddTaxModal}
        onHide={() => setShowAddTaxModal(false)}
        title="Add Tax"
        onSubmit={handleAddTax}
        loading={saving}
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Tax Name</label>
            <input
              type="text"
              className="form-control"
              value={addTaxForm.name}
              onChange={(e) => setAddTaxForm({ ...addTaxForm, name: e.target.value })}
              placeholder="e.g., CGST"
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Rate</label>
            <input
              type="text"
              className="form-control"
              value={addTaxForm.rate}
              onChange={(e) => setAddTaxForm({ ...addTaxForm, rate: e.target.value })}
              placeholder="e.g., 6%"
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Applies To</label>
            <select
              className="form-select"
              value={addTaxForm.applies_to}
              onChange={(e) => setAddTaxForm({ ...addTaxForm, applies_to: e.target.value })}
            >
              <option>Room Charges</option>
              <option>F&B Services</option>
              <option>All Services</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={addTaxForm.status}
              onChange={(e) => setAddTaxForm({ ...addTaxForm, status: e.target.value })}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default SettingsPage;
