const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const { getRoomGstRate, getGstRateByItemType, calculateGst, getHsnCode } = require('../utils/gst');
const { recalculateBillingTotals, derivePaymentStatus } = require('../utils/billingUtils');
const { getPagination, getPagingData } = require('../utils/pagination');
const waNotifier = require('../services/whatsapp/hotelNotifier');

// Convert number to Indian currency words
function numberToWords(num) {
  if (num === 0) return 'Zero Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function twoDigits(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  }

  function threeDigits(n) {
    if (n >= 100) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : '');
    return twoDigits(n);
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = '';

  if (rupees >= 10000000) {
    result += threeDigits(Math.floor(rupees / 10000000)) + ' Crore ';
    num = rupees % 10000000;
  } else { num = rupees; }
  if (num >= 100000) {
    result += twoDigits(Math.floor(num / 100000)) + ' Lakh ';
    num = num % 100000;
  }
  if (num >= 1000) {
    result += twoDigits(Math.floor(num / 1000)) + ' Thousand ';
    num = num % 1000;
  }
  if (num > 0) {
    result += threeDigits(num);
  }

  result = 'Indian Rupees ' + result.trim();
  if (paise > 0) {
    result += ' and ' + twoDigits(paise) + ' Paise';
  }
  result += ' Only';
  return result;
}

// GET / - List billings with filters and pagination
const list = async (req, res, next) => {
  try {
    const { Billing, Guest, Reservation, Room } = req.db;
    const { payment_status, start_date, end_date, page, size } = req.query;
    const { limit, offset } = getPagination(page, size);

    const where = {};

    if (payment_status) {
      where.payment_status = payment_status;
    }

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        where.created_at[Op.lte] = new Date(end_date);
      }
    }

    const data = await Billing.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { model: Guest, as: 'guest' },
        { model: Reservation, as: 'reservation', attributes: ['id', 'group_id', 'room_id', 'reservation_number', 'check_in_date', 'check_out_date', 'status'],
          include: [{ model: Room, as: 'room', attributes: ['id', 'room_number', 'room_type'] }] },
      ],
      order: [['created_at', 'DESC']]
    });

    const response = getPagingData(data, page, limit);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// POST / - Create billing
const create = async (req, res, next) => {
  try {
    const { Billing } = req.db;
    const invoiceNumber = 'INV-' + Date.now();

    const billing = await Billing.create({
      ...req.body,
      invoice_number: invoiceNumber,
      subtotal: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      grand_total: 0,
      paid_amount: 0,
      balance_due: 0,
      payment_status: 'unpaid'
    });

    res.status(201).json(billing);
  } catch (error) {
    next(error);
  }
};

// GET /:id - Get billing by ID with associations
const getById = async (req, res, next) => {
  try {
    const { Billing, BillingItem, Payment, Guest, Reservation, Room } = req.db;
    const billing = await Billing.findByPk(req.params.id, {
      include: [
        { model: BillingItem, as: 'items' },
        { model: Payment, as: 'payments' },
        { model: Guest, as: 'guest' },
        {
          model: Reservation,
          as: 'reservation',
          include: [{ model: Room, as: 'room' }]
        }
      ]
    });

    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }

    res.json(billing);
  } catch (error) {
    next(error);
  }
};

