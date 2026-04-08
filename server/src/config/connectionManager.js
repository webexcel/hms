const { Sequelize, DataTypes } = require('sequelize');
const { defineTenantModels } = require('../models/defineModels');
require('dotenv').config();
const logger = require('../utils/logger');

/**
 * Connection Manager for per-database multi-tenancy.
 *
 * - One master Sequelize instance for the `hotel_master` database (tenants table).
 * - One Sequelize instance per tenant database, cached and lazily created.
 * - Each tenant instance has all 30 models defined and associated via defineTenantModels().
 */

// ─── Internal state ──────────────────────────────────────────────────
let masterSequelize = null;
let MasterTenant = null;
const tenantCache = new Map(); // dbName -> { sequelize, ...models }

// ─── Shared connection options ───────────────────────────────────────
const commonOptions = {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  define: {
    timestamps: true,
    underscored: true,
  },
};

// ─── Master database ─────────────────────────────────────────────────

/**
 * Returns the Sequelize instance connected to the `hotel_master` database.
 * Created once and reused across calls.
 */
function getMasterSequelize() {
  if (!masterSequelize) {
    masterSequelize = new Sequelize(
      'hotel_master',
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '',
      {
        ...commonOptions,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );
  }
  return masterSequelize;
}

/**
 * Returns the Tenant model defined on the master database.
 */
function getMasterTenant() {
  if (!MasterTenant) {
    const seq = getMasterSequelize();
    MasterTenant = seq.define('Tenant', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      db_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'MySQL database name for this tenant',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    }, {
      tableName: 'tenants',
      indexes: [
        { unique: true, fields: ['slug'] },
        { unique: true, fields: ['db_name'] },
      ],
    });
  }
  return MasterTenant;
}

// ─── Tenant databases ────────────────────────────────────────────────

/**
 * Returns a cached object containing a Sequelize instance and all 30 models
 * defined and associated for the given tenant database.
 *
 * @param {string} dbName - The MySQL database name for the tenant.
 * @returns {{ sequelize: Sequelize, User, Room, Guest, Reservation, Billing, BillingItem, Payment, Staff, StaffSchedule, HousekeepingTask, MaintenanceRequest, RestaurantOrder, RestaurantOrderItem, MenuItem, InventoryItem, InventoryTransaction, RatePlan, Package, Promotion, ShiftHandover, HotelSetting, AuditLog, RefreshToken, OtaChannel, ApiKey, ChannelRateMapping, ChannelSyncLog, WebhookEvent, RoomTypeInventory, OtaReconciliation }}
 */
function getTenantModels(dbName) {
  if (tenantCache.has(dbName)) {
    return tenantCache.get(dbName);
  }

  const sequelize = new Sequelize(
    dbName,
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      ...commonOptions,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );

  const models = defineTenantModels(sequelize);
  tenantCache.set(dbName, models);
  return models;
}

// ─── Cleanup ─────────────────────────────────────────────────────────

/**
 * Closes all Sequelize connections (master + every cached tenant).
 * Call during graceful shutdown.
 */
async function closeAllConnections() {
  const promises = [];

  if (masterSequelize) {
    promises.push(masterSequelize.close());
    masterSequelize = null;
    MasterTenant = null;
  }

  for (const [dbName, { sequelize }] of tenantCache) {
    promises.push(sequelize.close());
  }
  tenantCache.clear();

  await Promise.all(promises);
}

module.exports = {
  getMasterSequelize,
  getMasterTenant,
  getTenantModels,
  closeAllConnections,
};
