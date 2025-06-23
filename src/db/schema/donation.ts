import { pgTable, serial, text, varchar, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

// Creating enum for donation status
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'success',
  'failed',
  'expired',
  'cancel',
  'deny',
  'challenge'
]);

// Creating enum for payment methods
export const paymentMethodEnum = pgEnum('payment_method', [
  'credit-card',
  'bank-transfer',
  'ewallet',
  'cstore',
  'gopay',
  'shopeepay',
  'other'
]);

export const donations = pgTable('donations', {
  id: serial('id').primaryKey(),
  amount: integer('amount').notNull(),
  name: text('name').notNull(),
  email: varchar('email', { length: 256 }).notNull(),
  
  // Midtrans specific fields
  orderId: varchar('order_id', { length: 64 }).notNull().unique(),
  transactionId: varchar('transaction_id', { length: 64 }),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  paymentType: varchar('payment_type', { length: 32 }),
  paymentStatus: paymentStatusEnum('payment_status').default('pending'),
  
  // Additional payment details (for bank transfers etc.)
  paymentDetails: text('payment_details'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
  
  // For recurring donations (optional)
  isRecurring: boolean('is_recurring').default(false),
  
  // Optional message from donor
  message: text('message'),
}); 