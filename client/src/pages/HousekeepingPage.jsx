import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { formatDate, capitalize } from '../utils/formatters';
import { toast } from 'react-hot-toast';

const HousekeepingPage = () => {
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

  const [taskForm, setTaskForm] = useState({
    room_id: '',
    assigned_to: '',
    task_type: 'cleaning',
    priority: 'medium',
    notes: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    room_id: '',
    issue_type: '',
    description: '',
    priority: 'medium'
  });

  const api = useApi();

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (silent = false) => {
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
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    // Check if room already has an active task
    const existingTask = tasks.find(t => t.room_id === parseInt(taskForm.room_id) && t.status !== 'completed' && t.status !== 'verified');
    if (existingTask) {
      toast.error(`Room already has an active ${existingTask.task_type} task (${existingTask.status})`);
      return;
    }
    try {
      await api.post('/housekeeping/tasks', taskForm);
      toast.success('Task assigned successfully');
      setShowTaskModal(false);
      setTaskForm({ room_id: '', assigned_to: '', task_type: 'cleaning', priority: 'medium', notes: '' });
      setSelectedRoom(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to assign task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await api.put(`/housekeeping/tasks/${taskId}/status`, { status });
      toast.success(`Task ${status === 'in_progress' ? 'started' : status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleReportMaintenance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/housekeeping/maintenance', maintenanceForm);
      toast.success('Maintenance issue reported');
      setShowMaintenanceModal(false);
      setMaintenanceForm({ room_id: '', issue_type: '', description: '', priority: 'medium' });
      fetchData();
    } catch (error) {
      toast.error('Failed to report maintenance issue');
    }
  };

  const handleResolveMaintenance = async (room) => {
    const maint = maintenanceRequests.find(m => m.room_id === room.id && !['completed', 'cancelled'].includes(m.status));
    if (!maint) {
      // No active maintenance request, just reset room directly
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
  };

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    // Handle out_of_order rooms
    if (room.cleanliness_status === 'out_of_order' || room.status === 'maintenance') {
      if (window.confirm(`Room ${room.room_number} is out of order.\n\nMark maintenance as resolved and make room available?`)) {
        handleResolveMaintenance(room);
      }
      return;
    }
    const roomTask = tasks.find(t => t.room_id === room.id && t.status !== 'verified');
    if (roomTask && roomTask.status === 'completed') {
      // Cleaning done — waiting for verification
      if (window.confirm(`Room ${room.room_number} is waiting for verification.\n\nVerify and mark as inspected?`)) {
        handleUpdateTaskStatus(roomTask.id, 'verified');
      }
    } else if (roomTask && roomTask.status === 'in_progress') {
      // Room is being cleaned — ask to mark done
      if (window.confirm(`Room ${room.room_number} is being cleaned.\n\nMark as Done?`)) {
        handleUpdateTaskStatus(roomTask.id, 'completed');
      }
    } else if (roomTask && roomTask.status === 'pending') {
      // Task exists but not started — ask to start
      if (window.confirm(`Room ${room.room_number} has a pending task.\n\nStart cleaning now?`)) {
        handleUpdateTaskStatus(roomTask.id, 'in_progress');
      }
    } else if (room.cleanliness_status === 'clean' || room.cleanliness_status === 'inspected') {
      // Room is already clean — no task needed
      toast.success(`Room ${room.room_number} is already clean. No task needed.`);
    } else {
      // Dirty or needs task — open assign modal
      setTaskForm({ ...taskForm, room_id: room.id.toString() });
      setShowTaskModal(true);
    }
  };

  const getRoomStatusClass = (status) => {
    const map = {
      clean: 'clean',
      dirty: 'dirty',
      inspected: 'clean',
      out_of_order: 'maintenance',
      in_progress: 'progress',
      awaiting_verification: 'verification'
    };
    return map[status] || 'dirty';
  };

  const getRoomStatusIcon = (status) => {
    const icons = {
      clean: 'bi-check-circle-fill',
      dirty: 'bi-brush-fill',
      inspected: 'bi-check-circle-fill',
      out_of_order: 'bi-wrench-fill',
      in_progress: 'bi-arrow-repeat',
      awaiting_verification: 'bi-hourglass-split'
    };
    return icons[status] || 'bi-brush-fill';
  };

  const getTaskPriorityClass = (task) => {
    if (task.priority === 'urgent' || task.priority === 'high') return 'high-priority';
    if (task.status === 'in_progress') return 'in-progress';
    return 'normal';
  };

  const getMaintenanceIcon = (issueType) => {
    const icons = {
      hvac: 'bi-snow',
      plumbing: 'bi-droplet',
      electrical: 'bi-lightbulb',
      furniture: 'bi-lamp',
      appliance: 'bi-tv',
      structural: 'bi-hammer',
    };
    return icons[issueType] || 'bi-wrench';
  };

  // Derive effective cleanliness status from cleanliness_status + room status fallback
  const getCleanlinessStatus = (room) => {
    if (room.cleanliness_status && room.cleanliness_status !== 'clean') {
      return room.cleanliness_status;
    }
    // Fallback: derive from room booking status when cleanliness_status is default 'clean'
    if (room.status === 'cleaning') return 'dirty';
    if (room.status === 'maintenance') return 'out_of_order';
    return room.cleanliness_status || 'clean';
  };

  const roomsWithCleanliness = rooms.map(room => ({
    ...room,
    cleanliness_status: room.cleanliness_status === 'awaiting_verification' ? 'awaiting_verification' : getCleanlinessStatus(room),
  }));

  const filteredRooms = roomsWithCleanliness.filter(room => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'clean') return room.cleanliness_status === 'clean' || room.cleanliness_status === 'inspected';
    if (statusFilter === 'dirty') return room.cleanliness_status === 'dirty';
    if (statusFilter === 'progress') return room.cleanliness_status === 'in_progress' || room.cleanliness_status === 'awaiting_verification';
    if (statusFilter === 'maintenance') return room.cleanliness_status === 'out_of_order';
    return true;
  });

  // Group rooms by floor
  const roomsByFloor = filteredRooms.reduce((acc, room) => {
    const floor = room.room_number ? Math.floor(parseInt(room.room_number) / 100) : 0;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});

  const getFloorStats = (floorRooms) => {
    const total = floorRooms.length;
    const clean = floorRooms.filter(r => r.cleanliness_status === 'clean' || r.cleanliness_status === 'inspected').length;
    const dirty = floorRooms.filter(r => r.cleanliness_status === 'dirty').length;
    const inProg = floorRooms.filter(r => r.cleanliness_status === 'in_progress' || r.cleanliness_status === 'awaiting_verification').length;
    const maint = floorRooms.filter(r => r.cleanliness_status === 'out_of_order').length;
    const parts = [`${total} rooms`, `${clean} clean`];
    if (dirty) parts.push(`${dirty} dirty`);
    if (inProg) parts.push(`${inProg} in progress`);
    if (maint) parts.push(`${maint} maintenance`);
    return parts.join(' \u2022 ');
  };

  const cleanCount = roomsWithCleanliness.filter(r => r.cleanliness_status === 'clean' || r.cleanliness_status === 'inspected').length;
  const dirtyCount = roomsWithCleanliness.filter(r => r.cleanliness_status === 'dirty').length;
  const progressCount = roomsWithCleanliness.filter(r => r.cleanliness_status === 'in_progress' || r.cleanliness_status === 'awaiting_verification').length;
  const maintCount = roomsWithCleanliness.filter(r => r.cleanliness_status === 'out_of_order').length;

  const housekeepingStaff = staff.filter(s => s.department === 'housekeeping' || s.department === 'Housekeeping');

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
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Housekeeping</h1>
          <p>Manage room cleaning status, assignments, and maintenance requests</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline-secondary" onClick={() => setShowMaintenanceModal(true)}>
            <i className="bi bi-tools me-2"></i>Maintenance Request
          </button>
          <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
            <i className="bi bi-plus-lg me-2"></i>Assign Task
          </button>
        </div>
      </div>

      {/* Housekeeping Stats */}
      <div className="row g-4 mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div className="stat-icon bg-success-subtle">
              <i className="bi bi-check-circle text-success"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{cleanCount}</div>
              <div className="stat-label">Clean Rooms</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div className="stat-icon bg-warning-subtle">
              <i className="bi bi-brush text-warning"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{dirtyCount || stats.pending}</div>
              <div className="stat-label">Needs Cleaning</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div className="stat-icon bg-info-subtle">
              <i className="bi bi-arrow-repeat text-info"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{progressCount || stats.inProgress}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div className="stat-icon bg-danger-subtle">
              <i className="bi bi-wrench text-danger"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{maintCount || stats.maintenanceRequests}</div>
              <div className="stat-label">Maintenance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="row g-4">
        {/* Left Column - Room Grid */}
        <div className="col-xl-8">
          {/* Filter Bar */}
          <div className="hk-filter-bar">
            <div className="filter-tabs">
              <button
                className={`filter-tab${statusFilter === 'all' ? ' active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All Rooms <span className="badge">{rooms.length}</span>
              </button>
              <button
                className={`filter-tab${statusFilter === 'clean' ? ' active' : ''}`}
                onClick={() => setStatusFilter('clean')}
              >
                <i className="bi bi-check-circle text-success"></i> Clean <span className="badge">{cleanCount}</span>
              </button>
              <button
                className={`filter-tab${statusFilter === 'dirty' ? ' active' : ''}`}
                onClick={() => setStatusFilter('dirty')}
              >
                <i className="bi bi-brush text-warning"></i> Dirty <span className="badge">{dirtyCount}</span>
              </button>
              <button
                className={`filter-tab${statusFilter === 'progress' ? ' active' : ''}`}
                onClick={() => setStatusFilter('progress')}
              >
                <i className="bi bi-arrow-repeat text-info"></i> In Progress <span className="badge">{progressCount}</span>
              </button>
              <button
                className={`filter-tab${statusFilter === 'maintenance' ? ' active' : ''}`}
                onClick={() => setStatusFilter('maintenance')}
              >
                <i className="bi bi-wrench text-danger"></i> Maintenance <span className="badge">{maintCount}</span>
              </button>
            </div>
          </div>

          {/* Room Status Grid */}
          <div className="hk-room-section">
            {Object.keys(roomsByFloor).sort((a, b) => a - b).map(floor => (
              <div className="floor-section" key={floor}>
                <div className="floor-header">
                  <h6><i className="bi bi-building me-2"></i>Floor {floor}</h6>
                  <span className="floor-stats">{getFloorStats(roomsByFloor[floor])}</span>
                </div>
                <div className="hk-room-grid">
                  {roomsByFloor[floor].map(room => (
                    <div
                      className={`hk-room-card ${getRoomStatusClass(room.cleanliness_status)}`}
                      key={room.id}
                      onClick={() => handleRoomClick(room)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="room-number">{room.room_number}</div>
                      <div className="room-status-icon">
                        <i className={`bi ${getRoomStatusIcon(room.cleanliness_status)}`}></i>
                      </div>
                      <div className="room-type">{room.room_type || 'Standard'}</div>
                      <div className="room-status-text">
                        {room.cleanliness_status === 'awaiting_verification'
                          ? 'Awaiting Verify'
                          : capitalize((room.cleanliness_status || 'unknown').replace('_', ' '))}
                      </div>
                      {room.priority && (room.priority === 'high' || room.priority === 'urgent') && (
                        <div className={`room-priority ${room.priority}`}>{capitalize(room.priority)}</div>
                      )}
                      {room.assigned_staff && (room.cleanliness_status === 'in_progress' || room.cleanliness_status === 'awaiting_verification') && (
                        <div className="room-assignee">{room.assigned_staff}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filteredRooms.length === 0 && (
              <div className="text-center text-muted py-5">No rooms found</div>
            )}
          </div>
        </div>

        {/* Right Column - Tasks & Staff */}
        <div className="col-xl-4">
          {/* Today's Tasks */}
          <div className="hk-tasks-card">
            <div className="card-header-custom">
              <h5><i className="bi bi-list-task me-2"></i>Today's Tasks</h5>
              <span className="badge bg-primary">{tasks.length} tasks</span>
            </div>
            <div className="task-list">
              {tasks.slice(0, 10).map(task => (
                <div className={`task-item ${getTaskPriorityClass(task)}`} key={task.id}>
                  <div className="task-priority-bar"></div>
                  <div className="task-content">
                    <div className="task-header">
                      <span className="task-room">Room {task.room?.room_number || task.room_number || task.room_id}</span>
                      <span className={`task-type ${task.task_type === 'cleaning' ? 'checkout' : 'stayover'}`}>
                        {task.task_type === 'cleaning' && (task.status === 'completed' || task.status === 'verified') ? 'Cleaned' : capitalize(task.task_type)}
                      </span>
                    </div>
                    <div className="task-details">
                      <span><i className="bi bi-clock"></i> {formatDate(task.created_at, 'hh:mm A')}</span>
                      <span><i className="bi bi-person"></i> {task.assignedStaff ? `${task.assignedStaff.first_name} ${task.assignedStaff.last_name}` : (task.staff_name || 'Unassigned')}</span>
                    </div>
                  </div>
                  {task.status === 'pending' && !task.assigned_to && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setSelectedRoom({ id: task.room_id, room_number: task.room_number });
                        setTaskForm({ ...taskForm, room_id: task.room_id?.toString() || '' });
                        setShowTaskModal(true);
                      }}
                    >
                      Assign
                    </button>
                  )}
                  {task.status === 'pending' && task.assigned_to && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                    >
                      Start
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                    >
                      <i className="bi bi-check-lg me-1"></i>Mark Done
                    </button>
                  )}
                  {task.status === 'completed' && (
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleUpdateTaskStatus(task.id, 'verified')}
                    >
                      <i className="bi bi-check-all me-1"></i>Verify
                    </button>
                  )}
                  {task.status === 'verified' && (
                    <span className="badge bg-secondary">Verified</span>
                  )}
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center text-muted py-3">No tasks for today</div>
              )}
            </div>
          </div>

          {/* Staff Workload */}
          <div className="hk-staff-card">
            <div className="card-header-custom">
              <h5><i className="bi bi-people me-2"></i>Staff on Duty</h5>
              <span className="badge bg-success">{housekeepingStaff.length} active</span>
            </div>
            <div className="staff-list">
              {housekeepingStaff.map(s => {
                const initials = `${(s.first_name || '')[0] || ''}${(s.last_name || '')[0] || ''}`.toUpperCase();
                const assigned = tasks.filter(t => t.assigned_to === s.id && t.status !== 'completed' && t.status !== 'verified').length;
                const maxRooms = 5;
                const pct = Math.min((assigned / maxRooms) * 100, 100);
                return (
                  <div className="staff-item" key={s.id}>
                    <div className="staff-avatar">
                      <span>{initials}</span>
                    </div>
                    <div className="staff-info">
                      <span className="staff-name">{s.first_name} {s.last_name}</span>
                      <span className="staff-role">{s.role || 'Housekeeper'}</span>
                    </div>
                    <div className="staff-workload">
                      <div className="workload-bar">
                        <div className="workload-progress" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="workload-text">{assigned}/{maxRooms} rooms</span>
                    </div>
                  </div>
                );
              })}
              {housekeepingStaff.length === 0 && (
                <div className="text-center text-muted py-3">No housekeeping staff found</div>
              )}
            </div>
          </div>

          {/* Maintenance Requests */}
          <div className="hk-maintenance-card">
            <div className="card-header-custom">
              <h5><i className="bi bi-tools me-2"></i>Maintenance</h5>
              <span className="badge bg-danger">{maintenanceRequests.length} pending</span>
            </div>
            <div className="maintenance-list">
              {maintenanceRequests.map(req => (
                <div className="maintenance-item" key={req.id}>
                  <div className="maintenance-icon">
                    <i className={`bi ${getMaintenanceIcon(req.issue_type)}`}></i>
                  </div>
                  <div className="maintenance-info">
                    <span className="maintenance-room">Room {req.room_number}</span>
                    <span className="maintenance-issue">{req.description || capitalize(req.issue_type || 'General')}</span>
                    <span className="maintenance-time">
                      <i className="bi bi-clock"></i> {formatDate(req.created_at)}
                    </span>
                  </div>
                  <span className={`maintenance-status ${(req.status || 'pending').replace('_', '-')}`}>
                    {capitalize((req.status || 'pending').replace('_', ' '))}
                  </span>
                </div>
              ))}
              {maintenanceRequests.length === 0 && (
                <div className="text-center text-muted py-3">No maintenance requests</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Task Modal */}
      {showTaskModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={() => {
            setShowTaskModal(false);
            setTaskForm({ room_id: '', assigned_to: '', task_type: 'cleaning', priority: 'medium', notes: '' });
            setSelectedRoom(null);
          }}>
          <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>
                  {selectedRoom ? `Assign Task - Room ${selectedRoom.room_number}` : 'Assign Cleaning Task'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowTaskModal(false);
                    setTaskForm({ room_id: '', assigned_to: '', task_type: 'cleaning', priority: 'medium', notes: '' });
                    setSelectedRoom(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleAssignTask}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Select Room</label>
                    <select
                      className="form-select"
                      value={taskForm.room_id}
                      onChange={(e) => setTaskForm({ ...taskForm, room_id: e.target.value })}
                      required
                    >
                      <option value="">Select room...</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>
                          Room {room.room_number} ({room.room_type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Assign To</label>
                    <select
                      className="form-select"
                      value={taskForm.assigned_to}
                      onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                      required
                    >
                      <option value="">Select staff member...</option>
                      {housekeepingStaff.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.first_name} {s.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Task Type</label>
                    <select
                      className="form-select"
                      value={taskForm.task_type}
                      onChange={(e) => setTaskForm({ ...taskForm, task_type: e.target.value })}
                    >
                      <option value="cleaning">Cleaning</option>
                      <option value="deep_cleaning">Deep Cleaning</option>
                      <option value="turnover">Turnover</option>
                      <option value="inspection">Inspection</option>
                      <option value="amenity_restock">Amenity Restock</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High - VIP/Expected Arrival</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Special Instructions</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={taskForm.notes}
                      onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                      placeholder="Any special cleaning requirements..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowTaskModal(false);
                      setTaskForm({ room_id: '', assigned_to: '', task_type: 'cleaning', priority: 'medium', notes: '' });
                      setSelectedRoom(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-lg me-1"></i>Assign Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Request Modal */}
      {showMaintenanceModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={() => {
            setShowMaintenanceModal(false);
            setMaintenanceForm({ room_id: '', issue_type: '', description: '', priority: 'medium' });
          }}>
          <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-tools me-2"></i>New Maintenance Request
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowMaintenanceModal(false);
                    setMaintenanceForm({ room_id: '', issue_type: '', description: '', priority: 'medium' });
                  }}
                ></button>
              </div>
              <form onSubmit={handleReportMaintenance}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Room Number</label>
                    <select
                      className="form-select"
                      value={maintenanceForm.room_id}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, room_id: e.target.value })}
                      required
                    >
                      <option value="">Select room...</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>
                          Room {room.room_number}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Issue Category</label>
                    <select
                      className="form-select"
                      value={maintenanceForm.issue_type}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issue_type: e.target.value })}
                      required
                    >
                      <option value="">Select category...</option>
                      <option value="hvac">Air Conditioning</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="furniture">Furniture</option>
                      <option value="appliance">TV/Electronics</option>
                      <option value="structural">Structural</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Issue Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={maintenanceForm.description}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                      placeholder="Describe the issue in detail..."
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={maintenanceForm.priority}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                    >
                      <option value="urgent">Urgent - Guest impacted</option>
                      <option value="high">High - Needs quick attention</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low - Can wait</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowMaintenanceModal(false);
                      setMaintenanceForm({ room_id: '', issue_type: '', description: '', priority: 'medium' });
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-send me-1"></i>Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HousekeepingPage;
