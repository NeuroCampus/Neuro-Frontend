import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DeanAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('hod');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedPersonSummary, setSelectedPersonSummary] = useState<any>(null);
  const [personLoading, setPersonLoading] = useState<boolean>(false);

  const fetchData = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      let url = `${API_ENDPOINT}/dean/reports/hod-admin-attendance/`;
      if (start && end) {
        url += `?start_date=${start}&end_date=${end}`;
      }
      const resSummary = await fetchWithTokenRefresh(url);
      const jsonSummary = await resSummary.json();
      if (!jsonSummary.success) {
        setError(jsonSummary.message || 'Failed to load HOD/admin summary');
        return;
      }
      setData(jsonSummary);
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      await fetchData();
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleFilter = () => {
    if (startDate && endDate) {
      fetchData(startDate, endDate);
    } else {
      fetchData();
    }
  };

  // Fetch selected HOD's attendance summary when selection or date range changes
  useEffect(() => {
    let mounted = true;
    const loadPerson = async () => {
      setSelectedPersonSummary(null);
      if (!selectedPersonId || selectedRole !== 'hod') return;
      setPersonLoading(true);
      try {
        let url = `${API_ENDPOINT}/dean/faculty/${selectedPersonId}/profile/`;
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (params.toString()) url += `?${params.toString()}`;
        const res = await fetchWithTokenRefresh(url);
        const json = await res.json();
        if (!mounted) return;
        if (json.success) {
          const profile = json.data || json.profile || null;
          setSelectedPersonSummary(profile?.attendance_summary || null);
        }
      } catch (e: any) {
        // silent: keep UI stable; error already shown in main fetch
      } finally {
        if (mounted) setPersonLoading(false);
      }
    };
    loadPerson();
    return () => { mounted = false; };
  }, [selectedPersonId, selectedRole, startDate, endDate]);

  const isMonthly = data?.summary?.period;


  if (loading) return <div className="p-4">Loading attendance...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  const hodList = data?.summary?.hods || [];
  const totalHods = data?.summary?.total_hods ?? hodList.length;

  let hodPresentCount, hodAbsentCount;
  if (isMonthly) {
    hodPresentCount = data?.summary?.hod_present_total ?? 0;
    hodAbsentCount = data?.summary?.hod_absent_total ?? 0;
  } else {
    hodPresentCount = data?.summary?.hod_present_count ?? hodList.filter((h: any) => h.status === 'present').length;
    hodAbsentCount = totalHods - hodPresentCount;
  }

  const adminPresentCount = data?.summary?.admin_present_count ?? 0;
  const adminList = data?.summary?.admin_present_list || [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">HOD & Admin Attendance</h2>

      {/* Date Filters */}
      <div className="bg-white p-4 rounded shadow">
        <div className="flex flex-wrap gap-4 items-end">
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
            onClick={handleFilter}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Filter
          </button>
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              fetchData();
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Clear
          </button>
          {/* Role + Person selector */}
          <div className="ml-4">
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select value={selectedRole} onChange={(e) => { setSelectedRole(e.target.value); setSelectedPersonId(null); }} className="mt-1 block px-3 py-2 border border-gray-300 rounded-md">
              <option value="hod">HOD</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Select</label>
            <select value={selectedPersonId || ''} onChange={(e) => setSelectedPersonId(e.target.value || null)} className="mt-1 block px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Select a person</option>
              {selectedRole === 'hod' && hodList.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name} {h.branch ? `• ${h.branch}` : ''}</option>
              ))}
              {selectedRole === 'admin' && (data?.summary?.admin_present_list || []).map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>
        {isMonthly && (
          <div className="mt-2 text-sm text-gray-600">
            Showing data from {data.summary.period.start_date} to {data.summary.period.end_date} ({data.summary.period.total_days} days)
          </div>
        )}
      </div>

      {/* Selected person summary (shows immediately under filters when a person is selected) */}
      {selectedPersonId && selectedPersonSummary && (
        <div className="mt-4 bg-white p-4 rounded shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-500">Selected</div>
              <div className="text-lg font-semibold">{(selectedRole === 'hod' ? (hodList.find((h: any) => h.id === selectedPersonId)?.name) : (adminList.find((a: any) => a.id === selectedPersonId)?.name)) || 'Selected Person'}</div>
              <div className="text-sm text-gray-500">{selectedRole === 'hod' ? (hodList.find((h: any) => h.id === selectedPersonId)?.branch) : (adminList.find((a: any) => a.id === selectedPersonId)?.email || adminList.find((a: any) => a.id === selectedPersonId)?.mobile)}</div>
            </div>
            <div className="text-sm text-gray-500 text-right">
              <div>Range days</div>
              <div className="text-lg font-semibold">{selectedPersonSummary?.total_days ?? (isMonthly ? data.summary.period.total_days : '-')}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-100">
              <div className="text-sm text-blue-600">Weekly Hours</div>
              <div className="text-2xl font-bold text-blue-900">{selectedPersonSummary?.weekly_hours ?? 0}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-100">
              <div className="text-sm text-green-600">Present Days</div>
              <div className="text-2xl font-bold text-green-900">{selectedPersonSummary?.present_days ?? 0}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-100">
              <div className="text-sm text-red-600">Absent Days</div>
              <div className="text-2xl font-bold text-red-900">{selectedPersonSummary?.absent_days ?? 0}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-100">
              <div className="text-sm text-purple-600">Attendance %</div>
              <div className="text-2xl font-bold text-purple-900">{selectedPersonSummary?.percent_present ?? 'N/A'}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-100">
              <div className="text-sm text-yellow-600">Leave Days</div>
              <div className="text-2xl font-bold text-yellow-900">{selectedPersonSummary?.leave_days ?? 0}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-100">
              <div className="text-sm text-amber-600">Unmarked Days</div>
              <div className="text-2xl font-bold text-amber-900">{selectedPersonSummary?.unmarked_days ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">HODs Present {isMonthly ? 'Days' : ''}</div>
          <div className="text-3xl font-bold text-green-600">{hodPresentCount}</div>
          <div className="text-sm text-gray-500 mt-1">Total HODs: <span className="font-semibold">{totalHods}</span></div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">HODs Absent {isMonthly ? 'Days' : ''}</div>
          <div className="text-3xl font-bold text-red-600">{hodAbsentCount}</div>
          <div className="text-sm text-gray-500 mt-1">{isMonthly ? 'Absent days in period' : 'Absent today'}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Admins Present</div>
          <div className="text-3xl font-bold text-indigo-600">{adminPresentCount}</div>
          <div className="text-sm text-gray-500 mt-1">Admin presence {isMonthly ? 'in period' : '(today)'}</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Admins Absent</div>
          <div className="text-3xl font-bold text-gray-800">—</div>
          <div className="text-sm text-gray-500 mt-1">(not tracked)</div>
        </div>
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4">
          <div className="text-lg font-semibold mb-3">HODs — {isMonthly ? 'Monthly Report' : 'Today'}</div>
          <div className="grid grid-cols-1 gap-3">
            {hodList.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{h.name}</div>
                  {isMonthly ? (
                    <div className="text-xs text-gray-500">
                      Present: {h.present_days} days • Absent: {h.absent_days} days • Branch: {h.branch}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {h.status === 'present' ? 'Present' : 'Absent'}{h.marked_at ? ` • ${new Date(h.marked_at).toLocaleTimeString()}` : ''}
                    </div>
                  )}
                </div>
                <div>
                  {isMonthly ? (
                    <div className="text-xs">
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 mr-1">
                        P: {h.present_days}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-red-100 text-red-800">
                        A: {h.absent_days}
                      </span>
                    </div>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${h.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {h.status === 'present' ? 'Present' : 'Absent'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <div className="text-lg font-semibold mb-3">Admins — {isMonthly ? 'In Period' : 'Today'}</div>
          <div className="grid grid-cols-1 gap-3">
            {adminList.length > 0 ? adminList.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-gray-500">{a.email || a.mobile || ''}</div>
                </div>
                <div>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">Present</span>
                </div>
              </div>
            )) : <div className="text-sm text-gray-500">No admin users {isMonthly ? 'present in the selected period' : 'present today'}.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeanAttendance;
