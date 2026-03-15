const sequelize = require('../config/database');

const Tenant = require('./Tenant');
const User = require('./User');
const Room = require('./Room');
const Guest = require('./Guest');
const Reservation = require('./Reservation');
const Billing = require('./Billing');
const BillingItem = require('./BillingItem');
const Payment = require('./Payment');
const Staff = require('./Staff');
const StaffSchedule = require('./StaffSchedule');
const HousekeepingTask = require('./HousekeepingTask');
const MaintenanceRequest = require('./MaintenanceRequest');
const RestaurantOrder = require('./RestaurantOrder');
const RestaurantOrderItem = require('./RestaurantOrderItem');
const MenuItem = require('./MenuItem');
const InventoryItem = require('./InventoryItem');
const InventoryTransaction = require('./InventoryTransaction');
const RatePlan = require('./RatePlan');
const Package = require('./Package');
const Promotion = require('./Promotion');
const ShiftHandover = require('./ShiftHandover');
const HotelSetting = require('./HotelSetting');
const AuditLog = require('./AuditLog');
const RefreshToken = require('./RefreshToken');

// OTA Integration Models
const OtaChannel = require('./OtaChannel');
const ApiKey = require('./ApiKey');
const ChannelRateMapping = require('./ChannelRateMapping');
const ChannelSyncLog = require('./ChannelSyncLog');
const WebhookEvent = require('./WebhookEvent');
const RoomTypeInventory = require('./RoomTypeInventory');
const OtaReconciliation = require('./OtaReconciliation');

// Tenant scoping
const { applyTenantScope } = require('../utils/tenantScope');
const tenantModels = [User, Room, Guest, Reservation, Billing, BillingItem, Payment, Staff, StaffSchedule, HousekeepingTask, MaintenanceRequest, RestaurantOrder, RestaurantOrderItem, MenuItem, InventoryItem, InventoryTransaction, RatePlan, Package, Promotion, ShiftHandover, HotelSetting, AuditLog, RefreshToken, OtaChannel, ApiKey, ChannelRateMapping, ChannelSyncLog, WebhookEvent, RoomTypeInventory, OtaReconciliation];
tenantModels.forEach(Model => {
  Tenant.hasMany(Model, { foreignKey: 'tenant_id' });
  Model.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
  applyTenantScope(Model);
});

// Associations

// Guest <-> Reservation
Guest.hasMany(Reservation, { foreignKey: 'guest_id', as: 'reservations' });
Reservation.belongsTo(Guest, { foreignKey: 'guest_id', as: 'guest' });

// Room <-> Reservation
Room.hasMany(Reservation, { foreignKey: 'room_id', as: 'reservations' });
Reservation.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

// Reservation <-> Billing
Reservation.hasOne(Billing, { foreignKey: 'reservation_id', as: 'billing' });
Billing.belongsTo(Reservation, { foreignKey: 'reservation_id', as: 'reservation' });

// Guest <-> Billing
Guest.hasMany(Billing, { foreignKey: 'guest_id', as: 'billings' });
Billing.belongsTo(Guest, { foreignKey: 'guest_id', as: 'guest' });

// Billing <-> BillingItem
Billing.hasMany(BillingItem, { foreignKey: 'billing_id', as: 'items' });
BillingItem.belongsTo(Billing, { foreignKey: 'billing_id', as: 'billing' });

// Billing <-> Payment
Billing.hasMany(Payment, { foreignKey: 'billing_id', as: 'payments' });
Payment.belongsTo(Billing, { foreignKey: 'billing_id', as: 'billing' });

// User <-> Staff
User.hasOne(Staff, { foreignKey: 'user_id', as: 'staffProfile' });
Staff.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Staff <-> StaffSchedule
Staff.hasMany(StaffSchedule, { foreignKey: 'staff_id', as: 'schedules' });
StaffSchedule.belongsTo(Staff, { foreignKey: 'staff_id', as: 'staff' });

// Room <-> HousekeepingTask
Room.hasMany(HousekeepingTask, { foreignKey: 'room_id', as: 'housekeepingTasks' });
HousekeepingTask.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

// Staff <-> HousekeepingTask
Staff.hasMany(HousekeepingTask, { foreignKey: 'assigned_to', as: 'housekeepingTasks' });
HousekeepingTask.belongsTo(Staff, { foreignKey: 'assigned_to', as: 'assignedStaff' });

// Room <-> MaintenanceRequest
Room.hasMany(MaintenanceRequest, { foreignKey: 'room_id', as: 'maintenanceRequests' });
MaintenanceRequest.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

// RestaurantOrder <-> RestaurantOrderItem
RestaurantOrder.hasMany(RestaurantOrderItem, { foreignKey: 'order_id', as: 'items' });
RestaurantOrderItem.belongsTo(RestaurantOrder, { foreignKey: 'order_id', as: 'order' });

// Room <-> RestaurantOrder
Room.hasMany(RestaurantOrder, { foreignKey: 'room_id', as: 'restaurantOrders' });
RestaurantOrder.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

