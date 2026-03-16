import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from 'react-hot-toast';

const INITIAL_FORM_DATA = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  id_proof_type: '',
  id_proof_number: '',
  gstin: '',
  company_name: '',
  vip_status: false,
  notes: '',
  nationality: '',
  date_of_birth: '',
  title: 'Mr.',
  marketing_consent: true,
};

const useGuests = () => {
  const navigate = useNavigate();
  const api = useApi();

  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({ total: 0, inHouse: 0, vip: 0, returning: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const debouncedSearch = useDebounce(searchTerm, 400);

  const fetchGuests = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterType && filterType !== 'all') params.filter = filterType;
      const response = await api.get('/guests', { params });
      setGuests(response.data.guests || response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch guests');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, filterType]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/guests/stats');
      setStats({
        total: response.data.total || 0,
        inHouse: response.data.inHouse || response.data.currentlyInHouse || 0,
        vip: response.data.vip || 0,
        returning: response.data.returning || 0,
      });
    } catch (error) {
      console.error('Failed to fetch guest stats:', error);
    }
  }, []);

  const fetchGuestProfile = useCallback(async (guest) => {
    try {
      const response = await api.get(`/guests/${guest.id}`);
      setSelectedGuest(response.data.guest || response.data || guest);
    } catch (error) {
      setSelectedGuest(guest);
    }
    setShowProfileModal(true);
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterType]);

  useEffect(() => {
    fetchGuests();
  }, [currentPage, debouncedSearch, filterType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/guests', formData);
      toast.success('Guest added successfully');
      setShowModal(false);
      setFormData(INITIAL_FORM_DATA);
      fetchGuests();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add guest');
    } finally {
      setSubmitting(false);
    }
  }, [formData, fetchGuests, fetchStats]);

  const handleRowClick = useCallback((guest) => {
    navigate(`/guests/${guest.id}`);
  }, [navigate]);

  const handleFilter = useCallback((type, e) => {
    e.preventDefault();
    setFilterType(type);
  }, []);

  const toggleDropdown = useCallback((guestId, e) => {
    e.stopPropagation();
    setActiveDropdown((prev) => (prev === guestId ? null : guestId));
  }, []);

  const getPageNumbers = useCallback(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  return {
    // State
    guests,
    stats,
    loading,
    searchTerm,
    filterType,
    viewMode,
    currentPage,
    totalPages,
    showModal,
    showProfileModal,
    selectedGuest,
    submitting,
    activeDropdown,
    formData,

    // Setters
    setSearchTerm,
    setViewMode,
    setCurrentPage,
    setShowModal,
    setShowProfileModal,

    // Handlers
    handleInputChange,
    handleSubmit,
    handleRowClick,
    handleFilter,
    toggleDropdown,
    fetchGuestProfile,

    // Helpers
    getPageNumbers,
    navigate,
  };
};

export default useGuests;
