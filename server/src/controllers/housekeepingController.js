const { Op } = require('sequelize');
const { HousekeepingTask, MaintenanceRequest, Room, Staff } = require('../models');

const listTasks = async (req, res, next) => {
  try {
    const { status, priority, room_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (room_id) where.room_id = room_id;

    const { count, rows } = await HousekeepingTask.findAndCountAll({
      where,
      include: [
        { model: Room, as: 'room' },
        { model: Staff, as: 'assignedStaff' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    // Prevent duplicate active tasks for the same room
    if (req.body.room_id) {
      const existing = await HousekeepingTask.findOne({
        where: {
          room_id: req.body.room_id,
          status: { [Op.notIn]: ['completed', 'verified'] }
        }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: `Room already has an active ${existing.task_type} task` });
      }

      // Prevent cleaning task for already clean rooms
      if (req.body.task_type === 'cleaning' || req.body.task_type === 'deep_cleaning') {
        const room = await Room.findByPk(req.body.room_id);
        if (room && (room.cleanliness_status === 'clean' || room.cleanliness_status === 'inspected')) {
          return res.status(400).json({ success: false, message: `Room ${room.room_number} is already clean. No cleaning task needed.` });
        }
      }
    }

    const task = await HousekeepingTask.create({ ...req.body, tenant_id: req.tenantId });

    // Mark room cleanliness as in_progress when a cleaning task is assigned
    if (task.room_id && (task.task_type === 'cleaning' || task.task_type === 'deep_cleaning')) {
      await Room.update({ cleanliness_status: 'in_progress' }, { where: { id: task.room_id } });
    }

    const createdTask = await HousekeepingTask.findByPk(task.id, {
      include: [
        { model: Room, as: 'room' },
        { model: Staff, as: 'assignedStaff' }
      ]
    });

    res.status(201).json({ success: true, data: createdTask });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await HousekeepingTask.findByPk(id, {
      include: [{ model: Room, as: 'room' }]
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (updates.status === 'in_progress') {
      // Mark room as cleaning in progress
      if (task.room_id) {
        await Room.update({ cleanliness_status: 'in_progress' }, { where: { id: task.room_id } });
      }
    }

    if (updates.status === 'completed') {
      updates.completed_at = new Date();

      if (task.room_id) {
        await Room.update({ cleanliness_status: 'awaiting_verification' }, { where: { id: task.room_id } });
      }
    }

    if (updates.status === 'verified') {
      // Inspection passed — now mark room as available
      if (task.room_id) {
        const roomUpdates = { cleanliness_status: 'clean' };
        if (task.room && task.room.status === 'cleaning') {
          roomUpdates.status = 'available';
        }
        await Room.update(roomUpdates, { where: { id: task.room_id } });
      }
    }

    await task.update(updates);

    const updatedTask = await HousekeepingTask.findByPk(id, {
      include: [
        { model: Room, as: 'room' },
        { model: Staff, as: 'assignedStaff' }
      ]
    });

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

const dashboard = async (req, res, next) => {
  try {
    const [statusCounts, priorityCounts, roomCleanliness] = await Promise.all([
      HousekeepingTask.findAll({
        attributes: [
          'status',
          [HousekeepingTask.sequelize.fn('COUNT', HousekeepingTask.sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      }),
      HousekeepingTask.findAll({
        attributes: [
          'priority',
          [HousekeepingTask.sequelize.fn('COUNT', HousekeepingTask.sequelize.col('id')), 'count']
        ],
        group: ['priority'],
        raw: true
      }),
      Room.findAll({
        attributes: [
          'cleanliness_status',
          [Room.sequelize.fn('COUNT', Room.sequelize.col('id')), 'count']
        ],
        group: ['cleanliness_status'],
        raw: true
      })
    ]);

    const statusBreakdown = {};
    statusCounts.forEach(item => { statusBreakdown[item.status] = parseInt(item.count); });

    const priorityBreakdown = {};
    priorityCounts.forEach(item => { priorityBreakdown[item.priority] = parseInt(item.count); });

    const cleanlinessBreakdown = {};
    roomCleanliness.forEach(item => { cleanlinessBreakdown[item.cleanliness_status] = parseInt(item.count); });

    res.json({
      success: true,
      data: {
        byStatus: statusBreakdown,
        byPriority: priorityBreakdown,
        total: Object.values(statusBreakdown).reduce((sum, c) => sum + c, 0),
        roomCleanliness: cleanlinessBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

const createMaintenance = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.create({ ...req.body, tenant_id: req.tenantId });

    // Mark room as out_of_order for housekeeping view
    if (req.body.room_id) {
      await Room.update(
        { cleanliness_status: 'out_of_order', status: 'maintenance' },
        { where: { id: req.body.room_id } }
      );
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

const listMaintenance = async (req, res, next) => {
  try {
    const { status, priority, room_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (room_id) where.room_id = room_id;

    const { count, rows } = await MaintenanceRequest.findAndCountAll({
      where,
      include: [{ model: Room, as: 'room' }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const maintenance = await MaintenanceRequest.findByPk(id);

    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Maintenance request not found' });
    }

    const updates = req.body;

    // When marking as completed, restore room to available
    if (updates.status === 'completed') {
      updates.completed_at = new Date();
      if (maintenance.room_id) {
        await Room.update(
          { status: 'available', cleanliness_status: 'dirty' },
          { where: { id: maintenance.room_id } }
        );
      }
    }

    // When cancelling, also restore room
    if (updates.status === 'cancelled') {
      if (maintenance.room_id) {
        await Room.update(
          { status: 'available', cleanliness_status: 'dirty' },
          { where: { id: maintenance.room_id } }
        );
      }
    }

    await maintenance.update(updates);

    const updated = await MaintenanceRequest.findByPk(id, {
      include: [{ model: Room, as: 'room' }]
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTasks,
  createTask,
  updateTask,
  dashboard,
  createMaintenance,
  updateMaintenance,
  listMaintenance
};
