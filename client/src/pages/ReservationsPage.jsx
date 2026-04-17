import LoadingSpinner from '../components/atoms/LoadingSpinner';
import {
  useReservations,
  ReservationActionBar,
  ReservationTabs,
  DayDetailModal,
  ReservationFormModal,
  RoomTransferModal,
  CancelReservationModal,
} from '../features/reservations';
import EditGuestModal from '../features/reservations/components/EditGuestModal';

export default function ReservationsPage() {
  const rv = useReservations();

  if (rv.loading && rv.allReservations.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <ReservationActionBar {...rv} />

      <ReservationTabs {...rv} />

      {rv.showDayDetailModal && rv.selectedDay && (
        <DayDetailModal
          date={rv.selectedDay}
          reservations={rv.calendarReservations}
          rooms={rv.rooms}
          onClose={rv.handleCloseDayDetail}
          onNewBooking={() => {
            const day = rv.selectedDay;
            rv.handleCloseDayDetail();
            rv.handleOpenNewModal(day);
          }}
        />
      )}

      <ReservationFormModal {...rv} />
      <RoomTransferModal {...rv} />
      <CancelReservationModal {...rv} />
      <EditGuestModal
        show={!!rv.editGuestTarget}
        reservation={rv.editGuestTarget}
        mode={rv.editGuestMode}
        saving={rv.editGuestSaving}
        onClose={rv.closeEditGuest}
        onSave={rv.saveEditGuest}
      />
    </>
  );
}