// POST /:id/items - Add billing item
const addItem = async (req, res, next) => {
  try {
    const { Billing, BillingItem } = req.db;
    const billing = await Billing.findByPk(req.params.id);

    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }

    const { description, amount, quantity, item_type } = req.body;

    // Enforce extra bed limit per room
    if (item_type === 'service' && description && description.toLowerCase().includes('extra bed')) {
      const { Reservation, Room } = req.db;
      const reservation = await Reservation.findOne({ where: { id: billing.reservation_id } });
      if (reservation) {
        const room = await Room.findByPk(reservation.room_id);
        const maxExtraBeds = room?.max_extra_beds || 1;
        const existingExtraBeds = await BillingItem.count({
          where: {
            billing_id: billing.id,
            item_type: 'service',
            description: { [Op.like]: '%Extra Bed%' },
          },
        });
        if (existingExtraBeds >= maxExtraBeds) {
          return res.status(400).json({ message: `Maximum extra beds (${maxExtraBeds}) already added for this room` });
        }
      }
    }

    const totalAmount = (parseFloat(amount) || 0) * (parseInt(quantity) || 1);
    const gstRate = getGstRateByItemType(item_type || 'room_charge', totalAmount);
    const gstResult = calculateGst(totalAmount, gstRate);
    const hsnCode = getHsnCode(item_type || 'room_charge');

    const item = await BillingItem.create({
      billing_id: billing.id,
      description,
      amount: totalAmount,
      quantity: quantity || 1,
      unit_price: parseFloat(amount) || 0,
      item_type: item_type || 'room',
      gst_rate: gstRate,
      gst_amount: gstResult.totalGst,
      hsn_code: hsnCode,
      date: new Date(),
    });

    await recalculateBillingTotals(billing, BillingItem);

    const updatedBilling = await Billing.findByPk(billing.id, {
      include: [{ model: BillingItem, as: 'items' }]
    });

    res.status(201).json(updatedBilling);
  } catch (error) {
    next(error);
  }
};

// DELETE /:id/items/:itemId - Remove billing item
const removeItem = async (req, res, next) => {
  try {
    const { Billing, BillingItem } = req.db;
    const billing = await Billing.findByPk(req.params.id);

    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }

    const item = await BillingItem.findOne({
      where: { id: req.params.itemId, billing_id: billing.id }
    });

    if (!item) {
      return res.status(404).json({ message: 'Billing item not found' });
    }

    await item.destroy();
    await recalculateBillingTotals(billing, BillingItem);

    const updatedBilling = await Billing.findByPk(billing.id, {
      include: [{ model: BillingItem, as: 'items' }]
    });

    res.json(updatedBilling);
  } catch (error) {
    next(error);
  }
};

// POST /:id/payments - Record payment
const recordPayment = async (req, res, next) => {
  try {
    const { Billing, Payment, Guest } = req.db;
    const billing = await Billing.findByPk(req.params.id);

    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }

    const amount = parseFloat(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than zero' });
    }

    const currentBalance = parseFloat(billing.balance_due || billing.grand_total || 0);
    if (amount > currentBalance && currentBalance > 0) {
      return res.status(400).json({
        message: `Payment amount (${amount}) exceeds balance due (${currentBalance})`,
      });
    }

    if (billing.payment_status === 'paid') {
      return res.status(400).json({ message: 'This bill is already fully paid' });
    }

    const payment = await Payment.create({
      billing_id: billing.id,
      ...req.body,
      amount,
    });

    const paidAmount = parseFloat(billing.paid_amount || 0) + amount;
    const grandTotal = parseFloat(billing.grand_total) || 0;
    const balanceDue = Math.max(0, grandTotal - paidAmount);

    await billing.update({
      paid_amount: paidAmount,
      balance_due: balanceDue,
      payment_status: derivePaymentStatus(paidAmount, grandTotal),
    });

    const updatedBilling = await Billing.findByPk(billing.id, {
      include: [{ model: Payment, as: 'payments' }]
    });

    // WhatsApp payment receipt (fire-and-forget)
    if (billing.guest_id) {
      Guest.findByPk(billing.guest_id).then((guest) => {
        if (guest?.phone) {
          waNotifier.notifyPaymentReceipt({
            guestName: `${guest.first_name} ${guest.last_name}`,
            guestPhone: guest.phone,
            invoiceNumber: billing.invoice_number,
            amount: amount,
            paymentMethod: req.body.payment_method || 'cash',
            balanceDue: Math.max(0, balanceDue),
          }).catch(() => {});
        }
      }).catch(() => {});
    }

    res.status(201).json({ payment, billing: updatedBilling });
  } catch (error) {
    next(error);
  }
};

