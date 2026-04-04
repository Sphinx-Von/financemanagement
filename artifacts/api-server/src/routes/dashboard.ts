import { Router, type IRouter, type Request, type Response } from "express";
import { db, recordsTable } from "@workspace/db";
import { eq, isNull, and, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const records = await db
    .select()
    .from(recordsTable)
    .where(isNull(recordsTable.deletedAt));

  let totalIncome = 0;
  let totalExpenses = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const r of records) {
    const amount = parseFloat(r.amount);
    if (r.type === "income") {
      totalIncome += amount;
      incomeCount++;
    } else {
      totalExpenses += amount;
      expenseCount++;
    }
  }

  res.json({
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netBalance: Math.round((totalIncome - totalExpenses) * 100) / 100,
    totalRecords: records.length,
    incomeCount,
    expenseCount,
  });
});

router.get(
  "/dashboard/category-totals",
  requireAuth,
  requireRole("analyst", "admin"),
  async (_req: Request, res: Response): Promise<void> => {
    const records = await db
      .select()
      .from(recordsTable)
      .where(isNull(recordsTable.deletedAt));

    const totalsMap = new Map<string, { total: number; count: number; type: string }>();

    for (const r of records) {
      const key = `${r.category}|${r.type}`;
      const existing = totalsMap.get(key);
      const amount = parseFloat(r.amount);
      if (existing) {
        existing.total += amount;
        existing.count++;
      } else {
        totalsMap.set(key, { total: amount, count: 1, type: r.type });
      }
    }

    const result = Array.from(totalsMap.entries()).map(([key, val]) => {
      const [category] = key.split("|");
      return {
        category: category!,
        type: val.type,
        total: Math.round(val.total * 100) / 100,
        count: val.count,
      };
    });

    result.sort((a, b) => b.total - a.total);
    res.json(result);
  },
);

router.get(
  "/dashboard/monthly-trends",
  requireAuth,
  requireRole("analyst", "admin"),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = z.object({ months: z.coerce.number().int().min(1).max(24).default(12) }).safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { months } = parsed.data;

    const records = await db
      .select()
      .from(recordsTable)
      .where(isNull(recordsTable.deletedAt))
      .orderBy(recordsTable.date);

    const trendsMap = new Map<string, { income: number; expenses: number }>();

    for (const r of records) {
      const month = r.date.substring(0, 7);
      const amount = parseFloat(r.amount);
      const existing = trendsMap.get(month) ?? { income: 0, expenses: 0 };
      if (r.type === "income") {
        existing.income += amount;
      } else {
        existing.expenses += amount;
      }
      trendsMap.set(month, existing);
    }

    const now = new Date();
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const vals = trendsMap.get(month) ?? { income: 0, expenses: 0 };
      result.push({
        month,
        income: Math.round(vals.income * 100) / 100,
        expenses: Math.round(vals.expenses * 100) / 100,
        net: Math.round((vals.income - vals.expenses) * 100) / 100,
      });
    }

    res.json(result);
  },
);

router.get("/dashboard/recent-activity", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) }).safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit } = parsed.data;

  const records = await db
    .select()
    .from(recordsTable)
    .where(isNull(recordsTable.deletedAt))
    .orderBy(sql`${recordsTable.createdAt} DESC`)
    .limit(limit);

  res.json(
    records.map((r) => ({
      ...r,
      amount: parseFloat(r.amount),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    })),
  );
});

export default router;
