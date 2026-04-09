import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";
// Use dean endpoints for branches/semesters/sections

const DeanTimetable = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timetable, setTimetable] = useState<any[]>([]);

  const [branches, setBranches] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const [branchId, setBranchId] = useState<string>("");
  const [semesterId, setSemesterId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");

  useEffect(() => {
    // Load branches for selection on mount
    let mounted = true;
    const boot = async () => {
      try {
        const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/branches/`);
        const json = await res.json();
        if (!mounted) return;
        if (json.success) {
          // normalize shape: backend may return {branch_id, branch} or {id, name}
          const normalized = (json.data || []).map((b: any) => ({ id: b.id || b.branch_id, name: b.name || b.branch }));
          setBranches(normalized);
          console.debug('Dean branches loaded', normalized);
        }
      } catch (err) {
        console.error('Error loading branches', err);
      }
    };
    boot();
    return () => { mounted = false; };
  }, []);

  const loadSemesters = async (bId: string) => {
    setSemesters([]);
    setSections([]);
    setSemesterId("");
    setSectionId("");
    if (!bId) return;
    try {
      const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/semesters/?branch_id=${bId}`);
      const json = await res.json();
      if (json.success) setSemesters(json.data || []);
    } catch (err) {
      console.error('Error loading semesters', err);
    }
  };

  const loadSections = async (bId: string, semId: string) => {
    setSections([]);
    setSectionId("");
    if (!bId || !semId) return;
    try {
      const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/sections/?branch_id=${bId}&semester_id=${semId}`);
      const json = await res.json();
      if (json.success) setSections(json.data || []);
    } catch (err) {
      console.error('Error loading sections', err);
    }
  };

  const loadTimetable = async () => {
    if (!branchId || !semesterId || !sectionId) {
      setError('Select branch, semester and section to view timetable');
      return;
    }
    setLoading(true); setError(null);
    try {
      // backend expects semester number and section name (not ids)
      const semObj = semesters.find((s: any) => String(s.id) === String(semesterId));
      const secObj = sections.find((s: any) => String(s.id) === String(sectionId));
      const semesterParam = semObj ? semObj.number : semesterId;
      const sectionParam = secObj ? secObj.name : sectionId;
      const url = `${API_ENDPOINT}/dean/reports/timetable/?branch_id=${branchId}&semester=${encodeURIComponent(semesterParam)}&section=${encodeURIComponent(sectionParam)}`;
      const res = await fetchWithTokenRefresh(url);
      const json = await res.json();
      if (json.success) {
        const raw = json.data || [];
        let list: any[] = [];
        if (Array.isArray(raw)) {
          // backend returns flat list of timetable entries; group by day
          const grouped: Record<string, any[]> = {};
          raw.forEach((r: any) => {
            const day = r.day || 'UNKNOWN';
            const entry = {
              subject: r.faculty_assignment?.subject || r.subject || '',
              faculty: r.faculty_assignment?.faculty || r.faculty || '',
              start_time: r.start_time,
              end_time: r.end_time,
              room: r.room,
            };
            if (!grouped[day]) grouped[day] = [];
            grouped[day].push(entry);
          });
          const dayOrder = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
          list = dayOrder.filter(d => grouped[d]).map(d => ({ day: d, entries: grouped[d] }));
          Object.keys(grouped).filter(d => !dayOrder.includes(d)).forEach(d => list.push({ day: d, entries: grouped[d] }));
        } else {
          // already grouped object
          list = Object.keys(raw).map((day) => ({ day, entries: raw[day] }));
        }
        setTimetable(list);
      } else {
        setTimetable([]);
        setError(json.message || 'Failed to load timetable');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load timetable when all three selections are made
  useEffect(() => {
    if (branchId && semesterId && sectionId) {
      loadTimetable();
    } else {
      setTimetable([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, semesterId, sectionId]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Timetable</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm block mb-1">Branch</label>
          <select value={branchId} onChange={e => { setBranchId(e.target.value); loadSemesters(e.target.value); }} className="w-full p-2 border rounded">
            <option value="">Select branch</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1">Semester</label>
          <select value={semesterId} onChange={e => { setSemesterId(e.target.value); loadSections(branchId, e.target.value); }} className="w-full p-2 border rounded">
            <option value="">Select semester</option>
            {semesters.map((s: any) => <option key={s.id} value={s.id}>{s.number ?? s.name ?? s.id}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1">Section</label>
          <select value={sectionId} onChange={e => setSectionId(e.target.value)} className="w-full p-2 border rounded">
            <option value="">Select section</option>
            {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Timetable auto-loads when branch, semester and section are selected */}

      {error && <div className="text-red-600">{error}</div>}

      {/* Grid view: MON -> SAT columns */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        {(() => {
          const dayOrder = ['MON','TUE','WED','THU','FRI','SAT'];
          const map: Record<string, any[]> = {};
          timetable.forEach((t: any) => { map[t.day] = t.entries || []; });
          return dayOrder.map((day) => (
            <div key={day} className="p-3 bg-white rounded shadow min-h-[120px]">
              <div className="font-medium mb-2">{day}</div>
              <div className="space-y-2">
                {(map[day] || []).length === 0 ? (
                  <div className="text-sm text-gray-400">No classes</div>
                ) : (
                  (map[day] || []).map((e: any, i: number) => (
                    <div key={i} className="p-2 border rounded">
                      <div className="font-semibold text-sm">{e.subject}</div>
                      <div className="text-xs text-gray-600">{e.faculty}</div>
                      <div className="text-xs text-gray-500">{e.start_time} - {e.end_time} {e.room ? `• ${e.room}` : ''}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

export default DeanTimetable;
