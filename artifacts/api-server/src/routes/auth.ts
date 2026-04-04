import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { hashPassword, verifyPassword, createSession, deleteSession, extractToken } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const LoginBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  if (user.status === "inactive") {
    res.status(403).json({ error: "Account is inactive" });
    return;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const token = createSession(user.id);

  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.post("/auth/logout", requireAuth, (req: Request, res: Response): void => {
  const token = extractToken(req.headers.authorization);
  if (token) {
    deleteSession(token);
  }
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", requireAuth, (req: Request, res: Response): void => {
  const user = req.currentUser!;
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
