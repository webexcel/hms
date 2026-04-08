const { Op } = require('sequelize');
const { recalculateBillingTotals } = require('../utils/billingUtils');

const listOrders = async (req, res, next) => {
  try {
    const { LaundryOrder, LaundryOrderItem, Room, Guest } = req.db;
    const { status, service_type, date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (service_type) where.service_type = service_type;
    if (date) {
      where.createdAt = {
        [Op.gte]: new Date(date),
        [Op.lt]: new Date(new Date(date).getTime() + 86400000)
      };
    }

    const { count, rows } = await LaundryOrder.findAndCountAll({
      where,
      include: [
        { model: LaundryOrderItem, as: 'items' },
        { model: Room, as: 'room', attributes: ['id', 'room_number'] },
        { model: Guest, as: 'guest', attributes: ['id', 'first_name', 'last_name'] },
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

const getOrder = async (req, res, next) => {
  try {
    const { LaundryOrder, LaundryOrderItem, Room, Guest } = req.db;
    const { id } = req.params;

    const order = await LaundryOrder.findByPk(id, {
      include: [
        { model: LaundryOrderItem, as: 'items' },
        { model: Room, as: 'room', attributes: ['id', 'room_number'] },
        { model: Guest, as: 'guest', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Laundry order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const { LaundryOrder, LaundryOrderItem, Reservation } = req.db;
    const { room_id, guest_id, service_type, items, notes, expected_delivery } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item' });
    }

    const order_number = 'LND-' + Date.now();

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      if (!item.item_name || !item.unit_price) {
        return res.status(400).json({ success: false, message: 'Each item must have item_name and unit_price' });
      }
      const qty = parseInt(item.quantity) || 1;
      const price = parseFloat(item.unit_price);
      const amount = qty * price;
      subtotal += amount;
      orderItemsData.push({
        item_name: item.item_name,
        category: item.category || 'topwear',
        quantity: qty,
        unit_price: price,
        amount,
      });
    }

    const tax = parseFloat((subtotal * 0.18).toFixed(2)); // 18% GST for laundry
    const total = parseFloat((subtotal + tax).toFixed(2));

    // Resolve guest and reservation from room if not provided
    let resolvedGuestId = guest_id || null;
    let resolvedReservationId = null;
    if (room_id) {
      const reservation = await Reservation.findOne({
        where: { room_id, status: 'checked_in' },
      });
      if (reservation) {
        resolvedReservationId = reservation.id;
        if (!resolvedGuestId) resolvedGuestId = reservation.guest_id;
      }
    }

    const order = await LaundryOrder.create({
      order_number,
      reservation_id: resolvedReservationId,
      room_id: room_id || null,
      guest_id: resolvedGuestId,
      service_type: service_type || 'regular',
      status: 'pending',
      subtotal,
      tax_amount: tax,
      total,
      notes: notes || null,
      expected_delivery: expected_delivery || null,
      posted_to_room: false,
      created_by: req.user?.id || null,
    });

    for (const itemData of orderItemsData) {
      await LaundryOrderItem.create({
        ...itemData,
        order_id: order.id,
      });
    }

    const createdOrder = await LaundryOrder.findByPk(order.id, {
      include: [{ model: LaundryOrderItem, as: 'items' }],
    });

    res.status(201).json({ success: true, data: createdOrder });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { LaundryOrder, LaundryOrderItem } = req.db;
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await LaundryOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Laundry order not found' });
    }

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'collected') updateData.collected_at = new Date();
      if (status === 'delivered') updateData.delivered_at = new Date();
    }
    if (notes !== undefined) updateData.notes = notes;

    await order.update(updateData);

    const updatedOrder = await LaundryOrder.findByPk(id, {
      include: [{ model: LaundryOrderItem, as: 'items' }]
    });

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

const postToRoom = async (req, res, next) => {
  try {
    const { LaundryOrder, Room, Reservation, Billing, BillingItem } = req.db;
    const { id } = req.params;

    const order = await LaundryOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Laundry order not found' });
    }

    if (!order.room_id) {
      return res.status(400).json({ success: false, message: 'Order is not associated with a room' });
    }

    if (order.posted_to_room) {
      return res.status(400).json({ success: false, message: 'Order already posted to room' });
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
      description: `Laundry Order ${order.order_number} (${order.service_type})`,
      item_type: 'laundry',
      unit_price: parseFloat(order.subtotal),
      amount: parseFloat(order.subtotal),
      quantity: 1,
      gst_rate: 18,
      hsn_code: '999713',
      date: new Date(),
    });

    await order.update({ posted_to_room: true });

    await recalculateBillingTotals(billing, BillingItem);

    res.json({ success: true, data: order, message: 'Laundry order posted to room billing' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  postToRoom,
};