// GET /stats - Billing statistics
const getStats = async (req, res, next) => {
  try {
    const { Billing, Payment } = req.db;
    const totalRevenue = await Billing.sum('paid_amount') || 0;

    const pendingPayments = await Billing.sum('balance_due', {
      where: {
        payment_status: { [Op.in]: ['unpaid', 'partial'] },
        balance_due: { [Op.gt]: 0 },
      }
    }) || 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayCollections = await Payment.sum('amount', {
      where: {
        created_at: { [Op.between]: [todayStart, todayEnd] }
      }
    }) || 0;

    const totalDiscount = await Billing.sum('discount_amount', {
      where: { discount_amount: { [Op.gt]: 0 } }
    }) || 0;

    res.json({
      total_revenue: totalRevenue,
      pending_payments: pendingPayments,
      today_collections: todayCollections,
      total_discount: totalDiscount
    });
  } catch (error) {
    next(error);
  }
};

// GET /:id/invoice/pdf - Generate invoice PDF
const generatePdf = async (req, res, next) => {
  try {
    const { Billing, BillingItem, Payment, Guest, Reservation, Room } = req.db;
    const billing = await Billing.findByPk(req.params.id, {
      include: [
        { model: BillingItem, as: 'items' },
        { model: Payment, as: 'payments' },
        { model: Guest, as: 'guest' },
        {
          model: Reservation,
          as: 'reservation',
          include: [{ model: Room, as: 'room' }]
        }
      ]
    });

    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${billing.invoice_number}.pdf`
    );

    doc.pipe(res);

    // Hotel name header
    doc.fontSize(22).font('Helvetica-Bold').text('Hotel Management System', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').text('TAX INVOICE', { align: 'center' });
    doc.moveDown();

    // Invoice details
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice Number: ${billing.invoice_number}`);
    doc.text(`Date: ${new Date(billing.created_at).toLocaleDateString()}`);
    doc.moveDown();

    // Guest info
    if (billing.guest) {
      doc.font('Helvetica-Bold').text('Guest Information:');
      doc.font('Helvetica');
      doc.text(`Name: ${billing.guest.first_name || ''} ${billing.guest.last_name || ''}`);
      doc.text(`Email: ${billing.guest.email || 'N/A'}`);
      doc.text(`Phone: ${billing.guest.phone || 'N/A'}`);
      doc.moveDown();
    }

    // Reservation info
    if (billing.reservation && billing.reservation.room) {
      doc.font('Helvetica-Bold').text('Reservation Details:');
      doc.font('Helvetica');
      doc.text(`Room: ${billing.reservation.room.room_number || 'N/A'}`);
      doc.text(`Check-in: ${billing.reservation.check_in_date || 'N/A'}`);
      doc.text(`Check-out: ${billing.reservation.check_out_date || 'N/A'}`);
      doc.moveDown();
    }

    // Items table header
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 250;
    const col3 = 340;
    const col4 = 410;
    const col5 = 480;

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Description', col1, tableTop);
    doc.text('HSN', col2, tableTop);
    doc.text('Qty', col3, tableTop);
    doc.text('GST %', col4, tableTop);
    doc.text('Amount', col5, tableTop);

    doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Items rows
    let rowY = tableTop + 25;
    doc.font('Helvetica').fontSize(9);

    const items = billing.items || [];
    for (const item of items) {
      if (rowY > 700) {
        doc.addPage();
        rowY = 50;
      }
      doc.text(item.description || '', col1, rowY, { width: 190 });
      doc.text(item.hsn_code || '', col2, rowY);
      doc.text(String(item.quantity || 1), col3, rowY);
      doc.text(`${item.gst_rate || 0}%`, col4, rowY);
      doc.text(`${parseFloat(item.amount || 0).toFixed(2)}`, col5, rowY);
      rowY += 20;
    }

    doc.moveTo(col1, rowY).lineTo(550, rowY).stroke();
    rowY += 15;

    // Totals
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`Subtotal:`, 380, rowY);
    doc.text(`${parseFloat(billing.subtotal || 0).toFixed(2)}`, col5, rowY);
    rowY += 18;

    // GST breakdown
    doc.font('Helvetica').fontSize(9);
    const cgstAmount = parseFloat(billing.cgst_amount || 0);
    const sgstAmount = parseFloat(billing.sgst_amount || 0);
    const cgst = cgstAmount.toFixed(2);
    const sgst = sgstAmount.toFixed(2);

    doc.text(`CGST:`, 380, rowY);
    doc.text(`${cgst}`, col5, rowY);
    rowY += 15;

    doc.text(`SGST:`, 380, rowY);
    doc.text(`${sgst}`, col5, rowY);
    rowY += 18;

    doc.font('Helvetica-Bold').fontSize(11);
    doc.text(`Grand Total:`, 380, rowY);
    doc.text(`${parseFloat(billing.grand_total || 0).toFixed(2)}`, col5, rowY);
    rowY += 20;

    doc.font('Helvetica').fontSize(10);
    doc.text(`Paid Amount:`, 380, rowY);
    doc.text(`${parseFloat(billing.paid_amount || 0).toFixed(2)}`, col5, rowY);
    rowY += 18;

    doc.text(`Balance Due:`, 380, rowY);
    doc.text(`${parseFloat(billing.balance_due || 0).toFixed(2)}`, col5, rowY);

    doc.end();
  } catch (error) {
    next(error);
  }
};

