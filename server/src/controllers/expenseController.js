const { Op } = require('sequelize');
const dayjs = require('dayjs');

// GET /format-b — Today's Format B report (auto-fetched)
const getFormatB = async (req, res, next) => {
  try {
    const { ExpenseReport, ExpenseEntry, ShiftHandover } = req.db;
    const { date } = req.query;
    const reportDate = date || dayjs().format('YYYY-MM-DD');

    // Check if Format B already saved for this date
    const fbSaved = await ExpenseReport.findOne({
      where: {
        report_date: reportDate,
        report_number: { [Op.regexp]: '^FB-[0-9]+$' },
      },
      attributes: ['report_number'],
      raw: true,
    });

    // Check if Shift 1 Format A was saved for this date
    const fa = await ShiftHandover.findOne({
      where: {
        shift_date: reportDate,
        shift: 'shift_2',
        report_number: { [Op.regexp]: '^FA-[0-9]+$' },
      },
      attributes: ['report_number'],
      raw: true,
    });
    const shiftSavedToday = !!fa;

    // Find last saved expense report — use its timestamp as start time
    const lastReport = await ExpenseReport.findOne({
      order: [['created_at', 'DESC']],
      raw: true,
    });
    const previousClosingBalance = lastReport ? parseFloat(lastReport.closing_balance) || 0 : 0;
    const lastReportTime = lastReport?.created_at || lastReport?.createdAt;

    const todayStart = dayjs(reportDate).startOf('day').toDate();
    const dayEnd = dayjs(reportDate).endOf('day').toDate();
    let dayStart = todayStart;
    if (lastReport && lastReportTime) {
      const t = new Date(lastReportTime);
      if (dayjs(t).format('YYYY-MM-DD') === reportDate) dayStart = t;
    }

    // Get cash from FO from hr_handovers table (real-time, not waiting for Format A close)
    const { HrHandover, GpayTransfer } = req.db;
    const hrHandovers = await HrHandover.findAll({
      where: {
        shift_date: reportDate,
        created_at: { [Op.between]: [dayStart, dayEnd] },
      },
      raw: true,
    });
    const cashFromFo = Math.round(hrHandovers.reduce((s, h) => s + (parseFloat(h.amount) || 0), 0) * 100) / 100;

    // GPay transfers since last report
    const gpayTransfers = await GpayTransfer.findAll({
      where: {
        transfer_date: reportDate,
        created_at: { [Op.between]: [dayStart, dayEnd] },
      },
      order: [['created_at', 'ASC']],
      raw: true,
    });
    const totalGpay = Math.round(gpayTransfers.reduce((s, g) => s + (parseFloat(g.amount) || 0), 0) * 100) / 100;

    // Bank withdrawals since last report
    const { BankWithdrawal } = req.db;
    const bankWithdrawals = await BankWithdrawal.findAll({
      where: {
        withdrawal_date: reportDate,
        created_at: { [Op.between]: [dayStart, dayEnd] },
      },
      order: [['created_at', 'ASC']],
      raw: true,
    });
    const totalBank = Math.round(bankWithdrawals.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0) * 100) / 100;

    // Get expenses for today since last report
    const expenses = await ExpenseEntry.findAll({
      where: {
        expense_date: reportDate,
        created_at: { [Op.between]: [dayStart, dayEnd] },
      },
      order: [['created_at', 'ASC']],
      raw: true,
    });
    const totalExpenses = Math.round(expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0) * 100) / 100;

    res.json({
      report_date: reportDate,
      previous_closing_balance: previousClosingBalance,
      cash_from_fo: cashFromFo,
      gpay_transfers: gpayTransfers,
      total_gpay: totalGpay,
      bank_withdrawals: bankWithdrawals,
      total_bank: totalBank,
      expenses,
      total_expenses: totalExpenses,
      last_report_number: lastReport?.report_number || null,
      shift_saved_today: shiftSavedToday,
      fb_saved_today: fbSaved?.report_number || null,
    });
  } catch (error) {
    next(error);
  }
};

