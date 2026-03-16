import React from 'react';

const PendingTasks = ({ latestHandover, tasks, getTaskTypeClass, getTaskIcon }) => (
  <div className="sh-section">
    <div className="sh-section-header">
      <h2 className="sh-section-title">
        <i className="bi bi-exclamation-triangle tasks"></i>
        Pending Tasks &amp; Issues
      </h2>
    </div>
    <div className="sh-section-body">
      {(latestHandover?.tasks || tasks || []).length > 0 ? (
        (latestHandover?.tasks || tasks || []).map((task, idx) => (
          <div key={task.id || idx} className={`sh-task ${getTaskTypeClass(task.type)}`}>
            <div className="sh-task-icon">
              <i className={`bi ${getTaskIcon(task.type)}`}></i>
            </div>
            <div className="sh-task-content">
              <p className="sh-task-title">{task.title}</p>
              <p className="sh-task-meta">{task.description || task.meta}</p>
            </div>
            <span className="sh-task-badge">{task.priority || task.badge || 'Info'}</span>
          </div>
        ))
      ) : (
        latestHandover?.tasks_pending ? (
          <div className="sh-task info">
            <div className="sh-task-icon">
              <i className="bi bi-info-circle"></i>
            </div>
            <div className="sh-task-content">
              <p className="sh-task-title">Pending Tasks</p>
              <p className="sh-task-meta">{latestHandover.tasks_pending}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted" style={{ fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
            No pending tasks
          </p>
        )
      )}
    </div>
  </div>
);

export default PendingTasks;
