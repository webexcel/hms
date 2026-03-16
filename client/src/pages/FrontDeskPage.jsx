import LoadingSpinner from '../components/atoms/LoadingSpinner';
import {
  useFrontDesk,
  FrontDeskStats,
  RoomGrid,
  ArrivalsPanel,
  RoomDetailsModal,
  WalkInBookingModal,
  CheckInModal,
  CheckOutModal,
  CancelModal,
  BanquetModal,
} from '../features/front-desk';

export default function FrontDeskPage() {
  const fd = useFrontDesk();

  if (fd.loading) return <LoadingSpinner />;

  return (
    <>
      <FrontDeskStats
        arrivals={fd.arrivals}
        departures={fd.departures}
        bs={fd.bs}
        occupancyRate={fd.occupancyRate}
        dashboard={fd.dashboard}
      />

      <div className="row g-4">
        <RoomGrid {...fd} />
        <ArrivalsPanel {...fd} />
      </div>

      <RoomDetailsModal {...fd} />
      <WalkInBookingModal {...fd} />
      <CheckInModal {...fd} />
      <CheckOutModal {...fd} />
      <CancelModal {...fd} />
      <BanquetModal {...fd} />
    </>
  );
}
