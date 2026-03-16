import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../../../hooks/useApi';
import { toast } from 'react-hot-toast';

const INITIAL_TASK_FORM = { room_id: '', assigned_to: '', task_type: 'cleaning', priority: 'medium', notes: '' };
const INITIAL_MAINTENANCE_FORM = { room_id: '', issue_type: '', description: '', priority: 'medium' };

const useHousekeeping = () => {
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completedToday: 0,
    maintenanceRequests: 0
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [taskForm, setTaskForm] = useState(INITIAL_TASK_FORM);
  const [maintenanceForm, setMaintenanceForm] = useState(INITIAL_MAINTENANCE_FORM);

  const api = useApi();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [dashboardRes, tasksRes, roomsRes, staffRes, maintenanceRes] = await Promise.all([
        api.get('/housekeeping/dashboard'),
        api.get('/housekeeping/tasks'),
        api.get('/rooms?limit=200'),
        api.get('/staff').catch(() => ({ data: [] })),
        api.get('/housekeeping/maintenance')
      ]);

      const dashboard = dashboardRes.data || {};
      setStats({
        pending: dashboard.pending || 0,
        inProgress: dashboard.in_progress || 0,
        completedToday: dashboard.completed_today || 0,
        maintenanceRequests: dashboard.maintenance_requests || 0
      });

      setTasks(tasksRes.data?.data || tasksRes.data || []);
      setRooms(roomsRes.data?.data || roomsRes.data || []);
      setStaff(staffRes.data?.data || staffRes.data || []);
      setMaintenanceRequests(maintenanceRes.data?.data || maintenanceRes.data || []);
    } catch (error) {
      toast.error('Failed to load housekeeping data');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const resetTaskForm = useCallback(() => {
    setTaskForm(INITIAL_TASK_FORM);
    setSelectedRoom(null);
  }, []);

  const resetMaintenanceForm = useCallback(() => {
    setMaintenanceForm(INITIAL_MAINTENANCE_FORM);
  }, []);

  const closeTaskModal = useCallback(() => {
    setShowTaskModal(false);
    resetTaskForm();
  }, [resetTaskForm]);

  const closeMaintenanceModal = useCallback(() => {
    setShowMaintenanceModal(false);
    resetMaintenanceForm();
  }, [resetMaintenanceForm]);

  const handleAssignTask = useCallback(async (e) => {
    e.preventDefault();
    const existingTask = tasks.find(t => t.room_id === parseInt(taskForm.room_id) && t.status !== 'completed' && t.status !== 'verified');
    if (existingTask) {
      toast.error(`Room already has an active ${existingTask.task_type} task (${existingTask.status})`);
      return;
    }
    try {
      await api.post('/housekeeping/tasks', taskForm);
      toast.success('Task assigned successfully');
      closeTaskModal();
      fetchData();
    } catch (error) {
      toast.error('Failed to assign task');
    }
  }, [api, taskForm, tasks, closeTaskModal, fetchData]);

  const handleUpdateTaskStatus = useCallback(async (taskId, status) => {
    try {
      await api.put(`/housekeeping/tasks/${taskId}/status`, { status });
      toast.success(`Task ${status === 'in_progress' ? 'started' : status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update task status');
    }
  }, [api, fetchData]);

  const handleReportMaintenance = useCallback(async (e) => {
    e.preventDefault();
    try {
      await api.post('/housekeeping/maintenance', maintenanceForm);
      toast.success('Maintenance issue reported');
      closeMaintenanceModal();
      fetchData();
    } catch (error) {
      toast.error('Failed to report maintenance issue');
    }
  }, [api, maintenanceForm, closeMaintenanceModal, fetchData]);

  const handleResolveMaintenance = useCallback(async (room) => {
    const maint = maintenanceRequests.find(m => m.room_id === room.id && !['completed', 'cancelled'].includes(m.status));
    if (!maint) {
      try {
        await api.put(`/rooms/${room.id}`, { status: 'available', cleanliness_status: 'dirty' }, { silent: true });
        toast.success(`Room ${room.room_number} is back to available (needs cleaning)`);
        fetchData();
      } catch {
        toast.error('Failed to update room');
      }
      return;
    }
    try {
      await api.put(`/housekeeping/maintenance/${maint.id}`, { status: 'completed' });
      toast.success(`Maintenance resolved. Room ${room.room_number} is back to available (needs cleaning)`);
      fetchData();
    } catch (error) {
      toast.error('Failed to resolve maintenance');
    }
  }, [api, maintenanceRequests, fetchData]);

  const handleRoomClick = useCallback((room) => {
    setSelectedRoom(room);
    if (room.cleanliness_status === 'out_of_order' || room.status === 'maintenance') {
      if (window.confirm(`Room ${room.room_number} is out of order.\n\nMark maintenance as resolved and make room available?`)) {
        handleResolveMaintenance(room);
      }
      return;
    }
    const roomTask = tasks.find(t => t.room_id === room.id && t.status !== 'verified');
    if (roomTask && roomTask.status === 'completed') {
      if (window.confirm(`Room ${room.room_number} is waiting for verification.\n\nVerify and mark as inspected?`)) {
        handleUpdateTaskStatus(roomTask.id, 'verified');
      }
    } else if (roomTask && roomTask.status === 'in_progress') {
      if (window.confirm(`Room ${room.room_number} is being cleaned.\n\nMark as Done?`)) {
        handleUpdateTaskStatus(roomTask.id, 'completed');
      }
    } else if (roomTask && roomTask.status === 'pending') {
      if (window.confirm(`Room ${room.room_number} has a pending task.\n\nStart cleaning now?`)) {
        handleUpdateTaskStatus(roomTask.id, 'in_progress');
      }
    } else if (room.cleanliness_status === 'clean' || room.cleanliness_status === 'inspected') {
      toast.success(`Room ${room.room_number} is already clean. No task needed.`);
    } else {
      setTaskForm(prev => ({ ...prev, room_id: room.id.toString() }));
      setShowTaskModal(true);
    }
  }, [tasks, handleResolveMaintenance, handleUpdateTaskStatus]);

  const handleTaskAssignFromList = useCallback((task) => {
    setSelectedRoom({ id: task.room_id, room_number: task.room_number });
    setTaskForm(prev => ({ ...prev, room_id: task.room_id?.toString() || '' }));
    setShowTaskModal(true);
  }, []);

  // Derived data
  const getCleanlinessStatus = useCallback((room) => {
    if (room.cleanliness_status && room.cleanliness_status !== 'clean') {
      return room.cleanliness_status;
    }
    if (room.status === 'cleaning') return 'dirty';
    if (room.status === 'maintenance') return 'out_of_order';
    return room.cleanliness_status || 'clean';
  }, []);

  const roomsWithCleanliness = useMemo(() =>
    rooms.map(room => ({
      ...room,
      cleanliness_status: room.cleanliness_status === 'awaiting_verification' ? 'awaiting_verification' : getCleanlinessStatus(room),
    })),
    [rooms, getCleanlinessStatus]
  );

  const filteredRooms = useMemo(() =>
    roomsWithCleanliness.filter(room => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'clean') return room.cleanliness_status === 'clean' || room.cleanliness_status === 'inspected';
      if (statusFilter === 'dirty') return room.cleanliness_status === 'dirty';
      if (statusFilter === 'progress') return room.cleanliness_status === 'in_progress' || room.cleanliness_status === 'awaiting_verification';
      if (statusFilter === 'maintenance') return room.cleanliness_status === 'out_of_order';
      return true;
    }),
    [roomsWithCleanliness, statusFilter]
  );

  const roomsByFloor = useMemo(() =>
    filteredRooms.reduce((acc, room) => {
      const floor = room.room_number ? Math.floor(parseInt(room.room_number) / 100) : 0;
      if (!acc[floor]) acc[floor] = [];
      acc[floor].push(room);
      return acc;
    }, {}),
    [filteredRooms]
  );

  const cleanCount = useMemo(() =>
    roomsWithCleanliness.filter(r => r.cleanliness_status === 'clean' || r.cleanliness_status === 'inspected').length,
    [roomsWithCleanliness]
  );
  const dirtyCount = useMemo(() =>
    roomsWithCleanliness.filter(r => r.cleanliness_status === 'dirty').length,
    [roomsWithCleanliness]
  );
  const progressCount = useMemo(() =>
    roomsWithCleanliness.filter(r => r.cleanliness_status === 'in_progress' || r.cleanliness_status === 'awaiting_verification').length,
    [roomsWithCleanliness]
  );
  const maintCount = useMemo(() =>
    roomsWithCleanliness.filter(r => r.cleanliness_status === 'out_of_order').length,
    [roomsWithCleanliness]
  );

  const housekeepingStaff = useMemo(() =>
    staff.filter(s => s.department === 'housekeeping' || s.department === 'Housekeeping'),
    [staff]
  );

  return {
    // State
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

    // Setters
    setShowTaskModal,
    setShowMaintenanceModal,
    setStatusFilter,
    setTaskForm,
    setMaintenanceForm,

    // Handlers
    handleAssignTask,
    handleUpdateTaskStatus,
    handleReportMaintenance,
    handleRoomClick,
    handleTaskAssignFromList,
    closeTaskModal,
    closeMaintenanceModal,

    // Derived
    filteredRooms,
    roomsByFloor,
    cleanCount,
    dirtyCount,
    progressCount,
    maintCount,
    housekeepingStaff,
  };
};

export default useHousekeeping;
