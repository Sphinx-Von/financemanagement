import type { ApiRecord, RecordType } from "../../../api";
import {
  smallInputStyle,
  thStyle,
  tdStyle,
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  buttonDangerStyle,
} from "./adminstyles";

type Props = {
  adminRecords: ApiRecord[];
  editingRecordId: number | null;
  editRecordAmount: string;
  editRecordType: RecordType;
  editRecordCategory: string;
  editRecordDate: string;
  editRecordNotes: string;
  recordsPage: number;
  recordsTotal: number;
  recordsTotalPages: number;
  setEditRecordAmount: (value: string) => void;
  setEditRecordType: (value: RecordType) => void;
  setEditRecordCategory: (value: string) => void;
  setEditRecordDate: (value: string) => void;
  setEditRecordNotes: (value: string) => void;
  startRecordEdit: (record: ApiRecord) => void;
  cancelRecordEdit: () => void;
  handleSaveRecordEdit: (id: number) => void;
  handleDeleteRecord: (id: number) => void;
  onRecordsPageChange: (page: number) => void;
};

export default function RecordsSection({
  adminRecords,
  editingRecordId,
  editRecordAmount,
  editRecordType,
  editRecordCategory,
  editRecordDate,
  editRecordNotes,
  recordsPage,
  recordsTotal,
  recordsTotalPages,
  setEditRecordAmount,
  setEditRecordType,
  setEditRecordCategory,
  setEditRecordDate,
  setEditRecordNotes,
  startRecordEdit,
  cancelRecordEdit,
  handleSaveRecordEdit,
  handleDeleteRecord,
  onRecordsPageChange,
}: Props) {
  return (
    <div>
      <h2>Records</h2>

      {adminRecords.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <>
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
                background: "#fff",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Notes</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminRecords.map((r) => {
                  const isEditing = editingRecordId === r.id;

                  return (
                    <tr key={r.id}>
                      <td style={tdStyle}>{r.id}</td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editRecordAmount}
                            onChange={(e) => setEditRecordAmount(e.target.value)}
                            style={smallInputStyle}
                          />
                        ) : (
                          r.amount
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <select
                            value={editRecordType}
                            onChange={(e) =>
                              setEditRecordType(e.target.value as RecordType)
                            }
                            style={smallInputStyle}
                          >
                            <option value="income">income</option>
                            <option value="expense">expense</option>
                          </select>
                        ) : (
                          r.type
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <input
                            value={editRecordCategory}
                            onChange={(e) => setEditRecordCategory(e.target.value)}
                            style={smallInputStyle}
                          />
                        ) : (
                          r.category
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editRecordDate}
                            onChange={(e) => setEditRecordDate(e.target.value)}
                            style={smallInputStyle}
                          />
                        ) : (
                          r.date
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <input
                            value={editRecordNotes}
                            onChange={(e) => setEditRecordNotes(e.target.value)}
                            style={smallInputStyle}
                          />
                        ) : (
                          r.notes ?? "-"
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => handleSaveRecordEdit(r.id)}
                              style={buttonPrimaryStyle}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelRecordEdit}
                              style={buttonSecondaryStyle}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => startRecordEdit(r)}
                              style={buttonSecondaryStyle}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(r.id)}
                              style={buttonDangerStyle}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <p style={{ margin: 0 }}>
              Page {recordsPage} of {recordsTotalPages} • Total records: {recordsTotal}
            </p>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => onRecordsPageChange(recordsPage - 1)}
                disabled={recordsPage <= 1}
                style={{
                  ...buttonSecondaryStyle,
                  opacity: recordsPage <= 1 ? 0.5 : 1,
                  cursor: recordsPage <= 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => onRecordsPageChange(recordsPage + 1)}
                disabled={recordsPage >= recordsTotalPages}
                style={{
                  ...buttonSecondaryStyle,
                  opacity: recordsPage >= recordsTotalPages ? 0.5 : 1,
                  cursor: recordsPage >= recordsTotalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}