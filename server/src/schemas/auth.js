const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(200),
  tenant: z.string().min(1, 'Hotel selection is required').max(50),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  email: z.string().email('Invalid email format'),
  full_name: z.string().min(1, 'Full name is required').max(100),
  role: z.enum(['admin', 'manager', 'front_desk', 'housekeeping', 'restaurant', 'staff']),
}).strict();

module.exports = { loginSchema, registerSchema };
