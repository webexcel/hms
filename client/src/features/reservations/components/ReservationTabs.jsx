import dayjs from 'dayjs';
import CalendarView from './CalendarView';
import ListView from './ListView';
import TimelineView from './TimelineView';

export default function ReservationTabs({
  activeTab, setActiveTab,
  // Calendar props
  calendarReservations, calendarMonth, setCalendarMonth, handleDayClick,
  // List props
  allReservations, loading, actionLoading, handleAction, openRoomTransfer, openEditGuest, openNewGuest,
  currentPage, totalPages, fetchReservations,
  // Timeline props
  timelineReservations, rooms, timelineStart, setTimelineStart,
}) {
  return (
    <>
      <ul className="nav nav-tabs nav-tabs-custom mb-4" role="tablist">
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'calendar' ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveTab('calendar')}
          >
            <i className="bi bi-calendar3 me-1"></i> Calendar View
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'list' ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveTab('list')}
          >
            <i className="bi bi-list-ul me-1"></i> List View
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'timeline' ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveTab('timeline')}
          >
            <i className="bi bi-view-stacked me-1"></i> Timeline View
          </button>
        </li>
      </ul>

      <div className="tab-content">
        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <div className="tab-pane fade show active" style={{ display: 'block' }}>
            <CalendarView
              reservations={calendarReservations}
              currentMonth={calendarMonth}
              onPrevMonth={() => setCalendarMonth(prev => prev.subtract(1, 'month'))}
              onNextMonth={() => setCalendarMonth(prev => prev.add(1, 'month'))}
              onToday={() => setCalendarMonth(dayjs().startOf('month'))}
              onDayClick={handleDayClick}
            />
          </div>
        )}

        {/* List View */}
        {activeTab === 'list' && (
          <div className="tab-pane fade show active" style={{ display: 'block' }}>
            <ListView
              reservations={allReservations}
              loading={loading}
              actionLoading={actionLoading}
              onAction={handleAction}
              onRoomTransfer={openRoomTransfer}
              onEditGuest={openEditGuest}
              onNewGuest={openNewGuest}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => fetchReservations(page)}
            />
          </div>
        )}

        {/* Timeline View */}
        {activeTab === 'timeline' && (
          <div className="tab-pane fade show active" style={{ display: 'block' }}>
            <TimelineView
              reservations={timelineReservations}
              rooms={rooms}
              timelineStart={timelineStart}
              onPrevWeek={() => setTimelineStart(prev => prev.subtract(7, 'day'))}
              onNextWeek={() => setTimelineStart(prev => prev.add(7, 'day'))}
              onThisWeek={() => setTimelineStart(dayjs().startOf('week').add(1, 'day'))}
            />
          </div>
        )}
      </div>
    </>
  );
}
