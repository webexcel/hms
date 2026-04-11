const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * Factory function that defines all 30 tenant models on a given Sequelize instance
 * and sets up all associations. No tenant_id fields are included since each tenant
 * gets its own database in the per-database multi-tenancy approach.
 */
function defineTenantModels(sequelize) {

  // ─── User ───────────────────────────────────────────────────────────
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: { isEmail: true },
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'front_desk', 'housekeeping', 'restaurant', 'staff'),
      allowNull: false,
      defaultValue: 'staff',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      },
    },
  });

  User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password_hash);
  };

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  };

  // ─── Room ───────────────────────────────────────────────────────────
  const Room = sequelize.define('Room', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    room_number: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    room_type: {
      type: DataTypes.ENUM('standard', 'executive', 'comfort', 'comfort_executive', 'suite'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('available', 'occupied', 'reserved', 'maintenance', 'cleaning'),
      defaultValue: 'available',
    },
    cleanliness_status: {
      type: DataTypes.ENUM('clean', 'dirty', 'in_progress', 'inspected', 'awaiting_verification', 'out_of_order'),
      defaultValue: 'clean',
    },
    base_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    single_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    single_misc: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Misc charge for single occupancy (no GST)',
    },
    double_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    double_misc: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Misc charge for double occupancy (no GST)',
    },
    triple_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    triple_misc: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Misc charge for triple occupancy (no GST)',
    },
    max_occupancy: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
    },
    amenities: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    hourly_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Legacy single hourly rate (deprecated, use hourly_rates JSON)',
    },
    hourly_rates: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Tiered hourly rates e.g. {"1":500,"2":800,"3":1000,"default":400}',
    },
    extra_bed_charge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Charge per extra bed per night',
    },
    max_extra_beds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: 'Max extra beds allowed in this room',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'rooms',
    indexes: [
      { unique: true, fields: ['room_number'] },
    ],
  });

  // ─── Guest ──────────────────────────────────────────────────────────
  const Guest = sequelize.define('Guest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    id_proof_type: {
      type: DataTypes.ENUM('aadhaar', 'passport', 'driving_license', 'voter_id', 'pan'),
      allowNull: true,
    },
    id_proof_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gstin: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    company_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    vip_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    total_stays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'guests',
  });

  // ─── Reservation ───────────────────────────────────────────────────
  const Reservation = sequelize.define('Reservation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    reservation_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    guest_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    check_in_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    check_out_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    actual_check_in: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actual_check_out: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('enquiry', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'),
      defaultValue: 'pending',
    },
    adults: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    children: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    nights: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING(30),
      defaultValue: 'direct',
    },
    rate_per_night: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    advance_paid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    special_requests: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ota_booking_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Booking reference from OTA',
    },
    channel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'FK to OtaChannel - null means direct booking',
    },
    ota_commission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Commission amount for this booking',
    },
    cancellation_policy: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'e.g. non_refundable, free_cancellation',
    },
    booking_type: {
      type: DataTypes.ENUM('nightly', 'hourly'),
      defaultValue: 'nightly',
      comment: 'nightly = standard stay, hourly = short stay (2-8 hours)',
    },
    expected_hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Booked duration in hours for hourly bookings',
    },
    hourly_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Rate per hour for hourly bookings',
    },
    expected_checkout_time: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Computed: actual_check_in + expected_hours (for hourly bookings)',
    },
    extra_beds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of extra beds requested',
    },
    extra_bed_charge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Extra bed charge per night at time of booking',
    },
    meal_plan: {
      type: DataTypes.ENUM('none', 'breakfast', 'dinner', 'both'),
      defaultValue: 'none',
      comment: 'Complimentary meal plan: none, breakfast, dinner, or both',
    },
    group_id: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null,
      comment: 'Links multiple reservations in a group booking',
    },
    is_group_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'True for the lead room in a group booking',
    },
    discount_type: {
      type: DataTypes.ENUM('percentage', 'amount'),
      allowNull: true,
      defaultValue: null,
      comment: 'OM discount type applied at booking time',
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'OM discount value',
    },
    discount_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
      comment: 'Reason for OM discount',
    },
  }, {
    tableName: 'reservations',
    indexes: [
      { unique: true, fields: ['reservation_number'] },
    ],
  });

  // ─── Billing ────────────────────────────────────────────────────────
  const Billing = sequelize.define('Billing', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoice_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    reservation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    guest_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    cgst_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    sgst_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    igst_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    grand_total: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    payment_status: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'refunded'),
      defaultValue: 'unpaid',
    },
    paid_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    balance_due: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gst_bill_number: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'billings',
    indexes: [
      { unique: true, fields: ['invoice_number'] },
    ],
  });

  // ─── BillingItem ────────────────────────────────────────────────────
  const BillingItem = sequelize.define('BillingItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    billing_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    item_type: {
      type: DataTypes.ENUM('room_charge', 'restaurant', 'laundry', 'minibar', 'service', 'tax', 'discount'),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 1,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    hsn_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    gst_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'billing_items',
  });

  // ─── Payment ────────────────────────────────────────────────────────
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    billing_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    payment_type: {
      type: DataTypes.ENUM('payment', 'refund'),
      defaultValue: 'payment',
      comment: 'payment = money in, refund = money out',
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'card', 'upi', 'bank_transfer', 'ota_collected'),
      allowNull: false,
    },
    transaction_ref: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    payment_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    received_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ota_transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    settlement_status: {
      type: DataTypes.ENUM('na', 'pending', 'settled', 'disputed'),
      defaultValue: 'na',
    },
    settlement_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    shift_handover_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'payments',
  });

  // ─── Staff ──────────────────────────────────────────────────────────
  const Staff = sequelize.define('Staff', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    employee_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    department: {
      type: DataTypes.ENUM('front_office', 'housekeeping', 'restaurant', 'maintenance', 'management', 'security', 'accounts'),
      allowNull: false,
    },
    designation: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    date_of_joining: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    shift: {
      type: DataTypes.ENUM('morning', 'afternoon', 'night', 'shift_1', 'shift_2'),
      defaultValue: 'morning',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'on_leave'),
      defaultValue: 'active',
    },
  }, {
    tableName: 'staff',
    indexes: [
      { unique: true, fields: ['employee_id'] },
    ],
  });

  // ─── StaffSchedule ─────────────────────────────────────────────────
  const StaffSchedule = sequelize.define('StaffSchedule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    shift: {
      type: DataTypes.ENUM('morning', 'afternoon', 'night', 'shift_1', 'shift_2'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'present', 'absent', 'leave'),
      defaultValue: 'scheduled',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'staff_schedules',
  });

  // ─── HousekeepingTask ──────────────────────────────────────────────
  const HousekeepingTask = sequelize.define('HousekeepingTask', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    task_type: {
      type: DataTypes.ENUM('cleaning', 'deep_cleaning', 'turnover', 'inspection', 'amenity_restock'),
      defaultValue: 'cleaning',
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'verified'),
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'housekeeping_tasks',
  });

  // ─── MaintenanceRequest ────────────────────────────────────────────
  const MaintenanceRequest = sequelize.define('MaintenanceRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reported_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    issue_type: {
      type: DataTypes.ENUM('plumbing', 'electrical', 'hvac', 'furniture', 'appliance', 'structural', 'other'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('reported', 'assigned', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'reported',
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'maintenance_requests',
  });

  // ─── RestaurantOrder ───────────────────────────────────────────────
  const RestaurantOrder = sequelize.define('RestaurantOrder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    guest_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    order_type: {
      type: DataTypes.ENUM('dine_in', 'room_service', 'takeaway'),
      defaultValue: 'dine_in',
    },
    status: {
      type: DataTypes.ENUM('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    payment_status: {
      type: DataTypes.ENUM('unpaid', 'paid'),
      defaultValue: 'unpaid',
    },
    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    shift_handover_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    posted_to_room: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'restaurant_orders',
    indexes: [
      { unique: true, fields: ['order_number'] },
    ],
  });

  // ─── RestaurantOrderItem ───────────────────────────────────────────
  const RestaurantOrderItem = sequelize.define('RestaurantOrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    menu_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    item_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  }, {
    tableName: 'restaurant_order_items',
  });

  // ─── LaundryOrder ─────────────────────────────────────────────────
  const LaundryOrder = sequelize.define('LaundryOrder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    reservation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    guest_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'collected', 'washing', 'ironing', 'ready', 'delivered', 'cancelled'),
      defaultValue: 'pending',
    },
    service_type: {
      type: DataTypes.ENUM('regular', 'express', 'dry_clean'),
      defaultValue: 'regular',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    posted_to_room: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    collected_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expected_delivery: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'laundry_orders',
    indexes: [
      { unique: true, fields: ['order_number'] },
    ],
  });

  // ─── LaundryOrderItem ───────────────────────────────────────────────
  const LaundryOrderItem = sequelize.define('LaundryOrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    item_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('topwear', 'bottomwear', 'ethnic', 'innerwear', 'accessories', 'other'),
      defaultValue: 'topwear',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  }, {
    tableName: 'laundry_order_items',
  });

  // ─── MenuItem ──────────────────────────────────────────────────────
  const MenuItem = sequelize.define('MenuItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('breakfast', 'lunch', 'salads', 'starters', 'soups', 'chinese', 'gravy', 'indian_breads', 'rice_biryani', 'indian_curries', 'evening_snacks', 'dinner', 'juices_shakes', 'hot_beverages', 'main_course', 'desserts', 'beverages', 'snacks'),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    is_veg: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hsn_code: {
      type: DataTypes.STRING(10),
      defaultValue: '996331',
    },
    gst_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 5.00,
    },
  }, {
    tableName: 'menu_items',
  });

  // ─── InventoryItem ─────────────────────────────────────────────────
  const InventoryItem = sequelize.define('InventoryItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('housekeeping', 'kitchen', 'maintenance', 'office', 'amenities', 'linen', 'other'),
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(20),
      defaultValue: 'pcs',
    },
    current_stock: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    min_stock_level: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    unit_cost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    supplier: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('in_stock', 'low_stock', 'out_of_stock'),
      defaultValue: 'in_stock',
    },
  }, {
    tableName: 'inventory_items',
    indexes: [
      { unique: true, fields: ['sku'] },
    ],
  });

  // ─── InventoryTransaction ──────────────────────────────────────────
  const InventoryTransaction = sequelize.define('InventoryTransaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    transaction_type: {
      type: DataTypes.ENUM('purchase', 'usage', 'adjustment', 'return', 'waste'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'inventory_transactions',
  });

  // ─── RatePlan ──────────────────────────────────────────────────────
  const RatePlan = sequelize.define('RatePlan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    room_type: {
      type: DataTypes.ENUM('standard', 'executive', 'comfort', 'comfort_executive', 'suite'),
      allowNull: false,
    },
    season: {
      type: DataTypes.ENUM('regular', 'peak', 'off_peak', 'festive'),
      defaultValue: 'regular',
    },
    base_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    weekend_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    meal_plan: {
      type: DataTypes.ENUM('ep', 'cp', 'map', 'ap'),
      defaultValue: 'ep',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    valid_from: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    valid_to: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    is_ota_visible: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this rate plan is pushed to OTAs',
    },
    hourly_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Per-hour rate for short-stay bookings',
    },
    min_hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2,
      comment: 'Minimum booking hours for hourly stays',
    },
    max_hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 8,
      comment: 'Maximum hours before nightly booking required',
    },
    cancellation_policy: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  }, {
    tableName: 'rate_plans',
  });

  // ─── Package ───────────────────────────────────────────────────────
  const Package = sequelize.define('Package', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    room_type: {
      type: DataTypes.ENUM('standard', 'executive', 'comfort', 'comfort_executive', 'suite'),
      allowNull: true,
    },
    duration_nights: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    inclusions: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'packages',
  });

  // ─── Promotion ─────────────────────────────────────────────────────
  const Promotion = sequelize.define('Promotion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    discount_type: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    min_stay: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    valid_from: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    valid_to: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    usage_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    times_used: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'promotions',
    indexes: [
      { unique: true, fields: ['code'] },
    ],
  });

  // ─── ShiftHandover ─────────────────────────────────────────────────
  // ─── ExpenseReport (Format B) ──────────────────────────────────────
  const ExpenseReport = sequelize.define('ExpenseReport', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    report_number: { type: DataTypes.STRING(20), allowNull: true, unique: true },
    report_date: { type: DataTypes.DATEONLY, allowNull: false },
    opening_balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    cash_from_fo: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    cash_from_bank: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    cash_from_gpay: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    total_in: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    total_expenses: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    closing_balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'submitted', 'approved'), defaultValue: 'pending' },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'expense_reports',
  });

  // ─── BankWithdrawal ────────────────────────────────────────────────
  const BankWithdrawal = sequelize.define('BankWithdrawal', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    notes: { type: DataTypes.STRING(255), allowNull: true },
    withdrawal_date: { type: DataTypes.DATEONLY, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'bank_withdrawals',
  });

  // ─── GpayTransfer ──────────────────────────────────────────────────
  const GpayTransfer = sequelize.define('GpayTransfer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    notes: { type: DataTypes.STRING(255), allowNull: true },
    transfer_date: { type: DataTypes.DATEONLY, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    shift_handover_id: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'gpay_transfers',
  });

  // ─── ExpenseEntry ──────────────────────────────────────────────────
  const ExpenseEntry = sequelize.define('ExpenseEntry', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    expense_report_id: { type: DataTypes.INTEGER, allowNull: true },
    expense_date: { type: DataTypes.DATEONLY, allowNull: false },
    category: { type: DataTypes.STRING(50), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    paid_to: { type: DataTypes.STRING(100), allowNull: true },
    bill_reference: { type: DataTypes.STRING(100), allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'expense_entries',
  });

  // ─── HrHandover ────────────────────────────────────────────────────
  const HrHandover = sequelize.define('HrHandover', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    given_to: { type: DataTypes.STRING(100), allowNull: false, comment: 'HR person name' },
    notes: { type: DataTypes.STRING(255), allowNull: true },
    shift_date: { type: DataTypes.DATEONLY, allowNull: false },
    shift: { type: DataTypes.ENUM('morning', 'afternoon', 'night', 'shift_1', 'shift_2'), allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    shift_handover_id: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'hr_handovers',
  });

  // ─── CheckoutHistory (standalone) ───────────────────────────────────
  const CheckoutHistory = sequelize.define('CheckoutHistory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bill_number: { type: DataTypes.STRING(20), allowNull: true, unique: true },
    gst_bill_number: { type: DataTypes.STRING(10), allowNull: true },
    reservation_number: { type: DataTypes.STRING(20), allowNull: false },
    invoice_number: { type: DataTypes.STRING(20), allowNull: true },
    guest_name: { type: DataTypes.STRING(200), allowNull: false },
    guest_phone: { type: DataTypes.STRING(20), allowNull: true },
    room_number: { type: DataTypes.STRING(10), allowNull: true },
    room_type: { type: DataTypes.STRING(50), allowNull: true },
    check_in: { type: DataTypes.DATEONLY, allowNull: false },
    check_out: { type: DataTypes.DATEONLY, allowNull: false },
    actual_check_in: { type: DataTypes.DATE, allowNull: true },
    actual_check_out: { type: DataTypes.DATE, allowNull: true },
    nights: { type: DataTypes.INTEGER, defaultValue: 0 },
    rate_per_night: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    source: { type: DataTypes.STRING(30), defaultValue: 'direct' },
    meal_plan: { type: DataTypes.STRING(20), defaultValue: 'none' },
    subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    cgst: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    sgst: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    igst: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total_gst: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    grand_total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    paid_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    refunded_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    net_paid: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    cash_paid: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    card_paid: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    upi_paid: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    payment_status: { type: DataTypes.STRING(20), defaultValue: 'paid' },
    reservation_id: { type: DataTypes.INTEGER, allowNull: true },
    billing_id: { type: DataTypes.INTEGER, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    is_permanent: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'checkout_history',
  });

  const ShiftHandover = sequelize.define('ShiftHandover', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    report_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    outgoing_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    incoming_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    shift_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    shift: {
      type: DataTypes.ENUM('morning', 'afternoon', 'night', 'shift_1', 'shift_2'),
      allowNull: false,
    },
    cash_in_hand: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    total_collections: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    pending_checkouts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tasks_pending: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      defaultValue: 'pending',
    },
  }, {
    tableName: 'shift_handovers',
  });

  // ─── HotelSetting ─────────────────────────────────────────────────
  const HotelSetting = sequelize.define('HotelSetting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(50),
      defaultValue: 'general',
    },
  }, {
    tableName: 'hotel_settings',
    indexes: [
      { unique: true, fields: ['key'] },
    ],
  });

  // ─── AuditLog ──────────────────────────────────────────────────────
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    old_values: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    new_values: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: 'user',
      comment: 'system, api, user, ota',
    },
    channel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'FK to OtaChannel for OTA-originated actions',
    },
  }, {
    tableName: 'audit_log',
    updatedAt: false,
  });

  // ─── RefreshToken ──────────────────────────────────────────────────
  const RefreshToken = sequelize.define('RefreshToken', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'refresh_tokens',
  });

  // ─── OtaChannel ────────────────────────────────────────────────────
  const OtaChannel = sequelize.define('OtaChannel', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    api_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    api_credentials: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'AES-256-GCM encrypted JSON with API key/secret',
    },
    hotel_id_on_ota: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Property ID as registered on the OTA',
    },
    webhook_secret: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    commission_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    sync_config: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        push_availability: true,
        push_rates: true,
        accept_bookings: true,
        inventory_days_ahead: 30,
      },
    },
    last_sync_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'ota_channels',
    indexes: [
      { unique: true, fields: ['code'] },
    ],
  });

  // ─── ApiKey ────────────────────────────────────────────────────────
  const ApiKey = sequelize.define('ApiKey', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    key_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: 'SHA-256 hash of the API key',
    },
    key_prefix: {
      type: DataTypes.STRING(8),
      allowNull: false,
      comment: 'First 8 chars of key for identification',
    },
    channel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ['booking.create', 'booking.modify', 'booking.cancel'],
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rate_limit: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
      comment: 'Max requests per 15 minutes',
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    request_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: 'api_keys',
  });

  // ─── ChannelRateMapping ────────────────────────────────────────────
  const ChannelRateMapping = sequelize.define('ChannelRateMapping', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    channel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rate_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ota_room_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Room type code on the OTA',
    },
    ota_rate_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Rate plan code on the OTA',
    },
    markup_type: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      defaultValue: 'percentage',
    },
    markup_value: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'channel_rate_mappings',
    indexes: [
      {
        unique: true,
        fields: ['channel_id', 'rate_plan_id'],
      },
    ],
  });

  // ─── ChannelSyncLog ────────────────────────────────────────────────
  const ChannelSyncLog = sequelize.define('ChannelSyncLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    channel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    direction: {
      type: DataTypes.ENUM('inbound', 'outbound'),
      allowNull: false,
    },
    operation: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'e.g. push_availability, push_rates, booking_create',
    },
    endpoint: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    request_payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    response_payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'timeout', 'pending'),
      defaultValue: 'pending',
    },
    status_code: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    correlation_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  }, {
    tableName: 'channel_sync_logs',
    updatedAt: false,
  });

  // ─── WebhookEvent ─────────────────────────────────────────────────
  const WebhookEvent = sequelize.define('WebhookEvent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    channel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    event_id: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'OTA-provided event/transaction ID for idempotency',
    },
    event_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'booking, modification, cancellation',
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('received', 'processing', 'processed', 'failed', 'duplicate'),
      defaultValue: 'received',
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reservation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Linked reservation after processing',
    },
  }, {
    tableName: 'webhook_events',
    indexes: [
      {
        unique: true,
        fields: ['channel_id', 'event_id'],
      },
    ],
  });

  // ─── RoomTypeInventory ─────────────────────────────────────────────
  const RoomTypeInventory = sequelize.define('RoomTypeInventory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    room_type: {
      type: DataTypes.ENUM('standard', 'executive', 'comfort', 'comfort_executive', 'suite'),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    total_rooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    booked_rooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    available_rooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    blocked_rooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Rooms blocked for maintenance etc.',
    },
    last_synced_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'room_type_inventory',
    indexes: [
      {
        unique: true,
        fields: ['room_type', 'date'],
      },
    ],
  });

  // ─── OtaReconciliation ────────────────────────────────────────────
  const OtaReconciliation = sequelize.define('OtaReconciliation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    channel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    period_start: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    period_end: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    total_bookings: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_revenue: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    total_commission: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    net_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    ota_payout_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Amount reported by OTA',
    },
    discrepancy_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'generated', 'matched', 'discrepancy', 'resolved'),
      defaultValue: 'draft',
    },
    cancellations: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    generated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'ota_reconciliations',
  });

  // ═══════════════════════════════════════════════════════════════════
  // ASSOCIATIONS (same as models/index.js lines 48-180, minus tenant)
  // ═══════════════════════════════════════════════════════════════════

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

  // RestaurantOrderItem <-> MenuItem
  RestaurantOrderItem.belongsTo(MenuItem, { foreignKey: 'menu_item_id', as: 'menuItem', onDelete: 'SET NULL' });
  MenuItem.hasMany(RestaurantOrderItem, { foreignKey: 'menu_item_id', as: 'orderItems' });

  // RestaurantOrder <-> Guest
  RestaurantOrder.belongsTo(Guest, { foreignKey: 'guest_id', as: 'guest' });
  Guest.hasMany(RestaurantOrder, { foreignKey: 'guest_id', as: 'restaurantOrders' });

  // RestaurantOrder <-> User (created_by)
  RestaurantOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

  // LaundryOrder <-> LaundryOrderItem
  LaundryOrder.hasMany(LaundryOrderItem, { foreignKey: 'order_id', as: 'items' });
  LaundryOrderItem.belongsTo(LaundryOrder, { foreignKey: 'order_id', as: 'order' });

  // Room <-> LaundryOrder
  Room.hasMany(LaundryOrder, { foreignKey: 'room_id', as: 'laundryOrders' });
  LaundryOrder.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

  // LaundryOrder <-> Guest
  LaundryOrder.belongsTo(Guest, { foreignKey: 'guest_id', as: 'guest' });
  Guest.hasMany(LaundryOrder, { foreignKey: 'guest_id', as: 'laundryOrders' });

  // LaundryOrder <-> Reservation
  LaundryOrder.belongsTo(Reservation, { foreignKey: 'reservation_id', as: 'reservation' });
  Reservation.hasMany(LaundryOrder, { foreignKey: 'reservation_id', as: 'laundryOrders' });

  // LaundryOrder <-> User (created_by)
  LaundryOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

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

  return {
    sequelize,
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
    LaundryOrder,
    LaundryOrderItem,
    MenuItem,
    InventoryItem,
    InventoryTransaction,
    RatePlan,
    Package,
    Promotion,
    ShiftHandover,
    HrHandover,
    ExpenseReport,
    ExpenseEntry,
    GpayTransfer,
    BankWithdrawal,
    CheckoutHistory,
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
}

module.exports = { defineTenantModels };
