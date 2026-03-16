import { useState, useEffect, useRef, useCallback } from 'react';
import { useApi } from '../../../hooks/useApi';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const drawSparkline = (canvas, data, color) => {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight || 40;
  ctx.clearRect(0, 0, width, height);

  if (!data || data.length === 0) return;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  data.forEach((val, i) => {
    const x = i * step;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Fill area
  ctx.lineTo((data.length - 1) * step, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = color.replace(')', ', 0.1)').replace('rgb', 'rgba');
  ctx.globalAlpha = 0.3;
  ctx.fill();
  ctx.globalAlpha = 1;
};

const QUICK_REPORTS = [
  { name: 'Daily Operations Report', desc: "Today's summary", icon: 'bi-bar-chart', color: 'primary' },
  { name: 'Revenue Report', desc: 'Income breakdown', icon: 'bi-currency-dollar', color: 'success' },
  { name: 'Occupancy Report', desc: 'Room utilization', icon: 'bi-door-open', color: 'warning' },
  { name: 'Guest Demographics', desc: 'Customer insights', icon: 'bi-people', color: 'info' },
  { name: 'Housekeeping Report', desc: 'Room status summary', icon: 'bi-brush', color: 'danger' },
  { name: 'Inventory Report', desc: 'Stock levels', icon: 'bi-box-seam', color: 'secondary' }
];

const REVENUE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' }
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: (value) => formatCurrency(value)
      }
    }
  }
};

const OCCUPANCY_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  cutout: '70%'
};

const useReports = () => {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  const [revenueData, setRevenueData] = useState({ labels: [], datasets: [] });
  const [occupancyData, setOccupancyData] = useState({ labels: [], datasets: [] });
  const [dailySummary, setDailySummary] = useState({
    check_ins: 0,
    check_outs: 0,
    revenue: 0,
    occupancy_rate: 0
  });
  const [guestStats, setGuestStats] = useState({
    total: 0,
    new_this_month: 0,
    vip: 0,
    top_guests: []
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [reportType, setReportType] = useState('Revenue Report');
  const [reportFormat, setReportFormat] = useState('PDF Document');
  const [dateRange, setDateRange] = useState('month');
  const [comparisonPeriod, setComparisonPeriod] = useState('Previous Period');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sections, setSections] = useState({
    summary: true,
    charts: true,
    tables: true,
    comparison: false,
    breakdown: false,
    recommendations: false
  });
  const [notes, setNotes] = useState('');
  const [chartView, setChartView] = useState('daily');

  // Sparkline refs
  const revenueSparklineRef = useRef(null);
  const occupancySparklineRef = useRef(null);
  const adrSparklineRef = useRef(null);
  const revparSparklineRef = useRef(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { start_date: startDate, end_date: endDate };

      const [revenueRes, occupancyRes, summaryRes, guestsRes] = await Promise.all([
        api.get('/reports/revenue', { params }),
        api.get('/reports/occupancy', { params }),
        api.get('/reports/daily-summary', { params }),
        api.get('/reports/guest-statistics', { params })
      ]);

      // Revenue chart data
      const revenue = revenueRes.data || {};
      setRevenueData({
        labels: revenue.labels || [],
        datasets: [
          {
            label: 'Revenue',
            data: revenue.values || [],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Last Period',
            data: revenue.previous_values || [],
            borderColor: '#bdc3c7',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.4
          }
        ]
      });

      // Occupancy chart data
      const occupancy = occupancyRes.data || {};
      setOccupancyData({
        labels: occupancy.labels || ['Occupied', 'Available'],
        datasets: [
          {
            data: [occupancy.occupied || 0, occupancy.available || 0],
            backgroundColor: ['#3498db', '#27ae60', '#f39c12', '#9b59b6'],
            borderWidth: 0
          }
        ]
      });

      // Daily summary
      setDailySummary(summaryRes.data || {
        check_ins: 0,
        check_outs: 0,
        revenue: 0,
        occupancy_rate: 0
      });

      // Guest statistics
      setGuestStats(guestsRes.data || {
        total: 0,
        new_this_month: 0,
        vip: 0,
        top_guests: []
      });
    } catch (err) {
      console.error('Failed to fetch reports', err);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [api, startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  // Draw sparklines after data loads
  useEffect(() => {
    if (!loading) {
      drawSparkline(revenueSparklineRef.current, dailySummary.revenue_sparkline || [30, 45, 35, 50, 40, 60, 55, 70, 65], '#3498db');
      drawSparkline(occupancySparklineRef.current, dailySummary.occupancy_sparkline || [60, 65, 70, 68, 72, 75, 74, 78, 75], '#27ae60');
      drawSparkline(adrSparklineRef.current, dailySummary.adr_sparkline || [120, 125, 130, 128, 135, 140, 138, 142, 143], '#f39c12');
      drawSparkline(revparSparklineRef.current, dailySummary.revpar_sparkline || [80, 85, 90, 88, 95, 100, 98, 105, 107], '#9b59b6');
    }
  }, [loading, dailySummary]);

  const handleQuickRange = useCallback((range) => {
    const today = dayjs();
    switch (range) {
      case 'today':
        setStartDate(today.format('YYYY-MM-DD'));
        setEndDate(today.format('YYYY-MM-DD'));
        break;
      case 'week':
        setStartDate(today.startOf('week').format('YYYY-MM-DD'));
        setEndDate(today.format('YYYY-MM-DD'));
        break;
      case 'month':
        setStartDate(today.startOf('month').format('YYYY-MM-DD'));
        setEndDate(today.format('YYYY-MM-DD'));
        break;
      case 'year':
        setStartDate(today.startOf('year').format('YYYY-MM-DD'));
        setEndDate(today.format('YYYY-MM-DD'));
        break;
      default:
        break;
    }
  }, []);

  const handleSectionToggle = useCallback((key) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleGenerateReport = useCallback(() => {
    toast.success(`Generating ${reportType}...`);
    setShowModal(false);
  }, [reportType]);

  const handleExport = useCallback(() => {
    toast.success('Exporting report data...');
  }, []);

  const openModalWithReport = useCallback((name) => {
    setReportType(name);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const dateDisplay = `${dayjs(startDate).format('MMM D')} - ${dayjs(endDate).format('MMM D, YYYY')}`;

  return {
    // Data
    loading,
    revenueData,
    occupancyData,
    dailySummary,
    guestStats,
    dateDisplay,

    // Chart options
    revenueChartOptions: REVENUE_CHART_OPTIONS,
    occupancyChartOptions: OCCUPANCY_CHART_OPTIONS,

    // Chart view
    chartView,
    setChartView,

    // Sparkline refs
    revenueSparklineRef,
    occupancySparklineRef,
    adrSparklineRef,
    revparSparklineRef,

    // Modal state
    showModal,
    reportType,
    setReportType,
    reportFormat,
    setReportFormat,
    dateRange,
    setDateRange,
    comparisonPeriod,
    setComparisonPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    sections,
    notes,
    setNotes,

    // Handlers
    handleQuickRange,
    handleSectionToggle,
    handleGenerateReport,
    handleExport,
    openModalWithReport,
    closeModal,

    // Constants
    quickReports: QUICK_REPORTS
  };
};

export default useReports;
