import { Spinner } from 'react-bootstrap';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <Spinner animation="border" variant="primary" />
      <span className="mt-2 text-muted">{text}</span>
    </div>
  );
}
