import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "unpaid",
  "overdue",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "upi",
  "bank_transfer",
  "cash",
  "card",
  "other",
]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),

  tenantUserId: integer("tenant_user_id").notNull(),

  dueDate: text("due_date").notNull(),
  paymentDate: text("payment_date"),

  amountPaid: numeric("amount_paid", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),

  paymentMethod: paymentMethodEnum("payment_method"),
  transactionId: text("transaction_id"),

  lateFees: numeric("late_fees", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),

  outstandingBalance: numeric("outstanding_balance", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),

  paymentStatus: paymentStatusEnum("payment_status")
    .notNull()
    .default("unpaid"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;