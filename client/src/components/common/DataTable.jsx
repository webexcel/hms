import { Table } from 'react-bootstrap';
import LoadingSpinner from './LoadingSpinner';

export default function DataTable({ columns, data, loading, emptyMessage = 'No data found', onRowClick }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="table-responsive">
      <Table hover className="align-middle">
        <thead className="table-light">
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={col.style}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-4 text-muted">{emptyMessage}</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id || i} onClick={() => onRowClick?.(row)} style={onRowClick ? { cursor: 'pointer' } : {}}>
                {columns.map((col, j) => (
                  <td key={j}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
