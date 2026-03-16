export default function PageTemplate({ title, description, actions, children }) {
  return (
    <>
      <div className="page-header">
        {(title || description) && (
          <div className="page-title">
            {title && <h1>{title}</h1>}
            {description && <p>{description}</p>}
          </div>
        )}
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      {children}
    </>
  );
}
