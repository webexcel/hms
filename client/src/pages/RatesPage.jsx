import React from 'react';
import PageTemplate from '../components/templates/PageTemplate';
import {
  useRates,
  RatesStats, RatesTabs,
  RatePlansTab, PackagesTab, RateCalendarTab, PromotionsTab,
  RatePlanModal, SeasonalRatesModal, PackageModal, PromoModal,
} from '../features/rates';

const RatesPage = () => {
  const r = useRates();

  if (r.isInitialLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <PageTemplate
      description="Manage room rates, seasonal pricing, and packages"
      actions={<>
        <button className="btn btn-outline-secondary" onClick={() => r.setShowSeasonalModal(true)}>
          <i className="bi bi-calendar-range me-2"></i>Seasonal Rates
        </button>
        <button className="btn btn-primary" onClick={() => { r.resetRatePlanForm(); r.setShowRatePlanModal(true); }}>
          <i className="bi bi-plus-lg me-2"></i>Add Rate Plan
        </button>
      </>}
    >
      <RatesStats roomTypes={r.roomTypes} avgRate={r.avgRate} packages={r.packages} />
      <RatesTabs activeTab={r.activeTab} setActiveTab={r.setActiveTab} />

      <div className="tab-content">
        {r.activeTab === 'ratePlans' && <RatePlansTab filteredRatePlans={r.filteredRatePlans} seasonFilter={r.seasonFilter} setSeasonFilter={r.setSeasonFilter} avgRate={r.avgRate} openEditRatePlan={r.openEditRatePlan} />}
        {r.activeTab === 'packages' && <PackagesTab packages={r.packages} loading={r.loading} openEditPackage={r.openEditPackage} resetPackageForm={r.resetPackageForm} setShowPackageModal={r.setShowPackageModal} />}
        {r.activeTab === 'rateCalendar' && <RateCalendarTab calendarMonthName={r.calendarMonthName} prevMonth={r.prevMonth} nextMonth={r.nextMonth} calendarRoomType={r.calendarRoomType} setCalendarRoomType={r.setCalendarRoomType} roomTypes={r.roomTypes} getCalendarDays={r.getCalendarDays} />}
        {r.activeTab === 'promotions' && <PromotionsTab promotions={r.promotions} openEditPromo={r.openEditPromo} togglePromoActive={r.togglePromoActive} resetPromoForm={r.resetPromoForm} setShowPromoModal={r.setShowPromoModal} />}
      </div>

      {r.showRatePlanModal && <RatePlanModal selectedRatePlan={r.selectedRatePlan} ratePlanForm={r.ratePlanForm} setRatePlanForm={r.setRatePlanForm} roomTypes={r.roomTypes} handleSaveRatePlan={r.handleSaveRatePlan} onClose={() => { r.setShowRatePlanModal(false); r.resetRatePlanForm(); }} />}
      {r.showSeasonalModal && <SeasonalRatesModal onClose={() => r.setShowSeasonalModal(false)} />}
      {r.showPackageModal && <PackageModal selectedPackage={r.selectedPackage} packageForm={r.packageForm} setPackageForm={r.setPackageForm} roomTypes={r.roomTypes} handleSavePackage={r.handleSavePackage} onClose={() => { r.setShowPackageModal(false); r.resetPackageForm(); }} />}
      {r.showPromoModal && <PromoModal selectedPromo={r.selectedPromo} promoForm={r.promoForm} setPromoForm={r.setPromoForm} handleSavePromo={r.handleSavePromo} onClose={() => { r.setShowPromoModal(false); r.resetPromoForm(); }} />}
    </PageTemplate>
  );
};

export default RatesPage;
