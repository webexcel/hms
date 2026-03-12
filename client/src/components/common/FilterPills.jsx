export default function FilterPills({ options, value, onChange, label }) {
  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      {label && <small className="text-muted fw-medium">{label}:</small>}
      {options.map(opt => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const lbl = typeof opt === 'string' ? opt : opt.label;
        return (
          <button
            key={val}
            className={`btn btn-sm ${value === val ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => onChange(value === val ? '' : val)}
            type="button"
          >
            {lbl}
          </button>
        );
      })}
    </div>
  );
}
