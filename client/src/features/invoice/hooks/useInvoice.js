import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import { formatCurrency } from '../../../utils/formatters';

export const COPY_TYPES = [
  { label: 'Original for Recipient', value: 'ORIGINAL FOR RECIPIENT' },
  { label: 'Duplicate for Transporter', value: 'DUPLICATE FOR TRANSPORTER' },
  { label: 'Triplicate for Supplier', value: 'TRIPLICATE FOR SUPPLIER' },
];

export default function useInvoice() {
  const { id, groupId } = useParams();
  const navigate = useNavigate();
  const api = useApi();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copyType, setCopyType] = useState('ORIGINAL FOR RECIPIENT');

  const isGroup = !!groupId;

  // Group payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const url = isGroup ? `/billing/group/${groupId}/invoice` : `/billing/${id}/invoice`;
        const response = await api.get(url);
        setInvoice(response.data);
      } catch (error) {
        console.error('Failed to fetch invoice:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handleGroupPayment = async () => {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) return;
    try {
      setPaymentLoading(true);
      await api.post(`/billing/group/${groupId}/payments`, {
        amount: amt,
        payment_method: paymentMethod,
        reference_number: paymentRef || undefined,
      });
      setShowPayment(false);
      setPaymentAmount('');
      setPaymentRef('');
      // Refresh invoice data
      const response = await api.get(`/billing/group/${groupId}/invoice`);
      setInvoice(response.data);
    } catch (err) {
      // error is handled by useApi toast
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePrint = () => window.print();
  const handleGoBack = () => navigate(-1);
  const togglePayment = () => setShowPayment(prev => !prev);

  // Derived data
  const items = invoice?.items || [];
  const hotel = invoice?.hotel || {};
  const guest = invoice?.guest || {};
  const reservation = invoice?.reservation || {};
  const taxBreakup = invoice?.tax_breakup || [];
  const payments = invoice?.payments || [];
  const isPaid = invoice?.payment_status === 'paid';

  return {
    // Core state
    invoice,
    loading,
    copyType,
    setCopyType,
    isGroup,
    id,
    groupId,
    isPaid,

    // Derived data
    items,
    hotel,
    guest,
    reservation,
    taxBreakup,
    payments,

    // Group payment
    showPayment,
    togglePayment,
    setShowPayment,
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,
    paymentRef,
    setPaymentRef,
    paymentLoading,
    handleGroupPayment,

    // Actions
    handlePrint,
    handleGoBack,
  };
}
