import { Modal, Button } from 'react-bootstrap';

export default function FormModal({ show, onHide, title, onSubmit, submitLabel = 'Save', loading, size = 'lg', children }) {
  return (
    <Modal show={show} onHide={onHide} size={size} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <form onSubmit={onSubmit}>
        <Modal.Body>{children}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : submitLabel}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
