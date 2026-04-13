import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";

// Dean view: load branches -> faculties -> selected faculty profile (attendance, scheduled classes, weekly hours)
const DeanFacultyProfile = ({ facultyId: initialFacultyId }: { facultyId?: string }) => {
  const [branches, setBranches] = useState<Array<any>>([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const [faculties, setFaculties] = useState<Array<any>>([]);
  const [facultiesLoading, setFacultiesLoading] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(initialFacultyId || null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Set default dates to current month on mount
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Load branches on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setBranchLoading(true);
      try {
        const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/branches/`);
        const json = await res.json();
        if (!mounted) return;
        if (json.success) setBranches(json.data || []);
        else setError(json.message || 'Failed to load branches');
      } catch (e: any) {
        setError(e?.message || 'Network error');
      } finally {
        if (mounted) setBranchLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Load faculties when branch changes
  useEffect(() => {
    let mounted = true;
    const loadFaculties = async () => {
      if (!selectedBranch) {
        setFaculties([]);
        return;
      }
      setFacultiesLoading(true);
      try {
        const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/faculties/?branch_id=${selectedBranch}`);
        const json = await res.json();
        if (!mounted) return;
        if (json.success) setFaculties(json.data || []);
        else setError(json.message || 'Failed to load faculties');
      } catch (e: any) {
        setError(e?.message || 'Network error');
      } finally {
        if (mounted) setFacultiesLoading(false);
      }
    };
    loadFaculties();
    return () => { mounted = false; };
  }, [selectedBranch]);

  // Load profile when selectedFaculty changes or dates change
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!selectedFaculty) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let url = `${API_ENDPOINT}/dean/faculty/${selectedFaculty}/profile/`;
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await fetchWithTokenRefresh(url);
        const json = await res.json();
        if (!mounted) return;
        if (json.success) setProfile(json.data || json.profile || null);
        else setError(json.message || 'Failed to load profile');
      } catch (e: any) {
        setError(e?.message || 'Network error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, [selectedFaculty, startDate, endDate]);

  // If initialFacultyId provided, try to select its branch automatically after branches load
  useEffect(() => {
    if (!initialFacultyId) return;
    setSelectedFaculty(initialFacultyId);
  }, [initialFacultyId]);

  const handleDateFilter = () => {
    // Trigger reload by updating state
    setProfile(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Faculty Profile</h2>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <label className="block text-sm text-gray-600">Branch</label>
          <select
            className="w-full p-2 border rounded"
            value={selectedBranch || ''}
            onChange={(e) => setSelectedBranch(e.target.value || null)}
          >
            <option value="">Select branch</option>
            {branches.map((b: any) => (
              <option key={b.branch_id || b.id} value={b.branch_id || b.id}>{b.branch || b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm text-gray-600">Faculty</label>
          <select
            className="w-full p-2 border rounded"
            value={selectedFaculty || ''}
            onChange={(e) => setSelectedFaculty(e.target.value || null)}
            disabled={!selectedBranch || facultiesLoading}
          >
            <option value="">Select faculty</option>
            {faculties.map((f: any) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedFaculty && <div className="p-4">Select a branch and faculty to view profile.</div>}

      {selectedFaculty && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-3">Attendance Report Filters</h3>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleDateFilter}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Apply Filter
            </button>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                handleDateFilter();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear
            </button>
          </div>
          {profile?.attendance_summary?.range && (
            <div className="mt-2 text-sm text-gray-600">
              Showing attendance from {profile.attendance_summary.range.start} to {profile.attendance_summary.range.end}
            </div>
          )}
        </div>
      )}

      {loading && selectedFaculty && <div className="p-4">Loading faculty profile...</div>}
      {error && <div className="p-4 text-red-600">{error}</div>}

      {profile && (
        <div className="p-4 bg-white rounded shadow space-y-4">
          <div>
            <div className="text-lg font-medium">{profile.name}</div>
            <div className="text-sm text-gray-500">{profile.email} {profile.mobile ? `• ${profile.mobile}` : ''}</div>
            <div className="mt-1 text-sm">{profile.designation}</div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded">
              <div className="text-xs text-gray-500">Weekly Scheduled Hours</div>
              <div className="text-lg font-semibold">{profile.total_weekly_hours ?? 0} hrs</div>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <div className="text-xs text-gray-500">Attendance (present)</div>
              <div className="text-lg font-semibold">{profile.attendance_summary?.present ?? 0}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <div className="text-xs text-gray-500">Attendance (absent)</div>
              <div className="text-lg font-semibold">{profile.attendance_summary?.absent ?? 0}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <div className="text-xs text-gray-500">Attendance %</div>
              <div className="text-lg font-semibold">{profile.attendance_summary?.percent_present ?? 'N/A'}</div>
            </div>
          </div>

          <div>
            <h3 className="font-medium">Assignments</h3>
            <ul className="list-disc ml-5">
              {profile.assignments && profile.assignments.length ? profile.assignments.map((a: any, idx: number) => (
                <li key={idx}>{a.subject} — {a.branch} S{a.semester} {a.section}</li>
              )) : <li>No assignments</li>}
            </ul>
          </div>

          <div>
            <h3 className="font-medium">Scheduled Classes (weekly)</h3>
            {profile.scheduled_classes && profile.scheduled_classes.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left"><th>Day</th><th>Time</th><th>Subject</th><th>Section</th><th>Hours</th></tr>
                </thead>
                <tbody>
                  {profile.scheduled_classes.map((s: any) => (
                    <tr key={s.id} className="border-t">
                      <td className="py-1">{s.day}</td>
                      <td className="py-1">{s.start_time} - {s.end_time}</td>
                      <td className="py-1">{s.subject}</td>
                      <td className="py-1">{s.section}</td>
                      <td className="py-1">{s.duration_hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div>No scheduled classes found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeanFacultyProfile;
