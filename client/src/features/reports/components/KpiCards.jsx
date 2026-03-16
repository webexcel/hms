import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const KpiCard = ({ label, value, trend, comparison, sparklineRef }) => (
  <div className="col-md-6 col-lg-3">
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        <span className="kpi-trend up"><i className="bi bi-arrow-up"></i> {trend || '0'}%</span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-comparison">
        <span className="text-muted">vs {comparison} last period</span>
      </div>
      <div className="kpi-chart">
        <canvas ref={sparklineRef}></canvas>
      </div>
    </div>
  </div>
);

const KpiCards = ({ dailySummary, revenueSparklineRef, occupancySparklineRef, adrSparklineRef, revparSparklineRef }) => (
  <div className="row g-3 mb-4">
    <KpiCard
      label="Total Revenue"
      value={formatCurrency(dailySummary.revenue)}
      trend={dailySummary.revenue_trend}
      comparison={formatCurrency(dailySummary.previous_revenue || 0)}
      sparklineRef={revenueSparklineRef}
    />
    <KpiCard
      label="Occupancy Rate"
      value={`${dailySummary.occupancy_rate}%`}
      trend={dailySummary.occupancy_trend}
      comparison={`${dailySummary.previous_occupancy || 0}%`}
      sparklineRef={occupancySparklineRef}
    />
    <KpiCard
      label="ADR"
      value={formatCurrency(dailySummary.adr || 0)}
      trend={dailySummary.adr_trend}
      comparison={formatCurrency(dailySummary.previous_adr || 0)}
      sparklineRef={adrSparklineRef}
    />
    <KpiCard
      label="RevPAR"
      value={formatCurrency(dailySummary.revpar || 0)}
      trend={dailySummary.revpar_trend}
      comparison={formatCurrency(dailySummary.previous_revpar || 0)}
      sparklineRef={revparSparklineRef}
    />
  </div>
);

export default KpiCards;
