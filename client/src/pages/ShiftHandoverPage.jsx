import React from 'react';
import {
  useShiftHandover,
  ShiftHeader,
  ShiftInfoBanner,
  FinancialSummary,
  OperationsSummary,
  RoomStatusGrid,
  PendingTasks,
  HandoverNotes,
  HandoverConfirmation,
  RecentHandovers,
  NewShiftModal,
  ConfirmHandoverModal,
  DiscountsModal,
} from '../features/shift-handover';

const ShiftHandoverPage = () => {
  const {
    user,
    handovers,
    loading,
    showModal,
    showConfirmModal,
    showDiscountsModal,
    stats,
    rooms,
    tasks,
    notes,
    outgoingConfirm,
    incomingConfirm,
    formData,
    latestHandover,
    shifts,
    setShowConfirmModal,
    setShowDiscountsModal,
    setNotes,
    setOutgoingConfirm,
    setIncomingConfirm,
    handleCreateHandover,
    handleAccept,
    handleReject,
    handleCompleteHandover,
    openNewShiftModal,
    closeNewShiftModal,
    updateFormField,
    getShiftLabel,
    getUserInitials,
    getRoomStatusClass,
    getTaskTypeClass,
    getTaskIcon,
  } = useShiftHandover();

  if (loading && handovers.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <ShiftHeader onPrint={() => window.print()} onStartNewShift={openNewShiftModal} />

      <ShiftInfoBanner
        user={user}
        latestHandover={latestHandover}
        stats={stats}
        getUserInitials={getUserInitials}
        getShiftLabel={getShiftLabel}
      />

      <div className="row g-4">
        {/* Left Column */}
        <div className="col-lg-8">
          <FinancialSummary
            latestHandover={latestHandover}
            onShowDiscounts={() => setShowDiscountsModal(true)}
          />
          <OperationsSummary latestHandover={latestHandover} />
          <RoomStatusGrid
            latestHandover={latestHandover}
            rooms={rooms}
            getRoomStatusClass={getRoomStatusClass}
          />
        </div>

        {/* Right Column */}
        <div className="col-lg-4">
          <PendingTasks
            latestHandover={latestHandover}
            tasks={tasks}
            getTaskTypeClass={getTaskTypeClass}
            getTaskIcon={getTaskIcon}
          />
          <HandoverNotes
            latestHandover={latestHandover}
            notes={notes}
            onNotesChange={setNotes}
          />
          <HandoverConfirmation
            user={user}
            outgoingConfirm={outgoingConfirm}
            incomingConfirm={incomingConfirm}
            onOutgoingConfirmChange={setOutgoingConfirm}
            onIncomingConfirmChange={setIncomingConfirm}
            onPrint={() => window.print()}
            onComplete={() => setShowConfirmModal(true)}
          />
          <RecentHandovers
            handovers={handovers}
            user={user}
            handleAccept={handleAccept}
            handleReject={handleReject}
          />
        </div>
      </div>

      {/* Modals */}
      <NewShiftModal
        show={showModal}
        user={user}
        formData={formData}
        shifts={shifts}
        getShiftLabel={getShiftLabel}
        onUpdateField={updateFormField}
        onClose={closeNewShiftModal}
        onSubmit={handleCreateHandover}
      />
      <ConfirmHandoverModal
        show={showConfirmModal}
        user={user}
        latestHandover={latestHandover}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleCompleteHandover}
      />
      <DiscountsModal
        show={showDiscountsModal}
        latestHandover={latestHandover}
        user={user}
        onClose={() => setShowDiscountsModal(false)}
      />
    </>
  );
};

export default ShiftHandoverPage;
