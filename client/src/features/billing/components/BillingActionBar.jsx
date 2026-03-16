export default function BillingActionBar({ searchTerm, setSearchTerm, activeFilter, setActiveFilter }) {
  return (
    <div className="bl-action-bar">
      <div className="bl-search">
        <i className="bi bi-search"></i>
        <input
          type="text"
          className="form-control"
          placeholder="Search by invoice #, guest name, or room..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <select
        className="form-select"
        value={activeFilter}
        onChange={(e) => setActiveFilter(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="unpaid">Open</option>
        <option value="paid">Paid</option>
        <option value="partial">Partially Paid</option>
        <option value="overdue">Overdue</option>
      </select>
    </div>
  );
}
