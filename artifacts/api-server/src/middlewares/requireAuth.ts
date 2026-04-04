import { type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { extractToken, getSessionUserId } from "../lib/auth";

export type Role = "viewer" | "analyst" | "admin";

declare global {
  namespace Express {
    interface Request {
      currentUser?: typeof usersTable.$inferSelect;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const userId = getSessionUserId(token);
  if (!userId) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  if (user.status === "inactive") {
    res.status(403).json({ error: "Account is inactive" });
    return;
  }

  req.currentUser = user;
  next();
}

export function requireRole(...roles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.currentUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.currentUser.role as Role)) {
      res.status(403).json({ error: `Access denied. Required role(s): ${roles.join(", ")}` });
      return;
    }
    next();
  };
}