// GET /:id/gst-invoice - GST invoice data
const getGstInvoice = async (req, res, next) => {
  try {
    const { Billing, BillingItem, Guest, Reservation, Room } = req.db;
    const billing = await Billing.findByPk(req.params.id, {
      include: [
        { model: BillingItem, as: 'items' },
        { model: Guest, as: 'guest' },
        {
          model: Reservation,
          as: 'reservation',
          include: [{ model: Room, as: 'room' }]
        }
      ]
    });

    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }

    const items = billing.items || [];
    const cgstTotal = parseFloat(billing.cgst_amount || 0);
    const sgstTotal = parseFloat(billing.sgst_amount || 0);
    const totalTax = cgstTotal + sgstTotal;

    const gstInvoice = {
      invoice_number: billing.invoice_number,
      invoice_date: billing.created_at,
      guest: billing.guest
        ? {
            name: `${billing.guest.first_name || ''} ${billing.guest.last_name || ''}`.trim(),
            email: billing.guest.email,
            phone: billing.guest.phone,
            address: billing.guest.address,
            gstin: billing.guest.gstin || null
          }
        : null,
      reservation: billing.reservation
        ? {
            room_number: billing.reservation.room
              ? billing.reservation.room.room_number
              : null,
            check_in: billing.reservation.check_in_date,
            check_out: billing.reservation.check_out_date
          }
        : null,
      items: items.map((item) => {
        const amount = parseFloat(item.amount || 0);
        const gstRate = item.gst_rate || getGstRateByItemType(item.item_type, amount);
        const gstResult = calculateGst(amount, gstRate);
        return {
          description: item.description,
          hsn_code: item.hsn_code || getHsnCode(item.item_type),
          quantity: item.quantity,
          amount,
          gst_rate: gstRate,
          cgst: gstResult.cgst,
          sgst: gstResult.sgst,
          total_gst: gstResult.totalGst,
          total: amount + gstResult.totalGst
        };
      }),
      subtotal: parseFloat(billing.subtotal || 0),
      cgst: cgstTotal,
      sgst: sgstTotal,
      total_gst: totalTax,
      grand_total: parseFloat(billing.grand_total || 0),
      paid_amount: parseFloat(billing.paid_amount || 0),
      balance_due: parseFloat(billing.balance_due || 0),
      payment_status: billing.payment_status
    };

    res.json(gstInvoice);
  } catch (error) {
    next(error);
  }
};

