const { Op } = require('sequelize');

const list = async (req, res, next) => {
  try {
    const { Staff, User } = req.db;
    const { department, status, shift, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (department) where.department = department;
    if (status) where.status = status;
    if (shift) where.shift = shift;

    const { count, rows } = await Staff.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
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

const create = async (req, res, next) => {
  try {
    const { Staff, User } = req.db;
    // Auto-generate employee_id if not provided
    if (!req.body.employee_id) {
      const lastStaff = await Staff.findOne({ order: [['id', 'DESC']] });
      const nextNum = (lastStaff ? lastStaff.id : 0) + 1;
      req.body.employee_id = `EMP${String(nextNum).padStart(4, '0')}`;
    }

    const staff = await Staff.create({ ...req.body });

    const createdStaff = await Staff.findByPk(staff.id, {
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }]
    });

    res.status(201).json({ success: true, data: createdStaff });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { Staff, StaffSchedule, User } = req.db;
    const { id } = req.params;

    const staff = await Staff.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: StaffSchedule, as: 'schedules' }
      ]
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { Staff, User } = req.db;
    const { id } = req.params;

    const staff = await Staff.findByPk(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    await staff.update(req.body);

    const updatedStaff = await Staff.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }]
    });

    res.json({ success: true, data: updatedStaff });
  } catch (error) {
    next(error);
  }
};

const listSchedules = async (req, res, next) => {
  try {
    const { StaffSchedule, Staff } = req.db;
    const { date, staff_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (staff_id) where.staff_id = staff_id;
    if (date) {
      where.date = {
        [Op.gte]: new Date(date),
        [Op.lt]: new Date(new Date(date).getTime() + 86400000)
      };
    }

    const { count, rows } = await StaffSchedule.findAndCountAll({
      where,
      include: [{ model: Staff, as: 'staff' }],
      order: [['date', 'ASC']],
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

const createSchedule = async (req, res, next) => {
  try {
    const { StaffSchedule, Staff } = req.db;
    const schedule = await StaffSchedule.create({ ...req.body });

    const createdSchedule = await StaffSchedule.findByPk(schedule.id, {
      include: [{ model: Staff, as: 'staff' }]
    });

    res.status(201).json({ success: true, data: createdSchedule });
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const { StaffSchedule, Staff } = req.db;
    const { id } = req.params;

    const schedule = await StaffSchedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    await schedule.update(req.body);

    const updatedSchedule = await StaffSchedule.findByPk(id, {
      include: [{ model: Staff, as: 'staff' }]
    });

    res.json({ success: true, data: updatedSchedule });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  create,
  getById,
  update,
  listSchedules,
  createSchedule,
  updateSchedule
};
