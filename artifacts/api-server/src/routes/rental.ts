import { Router, type IRouter, type Request, type Response } from "express";
import { db, propertiesTable, paymentsTable } from "@workspace/db";
import { z } from "zod";
import { requireAuth } from "../middlewares/requireAuth";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const CreateRentalSetupSchema = z.object({
  property: z.object({
    propertyName: z.string().min(1).max(200),
    fullAddress: z.string().min(1).max(500),
    unitNumber: z.string().min(1).max(50),
    floor: z.string().min(1).max(50),
    propertyType: z.enum(["apartment", "pg", "villa", "other"]),
    furnishingStatus: z.enum(["furnished", "semi_furnished", "unfurnished"]),
    amenities: z.array(z.string().min(1)).default([]),
  }),
  payment: z.object({
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    paymentDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .nullable()
      .optional(),
    amountPaid: z.number().min(0),
    paymentMethod: z
      .enum(["upi", "bank_transfer", "cash", "card", "other"])
      .nullable()
      .optional(),
    transactionId: z.string().max(200).nullable().optional(),
    lateFees: z.number().min(0),
    outstandingBalance: z.number().min(0),
    paymentStatus: z.enum(["paid", "unpaid", "overdue"]),
  }),
});

const UpdatePropertySchema = z.object({
  propertyName: z.string().min(1).max(200),
  fullAddress: z.string().min(1).max(500),
  unitNumber: z.string().min(1).max(50),
  floor: z.string().min(1).max(50),
  propertyType: z.enum(["apartment", "pg", "villa", "other"]),
  furnishingStatus: z.enum(["furnished", "semi_furnished", "unfurnished"]),
  amenities: z.array(z.string().min(1)).default([]),
});

const UpdatePaymentSchema = z.object({
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .nullable()
    .optional(),
  amountPaid: z.number().min(0),
  paymentMethod: z
    .enum(["upi", "bank_transfer", "cash", "card", "other"])
    .nullable()
    .optional(),
  transactionId: z.string().max(200).nullable().optional(),
  lateFees: z.number().min(0),
  outstandingBalance: z.number().min(0),
  paymentStatus: z.enum(["paid", "unpaid", "overdue"]),
});

// GET current user's saved rental setup
router.get(
  "/rental/setup",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.currentUser!;

    const [property] = await db
      .select()
      .from(propertiesTable)
      .where(eq(propertiesTable.tenantUserId, user.id))
      .orderBy(desc(propertiesTable.id));

    if (!property) {
      res.status(404).json({ error: "No rental setup found" });
      return;
    }

    const [payment] = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.tenantUserId, user.id))
      .orderBy(desc(paymentsTable.id));

    res.json({
      property,
      payment: payment ?? null,
    });
  }
);

// POST rental setup only once per user
router.post(
  "/rental/setup",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateRentalSetupSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const user = req.currentUser!;
    const { property, payment } = parsed.data;

    const [existingProperty] = await db
      .select()
      .from(propertiesTable)
      .where(eq(propertiesTable.tenantUserId, user.id))
      .orderBy(desc(propertiesTable.id));

    if (existingProperty) {
      res.status(409).json({
        error: "Rental setup already exists for this user",
      });
      return;
    }

    const [createdProperty] = await db
      .insert(propertiesTable)
      .values({
        tenantUserId: user.id,
        propertyName: property.propertyName,
        fullAddress: property.fullAddress,
        unitNumber: property.unitNumber,
        floor: property.floor,
        propertyType: property.propertyType,
        furnishingStatus: property.furnishingStatus,
        amenities: property.amenities,
      })
      .returning();

    const [createdPayment] = await db
      .insert(paymentsTable)
      .values({
        tenantUserId: user.id,
        dueDate: payment.dueDate,
        paymentDate: payment.paymentDate ?? null,
        amountPaid: payment.amountPaid.toString(),
        paymentMethod: payment.paymentMethod ?? null,
        transactionId: payment.transactionId ?? null,
        lateFees: payment.lateFees.toString(),
        outstandingBalance: payment.outstandingBalance.toString(),
        paymentStatus: payment.paymentStatus,
      })
      .returning();

    res.status(201).json({
      message: "Rental setup saved successfully",
      property: createdProperty,
      payment: createdPayment,
    });
  }
);

// PATCH property by id
router.patch(
  "/rental/property/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.currentUser!;

    if (currentUser.role !== "admin" && currentUser.role !== "analyst") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const propertyId = Number(req.params.id);

    if (Number.isNaN(propertyId)) {
      res.status(400).json({ error: "Invalid property id" });
      return;
    }

    const parsed = UpdatePropertySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [updatedProperty] = await db
      .update(propertiesTable)
      .set({
        propertyName: parsed.data.propertyName,
        fullAddress: parsed.data.fullAddress,
        unitNumber: parsed.data.unitNumber,
        floor: parsed.data.floor,
        propertyType: parsed.data.propertyType,
        furnishingStatus: parsed.data.furnishingStatus,
        amenities: parsed.data.amenities,
      })
      .where(eq(propertiesTable.id, propertyId))
      .returning();

    if (!updatedProperty) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    res.json(updatedProperty);
  }
);

// PATCH payment by id
router.patch(
  "/rental/payment/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.currentUser!;

    if (currentUser.role !== "admin" && currentUser.role !== "analyst") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const paymentId = Number(req.params.id);

    if (Number.isNaN(paymentId)) {
      res.status(400).json({ error: "Invalid payment id" });
      return;
    }

    const parsed = UpdatePaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [updatedPayment] = await db
      .update(paymentsTable)
      .set({
        dueDate: parsed.data.dueDate,
        paymentDate: parsed.data.paymentDate ?? null,
        amountPaid: parsed.data.amountPaid.toString(),
        paymentMethod: parsed.data.paymentMethod ?? null,
        transactionId: parsed.data.transactionId ?? null,
        lateFees: parsed.data.lateFees.toString(),
        outstandingBalance: parsed.data.outstandingBalance.toString(),
        paymentStatus: parsed.data.paymentStatus,
      })
      .where(eq(paymentsTable.id, paymentId))
      .returning();

    if (!updatedPayment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    res.json(updatedPayment);
  }
);

// DELETE property by id
router.delete(
  "/rental/property/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.currentUser!;

    if (currentUser.role !== "admin" && currentUser.role !== "analyst") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const propertyId = Number(req.params.id);

    if (Number.isNaN(propertyId)) {
      res.status(400).json({ error: "Invalid property id" });
      return;
    }

    const [deletedProperty] = await db
      .delete(propertiesTable)
      .where(eq(propertiesTable.id, propertyId))
      .returning();

    if (!deletedProperty) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    res.json({ message: "Property deleted successfully" });
  }
);

// DELETE payment by id
router.delete(
  "/rental/payment/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const currentUser = req.currentUser!;

    if (currentUser.role !== "admin" && currentUser.role !== "analyst") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const paymentId = Number(req.params.id);

    if (Number.isNaN(paymentId)) {
      res.status(400).json({ error: "Invalid payment id" });
      return;
    }

    const [deletedPayment] = await db
      .delete(paymentsTable)
      .where(eq(paymentsTable.id, paymentId))
      .returning();

    if (!deletedPayment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    res.json({ message: "Payment deleted successfully" });
  }
);

export default router;