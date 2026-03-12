const { Op } = require('sequelize');
const { RatePlan, Package, Promotion } = require('../models');
const { getPagination, getPagingData } = require('../utils/pagination');
const { handleRateChange } = require('../services/rateSync');

// Rate Plans
const listRatePlans = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { offset, limit: size } = getPagination(page, limit);

    const data = await RatePlan.findAndCountAll({
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

const createRatePlan = async (req, res, next) => {
  try {
    const ratePlan = await RatePlan.create(req.body);
    // Trigger rate sync if OTA-visible
    handleRateChange(ratePlan.id).catch(() => {});
    res.status(201).json(ratePlan);
  } catch (error) {
    next(error);
  }
};

const updateRatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ratePlan = await RatePlan.findByPk(id);

    if (!ratePlan) {
      return res.status(404).json({ message: 'Rate plan not found' });
    }

    await ratePlan.update(req.body);
    // Trigger rate sync if OTA-visible
    handleRateChange(ratePlan.id).catch(() => {});
    res.json(ratePlan);
  } catch (error) {
    next(error);
  }
};

// Packages
const listPackages = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { offset, limit: size } = getPagination(page, limit);

    const data = await Package.findAndCountAll({
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

const createPackage = async (req, res, next) => {
  try {
    const pkg = await Package.create(req.body);
    res.status(201).json(pkg);
  } catch (error) {
    next(error);
  }
};

const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pkg = await Package.findByPk(id);

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    await pkg.update(req.body);
    res.json(pkg);
  } catch (error) {
    next(error);
  }
};

// Promotions
const listPromotions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { offset, limit: size } = getPagination(page, limit);

    const data = await Promotion.findAndCountAll({
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

const createPromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.create(req.body);
    res.status(201).json(promotion);
  } catch (error) {
    next(error);
  }
};

const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findByPk(id);

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    await promotion.update(req.body);
    res.json(promotion);
  } catch (error) {
    next(error);
  }
};

// GET /rates/applicable - Get applicable rate for room type and date
const getApplicableRate = async (req, res, next) => {
  try {
    const { room_type, check_in_date } = req.query;

    if (!room_type) {
      return res.status(400).json({ message: 'room_type is required' });
    }

    const checkDate = check_in_date || new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date(checkDate).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Find active rate plan for this room type, valid on the given date
    const ratePlan = await RatePlan.findOne({
      where: {
        room_type,
        is_active: true,
        [Op.or]: [
          { valid_from: null, valid_to: null },
          {
            valid_from: { [Op.lte]: checkDate },
            valid_to: { [Op.gte]: checkDate },
          },
          { valid_from: { [Op.lte]: checkDate }, valid_to: null },
          { valid_from: null, valid_to: { [Op.gte]: checkDate } },
        ],
      },
      order: [
        ['season', 'ASC'], // prefer specific season over regular
        ['created_at', 'DESC'],
      ],
    });

    if (!ratePlan) {
      return res.json({ rate: null, message: 'No rate plan found for this room type' });
    }

    const rate = isWeekend && ratePlan.weekend_rate
      ? parseFloat(ratePlan.weekend_rate)
      : parseFloat(ratePlan.base_rate);

    res.json({
      rate,
      rate_plan: ratePlan.name,
      season: ratePlan.season,
      meal_plan: ratePlan.meal_plan,
      is_weekend: isWeekend,
    });
  } catch (error) {
    next(error);
  }
};

// POST /rates/promotions/validate - Validate a promo code
const validatePromoCode = async (req, res, next) => {
  try {
    const { code, nights, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ valid: false, message: 'Promo code is required' });
    }

    const promotion = await Promotion.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!promotion) {
      return res.status(404).json({ valid: false, message: 'Invalid promo code' });
    }

    if (!promotion.is_active) {
      return res.json({ valid: false, message: 'This promo code is no longer active' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (promotion.valid_from && today < promotion.valid_from) {
      return res.json({ valid: false, message: 'This promo code is not yet valid' });
    }
    if (promotion.valid_to && today > promotion.valid_to) {
      return res.json({ valid: false, message: 'This promo code has expired' });
    }

    if (promotion.usage_limit && promotion.times_used >= promotion.usage_limit) {
      return res.json({ valid: false, message: 'This promo code has reached its usage limit' });
    }

    if (promotion.min_stay && nights && nights < promotion.min_stay) {
      return res.json({
        valid: false,
        message: `Minimum stay of ${promotion.min_stay} night(s) required for this code`,
      });
    }

    let discount = 0;
    if (subtotal) {
      if (promotion.discount_type === 'percentage') {
        discount = (parseFloat(subtotal) * parseFloat(promotion.discount_value)) / 100;
      } else {
        discount = parseFloat(promotion.discount_value);
      }
      discount = Math.min(discount, parseFloat(subtotal)); // cap at subtotal
    }

    res.json({
      valid: true,
      promotion: {
        code: promotion.code,
        name: promotion.name,
        discount_type: promotion.discount_type,
        discount_value: parseFloat(promotion.discount_value),
      },
      discount: parseFloat(discount.toFixed(2)),
    });
  } catch (error) {
    next(error);
  }
};

// PUT /rates/promotions/:id/apply - Increment usage count
const applyPromoCode = async (req, res, next) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id);

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    await promotion.update({ times_used: (promotion.times_used || 0) + 1 });
    res.json(promotion);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRatePlans,
  createRatePlan,
  updateRatePlan,
  listPackages,
  createPackage,
  updatePackage,
  listPromotions,
  createPromotion,
  updatePromotion,
  getApplicableRate,
  validatePromoCode,
  applyPromoCode,
};
