import type { UserRole } from "../../../api";
import {
  formContainerStyle,
  inputStyle,
  buttonPrimaryStyle,
} from "./adminstyles";

type Props = {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  formError: string;
  submitting: boolean;
  setUsername: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setRole: (value: UserRole) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function CreateUserSection({
  username,
  email,
  password,
  role,
  formError,
  submitting,
  setUsername,
  setEmail,
  setPassword,
  setRole,
  onSubmit,
}: Props) {
  return (
    <div>
      <h2>Create User</h2>

      <form onSubmit={onSubmit} style={formContainerStyle}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          style={inputStyle}
        >
          <option value="viewer">viewer</option>
          <option value="analyst">analyst</option>
          <option value="admin">admin</option>
        </select>

        {formError && <p style={{ color: "red", margin: 0 }}>{formError}</p>}

        <button type="submit" disabled={submitting} style={buttonPrimaryStyle}>
          {submitting ? "Creating..." : "Create User"}
        </button>
      </form>
    </div>
  );
}