const { z } = require('zod');

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)');

const createReservationSchema = z.object({
  // Guest info (required if no guest_id)
  guest_id: z.number().int().positive().optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().max(100).optional().default(''),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  id_proof_type: z.string().max(50).optional().nullable(),
  id_proof_number: z.string().max(50).optional().nullable(),

  // Room
  room_id: z.number().int().positive().optional(),
  room_type: z.string().max(50).optional(),

  // Dates
  check_in_date: dateStr.optional(),
  check_out_date: dateStr.optional(),
  check_in: dateStr.optional(),
  check_out: dateStr.optional(),

  // Rates (coerce strings from form inputs to numbers)
  rate_per_night: z.coerce.number().min(0).optional(),
  booking_type: z.enum(['nightly', 'hourly']).optional().default('nightly'),
  expected_hours: z.coerce.number().int().min(2).max(24).optional(),
  hourly_rate: z.coerce.number().min(0).optional(),

  // Guests
  adults: z.coerce.number().int().min(1).max(20).optional().default(1),
  children: z.coerce.number().int().min(0).max(20).optional().default(0),

  // Extra beds
  extra_beds: z.coerce.number().int().min(0).max(10).optional().default(0),
  extra_bed_charge: z.coerce.number().min(0).optional(),

  // Payment
  advance_paid: z.coerce.number().min(0).optional().default(0),
  payment_mode: z.string().max(50).optional(),
  source: z.string().max(50).optional(),

  // Meal plan
  meal_plan: z.enum(['none', 'breakfast', 'dinner', 'both']).optional().default('none'),

  // Other
  special_requests: z.string().max(1000).optional(),
  status: z.enum(['pending', 'confirmed']).optional(),
  guests_count: z.string().max(50).optional(),

  // Group booking
  rooms: z.array(z.object({
    room_id: z.number().int().positive(),
    rate_per_night: z.number().min(0).optional(),
    adults: z.number().int().min(1).optional(),
    children: z.number().int().min(0).optional(),
  })).optional(),
}).passthrough(); // Allow extra fields for backward compat

const checkOutSchema = z.object({
  discount_type: z.enum(['amount', 'percent']).optional(),
  discount_value: z.union([z.string(), z.number()]).optional(),
  discount_reason: z.string().max(500).optional(),
  send_invoice: z.boolean().optional(),
}).passthrough();

const roomTransferSchema = z.object({
  new_room_id: z.number().int().positive('New room is required'),
  reason: z.string().max(500).optional(),
  adjust_rate: z.boolean().optional().default(false),
});

module.exports = { createReservationSchema, checkOutSchema, roomTransferSchema };
