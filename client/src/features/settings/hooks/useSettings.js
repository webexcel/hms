import { useState, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import { capitalize } from '../../../utils/formatters';
import toast from 'react-hot-toast';

// GST helpers
const GST_RATE = 0.12; // 12% for rooms < 7500/night
const GST_RATE_LUXURY = 0.18; // 18% for rooms >= 7500/night
export const getGstRate = (baseRate) => (parseFloat(baseRate) || 0) >= 7500 ? GST_RATE_LUXURY : GST_RATE;
export const gstInclusiveRate = (baseRate) => {
  const rate = parseFloat(baseRate) || 0;
  return Math.round(rate * (1 + getGstRate(rate)));
};
export const getGstPercent = (baseRate) => Math.round(getGstRate(baseRate) * 100);

export default function useSettings() {
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
  const [editingRoom, setEditingRoom] = useState(null);
  const [savingRate, setSavingRate] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [addRoomForm, setAddRoomForm] = useState({
    room_number: '',
    floor: '1',
    room_type: 'standard',
    base_rate: '',
    single_rate: '',
    single_misc: '',
    double_rate: '',
    double_misc: '',
    triple_rate: '',
    triple_misc: '',
    hourly_rate: '',
    extra_bed_charge: '',
    max_extra_beds: '1',
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
    show_meal_discount: 'false',
  });

  const [taxes, setTaxes] = useState([]);
  const [editingTax, setEditingTax] = useState(null);
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
        show_meal_discount: flat.show_meal_discount || prev.show_meal_discount,
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

  const handleSaveRate = async (roomId) => {
    if (!editingRoom) return;
    const id = roomId || editingRoom.id;
    if (!id) return;
    try {
      setSavingRate(true);
      const single = parseFloat(editingRoom.single_rate) || null;
      const double = parseFloat(editingRoom.double_rate) || null;
      const triple = parseFloat(editingRoom.triple_rate) || null;
      const baseRate = double || single || triple || 0;
      const hourlyRates = editingRoom.hourly_rates || {};
      const hasHourly = hourlyRates['2'] || hourlyRates['3'] || hourlyRates['4'];
      const payload = {
        single_rate: single,
        single_misc: parseFloat(editingRoom.single_misc) || 0,
        double_rate: double,
        double_misc: parseFloat(editingRoom.double_misc) || 0,
        triple_rate: triple,
        triple_misc: parseFloat(editingRoom.triple_misc) || 0,
        base_rate: baseRate,
        hourly_rate: hasHourly ? (hourlyRates['2'] || null) : null,
        hourly_rates: hasHourly ? hourlyRates : null,
        extra_bed_charge: editingRoom.extra_bed_charge ? Number(editingRoom.extra_bed_charge) : null,
        max_extra_beds: editingRoom.extra_bed_charge ? (Number(editingRoom.max_extra_beds) || 1) : 0,
        max_occupancy: parseInt(editingRoom.max_occupancy) || 2,
      };
      await api.put(`/rooms/${id}`, payload);
      toast.success(`Room ${editingRoom.room_number || ''} updated`);
      setEditingRoom(null);
      await fetchRoomTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update room');
    } finally {
      setSavingRate(false);
    }
  };

  const handleSaveTypeRate = async (type, roomIds) => {
    if (!editingRoom || !roomIds || roomIds.length === 0) return;
    try {
      setSavingRate(true);
      const single = parseFloat(editingRoom.single_rate) || null;
      const double = parseFloat(editingRoom.double_rate) || null;
      const triple = parseFloat(editingRoom.triple_rate) || null;
      const baseRate = double || single || triple || 0;
      const hourlyRates = editingRoom.hourly_rates || {};
      const hasHourly = hourlyRates['2'] || hourlyRates['3'] || hourlyRates['4'];
      const payload = {
        single_rate: single,
        single_misc: parseFloat(editingRoom.single_misc) || 0,
        double_rate: double,
        double_misc: parseFloat(editingRoom.double_misc) || 0,
        triple_rate: triple,
        triple_misc: parseFloat(editingRoom.triple_misc) || 0,
        base_rate: baseRate,
        hourly_rate: hasHourly ? (hourlyRates['2'] || null) : null,
        hourly_rates: hasHourly ? hourlyRates : null,
        extra_bed_charge: editingRoom.extra_bed_charge ? Number(editingRoom.extra_bed_charge) : null,
        max_extra_beds: editingRoom.extra_bed_charge ? (Number(editingRoom.max_extra_beds) || 1) : 0,
        max_occupancy: parseInt(editingRoom.max_occupancy) || 2,
      };
      await Promise.all(roomIds.map(id => api.put(`/rooms/${id}`, payload)));
      toast.success(`All ${roomIds.length} ${type.replace(/_/g, ' ')} rooms updated`);
      setEditingRoom(null);
      await fetchRoomTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update rooms');
    } finally {
      setSavingRate(false);
    }
  };

  const handleChangeRoomType = async (roomId, newType) => {
    try {
      setSavingRate(true);
      // Find a room of the target type to copy rates from
      const targetRoom = allRooms.find(r => r.room_type === newType);
      const payload = { room_type: newType };
      if (targetRoom) {
        payload.base_rate = targetRoom.base_rate || 0;
        payload.single_rate = targetRoom.single_rate || null;
        payload.single_misc = targetRoom.single_misc || 0;
        payload.double_rate = targetRoom.double_rate || null;
        payload.double_misc = targetRoom.double_misc || 0;
        payload.triple_rate = targetRoom.triple_rate || null;
        payload.triple_misc = targetRoom.triple_misc || 0;
        payload.hourly_rate = targetRoom.hourly_rate || null;
        payload.hourly_rates = targetRoom.hourly_rates || null;
        payload.extra_bed_charge = targetRoom.extra_bed_charge || null;
        payload.max_extra_beds = targetRoom.max_extra_beds || 1;
        payload.max_occupancy = targetRoom.max_occupancy || 2;
      }
      await api.put(`/rooms/${roomId}`, payload);
      toast.success(`Room moved to ${newType.replace(/_/g, ' ')} with matching rates`);
      await fetchRoomTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change room type');
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
      const dRate = parseFloat(addRoomForm.double_rate) || 0;
      const sRate = parseFloat(addRoomForm.single_rate) || 0;
      const tRate = parseFloat(addRoomForm.triple_rate) || 0;
      const baseRate = dRate || sRate || tRate || parseFloat(addRoomForm.base_rate) || 0;
      await api.post('/rooms', {
        room_number: addRoomForm.room_number,
        floor: parseInt(addRoomForm.floor),
        room_type: addRoomForm.room_type,
        base_rate: baseRate,
        single_rate: sRate || null,
        single_misc: parseFloat(addRoomForm.single_misc) || 0,
        double_rate: dRate || null,
        double_misc: parseFloat(addRoomForm.double_misc) || 0,
        triple_rate: tRate || null,
        triple_misc: parseFloat(addRoomForm.triple_misc) || 0,
        hourly_rate: addRoomForm.hourly_2 ? parseFloat(addRoomForm.hourly_2) : null,
        hourly_rates: (addRoomForm.hourly_2 || addRoomForm.hourly_3 || addRoomForm.hourly_4) ? {
          '2': parseFloat(addRoomForm.hourly_2) || 0,
          '3': parseFloat(addRoomForm.hourly_3) || 0,
          '4': parseFloat(addRoomForm.hourly_4) || 0,
          default: parseFloat(addRoomForm.hourly_default) || 0,
        } : null,
        extra_bed_charge: addRoomForm.extra_bed_charge ? parseFloat(addRoomForm.extra_bed_charge) : null,
        max_extra_beds: addRoomForm.extra_bed_charge ? (parseInt(addRoomForm.max_extra_beds) || 1) : 0,
        max_occupancy: parseInt(addRoomForm.max_occupancy),
        description: addRoomForm.description || undefined
      });
      toast.success(`Room ${addRoomForm.room_number} added successfully`);
      setShowAddRoomModal(false);
      setAddRoomForm({ room_number: '', floor: '1', room_type: 'standard', base_rate: '', single_rate: '', single_misc: '', double_rate: '', double_misc: '', triple_rate: '', triple_misc: '', hourly_rate: '', hourly_2: '', hourly_3: '', hourly_4: '', hourly_default: '', extra_bed_charge: '', max_extra_beds: '1', max_occupancy: '2', description: '' });
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

  return {
    // State
    activeTab, setActiveTab,
    loading,
    saving,
    generalSettings, setGeneralSettings,
    appearance, setAppearance,
    hotelInfo, setHotelInfo,
    roomTypes, allRooms, editingRoom, setEditingRoom, savingRate,
    showAddRoomModal, setShowAddRoomModal,
    addRoomForm, setAddRoomForm, addingRoom,
    amenities,
    users, showUserModal, setShowUserModal, userForm, setUserForm,
    notifications, setNotifications,
    billingSettings, setBillingSettings,
    mealSettings, setMealSettings,
    taxes, editingTax, setEditingTax,
    showAddTaxModal, setShowAddTaxModal,
    addTaxForm, setAddTaxForm,
    integrations,
    backupSettings, setBackupSettings,
    securitySettings, setSecuritySettings,

    // Constants
    roles, languages, timezones, dateFormats, currencies,
    roleDescriptions, navItems,

    // Handlers
    saveSettings,
    handleSaveRate,
    handleSaveTypeRate,
    handleChangeRoomType,
    handleAddRoom,
    handleAddTax,
    handleSaveTaxEdit,
    handleDeleteTax,
    toggleIntegration,
    handleAddUser,
    toggleUserActive,
    getRoleBadgeClass,
  };
}
