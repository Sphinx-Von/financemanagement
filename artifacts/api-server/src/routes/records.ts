import { Router, type IRouter, type Request, type Response } from "express";
import { db, recordsTable } from "@workspace/db";
import { eq, isNull, and, gte, lte, type SQL } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

const CreateRecordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  notes: z.string().max(1000).optional(),
});

const UpdateRecordSchema = z.object({
  amount: z.number().positive().optional(),
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().min(1).max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  notes: z.string().max(1000).optional(),
});

const ListQuerySchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function formatRecord(r: typeof recordsTable.$inferSelect) {
  return {
    ...r,
    amount: parseFloat(r.amount),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
  };
}

router.get("/records", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = ListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, category, dateFrom, dateTo, page, limit } = parsed.data;

  const conditions: SQL[] = [isNull(recordsTable.deletedAt)];

  if (type) conditions.push(eq(recordsTable.type, type));
  if (category) conditions.push(eq(recordsTable.category, category));
  if (dateFrom) conditions.push(gte(recordsTable.date, dateFrom));
  if (dateTo) conditions.push(lte(recordsTable.date, dateTo));

  const whereClause = and(...conditions);

  const allRecords = await db
    .select()
    .from(recordsTable)
    .where(whereClause)
    .orderBy(recordsTable.date);

  const total = allRecords.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const data = allRecords.slice(offset, offset + limit).map(formatRecord);

  res.json({ data, total, page, limit, totalPages });
});

router.post("/records", requireAuth, requireRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = req.currentUser!;
  const { amount, ...rest } = parsed.data;

  const [record] = await db
    .insert(recordsTable)
    .values({ ...rest, amount: amount.toString(), createdById: user.id })
    .returning();

  res.status(201).json(formatRecord(record!));
});

router.get("/records/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId!, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid record ID" });
    return;
  }

  const [record] = await db
    .select()
    .from(recordsTable)
    .where(and(eq(recordsTable.id, id), isNull(recordsTable.deletedAt)));

  if (!record) {
    res.status(404).json({ error: "Record not found" });
    return;
  }

  res.json(formatRecord(record));
});

router.patch("/records/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId!, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid record ID" });
    return;
  }

  const parsed = UpdateRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const { amount, ...rest } = parsed.data;
  const updates: Partial<typeof recordsTable.$inferInsert> = { ...rest };
  if (amount !== undefined) {
    updates.amount = amount.toString();
  }

  const [record] = await db
    .update(recordsTable)
    .set(updates)
    .where(and(eq(recordsTable.id, id), isNull(recordsTable.deletedAt)))
    .returning();

  if (!record) {
    res.status(404).json({ error: "Record not found" });
    return;
  }

  res.json(formatRecord(record));
});

router.delete("/records/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId!, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid record ID" });
    return;
  }

  const [record] = await db
    .update(recordsTable)
    .set({ deletedAt: new Date() })
    .where(and(eq(recordsTable.id, id), isNull(recordsTable.deletedAt)))
    .returning();

  if (!record) {
    res.status(404).json({ error: "Record not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
