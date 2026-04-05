const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: "viewer" | "analyst" | "admin";
  };
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Login failed");
  }

  return res.json();
}

export async function getDashboardSummary(token: string) {
  const res = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load summary");
  }

  return res.json();
}

export type RecordType = "income" | "expense";

export type ApiRecord = {
  id: number;
  amount: number;
  type: RecordType;
  category: string;
  date: string;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: number;
};

export type RecordsResponse = {
  data: ApiRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function getRecords(
  token: string,
  page = 1,
  limit = 10
): Promise<RecordsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const res = await fetch(`${API_BASE_URL}/records?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load records");
  }

  return res.json();
}

export type UserRole = "viewer" | "analyst" | "admin";
export type UserStatus = "active" | "inactive";

export interface ApiUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export async function getUsers(token: string): Promise<ApiUser[]> {
  const res = await fetch(`${API_BASE_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load users");
  }

  return res.json();
}

export async function createUser(
  token: string,
  payload: { username: string; email: string; password: string; role: UserRole }
): Promise<ApiUser> {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to create user");
  }

  return res.json();
}

export async function updateUser(
  token: string,
  id: number,
  payload: {
    email?: string;
    role?: UserRole;
    status?: UserStatus;
    password?: string;
  }
): Promise<ApiUser> {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update user");
  }

  return res.json();
}

export async function deleteUser(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete user");
  }
}

export type CreateRecordBody = {
  amount: number;
  type: RecordType;
  category: string;
  date: string;
  notes?: string;
};

export type UpdateRecordBody = {
  amount?: number;
  type?: RecordType;
  category?: string;
  date?: string;
  notes?: string;
};

export async function createRecord(
  token: string,
  payload: CreateRecordBody
): Promise<ApiRecord> {
  const res = await fetch(`${API_BASE_URL}/records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to create record");
  }

  return res.json();
}

export async function updateRecord(
  token: string,
  id: number,
  payload: UpdateRecordBody
): Promise<ApiRecord> {
  const res = await fetch(`${API_BASE_URL}/records/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update record");
  }

  return res.json();
}

export async function deleteRecord(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/records/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete record");
  }
}

export interface TenantDashboardRow {
  userId: number;
  username: string;
  email: string;
  role: "viewer" | "analyst" | "admin";
  status: "active" | "inactive";

  propertyId: number | null;
  propertyName: string | null;
  fullAddress: string | null;
  unitNumber: string | null;
  floor: string | null;
  propertyType: "apartment" | "pg" | "villa" | "other" | null;
  furnishingStatus: "furnished" | "semi_furnished" | "unfurnished" | null;
  amenities: string[] | null;

  paymentId: number | null;
  dueDate: string | null;
  paymentDate: string | null;
  amountPaid: string | null;
  paymentMethod: "upi" | "bank_transfer" | "cash" | "card" | "other" | null;
  transactionId: string | null;
  lateFees: string | null;
  outstandingBalance: string | null;
  paymentStatus: "paid" | "unpaid" | "overdue" | null;
}

export async function getTenantDashboard(
  token: string
): Promise<TenantDashboardRow[]> {
  const res = await fetch(`${API_BASE_URL}/dashboard/tenants`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load tenant dashboard");
  }

  return res.json();
}

export type UpdatePropertyBody = {
  propertyName: string;
  fullAddress: string;
  unitNumber: string;
  floor: string;
  propertyType: "apartment" | "pg" | "villa" | "other";
  furnishingStatus: "furnished" | "semi_furnished" | "unfurnished";
  amenities: string[];
};

export async function updateProperty(
  token: string,
  id: number,
  payload: UpdatePropertyBody
) {
  const res = await fetch(`${API_BASE_URL}/rental/property/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update property");
  }

  return res.json();
}

export type UpdatePaymentBody = {
  dueDate: string;
  paymentDate?: string | null;
  amountPaid: number;
  paymentMethod?: "upi" | "bank_transfer" | "cash" | "card" | "other" | null;
  transactionId?: string | null;
  lateFees: number;
  outstandingBalance: number;
  paymentStatus: "paid" | "unpaid" | "overdue";
};

export async function updatePayment(
  token: string,
  id: number,
  payload: UpdatePaymentBody
) {
  const res = await fetch(`${API_BASE_URL}/rental/payment/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update payment");
  }

  return res.json();
}

export async function deleteProperty(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/rental/property/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete property");
  }
}

export async function deletePayment(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/rental/payment/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete payment");
  }
}