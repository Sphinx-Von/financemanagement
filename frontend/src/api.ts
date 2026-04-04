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

export async function login(username: string, password: string): Promise<LoginResponse> {
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

export interface ApiUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

// GET /users
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

// POST /users
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



//Update user - PATCH /users/:id
export type UserStatus = "active" | "inactive";

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