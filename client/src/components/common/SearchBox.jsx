export default function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="position-relative">
      <i className="bi bi-search position-absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500)' }}></i>
      <input
        type="text"
        className="form-control"
        style={{ paddingLeft: '2.2rem' }}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
