import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const propertyTypeEnum = pgEnum("property_type", [
  "apartment",
  "pg",
  "villa",
  "other",
]);

export const furnishingStatusEnum = pgEnum("furnishing_status", [
  "furnished",
  "semi_furnished",
  "unfurnished",
]);

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),

  tenantUserId: integer("tenant_user_id")
    .notNull()
    .references(() => usersTable.id),

  propertyName: text("property_name").notNull(),
  fullAddress: text("full_address").notNull(),
  unitNumber: text("unit_number").notNull(),
  floor: text("floor").notNull(),

  propertyType: propertyTypeEnum("property_type").notNull(),
  furnishingStatus: furnishingStatusEnum("furnishing_status").notNull(),

  amenities: jsonb("amenities").$type<string[]>().notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;