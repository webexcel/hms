import { Pagination as BSPagination } from 'react-bootstrap';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const items = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) {
    items.push(
      <BSPagination.Item key={i} active={i === page} onClick={() => onChange(i)}>
        {i}
      </BSPagination.Item>
    );
  }

  return (
    <BSPagination className="justify-content-center mt-3 mb-0" size="sm">
      <BSPagination.Prev disabled={page <= 1} onClick={() => onChange(page - 1)} />
      {start > 1 && <BSPagination.Ellipsis disabled />}
      {items}
      {end < totalPages && <BSPagination.Ellipsis disabled />}
      <BSPagination.Next disabled={page >= totalPages} onClick={() => onChange(page + 1)} />
    </BSPagination>
  );
}
