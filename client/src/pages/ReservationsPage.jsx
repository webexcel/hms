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
    </>
  );
}