// GET /:id/invoice - JSON invoice data for React InvoicePage
const getInvoice = async (req, res, next) => {
  try {
    const { Billing, BillingItem, Payment, Guest, Reservation, Room } = req.db;
    const billing = await Billing.findByPk(req.params.id, {
      include: [
        { model: BillingItem, as: 'items' },
        { model: Payment, as: 'payments' },
        { model: Guest, as: 'guest' },
        {
          model: Reservation,
          as: 'reservation',
          include: [{ model: Room, as: 'room' }]
        }
      ]
    });

    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }

    const { HOTEL_INFO } = require('../config/constants');
    const items = billing.items || [];
    const cgstTotal = parseFloat(billing.cgst_amount || 0);
    const sgstTotal = parseFloat(billing.sgst_amount || 0);
    const totalTax = cgstTotal + sgstTotal;

    // Build per-rate tax breakup
    const taxBreakup = {};
    const invoiceItems = items.map((item) => {
      const amount = parseFloat(item.amount || 0);
      const gstRate = item.gst_rate || getGstRateByItemType(item.item_type, amount);
      const gstResult = calculateGst(amount, gstRate);

      // Accumulate tax breakup by rate
      if (!taxBreakup[gstRate]) {
        taxBreakup[gstRate] = { rate: gstRate, taxable_amount: 0, cgst: 0, sgst: 0, total_tax: 0 };
      }
      taxBreakup[gstRate].taxable_amount += amount;
      taxBreakup[gstRate].cgst += gstResult.cgst;
      taxBreakup[gstRate].sgst += gstResult.sgst;
      taxBreakup[gstRate].total_tax += gstResult.totalGst;

      return {
        description: item.description,
        item_type: item.item_type,
        hsn_code: item.hsn_code || getHsnCode(item.item_type),
        quantity: item.quantity,
        rate: amount / (item.quantity || 1),
        amount,
        gst_rate: gstRate,
        cgst: gstResult.cgst,
        sgst: gstResult.sgst,
        total_gst: gstResult.totalGst,
        total: amount + gstResult.totalGst,
      };
    });

    const subtotal = parseFloat(billing.subtotal || 0);
    const grandTotal = parseFloat(billing.grand_total || 0);

    const invoice = {
      invoice_number: billing.invoice_number,
      invoice_date: billing.created_at,
      hotel: {
        legal_name: HOTEL_INFO.LEGAL_NAME,
        trade_name: HOTEL_INFO.TRADE_NAME,
        gstin: HOTEL_INFO.GSTIN,
        pan: HOTEL_INFO.PAN,
        address: HOTEL_INFO.ADDRESS,
        city: HOTEL_INFO.CITY,
        state: HOTEL_INFO.STATE,
        pincode: HOTEL_INFO.PINCODE,
        state_code: HOTEL_INFO.STATE_CODE,
        phone: HOTEL_INFO.PHONE,
        email: HOTEL_INFO.EMAIL,
        website: HOTEL_INFO.WEBSITE,
        bank_name: HOTEL_INFO.BANK_NAME,
        bank_account: HOTEL_INFO.BANK_ACCOUNT,
        bank_ifsc: HOTEL_INFO.BANK_IFSC,
        bank_branch: HOTEL_INFO.BANK_BRANCH,
      },
      guest: billing.guest
        ? {
            name: `${billing.guest.first_name || ''} ${billing.guest.last_name || ''}`.trim(),
            email: billing.guest.email,
            phone: billing.guest.phone,
            address: billing.guest.address,
            city: billing.guest.city,
            state: billing.guest.state,
            gstin: billing.guest.gstin || null,
            company: billing.guest.company || null,
          }
        : null,
      reservation: billing.reservation
        ? {
            reservation_number: billing.reservation.reservation_number,
            room_number: billing.reservation.room ? billing.reservation.room.room_number : null,
            room_type: billing.reservation.room ? billing.reservation.room.room_type : null,
            check_in: billing.reservation.check_in_date,
            check_out: billing.reservation.check_out_date,
            nights: billing.reservation.nights,
          }
        : null,
      items: invoiceItems,
      tax_breakup: Object.values(taxBreakup).sort((a, b) => a.rate - b.rate),
      subtotal,
      cgst: cgstTotal,
      sgst: sgstTotal,
      total_gst: totalTax,
      grand_total: grandTotal,
      amount_in_words: numberToWords(grandTotal),
      paid_amount: parseFloat(billing.paid_amount || 0),
      balance_due: parseFloat(billing.balance_due || 0),
      payment_status: billing.payment_status,
      payments: (billing.payments || []).map((p) => ({
        amount: parseFloat(p.amount),
        method: p.payment_method,
        reference: p.reference_number,
        date: p.payment_date || p.created_at,
      })),
    };

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

const getGroupInvoice = async (req, res, next) => {
  try {
    const { Reservation, Room, Guest, Billing, BillingItem, Payment } = req.db;
    const { groupId } = req.params;

    // Find all reservations in this group
    const reservations = await Reservation.findAll({
      where: { group_id: groupId },
      include: [
        { model: Room, as: 'room' },
        { model: Guest, as: 'guest' },
        { model: Billing, as: 'billing', include: [
          { model: BillingItem, as: 'items' },
          { model: Payment, as: 'payments' },
        ]},
      ],
      order: [['is_group_primary', 'DESC'], ['id', 'ASC']],
    });

    if (!reservations.length) {
      return res.status(404).json({ message: 'No reservations found for this group' });
    }

    const primary = reservations[0];
    const guest = primary.guest;
    const { HOTEL_INFO } = require('../config/constants');

    // Aggregate all billing items across all rooms
    const allInvoiceItems = [];
    const taxBreakup = {};
    let totalSubtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalPaid = 0;

    reservations.forEach(resv => {
      const billing = resv.billing;
      if (!billing) return;

      const roomNum = resv.room ? resv.room.room_number : '?';
      const roomType = resv.room ? resv.room.room_type : '';

      (billing.items || []).forEach(item => {
        const amount = parseFloat(item.amount || 0);
        const gstRate = item.gst_rate || getGstRateByItemType(item.item_type, amount);
        const gstResult = calculateGst(amount, gstRate);

        if (!taxBreakup[gstRate]) {
          taxBreakup[gstRate] = { rate: gstRate, taxable_amount: 0, cgst: 0, sgst: 0, total_tax: 0 };
        }
        taxBreakup[gstRate].taxable_amount += amount;
        taxBreakup[gstRate].cgst += gstResult.cgst;
        taxBreakup[gstRate].sgst += gstResult.sgst;
        taxBreakup[gstRate].total_tax += gstResult.totalGst;

        allInvoiceItems.push({
          description: `Room ${roomNum} — ${item.description}`,
          item_type: item.item_type,
          hsn_code: item.hsn_code || getHsnCode(item.item_type),
          quantity: item.quantity,
          rate: amount / (item.quantity || 1),
          amount,
          gst_rate: gstRate,
          cgst: gstResult.cgst,
          sgst: gstResult.sgst,
          total_gst: gstResult.totalGst,
          total: amount + gstResult.totalGst,
        });
      });

      totalSubtotal += parseFloat(billing.subtotal || 0);
      totalCgst += parseFloat(billing.cgst_amount || 0);
      totalSgst += parseFloat(billing.sgst_amount || 0);
      totalPaid += parseFloat(billing.paid_amount || 0);
    });

    const totalTax = totalCgst + totalSgst;
    const grandTotal = totalSubtotal + totalTax;
    const balanceDue = grandTotal - totalPaid;

    // All payments across all billings
    const allPayments = [];
    reservations.forEach(resv => {
      if (!resv.billing) return;
      (resv.billing.payments || []).forEach(p => {
        allPayments.push({
          amount: parseFloat(p.amount),
          method: p.payment_method,
          reference: p.reference_number,
          date: p.payment_date || p.created_at,
          room: resv.room ? resv.room.room_number : null,
        });
      });
    });

    // Room list for reservation section
    const roomList = reservations.map(r => ({
      room_number: r.room ? r.room.room_number : '?',
      room_type: r.room ? r.room.room_type : '',
      check_in: r.check_in_date,
      check_out: r.check_out_date,
      nights: r.nights,
      rate: parseFloat(r.rate_per_night || 0),
    }));

    const invoice = {
      invoice_number: `GRP-${primary.billing ? primary.billing.invoice_number : groupId}`,
      invoice_date: primary.billing ? primary.billing.created_at : primary.created_at,
      group_id: groupId,
      hotel: {
        legal_name: HOTEL_INFO.LEGAL_NAME,
        trade_name: HOTEL_INFO.TRADE_NAME,
        gstin: HOTEL_INFO.GSTIN,
        pan: HOTEL_INFO.PAN,
        address: HOTEL_INFO.ADDRESS,
        city: HOTEL_INFO.CITY,
        state: HOTEL_INFO.STATE,
        pincode: HOTEL_INFO.PINCODE,
        state_code: HOTEL_INFO.STATE_CODE,
        phone: HOTEL_INFO.PHONE,
        email: HOTEL_INFO.EMAIL,
        website: HOTEL_INFO.WEBSITE,
        bank_name: HOTEL_INFO.BANK_NAME,
        bank_account: HOTEL_INFO.BANK_ACCOUNT,
        bank_ifsc: HOTEL_INFO.BANK_IFSC,
        bank_branch: HOTEL_INFO.BANK_BRANCH,
      },
      guest: guest ? {
        name: `${guest.first_name || ''} ${guest.last_name || ''}`.trim(),
        email: guest.email,
        phone: guest.phone,
        address: guest.address,
        city: guest.city,
        state: guest.state,
        gstin: guest.gstin || null,
        company: guest.company || null,
      } : null,
      reservation: {
        reservation_number: `${primary.reservation_number} (Group: ${reservations.length} rooms)`,
        rooms: roomList,
        check_in: primary.check_in_date,
        check_out: primary.check_out_date,
        nights: primary.nights,
        total_rooms: reservations.length,
      },
      items: allInvoiceItems,
      tax_breakup: Object.values(taxBreakup).sort((a, b) => a.rate - b.rate),
      subtotal: totalSubtotal,
      cgst: totalCgst,
      sgst: totalSgst,
      total_gst: totalTax,
      grand_total: grandTotal,
      amount_in_words: numberToWords(Math.round(grandTotal)),
      paid_amount: totalPaid,
      balance_due: balanceDue,
      payment_status: balanceDue <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
      payments: allPayments,
    };

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

const recordGroupPayment = async (req, res, next) => {
  try {
    const { Reservation, Billing, Payment, Guest } = req.db;
    const { groupId } = req.params;
    const totalAmount = parseFloat(req.body.amount);
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than zero' });
    }

    // Find all billings for this group
    const reservations = await Reservation.findAll({
      where: { group_id: groupId },
      include: [{ model: Billing, as: 'billing' }],
      order: [['is_group_primary', 'DESC'], ['id', 'ASC']],
    });

    const billings = reservations.map(r => r.billing).filter(Boolean);
    if (!billings.length) {
      return res.status(404).json({ message: 'No billings found for this group' });
    }

    // Check total balance across all billings
    const totalBalance = billings.reduce((sum, b) => sum + (parseFloat(b.balance_due) || parseFloat(b.grand_total) || 0), 0);
    if (totalBalance <= 0) {
      return res.status(400).json({ message: 'All bills in this group are already paid' });
    }
    if (totalAmount > totalBalance) {
      return res.status(400).json({ message: `Payment (${totalAmount}) exceeds total group balance (${totalBalance.toFixed(2)})` });
    }

    // Distribute payment proportionally across billings with outstanding balance
    let remaining = totalAmount;
    const results = [];

    for (const billing of billings) {
      if (remaining <= 0) break;
      const balance = parseFloat(billing.balance_due) || (parseFloat(billing.grand_total) - parseFloat(billing.paid_amount || 0));
      if (balance <= 0) continue;

      const payForThis = Math.min(remaining, balance);
      remaining = Math.round((remaining - payForThis) * 100) / 100;

      const payment = await Payment.create({
        billing_id: billing.id,
        amount: payForThis,
        payment_method: req.body.payment_method || 'cash',
        reference_number: req.body.reference_number || null,
        payment_date: req.body.payment_date || new Date(),
        notes: `Group payment (${groupId})`,
      });

      const paidAmount = parseFloat(billing.paid_amount || 0) + payForThis;
      const grandTotal = parseFloat(billing.grand_total) || 0;
      const balanceDue = Math.max(0, grandTotal - paidAmount);
      const paymentStatus = derivePaymentStatus(paidAmount, grandTotal);

      await billing.update({ paid_amount: paidAmount, balance_due: balanceDue, payment_status: paymentStatus });
      results.push({ billing_id: billing.id, paid: payForThis, balance_due: balanceDue, status: paymentStatus });
    }

    // WhatsApp receipt for group (fire-and-forget)
    const primary = reservations[0];
    if (primary?.guest_id) {
      Guest.findByPk(primary.guest_id).then((guest) => {
        if (guest?.phone) {
          waNotifier.notifyPaymentReceipt({
            guestName: `${guest.first_name} ${guest.last_name}`,
            guestPhone: guest.phone,
            invoiceNumber: `Group ${groupId}`,
            amount: totalAmount,
            paymentMethod: req.body.payment_method || 'cash',
            balanceDue: Math.max(0, totalBalance - totalAmount),
          }).catch(() => {});
        }
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      group_id: groupId,
      total_paid: totalAmount,
      total_balance_remaining: Math.max(0, totalBalance - totalAmount),
      billings: results,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /:id/discount - Apply or update OM Discount on a billing
const applyDiscount = async (req, res, next) => {
  try {
    const { Billing, BillingItem } = req.db;
    const billing = await Billing.findByPk(req.params.id);
    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }

    const { discount_type, discount_value, discount_reason } = req.body;
    const discVal = Number(discount_value);
    if (!discVal || discVal <= 0) {
      // Remove discount
      await recalculateBillingTotals(billing, BillingItem, {
        discountAmount: 0,
        discountNotes: null,
      });
      const updated = await Billing.findByPk(billing.id, {
        include: [{ model: BillingItem, as: 'items' }],
      });
      return res.json(updated);
    }

    const allItems = await BillingItem.findAll({ where: { billing_id: billing.id } });
    let itemsTotal = 0;
    for (const item of allItems) { itemsTotal += parseFloat(item.amount) || 0; }

    let discountAmount;
    if (discount_type === 'percent' || discount_type === 'percentage') {
      discountAmount = Math.round(itemsTotal * (discVal / 100) * 100) / 100;
    } else {
      discountAmount = Math.round(discVal * 100) / 100;
    }

    const notes = discount_reason ? `OM Discount: ${discount_reason}` : 'OM Discount';

    await recalculateBillingTotals(billing, BillingItem, {
      items: allItems,
      discountAmount,
      discountNotes: notes,
    });

    const updated = await Billing.findByPk(billing.id, {
      include: [{ model: BillingItem, as: 'items' }],
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  create,
  getById,
  addItem,
  removeItem,
  recordPayment,
  recordGroupPayment,
  getStats,
  generatePdf,
  getGstInvoice,
  getInvoice,
  getGroupInvoice,
  applyDiscount,
};
