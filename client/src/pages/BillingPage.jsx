import PageTemplate from '../components/templates/PageTemplate';
import {
  useBilling,
  BillingStats,
  BillingActionBar,
  FolioList,
  QuickActionsPanel,
  FolioDetailModal,
  PaymentModal,
} from '../features/billing';

const BillingPage = () => {
  const bl = useBilling();

  return (
    <PageTemplate
      title="Billing & Invoices"
      description="Manage guest folios, generate invoices, and record payments"
      actions={
        <button className="btn btn-outline-secondary" onClick={bl.openRecordPaymentAction}>
          <i className="bi bi-credit-card me-2"></i>Record Payment
        </button>
      }
    >
      <BillingStats stats={bl.stats} />

      <div className="row g-4">
        <div className="col-xl-8">
          <BillingActionBar
            searchTerm={bl.searchTerm}
            setSearchTerm={bl.setSearchTerm}
            activeFilter={bl.activeFilter}
            setActiveFilter={bl.setActiveFilter}
          />
          <FolioList {...bl} />
        </div>

        <QuickActionsPanel
          stats={bl.stats}
          openQuickPayment={bl.openQuickPayment}
          refreshData={bl.refreshData}
        />
      </div>

      <FolioDetailModal {...bl} />
      <PaymentModal {...bl} />
    </PageTemplate>
  );
};

export default BillingPage;
