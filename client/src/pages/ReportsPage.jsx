import React, { useState, useEffect, useRef } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useApi } from '../hooks/useApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate, capitalize } from '../utils/formatters';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Filler, Title, Tooltip, Legend);

const ReportsPage = () => {
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

  const fetchReports = async () => {
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
  };

  const revenueChartOptions = {
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

  const occupancyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    cutout: '70%'
  };

  const handleQuickRange = (range) => {
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
  };

  const handleSectionToggle = (key) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerateReport = () => {
    toast.success(`Generating ${reportType}...`);
    setShowModal(false);
  };

  const handleExport = () => {
    toast.success('Exporting report data...');
  };

  const quickReports = [
    { name: 'Daily Operations Report', desc: "Today's summary", icon: 'bi-bar-chart', color: 'primary' },
    { name: 'Revenue Report', desc: 'Income breakdown', icon: 'bi-currency-dollar', color: 'success' },
    { name: 'Occupancy Report', desc: 'Room utilization', icon: 'bi-door-open', color: 'warning' },
    { name: 'Guest Demographics', desc: 'Customer insights', icon: 'bi-people', color: 'info' },
    { name: 'Housekeeping Report', desc: 'Room status summary', icon: 'bi-brush', color: 'danger' },
    { name: 'Inventory Report', desc: 'Stock levels', icon: 'bi-box-seam', color: 'secondary' }
  ];

  const dateDisplay = `${dayjs(startDate).format('MMM D')} - ${dayjs(endDate).format('MMM D, YYYY')}`;

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-muted mb-0">View performance metrics and generate reports</p>
        </div>
        <div className="d-flex gap-2">
          <div className="input-group" style={{ width: 'auto' }}>
            <span className="input-group-text"><i className="bi bi-calendar-range"></i></span>
            <input
              type="text"
              className="form-control"
              value={dateDisplay}
              readOnly
              style={{ width: '180px' }}
            />
          </div>
          <button className="btn btn-outline-secondary" onClick={handleExport}>
            <i className="bi bi-download me-2"></i>Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="bi bi-file-earmark-text me-2"></i>Generate Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Total Revenue</span>
              <span className="kpi-trend up"><i className="bi bi-arrow-up"></i> {dailySummary.revenue_trend || '0'}%</span>
            </div>
            <div className="kpi-value">{formatCurrency(dailySummary.revenue)}</div>
            <div className="kpi-comparison">
              <span className="text-muted">vs {formatCurrency(dailySummary.previous_revenue || 0)} last period</span>
            </div>
            <div className="kpi-chart">
              <canvas ref={revenueSparklineRef}></canvas>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Occupancy Rate</span>
              <span className="kpi-trend up"><i className="bi bi-arrow-up"></i> {dailySummary.occupancy_trend || '0'}%</span>
            </div>
            <div className="kpi-value">{dailySummary.occupancy_rate}%</div>
            <div className="kpi-comparison">
              <span className="text-muted">vs {dailySummary.previous_occupancy || 0}% last period</span>
            </div>
            <div className="kpi-chart">
              <canvas ref={occupancySparklineRef}></canvas>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">ADR</span>
              <span className="kpi-trend up"><i className="bi bi-arrow-up"></i> {dailySummary.adr_trend || '0'}%</span>
            </div>
            <div className="kpi-value">{formatCurrency(dailySummary.adr || 0)}</div>
            <div className="kpi-comparison">
              <span className="text-muted">vs {formatCurrency(dailySummary.previous_adr || 0)} last period</span>
            </div>
            <div className="kpi-chart">
              <canvas ref={adrSparklineRef}></canvas>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">RevPAR</span>
              <span className="kpi-trend up"><i className="bi bi-arrow-up"></i> {dailySummary.revpar_trend || '0'}%</span>
            </div>
            <div className="kpi-value">{formatCurrency(dailySummary.revpar || 0)}</div>
            <div className="kpi-comparison">
              <span className="text-muted">vs {formatCurrency(dailySummary.previous_revpar || 0)} last period</span>
            </div>
            <div className="kpi-chart">
              <canvas ref={revparSparklineRef}></canvas>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        {/* Revenue Chart */}
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Revenue Overview</h5>
              <div className="btn-group btn-group-sm">
                <button
                  className={`btn btn-outline-secondary ${chartView === 'daily' ? 'active' : ''}`}
                  onClick={() => setChartView('daily')}
                >Daily</button>
                <button
                  className={`btn btn-outline-secondary ${chartView === 'weekly' ? 'active' : ''}`}
                  onClick={() => setChartView('weekly')}
                >Weekly</button>
                <button
                  className={`btn btn-outline-secondary ${chartView === 'monthly' ? 'active' : ''}`}
                  onClick={() => setChartView('monthly')}
                >Monthly</button>
              </div>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <Line data={revenueData} options={revenueChartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue by Source */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Revenue by Source</h5>
            </div>
            <div className="card-body">
              <div style={{ height: '220px' }}>
                <Doughnut data={occupancyData} options={occupancyChartOptions} />
              </div>
              <div className="source-legend mt-3">
                {(occupancyData.labels || []).map((label, idx) => (
                  <div className="legend-item" key={label}>
                    <span className="legend-color" style={{ background: occupancyData.datasets[0]?.backgroundColor[idx] || '#ccc' }}></span>
                    <span>{label}</span>
                    <strong>{occupancyData.datasets[0]?.data[idx] || 0}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="row g-3 mb-4">
        {/* Occupancy Chart */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Occupancy by Room Type</h5>
              <select className="form-select form-select-sm" style={{ width: 'auto' }} onChange={(e) => handleQuickRange(e.target.value)}>
                <option value="month">This Month</option>
                <option value="week">Last Month</option>
                <option value="year">Last 3 Months</option>
              </select>
            </div>
            <div className="card-body">
              <div style={{ height: '250px' }}>
                <Bar
                  data={{
                    labels: dailySummary.room_type_labels || [],
                    datasets: [{
                      label: 'Occupancy %',
                      data: dailySummary.room_type_occupancy || [],
                      backgroundColor: '#3498db',
                      borderRadius: 4
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, max: 100 } }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Booking Channels */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Booking Channels</h5>
              <select className="form-select form-select-sm" style={{ width: 'auto' }}>
                <option>This Month</option>
                <option>Last Month</option>
                <option>Last 3 Months</option>
              </select>
            </div>
            <div className="card-body">
              <div style={{ height: '250px' }}>
                <Bar
                  data={{
                    labels: dailySummary.channel_labels || [],
                    datasets: [{
                      label: 'Bookings',
                      data: dailySummary.channel_values || [],
                      backgroundColor: ['#3498db', '#27ae60', '#f39c12', '#9b59b6', '#e74c3c'],
                      borderRadius: 4
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: { x: { beginAtZero: true } }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports & Tables Row */}
      <div className="row g-3">
        {/* Quick Reports */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0"><i className="bi bi-file-earmark-text me-2"></i>Quick Reports</h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush report-list">
                {quickReports.map((report) => (
                  <a
                    href="#"
                    className="list-group-item list-group-item-action d-flex align-items-center"
                    key={report.name}
                    onClick={(e) => {
                      e.preventDefault();
                      setReportType(report.name);
                      setShowModal(true);
                    }}
                  >
                    <div className={`report-icon bg-${report.color}-subtle`}>
                      <i className={`bi ${report.icon} text-${report.color}`}></i>
                    </div>
                    <div className="report-info">
                      <div className="report-name">{report.name}</div>
                      <small className="text-muted">{report.desc}</small>
                    </div>
                    <i className="bi bi-chevron-right ms-auto"></i>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0"><i className="bi bi-trophy me-2"></i>Top Performing</h5>
            </div>
            <div className="card-body">
              <h6 className="text-muted mb-3">Room Types by Revenue</h6>
              {(guestStats.top_guests || []).slice(0, 5).map((guest, idx) => {
                const colors = ['#27ae60', '#3498db', '#f39c12', '#9b59b6', '#e74c3c'];
                const maxSpent = guestStats.top_guests[0]?.total_spent || 1;
                const pct = Math.round((guest.total_spent / maxSpent) * 100);
                return (
                  <div className="performance-item" key={guest.id || idx}>
                    <div className="perf-info">
                      <span className="perf-rank">{idx + 1}</span>
                      <span className="perf-name">{guest.name}</span>
                    </div>
                    <div className="perf-bar">
                      <div className="perf-progress" style={{ width: `${pct}%`, background: colors[idx % colors.length] }}></div>
                    </div>
                    <span className="perf-value">{formatCurrency(guest.total_spent)}</span>
                  </div>
                );
              })}

              <hr className="my-3" />

              <h6 className="text-muted mb-3">Top Booking Sources</h6>
              <div className="source-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-globe text-primary"></i>
                  <span>Direct Website</span>
                </div>
                <strong>{dailySummary.direct_pct || 0}%</strong>
              </div>
              <div className="source-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-building text-success"></i>
                  <span>Booking.com</span>
                </div>
                <strong>{dailySummary.booking_pct || 0}%</strong>
              </div>
              <div className="source-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-airplane text-warning"></i>
                  <span>Expedia</span>
                </div>
                <strong>{dailySummary.expedia_pct || 0}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Generated Reports */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><i className="bi bi-clock-history me-2"></i>Recent Reports</h5>
              <a href="#" className="btn btn-sm btn-link">View All</a>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {(dailySummary.recent_reports || []).map((report, idx) => (
                  <div className="list-group-item" key={idx}>
                    <div className="d-flex align-items-center gap-3">
                      <div className={`file-icon ${report.format === 'pdf' ? 'pdf' : 'excel'}`}>
                        <i className={`bi ${report.format === 'pdf' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-excel'}`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium">{report.name}</div>
                        <small className="text-muted">Generated {formatDate(report.generated_at)}</small>
                      </div>
                      <button className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-download"></i>
                      </button>
                    </div>
                  </div>
                ))}
                {(!dailySummary.recent_reports || dailySummary.recent_reports.length === 0) && (
                  <div className="list-group-item text-center text-muted py-4">
                    No recent reports generated
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-file-earmark-text me-2"></i>Generate Report</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Report Type</label>
                      <select className="form-select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                        <option>Revenue Report</option>
                        <option>Occupancy Report</option>
                        <option>Daily Operations</option>
                        <option>Guest Demographics</option>
                        <option>Housekeeping Summary</option>
                        <option>Inventory Report</option>
                        <option>Staff Performance</option>
                        <option>Financial Summary</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Format</label>
                      <select className="form-select" value={reportFormat} onChange={(e) => setReportFormat(e.target.value)}>
                        <option>PDF Document</option>
                        <option>Excel Spreadsheet</option>
                        <option>CSV File</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Date Range</label>
                      <select className="form-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                        <option value="custom">Custom Range</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Comparison Period</label>
                      <select className="form-select" value={comparisonPeriod} onChange={(e) => setComparisonPeriod(e.target.value)}>
                        <option>None</option>
                        <option>Previous Period</option>
                        <option>Same Period Last Year</option>
                      </select>
                    </div>
                    {dateRange === 'custom' && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label">Start Date</label>
                          <input type="date" className="form-control" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">End Date</label>
                          <input type="date" className="form-control" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                        </div>
                      </>
                    )}
                    <div className="col-12">
                      <label className="form-label">Include Sections</label>
                      <div className="row g-2">
                        <div className="col-md-4">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="incSummary" checked={sections.summary} onChange={() => handleSectionToggle('summary')} />
                            <label className="form-check-label" htmlFor="incSummary">Executive Summary</label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="incCharts" checked={sections.charts} onChange={() => handleSectionToggle('charts')} />
                            <label className="form-check-label" htmlFor="incCharts">Charts &amp; Graphs</label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="incTables" checked={sections.tables} onChange={() => handleSectionToggle('tables')} />
                            <label className="form-check-label" htmlFor="incTables">Data Tables</label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="incComparison" checked={sections.comparison} onChange={() => handleSectionToggle('comparison')} />
                            <label className="form-check-label" htmlFor="incComparison">Period Comparison</label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="incBreakdown" checked={sections.breakdown} onChange={() => handleSectionToggle('breakdown')} />
                            <label className="form-check-label" htmlFor="incBreakdown">Detailed Breakdown</label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="incRecommendations" checked={sections.recommendations} onChange={() => handleSectionToggle('recommendations')} />
                            <label className="form-check-label" htmlFor="incRecommendations">Recommendations</label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Additional Notes</label>
                      <textarea className="form-control" rows="2" placeholder="Add any notes to include in the report..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="button" className="btn btn-outline-primary">
                  <i className="bi bi-eye me-2"></i>Preview
                </button>
                <button type="button" className="btn btn-primary" onClick={handleGenerateReport}>
                  <i className="bi bi-download me-2"></i>Generate &amp; Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportsPage;
