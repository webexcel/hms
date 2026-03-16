import React from 'react';
import PageTemplate from '../components/templates/PageTemplate';
import {
  useHousekeeping,
  HousekeepingStats,
  RoomFilterBar,
  RoomGrid,
  TaskList,
  StaffWorkload,
  MaintenanceList,
  AssignTaskModal,
  MaintenanceModal,
} from '../features/housekeeping';

const HousekeepingPage = () => {
  const {
    tasks,
    rooms,
    stats,
    maintenanceRequests,
    showTaskModal,
    showMaintenanceModal,
    selectedRoom,
    statusFilter,
    loading,
    taskForm,
    maintenanceForm,
    setShowTaskModal,
    setShowMaintenanceModal,
    setStatusFilter,
    setTaskForm,
    setMaintenanceForm,
    handleAssignTask,
    handleUpdateTaskStatus,
    handleReportMaintenance,
    handleRoomClick,
    handleTaskAssignFromList,
    closeTaskModal,
    closeMaintenanceModal,
    filteredRooms,
    roomsByFloor,
    cleanCount,
    dirtyCount,
    progressCount,
    maintCount,
    housekeepingStaff,
  } = useHousekeeping();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <PageTemplate
      title="Housekeeping"
      description="Manage room cleaning status, assignments, and maintenance requests"
      actions={<>
        <button className="btn btn-outline-secondary" onClick={() => setShowMaintenanceModal(true)}>
          <i className="bi bi-tools me-2"></i>Maintenance Request
        </button>
        <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
          <i className="bi bi-plus-lg me-2"></i>Assign Task
        </button>
      </>}
    >
      <HousekeepingStats
        cleanCount={cleanCount}
        dirtyCount={dirtyCount}
        progressCount={progressCount}
        maintCount={maintCount}
        stats={stats}
      />

      <div className="row g-4">
        <div className="col-xl-8">
          <RoomFilterBar
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            totalRooms={rooms.length}
            cleanCount={cleanCount}
            dirtyCount={dirtyCount}
            progressCount={progressCount}
            maintCount={maintCount}
          />
          <RoomGrid
            roomsByFloor={roomsByFloor}
            filteredRooms={filteredRooms}
            onRoomClick={handleRoomClick}
          />
        </div>

        <div className="col-xl-4">
          <TaskList
            tasks={tasks}
            onUpdateStatus={handleUpdateTaskStatus}
            onAssignFromList={handleTaskAssignFromList}
          />
          <StaffWorkload
            housekeepingStaff={housekeepingStaff}
            tasks={tasks}
          />
          <MaintenanceList maintenanceRequests={maintenanceRequests} />
        </div>
      </div>

      <AssignTaskModal
        show={showTaskModal}
        selectedRoom={selectedRoom}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        rooms={rooms}
        housekeepingStaff={housekeepingStaff}
        onSubmit={handleAssignTask}
        onClose={closeTaskModal}
      />

      <MaintenanceModal
        show={showMaintenanceModal}
        maintenanceForm={maintenanceForm}
        setMaintenanceForm={setMaintenanceForm}
        rooms={rooms}
        onSubmit={handleReportMaintenance}
        onClose={closeMaintenanceModal}
      />
    </PageTemplate>
  );
};

export default HousekeepingPage;
