import React, { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";

const MakeupExam = () => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
  const [batches, setBatches] = useState([] as any[]);
  const [branches, setBranches] = useState([] as any[]);
  const [semesters, setSemesters] = useState([] as any[]);
  const [semestersByBranch, setSemestersByBranch] = useState<Record<string, any[]>>({});
  const [filters, setFilters] = useState({ batch_id: "", branch_id: "", semester_id: "", section_id: "", exam_period: "" });
  // allow USN search like Revaluation
  const [usn, setUsn] = useState("");
  const [messageModal, setMessageModal] = useState<{ open: boolean; title?: string; message?: string }>({ open: false });
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectionMap, setSelectionMap] = useState<Record<number, boolean>>({});
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirmMakeup, setConfirmMakeup] = useState<{ open: boolean; student_id?: number; subject_id?: number; subject_name?: string }>({ open: false });

  // Lazy-load filter options only when needed (user focuses/selects batch/branch)
  const fetchFilterOptions = async () => {
    if (Object.keys(semestersByBranch).length || batches.length) return null;
    try {
      const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/revaluation/filter-options/`, { method: 'GET' });
      const data = await res.json();
      if (data.success) {
        setBatches(data.data.batches || []);
        setBranches(data.data.branches || []);
        setSemestersByBranch(data.data.semesters_by_branch || {});
        if (filters.branch_id && data.data.semesters_by_branch) {
          setSemesters(data.data.semesters_by_branch[filters.branch_id] || []);
        }
        return data.data.semesters_by_branch || {};
      }
    } catch (e) {
      console.error('Error loading filter options', e);
    }
    return null;
  };

  const loadStudents = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    let url = `${API_ENDPOINT}/makeup/students/`;
    if (usn.trim()) {
      qs.set('usn', usn.trim());
      qs.set('exam_period', filters.exam_period);
      url = `${API_ENDPOINT}/makeup/students/?${qs.toString()}`;
    } else {
      qs.set("batch_id", filters.batch_id);
      qs.set("branch_id", filters.branch_id);
      qs.set("semester_id", filters.semester_id);
      qs.set("exam_period", filters.exam_period);
      url = `${API_ENDPOINT}/makeup/students/?${qs.toString()}`;
    }

    const res = await fetchWithTokenRefresh(url, { method: 'GET' });
    const json = await res.json();
    const payload = json.results && typeof json.results === 'object' ? json.results : json;
    if (payload.success) {
      const safeStudents = (payload.students || []).map((st: any) => ({
        ...st,
        subjects: (st.subjects || []).map((sb: any) => ({ ...sb, applied: sb.applied ? true : false }))
      }));
      setStudents(safeStudents);
    } else { setStudents([]); console.error('Load students error response:', payload); setMessageModal({ open: true, title: 'Error', message: payload.message || 'Failed to load students' }); }
    setLoading(false);
  };

  const applyMakeup = async () => {
    if (!selectedStudent || !selectedSubject) return setMessageModal({ open: true, title: 'Error', message: 'Select student and subject' });
    const form = new FormData();
    form.append("student_id", String(selectedStudent));
    form.append("subject_id", String(selectedSubject));
    form.append("batch_id", filters.batch_id);
    form.append("branch_id", filters.branch_id);
    form.append("semester_id", filters.semester_id);
    form.append("exam_period", filters.exam_period);
    form.append("reason", reason);

    const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/makeup/request/`, { method: "POST", body: form });
    const json = await res.json();
    if (json.success) {
      // mark selected subject as applied locally
      setStudents(prev => prev.map(st => ({ ...st, subjects: st.subjects.map((sb: any) => sb.subject_id === selectedSubject ? { ...sb, applied: true } : sb) })));
      setMessageModal({ open: true, title: 'Success', message: 'Makeup request submitted' });
      setSelectedStudent(null); setSelectedSubject(null); setReason("");
    } else if (json.makeup_request) {
      // unexpected success shape
      setMessageModal({ open: true, title: 'Success', message: 'Makeup request submitted' });
    } else {
      setMessageModal({ open: true, title: 'Error', message: json.message || 'Error' });
    }
  };

  return (
    <div className="min-h-screen p-4 bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="max-w-5xl mx-auto">
        <main className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-6 shadow-sm">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold mb-1">Makeup Exam</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Submit makeup exam requests for students — search by USN or select batch/branch and exam period.</p>
          </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 items-end">
        <div>
          <label className="text-sm block mb-1">USN</label>
          <input value={usn} onChange={e=>setUsn(e.target.value)} placeholder="Enter student USN" className="w-full p-2 border border-[hsl(var(--border))] rounded bg-[hsl(var(--input))] text-[hsl(var(--foreground))]" />
        </div>
        <div>
          <label className="text-sm block mb-1">Exam Period</label>
          <select value={filters.exam_period} onChange={e=>setFilters({...filters, exam_period: e.target.value})} className="w-full p-2 border border-[hsl(var(--border))] rounded bg-[hsl(var(--input))] text-[hsl(var(--foreground))]">
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
                  {role === 'student' && <th className="p-2 border-b">Select</th>}
                </tr>
              </thead>
              <tbody>
                {s.subjects.map((sub: any) => (
                  <tr key={sub.subject_id} className="odd:bg-[hsl(var(--card))]">
                    <td className="p-2">{sub.subject_name}</td>
                    <td className="p-2 text-right">{sub.cie_marks ?? '-'}</td>
                    <td className="p-2 text-right">{sub.see_marks ?? '-'}</td>
                    <td className="p-2 text-right">{sub.total_marks ?? '-'}</td>
                    <td className="p-2">{sub.applied ? <span className="text-[hsl(var(--muted-foreground))]">Applied</span> : (sub.status === 'pass' ? <span className="text-[hsl(140,50%,40%)]">Pass</span> : <span className="text-[hsl(0,70%,60%)]">Fail</span>)}</td>
                    <td className="p-2">
                      {sub.subject_id ? (
                        role === 'student' ? (
                          <input type="checkbox" checked={!!selectionMap[sub.subject_id]} onChange={(e)=>setSelectionMap(prev=>({ ...prev, [sub.subject_id]: e.target.checked }))} />
                        ) : (
                          <button disabled={sub.applied} onClick={() => { setSelectedStudent(s.student_id); setSelectedSubject(sub.subject_id); setSelectedSubjectName(sub.subject_name); setConfirmMakeup({ open: true, student_id: s.student_id, subject_id: sub.subject_id, subject_name: sub.subject_name }); }} className={`px-3 py-1 rounded ${sub.applied ? 'bg-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]' : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'}`}>
                            {sub.applied ? 'Applied' : 'Apply for Makeup'}
                          </button>
                        )
                      ) : 'N/A'}
                    </td>
                    {role === 'student' && <td className="p-2">&nbsp;</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {role === 'student' && (
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">Selected: {Object.keys(selectionMap).filter(k=>selectionMap[Number(k)]).length}</div>
            <div className="text-sm">Total: ₹{Object.keys(selectionMap).reduce((acc,k)=> acc + (selectionMap[Number(k)]?300:0), 0)}</div>
            <div>
              <button onClick={async ()=>{
                const items = Object.entries(selectionMap).map(([k,v])=>({ subject_id: Number(k) })).filter((it:any)=>selectionMap[it.subject_id]);
                if(items.length===0) return setMessageModal({ open: true, title: 'Error', message: 'Select at least one subject to pay' });
                if(!filters.exam_period) return setMessageModal({ open: true, title: 'Error', message: 'Select exam period' });
                setLoading(true);
                try{
                  const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/makeup/initiate-payment/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, exam_period: filters.exam_period }) });
                  const json = await res.json();
                  if(json.success && json.checkout_url){ window.location.href = json.checkout_url; }
                  else setMessageModal({ open: true, title: 'Error', message: json.message || 'Failed to initiate payment' });
                }catch(err){ console.error(err); setMessageModal({ open: true, title: 'Error', message: 'Network error' }); }
                setLoading(false);
              }} className="px-4 py-2 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">Pay & Apply</button>
            </div>
          </div>
        </div>
      )}
      {confirmMakeup.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="w-11/12 max-w-md p-4 rounded shadow-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <h3 className="font-semibold mb-2 text-[hsl(var(--foreground))]">Confirm Makeup Application</h3>
            <div className="mb-4 text-sm">Apply makeup for <strong>{confirmMakeup.student_id}</strong> — <strong>{confirmMakeup.subject_name}</strong>?</div>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setConfirmMakeup({ open: false })} className="px-3 py-1 rounded border border-[hsl(var(--border))] text-[hsl(var(--foreground))]">Cancel</button>
              <button onClick={async ()=>{ setConfirmMakeup({ open: false }); await applyMakeup(); }} className="px-3 py-1 rounded bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">Confirm</button>
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
      </main>
      </div>
    </div>
  );
};

export default MakeupExam;
