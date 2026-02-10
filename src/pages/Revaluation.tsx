import React, { useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";

type Filters = { usn: string; exam_period: string };

const Revaluation = () => {
  const [filters, setFilters] = useState<Filters>({ usn: "", exam_period: "" });
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sanitizeMessage = (msg: any) => {
    if (!msg) return null;
    if (typeof msg !== 'string') return String(msg);
    const lowered = msg.toLowerCase();
    if (lowered.includes('localhost') || lowered.includes('traceback') || lowered.includes('connection refused') || lowered.includes('err')) return null;
    return msg;
  };

  // confirmation modal state for revaluation
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; subject_mark_id?: number; subject_name?: string }>(
    { open: false }
  );

  const handleApply = (subject_mark_id: number, subject_name?: string) => {
    setConfirmModal({ open: true, subject_mark_id, subject_name });
  };

  // message modal state (replaces native alert())
  const [messageModal, setMessageModal] = useState<{ open: boolean; title?: string; message?: string }>({ open: false });

  const confirmApply = async (subject_mark_id?: number) => {
    if (!subject_mark_id) return setConfirmModal({ open: false });
    setConfirmModal({ open: false });
    setLoading(true);
    try {
      const form = new FormData();
      form.append('subject_mark_id', String(subject_mark_id));
      const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/revaluation/request/`, { method: 'POST', body: form });
      const json = await res.json();
      if (json.success) {
        // mark the subject as applied in the local UI so button is disabled immediately
        setStudents(prev => prev.map(st => ({
          ...st,
          subjects: st.subjects.map((sb: any) => sb.subject_mark_id === subject_mark_id ? { ...sb, applied: true } : sb)
        })));
        setMessageModal({ open: true, title: 'Success', message: 'Revaluation requested' });
      } else if (json.applied) {
        // backend indicates an existing applied request
        setStudents(prev => prev.map(st => ({
          ...st,
          subjects: st.subjects.map((sb: any) => sb.subject_mark_id === subject_mark_id ? { ...sb, applied: true } : sb)
        })));
        const safe = sanitizeMessage(json.message) || 'Revaluation already applied';
        setMessageModal({ open: true, title: 'Info', message: safe });
      } else {
        const safe = sanitizeMessage(json.message) || 'Failed to submit revaluation request';
        setMessageModal({ open: true, title: 'Error', message: safe });
      }
    } catch (err: any) {
      console.error('submitReval error', err);
      setMessageModal({ open: true, title: 'Error', message: 'Network error contacting server' });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    qs.set("usn", filters.usn.trim());
    qs.set("exam_period", filters.exam_period);

    try {
      const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/revaluation/students/?${qs.toString()}`, { method: 'GET' });
      const json = await res.json();
      // DRF pagination wraps our payload under `results` when paginated.
      const payload = json.results && typeof json.results === 'object' ? json.results : json;
      if (payload.success) {
        // ensure applied flag defaults to false if missing
        const safeStudents = (payload.students || []).map((st: any) => ({
          ...st,
          subjects: (st.subjects || []).map((sb: any) => ({ ...sb, applied: sb.applied ? true : false }))
        }));
        setStudents(safeStudents);
      } else {
        setStudents([]);
        console.error('Load students error response:', payload);
        setMessageModal({ open: true, title: 'Error', message: payload.message || 'Failed to load students' });
      }
    } catch (err) {
      console.error('Error loading students:', err);
      setStudents([]);
      setMessageModal({ open: true, title: 'Error', message: 'Failed to load students (network or auth error)' });
    }
    setLoading(false);
  };

  

  return (
    <div className="min-h-screen p-4 bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="max-w-4xl mx-auto">
        <main className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-6 shadow-sm">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold mb-1">Revaluation</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Apply for revaluation of exam papers. Search by student USN and select the exam period.</p>
          </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 items-end">
        <div>
          <label className="text-sm block mb-1">USN</label>
          <input value={filters.usn} onChange={e => setFilters({ ...filters, usn: e.target.value })} placeholder="Enter student USN" className="w-full p-2 border border-[hsl(var(--border))] rounded bg-[hsl(var(--input))] text-[hsl(var(--foreground))]" />
        </div>
        <div>
          <label className="text-sm block mb-1">Exam Period</label>
          <select value={filters.exam_period} onChange={e => setFilters({ ...filters, exam_period: e.target.value })} className="w-full p-2 border border-[hsl(var(--border))] rounded bg-[hsl(var(--input))] text-[hsl(var(--foreground))]">
            <option value="">Select Exam Period</option>
            <option value="june_july">June/July</option>
            <option value="nov_dec">Nov/Dec</option>
            <option value="jan_feb">Jan/Feb</option>
            <option value="apr_may">Apr/May</option>
            <option value="supplementary">Supplementary</option>
          </select>
        </div>
        <div>
          <button onClick={loadStudents} className="w-full px-4 py-2 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">Search</button>
        </div>
      </div>

      {loading && <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</div>}

      {!loading && students.map(s => (
        <div key={s.student_id} className="border border-[hsl(var(--border))] p-4 mb-4 rounded bg-[hsl(var(--popover))]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">Student</div>
              <div className="font-medium">{s.usn} - {s.name}</div>
            </div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">Exam: {filters.exam_period ? filters.exam_period.replace('_',' / ') : '-'}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left text-sm">
                  <th className="p-2 border-b">Subject</th>
                  <th className="p-2 border-b text-right">CIE</th>
                  <th className="p-2 border-b text-right">SEE</th>
                  <th className="p-2 border-b text-right">Total</th>
                  <th className="p-2 border-b">Status</th>
                  <th className="p-2 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {s.subjects.map((sub: any) => (
                  <tr key={sub.subject_id} className="odd:bg-[hsl(var(--card))]">
                    <td className="p-2">{sub.subject_name}</td>
                    <td className="p-2 text-right">{sub.cie_marks ?? '-'}</td>
                    <td className="p-2 text-right">{sub.see_marks ?? '-'}</td>
                    <td className="p-2 text-right">{sub.total_marks ?? '-'}</td>
                    <td className="p-2">
                      {sub.applied ? (
                        <span className="text-[hsl(var(--muted-foreground))]">Applied</span>
                      ) : (sub.status === 'pass' ? <span className="text-[hsl(140,50%,40%)]">Pass</span> : <span className="text-[hsl(0,70%,60%)]">Fail</span>)}
                    </td>
                    <td className="p-2">
                      {sub.subject_mark_id ? (
                        <button disabled={sub.applied} onClick={() => handleApply(sub.subject_mark_id, sub.subject_name)} className={`px-3 py-1 rounded ${sub.applied ? 'bg-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]'}`}>
                          {sub.applied ? 'Applied' : 'Apply for Revaluation'}
                        </button>
                      ) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {confirmModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="w-11/12 max-w-md p-4 rounded shadow-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <h3 className="font-semibold mb-2 text-[hsl(var(--foreground))]">Confirm Revaluation</h3>
            <div className="mb-4 text-sm">Apply revaluation for <strong>{filters.usn}</strong> — <strong>{confirmModal.subject_name}</strong>?</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmModal({ open: false })} className="px-3 py-1 rounded border border-[hsl(var(--border))] text-[hsl(var(--foreground))]">Cancel</button>
              <button onClick={() => confirmApply(confirmModal.subject_mark_id)} className="px-3 py-1 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {messageModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="w-11/12 max-w-sm p-4 rounded shadow-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <h3 className="font-semibold mb-2 text-[hsl(var(--foreground))]">{messageModal.title}</h3>
            <div className="mb-4 text-sm text-[hsl(var(--foreground))]">{messageModal.message}</div>
            <div className="flex justify-end">
              <button onClick={() => setMessageModal({ open: false })} className="px-3 py-1 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal replaced: confirmation handled via styled popup. */}
        </main>
      </div>
    </div>
  );
};

export default Revaluation;
