import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Table, Badge } from 'react-bootstrap';
import { useApi } from '../hooks/useApi';
import StatusBadge from '../components/common/StatusBadge';
import FormModal from '../components/common/FormModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../utils/formatters';
import { toast } from 'react-hot-toast';

const GuestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi();

  const [guest, setGuest] = useState(null);
  const [stayHistory, setStayHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});

  const fetchGuest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/guests/${id}`);
      const guestData = response.data.guest || response.data;
      setGuest(guestData);
      setFormData({
        first_name: guestData.first_name || '',
        last_name: guestData.last_name || '',
        email: guestData.email || '',
        phone: guestData.phone || '',
        address: guestData.address || '',
        city: guestData.city || '',
        state: guestData.state || '',
        pincode: guestData.pincode || '',
        id_proof_type: guestData.id_proof_type || '',
        id_proof_number: guestData.id_proof_number || '',
        gstin: guestData.gstin || '',
        company_name: guestData.company_name || '',
        vip_status: guestData.vip_status || false,
      });
    } catch (error) {
      toast.error('Failed to fetch guest details');
    } finally {
      setLoading(false);
    }
  };

  const fetchStayHistory = async () => {
    try {
      const response = await api.get(`/guests/${id}/stays`);
      setStayHistory(response.data.stays || response.data || []);
    } catch (error) {
      console.error('Failed to fetch stay history:', error);
    }
  };

  useEffect(() => {
    fetchGuest();
    fetchStayHistory();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      await api.put(`/guests/${id}`, formData);
      toast.success('Guest updated successfully');
      setShowEditModal(false);
      fetchGuest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update guest');
    } finally {
      setSubmitting(false);
    }
  };

  const idProofOptions = [
    { value: '', label: 'Select ID Proof Type' },
    { value: 'aadhar', label: 'Aadhar Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'voter_id', label: 'Voter ID' },
    { value: 'pan', label: 'PAN Card' },
  ];

  const editFields = [
    { name: 'first_name', label: 'First Name', type: 'text', required: true, colSize: 6 },
    { name: 'last_name', label: 'Last Name', type: 'text', required: false, colSize: 6 },
    { name: 'phone', label: 'Phone', type: 'text', required: true, colSize: 6 },
    { name: 'email', label: 'Email', type: 'email', required: false, colSize: 6 },
    { name: 'address', label: 'Address', type: 'text', colSize: 12 },
    { name: 'city', label: 'City', type: 'text', colSize: 4 },
    { name: 'state', label: 'State', type: 'text', colSize: 4 },
    { name: 'pincode', label: 'Pincode', type: 'text', colSize: 4 },
    { name: 'id_proof_type', label: 'ID Proof Type', type: 'select', options: idProofOptions, colSize: 6 },
    { name: 'id_proof_number', label: 'ID Proof Number', type: 'text', colSize: 6 },
    { name: 'gstin', label: 'GSTIN', type: 'text', colSize: 6 },
    { name: 'company_name', label: 'Company Name', type: 'text', colSize: 6 },
    { name: 'vip_status', label: 'VIP Guest', type: 'checkbox', colSize: 12 },
  ];

  if (loading) return <LoadingSpinner />;

  if (!guest) {
    return (
      <div className="text-center py-5">
        <h4>Guest not found</h4>
        <Button variant="primary" onClick={() => navigate('/guests')}>
          Back to Guests
        </Button>
      </div>
    );
  }

  return (
    <div className="guest-detail-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" onClick={() => navigate('/guests')}>
            <i className="bi bi-arrow-left me-1"></i> Back
          </Button>
          <h2 className="mb-0">
            {guest.first_name} {guest.last_name}
          </h2>
          {guest.vip_status && (
            <Badge bg="warning" text="dark" className="ms-2">
              VIP
            </Badge>
          )}
        </div>
        <Button variant="primary" onClick={() => setShowEditModal(true)}>
          <i className="bi bi-pencil me-1"></i> Edit
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Contact Information</h5>
            </Card.Header>
            <Card.Body>
              <Table borderless>
                <tbody>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ width: '40%' }}>Email</td>
                    <td>{guest.email || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">Phone</td>
                    <td>{guest.phone || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">Address</td>
                    <td>{guest.address || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">City</td>
                    <td>{guest.city || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">State</td>
                    <td>{guest.state || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">Pincode</td>
                    <td>{guest.pincode || '-'}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Identification & Company</h5>
            </Card.Header>
            <Card.Body>
              <Table borderless>
                <tbody>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ width: '40%' }}>ID Proof Type</td>
                    <td>{guest.id_proof_type ? guest.id_proof_type.replace('_', ' ').toUpperCase() : '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">ID Proof Number</td>
                    <td>{guest.id_proof_number || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">GSTIN</td>
                    <td>{guest.gstin || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">Company</td>
                    <td>{guest.company_name || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">VIP Status</td>
                    <td>
                      {guest.vip_status ? (
                        <StatusBadge status="VIP" variant="warning" />
                      ) : (
                        <StatusBadge status="Regular" variant="secondary" />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">Total Stays</td>
                    <td>{guest.total_stays || 0}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Stay History</h5>
        </Card.Header>
        <Card.Body>
          {stayHistory.length === 0 ? (
            <p className="text-muted text-center py-3">No stay history found</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Reservation #</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {stayHistory.map((stay) => (
                  <tr key={stay.id}>
                    <td>{stay.reservation_number || stay.id}</td>
                    <td>{stay.room_number || stay.room}</td>
                    <td>{formatDate(stay.check_in)}</td>
                    <td>{formatDate(stay.check_out)}</td>
                    <td>
                      <StatusBadge status={stay.status} />
                    </td>
                    <td className="text-end">{formatCurrency(stay.total_amount || stay.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <FormModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        title="Edit Guest"
        fields={editFields}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleUpdate}
        submitting={submitting}
        submitLabel="Update Guest"
      />
    </div>
  );
};

export default GuestDetailPage;
