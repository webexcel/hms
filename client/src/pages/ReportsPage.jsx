import React from 'react';
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
import LoadingSpinner from '../components/atoms/LoadingSpinner';
import PageTemplate from '../components/templates/PageTemplate';
import {
  useReports,
  KpiCards,
  RevenueChart,
  RevenueBySource,
  OccupancyAndChannels,
  QuickReports,
  TopPerforming,
  RecentReports,
  GenerateReportModal
} from '../features/reports';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Filler, Title, Tooltip, Legend);

const ReportsPage = () => {
  const reports = useReports();

  if (reports.loading) return <LoadingSpinner />;

  return (
    <PageTemplate
      description="View performance metrics and generate reports"
      actions={<>
        <div className="input-group" style={{ width: 'auto' }}>
          <span className="input-group-text"><i className="bi bi-calendar-range"></i></span>
          <input
            type="text"
            className="form-control"
            value={reports.dateDisplay}
            readOnly
            style={{ width: '180px' }}
          />
        </div>
        <button className="btn btn-outline-secondary" onClick={reports.handleExport}>
          <i className="bi bi-download me-2"></i>Export
        </button>
        <button className="btn btn-primary" onClick={() => reports.openModalWithReport('Revenue Report')}>
          <i className="bi bi-file-earmark-text me-2"></i>Generate Report
        </button>
      </>}
    >
      <KpiCards
        dailySummary={reports.dailySummary}
        revenueSparklineRef={reports.revenueSparklineRef}
        occupancySparklineRef={reports.occupancySparklineRef}
        adrSparklineRef={reports.adrSparklineRef}
        revparSparklineRef={reports.revparSparklineRef}
      />

      <div className="row g-3 mb-4">
        <RevenueChart
          revenueData={reports.revenueData}
          revenueChartOptions={reports.revenueChartOptions}
          chartView={reports.chartView}
          setChartView={reports.setChartView}
        />
        <RevenueBySource
          occupancyData={reports.occupancyData}
          occupancyChartOptions={reports.occupancyChartOptions}
        />
      </div>

      <OccupancyAndChannels
        dailySummary={reports.dailySummary}
        handleQuickRange={reports.handleQuickRange}
      />

      <div className="row g-3">
        <QuickReports
          quickReports={reports.quickReports}
          openModalWithReport={reports.openModalWithReport}
        />
        <TopPerforming
          guestStats={reports.guestStats}
          dailySummary={reports.dailySummary}
        />
        <RecentReports
          recentReports={reports.dailySummary.recent_reports}
        />
      </div>

      <GenerateReportModal
        showModal={reports.showModal}
        closeModal={reports.closeModal}
        reportType={reports.reportType}
        setReportType={reports.setReportType}
        reportFormat={reports.reportFormat}
        setReportFormat={reports.setReportFormat}
        dateRange={reports.dateRange}
        setDateRange={reports.setDateRange}
        comparisonPeriod={reports.comparisonPeriod}
        setComparisonPeriod={reports.setComparisonPeriod}
        customStart={reports.customStart}
        setCustomStart={reports.setCustomStart}
        customEnd={reports.customEnd}
        setCustomEnd={reports.setCustomEnd}
        sections={reports.sections}
        handleSectionToggle={reports.handleSectionToggle}
        notes={reports.notes}
        setNotes={reports.setNotes}
        handleGenerateReport={reports.handleGenerateReport}
      />
    </PageTemplate>
  );
};

export default ReportsPage;
