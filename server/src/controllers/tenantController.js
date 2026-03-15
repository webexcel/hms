const { getMasterTenant } = require('../config/connectionManager');

exports.listTenants = async (req, res, next) => {
  try {
    const Tenant = getMasterTenant();
    const tenants = await Tenant.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'slug'],
      order: [['name', 'ASC']],
    });
    res.json(tenants);
  } catch (error) {
    next(error);
  }
};
