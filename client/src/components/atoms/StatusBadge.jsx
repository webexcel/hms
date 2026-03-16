import { Badge } from 'react-bootstrap';
import { getStatusColor, capitalize } from '../../utils/formatters';

export default function StatusBadge({ status }) {
  return (
    <Badge bg={getStatusColor(status)} className="text-capitalize">
      {capitalize(status)}
    </Badge>
  );
}
