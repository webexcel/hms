import { Card } from 'react-bootstrap';

export default function StatCard({ icon, iconBg, value, label, trend, trendUp }) {
  return (
    <Card className="stat-card h-100">
      <Card.Body className="d-flex align-items-center gap-3">
        <div className={`stat-icon bg-${iconBg || 'primary'} bg-opacity-10 text-${iconBg || 'primary'}`}
          style={{ width: 48, height: 48, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
          <i className={`bi ${icon}`}></i>
        </div>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>{label}</div>
          {trend && (
            <small className={`text-${trendUp ? 'success' : 'danger'}`}>
              <i className={`bi bi-arrow-${trendUp ? 'up' : 'down'} me-1`}></i>{trend}
            </small>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
