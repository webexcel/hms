import React from 'react';
import LoadingSpinner from '../components/atoms/LoadingSpinner';
import PageTemplate from '../components/templates/PageTemplate';
import {
  useStaff,
  StaffStats,
  StaffFilterBar,
  StaffListView,
  StaffGridView,
  TodayScheduleCard,
  DepartmentSummaryCard,
  StaffFormModal,
  StaffProfileModal,
  ScheduleModal,
} from '../features/staff';

const StaffPage = () => {
  const {
    staffList,
    stats,
    loading,
    showStaffModal,
    showScheduleModal,
    showProfileModal,
    editingStaff,
    selectedStaff,
    selectedStaffSchedule,
    staffForm,
    departmentFilter,
    statusFilter,
    searchQuery,
    viewMode,
    scheduleWeekStart,
    filteredStaff,
    weekDates,
    deptSummary,
    morningStaff,
    afternoonStaff,
    nightStaff,
    departments,
    dayNames,
    setShowStaffModal,
    setShowScheduleModal,
    setStaffForm,
    setDepartmentFilter,
    setStatusFilter,
    setSearchQuery,
    setViewMode,
    handleCreateStaff,
    handleEditStaff,
    handleViewProfile,
    handleViewSchedule,
    resetStaffForm,
    closeProfileModal,
    closeScheduleModal,
    navigateWeek,
    getScheduleForStaffDate,
  } = useStaff();

  if (loading) return <LoadingSpinner />;

  return (
    <PageTemplate
      title="Staff Management"
      description="Manage employees, schedules, and department assignments"
      actions={<>
        <button className="btn btn-outline-secondary" onClick={() => setShowScheduleModal(true)}>
          <i className="bi bi-calendar-week me-2"></i>Schedule
        </button>
        <button className="btn btn-primary" onClick={() => setShowStaffModal(true)}>
          <i className="bi bi-plus-lg me-2"></i>Add Staff
        </button>
      </>}
    >
      <StaffStats stats={stats} />

      <div className="row g-4">
        <div className="col-xl-8">
          <StaffFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
            departments={departments}
          />

          {viewMode === 'list' && (
            <StaffListView
              filteredStaff={filteredStaff}
              onViewProfile={handleViewProfile}
              onEditStaff={handleEditStaff}
              onViewSchedule={handleViewSchedule}
            />
          )}

          {viewMode === 'grid' && (
            <StaffGridView filteredStaff={filteredStaff} />
          )}
        </div>

        <div className="col-xl-4">
          <TodayScheduleCard
            morningStaff={morningStaff}
            afternoonStaff={afternoonStaff}
            nightStaff={nightStaff}
          />
          <DepartmentSummaryCard deptSummary={deptSummary} />
        </div>
      </div>

      {showStaffModal && (
        <StaffFormModal
          editingStaff={editingStaff}
          staffForm={staffForm}
          setStaffForm={setStaffForm}
          departments={departments}
          onSubmit={handleCreateStaff}
          onClose={resetStaffForm}
        />
      )}

      {showProfileModal && selectedStaff && (
        <StaffProfileModal
          selectedStaff={selectedStaff}
          onClose={closeProfileModal}
          onEdit={(staff) => { closeProfileModal(); handleEditStaff(staff); }}
        />
      )}

      {showScheduleModal && (
        <ScheduleModal
          selectedStaffSchedule={selectedStaffSchedule}
          staffList={staffList}
          weekDates={weekDates}
          dayNames={dayNames}
          scheduleWeekStart={scheduleWeekStart}
          navigateWeek={navigateWeek}
          getScheduleForStaffDate={getScheduleForStaffDate}
          onClose={closeScheduleModal}
        />
      )}
    </PageTemplate>
  );
};

export default StaffPage;