// POST /format-b/save — Save Format B report
const saveFormatB = async (req, res, next) => {
  try {
    const { ExpenseReport, ShiftHandover } = req.db;
    const { report_date, opening_balance, cash_from_fo, cash_from_bank, cash_from_gpay, total_expenses, closing_balance, notes } = req.body;

    const reportDt = report_date || dayjs().format('YYYY-MM-DD');

    // Check if Format B already exists for this date
    const existing = await ExpenseReport.findOne({
      where: {
        report_date: reportDt,
        report_number: { [Op.regexp]: '^FB-[0-9]+$' },
      },
    });
    if (existing) {
      return res.status(400).json({ message: `${existing.report_number} already exists for ${reportDt}. Cannot create duplicate.` });
    }

    // Require Shift 1 (Format A) to be closed for this date
    const shift1Saved = await ShiftHandover.findOne({
      where: {
        shift_date: reportDt,
        shift: 'shift_2',
        report_number: { [Op.regexp]: '^FA-[0-9]+$' },
      },
    });
    if (!shift1Saved) {
      return res.status(400).json({ message: `Cannot close HR report for ${reportDt} — Shift 2 Format A must be closed first.` });
    }

    const lastReport = await ExpenseReport.findOne({
      where: { report_number: { [Op.regexp]: '^FB-[0-9]+$' } },
      order: [['report_number', 'DESC']],
      attributes: ['report_number'],
      raw: true,
    });
    let nextNum = 1;
    if (lastReport?.report_number) {
      const match = lastReport.report_number.match(/^FB-(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const reportNumber = `FB-${String(nextNum).padStart(4, '0')}`;

    const totalIn = (parseFloat(opening_balance) || 0) + (parseFloat(cash_from_fo) || 0) + (parseFloat(cash_from_bank) || 0) + (parseFloat(cash_from_gpay) || 0);
    const closing = totalIn - (parseFloat(total_expenses) || 0);

    const record = await ExpenseReport.create({
      report_number: reportNumber,
      report_date: report_date || dayjs().format('YYYY-MM-DD'),
      opening_balance: parseFloat(opening_balance) || 0,
      cash_from_fo: parseFloat(cash_from_fo) || 0,
      cash_from_bank: parseFloat(cash_from_bank) || 0,
      cash_from_gpay: parseFloat(cash_from_gpay) || 0,
      total_in: Math.round(totalIn * 100) / 100,
      total_expenses: parseFloat(total_expenses) || 0,
      closing_balance: Math.round(closing * 100) / 100,
      notes: notes || null,
      status: 'submitted',
      created_by: req.user?.id || null,
    });

    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

// GET /list — List saved expense reports
const listReports = async (req, res, next) => {
  try {
    const { ExpenseReport } = req.db;
    const records = await ExpenseReport.findAll({
      order: [['created_at', 'DESC']],
      limit: 30,
      raw: true,
    });
    res.json(records);
  } catch (error) {
    next(error);
  }
};

// POST /entry — Create an expense entry
const createExpense = async (req, res, next) => {
  try {
    const { ExpenseEntry } = req.db;
    const { category, description, amount, paid_to, bill_reference, expense_date } = req.body;

    if (!category || !description || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Category, description, and amount are required' });
    }

    const record = await ExpenseEntry.create({
      expense_date: expense_date || dayjs().format('YYYY-MM-DD'),
      category,
      description,
      amount: parseFloat(amount),
      paid_to: paid_to || null,
      bill_reference: bill_reference || null,
      created_by: req.user?.id || null,
    });

    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

// DELETE /entry/:id
const deleteExpense = async (req, res, next) => {
  try {
    const { ExpenseEntry } = req.db;
    const record = await ExpenseEntry.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Expense not found' });
    if (record.expense_report_id) return res.status(400).json({ message: 'Cannot delete expense already in a saved report' });
    await record.destroy();
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    next(error);
  }
};

// POST /gpay — Add a GPay transfer entry
const createGpayTransfer = async (req, res, next) => {
  try {
    const { GpayTransfer } = req.db;
    const { amount, notes, transfer_date } = req.body;
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ message: 'Amount required' });
    const record = await GpayTransfer.create({
      amount: parseFloat(amount),
      notes: notes || null,
      transfer_date: transfer_date || dayjs().format('YYYY-MM-DD'),
      created_by: req.user?.id || null,
    });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

// DELETE /gpay/:id
const deleteGpayTransfer = async (req, res, next) => {
  try {
    const { GpayTransfer } = req.db;
    const record = await GpayTransfer.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Not found' });
    await record.destroy();
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};

// POST /bank — Add a Bank withdrawal entry
const createBankWithdrawal = async (req, res, next) => {
  try {
    const { BankWithdrawal } = req.db;
    const { amount, notes, withdrawal_date } = req.body;
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ message: 'Amount required' });
    const record = await BankWithdrawal.create({
      amount: parseFloat(amount),
      notes: notes || null,
      withdrawal_date: withdrawal_date || dayjs().format('YYYY-MM-DD'),
      created_by: req.user?.id || null,
    });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

// DELETE /bank/:id
const deleteBankWithdrawal = async (req, res, next) => {
  try {
    const { BankWithdrawal } = req.db;
    const record = await BankWithdrawal.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Not found' });
    await record.destroy();
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /hr-cash-ledger — HR cash ledger with running balance
const getHrCashLedger = async (req, res, next) => {
  try {
    const { ExpenseEntry, ExpenseReport, HrHandover, GpayTransfer } = req.db;
    const { from, to } = req.query;
    const fromDate = from ? dayjs(from).startOf('day').toDate() : dayjs().subtract(7, 'day').startOf('day').toDate();
    const toDate = to ? dayjs(to).endOf('day').toDate() : dayjs().endOf('day').toDate();

    const entries = [];

    // 1. Cash from Front Office (HR handovers)
    const hrIn = await HrHandover.findAll({
      where: { created_at: { [Op.between]: [fromDate, toDate] } },
      raw: true,
    });
    for (const h of hrIn) {
      entries.push({
        time: h.created_at || h.createdAt,
        type: 'IN',
        category: 'Cash from FO',
        mode: 'cash',
        reference: `HR-${h.id}`,
        amount: parseFloat(h.amount) || 0,
      });
    }

    // 2. GPay transfers (money in for HR)
    const gpay = await GpayTransfer.findAll({
      where: { created_at: { [Op.between]: [fromDate, toDate] } },
      raw: true,
    });
    for (const g of gpay) {
      entries.push({
        time: g.created_at || g.createdAt,
        type: 'IN',
        category: 'GPay Received',
        mode: 'gpay',
        reference: `GP-${g.id}`,
        amount: parseFloat(g.amount) || 0,
      });
    }

    // 3. Cash from Bank (from bank_withdrawals table)
    const { BankWithdrawal } = req.db;
    const bankWithdrawals = await BankWithdrawal.findAll({
      where: { created_at: { [Op.between]: [fromDate, toDate] } },
      raw: true,
    });
    for (const b of bankWithdrawals) {
      entries.push({
        time: b.created_at || b.createdAt,
        type: 'IN',
        category: 'Cash from Bank',
        mode: 'bank',
        reference: `BW-${b.id}`,
        amount: parseFloat(b.amount) || 0,
      });
    }

    // 4. Expense entries (money out)
    const expenses = await ExpenseEntry.findAll({
      where: { created_at: { [Op.between]: [fromDate, toDate] } },
      raw: true,
    });
    for (const e of expenses) {
      entries.push({
        time: e.created_at || e.createdAt,
        type: 'OUT',
        category: e.category || 'Expense',
        mode: 'cash',
        reference: e.bill_reference || `EXP-${e.id}`,
        amount: parseFloat(e.amount) || 0,
      });
    }

    // Sort and compute running balance
    entries.sort((a, b) => new Date(a.time) - new Date(b.time));

    const totalIn = Math.round(entries.filter(e => e.type === 'IN').reduce((s, e) => s + e.amount, 0) * 100) / 100;
    const totalOut = Math.round(entries.filter(e => e.type === 'OUT').reduce((s, e) => s + e.amount, 0) * 100) / 100;

    // Opening balance — closing of the most recent FB report on or before day before from
    const dayBeforeFrom = dayjs(fromDate).subtract(1, 'day').format('YYYY-MM-DD');
    const prevReport = await ExpenseReport.findOne({
      where: {
        report_number: { [Op.ne]: null },
        report_date: { [Op.lte]: dayBeforeFrom },
      },
      order: [['report_date', 'DESC'], ['created_at', 'DESC']],
      raw: true,
    });
    const openingBalance = prevReport ? parseFloat(prevReport.closing_balance) || 0 : 0;
    const closingBalance = Math.round((openingBalance + totalIn - totalOut) * 100) / 100;

    let runningBalance = openingBalance;
    for (const e of entries) {
      if (e.type === 'IN') runningBalance += e.amount;
      else runningBalance -= e.amount;
      e.running_balance = Math.round(runningBalance * 100) / 100;
      e.amount = Math.round(e.amount * 100) / 100;
    }

    res.json({
      from: dayjs(fromDate).format('YYYY-MM-DD'),
      to: dayjs(toDate).format('YYYY-MM-DD'),
      entries,
      summary: {
        opening_balance: openingBalance,
        total_in: totalIn,
        total_out: totalOut,
        closing_balance: closingBalance,
        count: entries.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFormatB,
  saveFormatB,
  listReports,
  createExpense,
  deleteExpense,
  createGpayTransfer,
  deleteGpayTransfer,
  createBankWithdrawal,
  deleteBankWithdrawal,
  getHrCashLedger,
};
