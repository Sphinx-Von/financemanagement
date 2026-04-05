import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, propertiesTable, paymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get(
  "/dashboard/tenants",
  requireAuth,
  async (req: Request, res: Response) => {
    const currentUser = req.currentUser!;

    if (currentUser.role !== "analyst" && currentUser.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const rows = await db
      .select({
        userId: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        role: usersTable.role,
        status: usersTable.status,

        propertyId: propertiesTable.id,
        propertyName: propertiesTable.propertyName,
        fullAddress: propertiesTable.fullAddress,
        unitNumber: propertiesTable.unitNumber,
        floor: propertiesTable.floor,
        propertyType: propertiesTable.propertyType,
        furnishingStatus: propertiesTable.furnishingStatus,
        amenities: propertiesTable.amenities,

        paymentId: paymentsTable.id,
        dueDate: paymentsTable.dueDate,
        paymentDate: paymentsTable.paymentDate,
        amountPaid: paymentsTable.amountPaid,
        paymentMethod: paymentsTable.paymentMethod,
        transactionId: paymentsTable.transactionId,
        lateFees: paymentsTable.lateFees,
        outstandingBalance: paymentsTable.outstandingBalance,
        paymentStatus: paymentsTable.paymentStatus,
      })
      .from(usersTable)
      .leftJoin(propertiesTable, eq(propertiesTable.tenantUserId, usersTable.id))
      .leftJoin(paymentsTable, eq(paymentsTable.tenantUserId, usersTable.id));

    res.json(rows);
  }
);

export default router;