// InventoryItem <-> InventoryTransaction
InventoryItem.hasMany(InventoryTransaction, { foreignKey: 'item_id', as: 'transactions' });
InventoryTransaction.belongsTo(InventoryItem, { foreignKey: 'item_id', as: 'item' });

// User <-> ShiftHandover
User.hasMany(ShiftHandover, { foreignKey: 'outgoing_user_id', as: 'outgoingHandovers' });
User.hasMany(ShiftHandover, { foreignKey: 'incoming_user_id', as: 'incomingHandovers' });
ShiftHandover.belongsTo(User, { foreignKey: 'outgoing_user_id', as: 'outgoingUser' });
ShiftHandover.belongsTo(User, { foreignKey: 'incoming_user_id', as: 'incomingUser' });

// User <-> RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> AuditLog
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Reservation created_by
Reservation.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// RestaurantOrderItem <-> MenuItem (B5 fix)
RestaurantOrderItem.belongsTo(MenuItem, { foreignKey: 'menu_item_id', as: 'menuItem', onDelete: 'SET NULL' });
MenuItem.hasMany(RestaurantOrderItem, { foreignKey: 'menu_item_id', as: 'orderItems' });

// RestaurantOrder <-> Guest
RestaurantOrder.belongsTo(Guest, { foreignKey: 'guest_id', as: 'guest' });
Guest.hasMany(RestaurantOrder, { foreignKey: 'guest_id', as: 'restaurantOrders' });

// RestaurantOrder <-> User (created_by)
RestaurantOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Payment <-> User (received_by)
Payment.belongsTo(User, { foreignKey: 'received_by', as: 'receivedBy' });

// MaintenanceRequest <-> User (reported_by, assigned_to)
MaintenanceRequest.belongsTo(User, { foreignKey: 'reported_by', as: 'reportedBy' });
MaintenanceRequest.belongsTo(Staff, { foreignKey: 'assigned_to', as: 'assignedStaff' });

// InventoryTransaction <-> User (created_by)
InventoryTransaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// === OTA Integration Associations ===

// OtaChannel <-> ApiKey
OtaChannel.hasMany(ApiKey, { foreignKey: 'channel_id', as: 'apiKeys' });
ApiKey.belongsTo(OtaChannel, { foreignKey: 'channel_id', as: 'channel' });

// OtaChannel <-> ChannelRateMapping
OtaChannel.hasMany(ChannelRateMapping, { foreignKey: 'channel_id', as: 'rateMappings' });
ChannelRateMapping.belongsTo(OtaChannel, { foreignKey: 'channel_id', as: 'channel' });

// RatePlan <-> ChannelRateMapping
RatePlan.hasMany(ChannelRateMapping, { foreignKey: 'rate_plan_id', as: 'channelMappings' });
ChannelRateMapping.belongsTo(RatePlan, { foreignKey: 'rate_plan_id', as: 'ratePlan' });

// OtaChannel <-> ChannelSyncLog
OtaChannel.hasMany(ChannelSyncLog, { foreignKey: 'channel_id', as: 'syncLogs' });
ChannelSyncLog.belongsTo(OtaChannel, { foreignKey: 'channel_id', as: 'channel' });

// OtaChannel <-> WebhookEvent
OtaChannel.hasMany(WebhookEvent, { foreignKey: 'channel_id', as: 'webhookEvents' });
WebhookEvent.belongsTo(OtaChannel, { foreignKey: 'channel_id', as: 'channel' });

// Reservation <-> OtaChannel
OtaChannel.hasMany(Reservation, { foreignKey: 'channel_id', as: 'reservations' });
Reservation.belongsTo(OtaChannel, { foreignKey: 'channel_id', as: 'otaChannel' });

// WebhookEvent <-> Reservation
WebhookEvent.belongsTo(Reservation, { foreignKey: 'reservation_id', as: 'reservation' });

// OtaChannel <-> OtaReconciliation
OtaChannel.hasMany(OtaReconciliation, { foreignKey: 'channel_id', as: 'reconciliations' });
OtaReconciliation.belongsTo(OtaChannel, { foreignKey: 'channel_id', as: 'channel' });

// OtaReconciliation <-> User (generated_by)
OtaReconciliation.belongsTo(User, { foreignKey: 'generated_by', as: 'generatedBy' });

// AuditLog <-> OtaChannel
AuditLog.belongsTo(OtaChannel, { foreignKey: 'channel_id', as: 'otaChannel' });

module.exports = {
  sequelize,
  Tenant,
  User,
  Room,
  Guest,
  Reservation,
  Billing,
  BillingItem,
  Payment,
  Staff,
  StaffSchedule,
  HousekeepingTask,
  MaintenanceRequest,
  RestaurantOrder,
  RestaurantOrderItem,
  MenuItem,
  InventoryItem,
  InventoryTransaction,
  RatePlan,
  Package,
  Promotion,
  ShiftHandover,
  HotelSetting,
  AuditLog,
  RefreshToken,
  OtaChannel,
  ApiKey,
  ChannelRateMapping,
  ChannelSyncLog,
  WebhookEvent,
  RoomTypeInventory,
  OtaReconciliation,
};
