const { z } = require('zod');

const addItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  amount: z.coerce.number().positive('Amount must be positive'),
  quantity: z.coerce.number().int().min(1).optional().default(1),
  item_type: z.enum(['room_charge', 'restaurant', 'service', 'laundry', 'spa', 'transport', 'discount']).optional().default('room_charge'),
});

const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be greater than 0'),
  payment_method: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other']).optional().default('cash'),
  payment_date: z.string().optional(),
  notes: z.string().max(500).optional(),
  transaction_reference: z.string().max(100).optional(),
});

module.exports = { addItemSchema, recordPaymentSchema };
