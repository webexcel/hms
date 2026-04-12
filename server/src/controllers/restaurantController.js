const { Op } = require('sequelize');
const { recalculateBillingTotals } = require('../utils/billingUtils');

const listOrders = async (req, res, next) => {
  try {
    const { RestaurantOrder, RestaurantOrderItem, Room, Guest } = req.db;
    const { status, order_type, date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (order_type) where.order_type = order_type;
    if (date) {
      where.createdAt = {
        [Op.gte]: new Date(date),
        [Op.lt]: new Date(new Date(date).getTime() + 86400000)
      };
    }

    const { count, rows } = await RestaurantOrder.findAndCountAll({
      where,
      include: [
        { model: RestaurantOrderItem, as: 'items' },
        { model: Room, as: 'room', attributes: ['id', 'room_number'] },
        { model: Guest, as: 'guest', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Attach shift-lock flag to each paid walk-in order
    const { ShiftHandover } = req.db;
    const handovers = await ShiftHandover.findAll({
      where: { report_number: { [Op.like]: 'FA-%' } },
      attributes: ['created_at', 'report_number'],
      order: [['created_at', 'ASC']],
      raw: true,
    });
    const data = rows.map(r => {
      const o = r.toJSON();
      if (o.payment_status === 'paid' && !o.room_id) {
        const paidAt = new Date(o.paid_at || o.created_at || o.createdAt);
        const locking = handovers.find(h => new Date(h.created_at) > paidAt);
        o.locked = !!locking;
        o.locked_by = locking?.report_number || null;
      } else {
        o.locked = false;
      }
      return o;
    });

    res.json({
      success: true,
      data,
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

const createOrder = async (req, res, next) => {
  try {
    const { RestaurantOrder, RestaurantOrderItem, MenuItem, Reservation } = req.db;
    const { order_type, room_id, guest_id, items, notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item' });
    }

    const order_number = 'ORD-' + Date.now();

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      // Support both menu_item_id (dropdown) and name+rate (legacy/manual)
      if (item.menu_item_id) {
        const menuItem = await MenuItem.findByPk(item.menu_item_id);
        if (!menuItem) {
          return res.status(404).json({ success: false, message: `Menu item ${item.menu_item_id} not found` });
        }
        if (!menuItem.is_available) {
          return res.status(400).json({ success: false, message: `"${menuItem.name}" is currently unavailable` });
        }
        if (!item.quantity || item.quantity < 1) {
          return res.status(400).json({ success: false, message: `Invalid quantity for "${menuItem.name}"` });
        }
        const itemTotal = parseFloat(menuItem.price) * item.quantity;
        subtotal += itemTotal;
        orderItemsData.push({
          menu_item_id: menuItem.id,
          item_name: menuItem.name,
          quantity: item.quantity,
          unit_price: parseFloat(menuItem.price),
          amount: itemTotal,
        });
      } else if (item.name && item.rate) {
        // Legacy: manual item entry
        const qty = parseInt(item.quantity) || 1;
        const rate = parseFloat(item.rate) || 0;
        const itemTotal = qty * rate;
        subtotal += itemTotal;
        orderItemsData.push({
          menu_item_id: null,
          item_name: item.name,
          quantity: qty,
          unit_price: rate,
          amount: itemTotal,
        });
      }
    }

    if (orderItemsData.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid items in order' });
    }

    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    // Resolve guest from room if not provided
    let resolvedGuestId = guest_id || null;
    if (!resolvedGuestId && room_id) {
      const reservation = await Reservation.findOne({
        where: { room_id, status: 'checked_in' },
      });
      if (reservation) resolvedGuestId = reservation.guest_id;
    }

    const order = await RestaurantOrder.create({
      order_number,
      order_type: room_id ? (order_type || 'room_service') : 'dine_in',
      room_id: room_id || null,
      guest_id: resolvedGuestId,
      status: 'pending',
      subtotal,
      tax_amount: tax,
      total,
      notes: notes || null,
      posted_to_room: false,
    });

    for (const itemData of orderItemsData) {
      await RestaurantOrderItem.create({
        ...itemData,
        order_id: order.id,
      });
    }

    const createdOrder = await RestaurantOrder.findByPk(order.id, {
      include: [{ model: RestaurantOrderItem, as: 'items' }],
    });

    res.status(201).json({ success: true, data: createdOrder });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { RestaurantOrder, RestaurantOrderItem } = req.db;
    const { id } = req.params;
    const { status } = req.body;

    const order = await RestaurantOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.update({ status });

    const updatedOrder = await RestaurantOrder.findByPk(id, {
      include: [{ model: RestaurantOrderItem, as: 'items' }]
    });

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

const postToRoom = async (req, res, next) => {
  try {
    const { RestaurantOrder, Room, Reservation, Billing, BillingItem } = req.db;
    const { id } = req.params;

    const order = await RestaurantOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.room_id) {
      return res.status(400).json({ success: false, message: 'Order is not associated with a room' });
    }

    if (order.posted_to_room) {
      return res.status(400).json({ success: false, message: 'Order already posted to room' });
    }

    if (order.status !== 'served') {
      return res.status(400).json({ success: false, message: 'Order must be served before posting to billing' });
    }

    const room = await Room.findByPk(order.room_id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const reservation = await Reservation.findOne({
      where: { room_id: order.room_id, status: 'checked_in' }
    });

    if (!reservation) {
      return res.status(400).json({ success: false, message: 'No active reservation found for this room' });
    }

    const billing = await Billing.findOne({
      where: { reservation_id: reservation.id }
    });

    if (!billing) {
      return res.status(400).json({ success: false, message: 'No billing found for this reservation' });
    }

    await BillingItem.create({
      billing_id: billing.id,
      description: `Restaurant Order ${order.order_number}`,
      item_type: 'restaurant',
      unit_price: parseFloat(order.subtotal),
      amount: parseFloat(order.subtotal),
      quantity: 1,
      gst_rate: 5,
      hsn_code: '996331',
      date: new Date(),
    });

    await order.update({ posted_to_room: true });

    // Recalculate billing totals to include restaurant charge
    await recalculateBillingTotals(billing, BillingItem);

    res.json({ success: true, data: order, message: 'Order posted to room billing' });
  } catch (error) {
    next(error);
  }
};

const listMenu = async (req, res, next) => {
  try {
    const { MenuItem } = req.db;
    const { category, is_veg, is_available } = req.query;
    const where = {};

    if (category) where.category = category;
    if (is_veg !== undefined) where.is_veg = is_veg === 'true';
    if (is_available !== undefined) where.is_available = is_available === 'true';

    const menuItems = await MenuItem.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    res.json({ success: true, data: menuItems });
  } catch (error) {
    next(error);
  }
};

const createMenuItem = async (req, res, next) => {
  try {
    const { MenuItem } = req.db;
    const menuItem = await MenuItem.create({ ...req.body });
    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    next(error);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const { MenuItem } = req.db;
    const { id } = req.params;

    const menuItem = await MenuItem.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    await menuItem.update(req.body);

    res.json({ success: true, data: menuItem });
  } catch (error) {
    next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const { MenuItem, RestaurantOrderItem } = req.db;
    const { id } = req.params;
    const menuItem = await MenuItem.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    // Nullify references in order items first, then delete
    await RestaurantOrderItem.update(
      { menu_item_id: null },
      { where: { menu_item_id: id } }
    );
    await menuItem.destroy();
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
};

// PUT /:id/pay — Mark walk-in order as paid
const payOrder = async (req, res, next) => {
  try {
    const { RestaurantOrder } = req.db;
    const { id } = req.params;
    const { payment_method } = req.body;

    const order = await RestaurantOrder.findByPk(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Order already paid' });
    }
    if (order.room_id) {
      return res.status(400).json({ success: false, message: 'Room-linked orders should be posted to room billing instead' });
    }

    await order.update({
      payment_status: 'paid',
      payment_method: payment_method || 'cash',
      paid_at: new Date(),
      status: 'completed',
    });

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// PUT /:id/payment-method — Change payment method of a paid walk-in order (correction)
const updatePaymentMethod = async (req, res, next) => {
  try {
    const { RestaurantOrder, ShiftHandover } = req.db;
    const { Op } = require('sequelize');
    const { id } = req.params;
    const { payment_method } = req.body;

    const allowedMethods = ['cash', 'card', 'upi', 'bank_transfer'];
    if (!payment_method || !allowedMethods.includes(payment_method)) {
      return res.status(400).json({ success: false, message: `Invalid payment method. Must be one of: ${allowedMethods.join(', ')}` });
    }

    const order = await RestaurantOrder.findByPk(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.room_id) {
      return res.status(400).json({ success: false, message: 'Room-linked orders cannot have payment method changed here' });
    }
    if (order.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Order is not paid yet — use pay endpoint first' });
    }

    // Shift lock: block edits if a shift handover was saved after this order's paid_at
    const paidAt = order.paid_at || order.created_at || order.createdAt;
    const handover = await ShiftHandover.findOne({
      where: {
        created_at: { [Op.gt]: paidAt },
        report_number: { [Op.like]: 'FA-%' },
      },
      order: [['created_at', 'ASC']],
    });
    if (handover) {
      return res.status(403).json({
        success: false,
        message: `Order is locked — shift handover ${handover.report_number} was already saved for this period.`,
      });
    }

    await order.update({ payment_method });
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listOrders,
  createOrder,
  updateOrder,
  postToRoom,
  payOrder,
  updatePaymentMethod,
  listMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
