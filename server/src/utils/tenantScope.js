const clsNamespace = require('../config/cls');

function applyTenantScope(Model) {
  // Auto-set tenant_id on create
  Model.addHook('beforeCreate', 'tenantCreate', (instance) => {
    if (!instance.tenant_id) {
      const tenantId = clsNamespace.get('tenantId');
      if (tenantId) instance.tenant_id = tenantId;
    }
  });

  Model.addHook('beforeBulkCreate', 'tenantBulkCreate', (instances) => {
    const tenantId = clsNamespace.get('tenantId');
    if (tenantId) {
      instances.forEach(i => { if (!i.tenant_id) i.tenant_id = tenantId; });
    }
  });

  // Auto-filter on find queries
  Model.addHook('beforeFind', 'tenantFind', (options) => {
    const tenantId = clsNamespace.get('tenantId');
    if (tenantId && !options._bypassTenant) {
      if (!options.where) options.where = {};
      options.where.tenant_id = tenantId;
    }
  });

  Model.addHook('beforeCount', 'tenantCount', (options) => {
    const tenantId = clsNamespace.get('tenantId');
    if (tenantId && !options._bypassTenant) {
      if (!options.where) options.where = {};
      options.where.tenant_id = tenantId;
    }
  });

  // Auto-filter on bulk update/destroy
  Model.addHook('beforeBulkUpdate', 'tenantBulkUpdate', (options) => {
    const tenantId = clsNamespace.get('tenantId');
    if (tenantId) {
      if (!options.where) options.where = {};
      options.where.tenant_id = tenantId;
    }
  });

  Model.addHook('beforeBulkDestroy', 'tenantBulkDestroy', (options) => {
    const tenantId = clsNamespace.get('tenantId');
    if (tenantId) {
      if (!options.where) options.where = {};
      options.where.tenant_id = tenantId;
    }
  });
}

module.exports = { applyTenantScope };
