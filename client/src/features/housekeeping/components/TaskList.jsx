import React from 'react';
import { formatDate, capitalize } from '../../../utils/formatters';

const getTaskPriorityClass = (task) => {
  if (task.priority === 'urgent' || task.priority === 'high') return 'high-priority';
  if (task.status === 'in_progress') return 'in-progress';
  return 'normal';
};

const TaskList = ({ tasks, onUpdateStatus, onAssignFromList }) => (
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
              onClick={() => onAssignFromList(task)}
            >
              Assign
            </button>
          )}
          {task.status === 'pending' && task.assigned_to && (
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => onUpdateStatus(task.id, 'in_progress')}
            >
              Start
            </button>
          )}
          {task.status === 'in_progress' && (
            <button
              className="btn btn-sm btn-success"
              onClick={() => onUpdateStatus(task.id, 'completed')}
            >
              <i className="bi bi-check-lg me-1"></i>Mark Done
            </button>
          )}
          {task.status === 'completed' && (
            <button
              className="btn btn-sm btn-outline-success"
              onClick={() => onUpdateStatus(task.id, 'verified')}
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
);

export default TaskList;
