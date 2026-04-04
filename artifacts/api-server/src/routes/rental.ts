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

export default router;