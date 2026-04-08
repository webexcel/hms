export default function LaundryStats({ stats }) {
  const cards = [
    { label: "Today's Orders", value: stats.total, icon: 'bi-basket', color: 'primary' },
    { label: 'Pending', value: stats.pending, icon: 'bi-clock', color: 'warning' },
    { label: 'Delivered', value: stats.delivered, icon: 'bi-check-circle', color: 'info' },
    { label: "Today's Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: 'bi-currency-rupee', color: 'success' },
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div key={card.label} className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className={`rounded-circle bg-${card.color} bg-opacity-10 p-3`}>
                <i className={`bi ${card.icon} text-${card.color} fs-4`}></i>
              </div>
              <div>
                <div className="text-muted small">{card.label}</div>
                <div className="fw-bold fs-5">{card.value}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
