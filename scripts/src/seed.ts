import { db, usersTable, recordsTable } from "@workspace/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + process.env.SESSION_SECRET).digest("hex");
}

async function seed() {
  console.log("Seeding database...");

  const existingUsers = await db.select().from(usersTable);
  if (existingUsers.length > 0) {
    console.log("Database already seeded. Skipping.");
    process.exit(0);
  }

  const [admin] = await db
    .insert(usersTable)
    .values([
      {
        username: "admin",
        email: "admin@example.com",
        passwordHash: hashPassword("admin123"),
        role: "admin",
        status: "active",
      },
      {
        username: "analyst",
        email: "analyst@example.com",
        passwordHash: hashPassword("analyst123"),
        role: "analyst",
        status: "active",
      },
      {
        username: "viewer",
        email: "viewer@example.com",
        passwordHash: hashPassword("viewer123"),
        role: "viewer",
        status: "active",
      },
    ])
    .returning();

  console.log("Created users: admin, analyst, viewer");

  const adminId = admin!.id;

  const categories = ["Salary", "Freelance", "Rent", "Utilities", "Groceries", "Entertainment", "Travel", "Healthcare", "Investments", "Other"];

  const records = [];
  const now = new Date();

  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");

    records.push({
      amount: (5000 + Math.random() * 2000).toFixed(2),
      type: "income" as const,
      category: "Salary",
      date: `${year}-${month}-01`,
      notes: "Monthly salary",
      createdById: adminId,
    });

    if (Math.random() > 0.5) {
      records.push({
        amount: (500 + Math.random() * 1500).toFixed(2),
        type: "income" as const,
        category: "Freelance",
        date: `${year}-${month}-15`,
        notes: "Freelance project",
        createdById: adminId,
      });
    }

    records.push({
      amount: (1200 + Math.random() * 300).toFixed(2),
      type: "expense" as const,
      category: "Rent",
      date: `${year}-${month}-05`,
      notes: "Monthly rent",
      createdById: adminId,
    });

    records.push({
      amount: (80 + Math.random() * 50).toFixed(2),
      type: "expense" as const,
      category: "Utilities",
      date: `${year}-${month}-10`,
      notes: "Electricity and water",
      createdById: adminId,
    });

    records.push({
      amount: (200 + Math.random() * 150).toFixed(2),
      type: "expense" as const,
      category: "Groceries",
      date: `${year}-${month}-20`,
      createdById: adminId,
    });

    if (Math.random() > 0.4) {
      records.push({
        amount: (50 + Math.random() * 150).toFixed(2),
        type: "expense" as const,
        category: "Entertainment",
        date: `${year}-${month}-${String(Math.ceil(Math.random() * 28)).padStart(2, "0")}`,
        createdById: adminId,
      });
    }
  }

  await db.insert(recordsTable).values(records);
  console.log(`Created ${records.length} financial records`);
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
