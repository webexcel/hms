import LoadingSpinner from '../components/atoms/LoadingSpinner';
import {
  useInvoice,
  InvoicePrintControls,
  InvoiceHeader,
  SupplierRecipientDetails,
  InvoiceStayDetails,
  InvoiceItemsTable,
  TaxBreakupTotals,
  InvoiceFooterSection,
  InvoiceContactFooter,
} from '../features/invoice';

const printStyles = `
@media print {
  .no-print { display: none !important; }
  body {
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .invoice-container {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 15px !important;
  }
  .sidebar, .navbar, .header, nav, footer,
  .app-sidebar, .app-header { display: none !important; }
  .page-break { page-break-before: always; }
}

.invoice-container {
  max-width: 900px;
  margin: 20px auto;
  background: white;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  border-radius: 8px;
}
.invoice-header {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 25px;
  border-radius: 8px 8px 0 0;
}
.invoice-body { padding: 25px; }
.info-section {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 20px;
}
.info-header {
  background: #f8f9fa;
  padding: 10px 15px;
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
  font-size: 13px;
  color: #2c3e50;
}
.info-body { padding: 15px; }
.info-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
}
.info-label {
  font-weight: 500;
  color: #6c757d;
  width: 140px;
  flex-shrink: 0;
}
.info-value { color: #2c3e50; }
.gstin-highlight {
  background: #fff3cd;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-family: monospace;
}
.hsn-code {
  font-family: monospace;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}
.invoice-table { font-size: 13px; }
.invoice-table thead {
  background: #2c3e50;
  color: white;
}
.invoice-table thead th {
  font-weight: 500;
  padding: 12px 10px;
  border: none;
  font-size: 12px;
}
.invoice-table tbody td {
  padding: 12px 10px;
  vertical-align: middle;
  border-color: #e9ecef;
}
.invoice-table tfoot { background: #f8f9fa; }
.invoice-table tfoot td { padding: 10px; border-color: #dee2e6; }
.tax-summary-table { font-size: 12px; }
.tax-summary-table th {
  background: #34495e;
  color: white;
  font-weight: 500;
  padding: 8px;
}
.tax-summary-table td { padding: 8px; }
.total-section {
  background: #2c3e50;
  color: white;
  padding: 15px 20px;
  border-radius: 6px;
}
.grand-total { font-size: 24px; font-weight: 700; }
.amount-words {
  background: #f8f9fa;
  padding: 12px 15px;
  border-radius: 6px;
  border-left: 4px solid #3498db;
  font-style: italic;
}
.qr-section {
  text-align: center;
  padding: 15px;
  border: 1px dashed #dee2e6;
  border-radius: 6px;
}
.qr-placeholder {
  width: 100px;
  height: 100px;
  background: #e9ecef;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.signature-box {
  border-top: 1px solid #2c3e50;
  padding-top: 10px;
  margin-top: 60px;
  text-align: center;
}
.terms-section {
  font-size: 11px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}
.terms-section ol { margin-bottom: 0; padding-left: 20px; }
.invoice-footer {
  background: #2c3e50;
  color: white;
  padding: 15px 25px;
  border-radius: 0 0 8px 8px;
  font-size: 12px;
}
.copy-type {
  display: inline-block;
  padding: 3px 10px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 11px;
  cursor: pointer;
}
.copy-type.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}
.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 80px;
  font-weight: 700;
  pointer-events: none;
  z-index: 0;
}
.watermark.paid { color: rgba(39, 174, 96, 0.1); }
.watermark.unpaid { color: rgba(231, 76, 60, 0.1); }
`;

export default function InvoicePage() {
  const {
    invoice, loading, copyType, setCopyType,
    isGroup, id, isPaid,
    items, hotel, guest, reservation, taxBreakup, payments,
    showPayment, togglePayment, setShowPayment,
    paymentAmount, setPaymentAmount,
    paymentMethod, setPaymentMethod,
    paymentRef, setPaymentRef,
    paymentLoading, handleGroupPayment,
    handlePrint, handleGoBack,
  } = useInvoice();

  if (loading) return <LoadingSpinner />;

  if (!invoice) {
    return (
      <div className="text-center py-5">
        <h4>Invoice not found</h4>
        <button className="btn btn-primary" onClick={handleGoBack}>Go Back</button>
      </div>
    );
  }

  return (
    <>
      <style>{printStyles}</style>

      <InvoicePrintControls
        isGroup={isGroup}
        isPaid={isPaid}
        id={id}
        showPayment={showPayment}
        togglePayment={togglePayment}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentRef={paymentRef}
        setPaymentRef={setPaymentRef}
        paymentLoading={paymentLoading}
        handleGroupPayment={handleGroupPayment}
        setShowPayment={setShowPayment}
        balanceDue={invoice.balance_due || 0}
        handlePrint={handlePrint}
        handleGoBack={handleGoBack}
      />

      <div className="invoice-container position-relative">
        <div className={`watermark ${isPaid ? 'paid' : 'unpaid'}`}>
          {isPaid ? 'PAID' : 'UNPAID'}
        </div>

        <InvoiceHeader hotel={hotel} copyType={copyType} />

        <div className="invoice-body">
          <SupplierRecipientDetails hotel={hotel} guest={guest} />
          <InvoiceStayDetails invoice={invoice} reservation={reservation} />
          <InvoiceItemsTable items={items} invoice={invoice} />
          <TaxBreakupTotals invoice={invoice} taxBreakup={taxBreakup} payments={payments} isPaid={isPaid} />
          <InvoiceFooterSection invoice={invoice} hotel={hotel} copyType={copyType} setCopyType={setCopyType} />
        </div>

        <InvoiceContactFooter hotel={hotel} />
      </div>
    </>
  );
}
