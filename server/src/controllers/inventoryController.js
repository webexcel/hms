const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { InventoryItem, InventoryTransaction } = require('../models');
const { getPagination, getPagingData } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, status, search } = req.query;
    const { offset, limit: size } = getPagination(page, limit);

    const where = {};

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const data = await InventoryItem.findAndCountAll({
      where,
      limit: size,
      offset,
      order: [['created_at', 'DESC']],
    });

    const response = getPagingData(data, page, size);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const item = await InventoryItem.create({ ...req.body, tenant_id: req.tenantId });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await InventoryItem.findByPk(id, {
      include: [
        {
          model: InventoryTransaction,
          as: 'transactions',
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await InventoryItem.findByPk(id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    await item.update(req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, type, reason, reference_type, reference_id } = req.body;

    const item = await InventoryItem.findByPk(id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const previousStock = item.current_stock;
    const newStock = type === 'in' ? previousStock + quantity : previousStock - quantity;

    if (newStock < 0) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    await InventoryTransaction.create({
      item_id: id,
      transaction_type: type,
      quantity,
      reference: reference_type || null,
      notes: reason || null,
      created_by: req.user.id,
    });

    let status;
    if (newStock === 0) {
      status = 'out_of_stock';
    } else if (newStock <= item.min_stock_level) {
      status = 'low_stock';
    } else {
      status = 'in_stock';
    }

    await item.update({ current_stock: newStock, status });

    res.json(item);
  } catch (error) {
    next(error);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const items = await InventoryItem.findAll({
      where: {
        current_stock: {
          [Op.lte]: sequelize.col('min_stock_level'),
        },
      },
      order: [['current_stock', 'ASC']],
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const total = await InventoryItem.count();
    const inStock = await InventoryItem.count({ where: { status: 'in_stock' } });
    const lowStock = await InventoryItem.count({ where: { status: 'low_stock' } });
    const outOfStock = await InventoryItem.count({ where: { status: 'out_of_stock' } });

    res.json({ total, in_stock: inStock, low_stock: lowStock, out_of_stock: outOfStock });
  } catch (error) {
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    await InventoryTransaction.destroy({ where: { item_id: item.id } });
    await item.destroy();

    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  create,
  getById,
  update,
  adjustStock,
  getLowStock,
  getStats,
  deleteItem,
};
