import type { RecordType } from "../../../api";
import {
  formContainerStyle,
  inputStyle,
  buttonPrimaryStyle,
} from "./adminstyles";

type Props = {
  recordAmount: string;
  recordType: RecordType;
  recordCategory: string;
  recordDate: string;
  recordNotes: string;
  recordError: string;
  recordSubmitting: boolean;
  setRecordAmount: (value: string) => void;
  setRecordType: (value: RecordType) => void;
  setRecordCategory: (value: string) => void;
  setRecordDate: (value: string) => void;
  setRecordNotes: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function CreateRecordSection({
  recordAmount,
  recordType,
  recordCategory,
  recordDate,
  recordNotes,
  recordError,
  recordSubmitting,
  setRecordAmount,
  setRecordType,
  setRecordCategory,
  setRecordDate,
  setRecordNotes,
  onSubmit,
}: Props) {
  return (
    <div>
      <h2>Create Record</h2>

      <form onSubmit={onSubmit} style={{ ...formContainerStyle, maxWidth: 520 }}>
        <input
          type="number"
          placeholder="Amount"
          value={recordAmount}
          onChange={(e) => setRecordAmount(e.target.value)}
          style={inputStyle}
          required
        />

        <select
          value={recordType}
          onChange={(e) => setRecordType(e.target.value as RecordType)}
          style={inputStyle}
        >
          <option value="income">income</option>
          <option value="expense">expense</option>
        </select>

        <input
          type="text"
          placeholder="Category"
          value={recordCategory}
          onChange={(e) => setRecordCategory(e.target.value)}
          style={inputStyle}
          required
        />

        <input
          type="date"
          value={recordDate}
          onChange={(e) => setRecordDate(e.target.value)}
          style={inputStyle}
          required
        />

        <textarea
          placeholder="Notes (optional)"
          value={recordNotes}
          onChange={(e) => setRecordNotes(e.target.value)}
          style={{ ...inputStyle, minHeight: 90 }}
        />

        {recordError && <p style={{ color: "red", margin: 0 }}>{recordError}</p>}

        <button
          type="submit"
          disabled={recordSubmitting}
          style={buttonPrimaryStyle}
        >
          {recordSubmitting ? "Creating..." : "Create Record"}
        </button>
      </form>
    </div>
  );
}