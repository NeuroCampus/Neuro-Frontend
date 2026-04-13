import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DeanAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Fetch compact HOD/Admin attendance summary (includes full hods list)
        const resSummary = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/hod-admin-attendance/`);
        const jsonSummary = await resSummary.json();
        if (!mounted) return;
        if (!jsonSummary.success) {
          setError(jsonSummary.message || 'Failed to load HOD/admin summary');
          return;
        }
        setData(jsonSummary);
      } catch (e: any) {
        setError(e?.message || 'Network error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-4">Loading attendance...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  // Use hod list returned by endpoint (full list with present/absent status)
  const hodList = data?.summary?.hods || [];
  const totalHods = data?.summary?.total_hods ?? hodList.length;
  const hodPresentCount = data?.summary?.hod_present_count ?? hodList.filter((h: any) => h.status === 'present').length;
  const hodAbsentCount = totalHods - hodPresentCount;

  const adminPresentCount = data?.summary?.admin_present_count ?? 0;
  const adminList = data?.summary?.admin_present_list || [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">HOD & Admin Attendance</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">HODs Present</div>
          <div className="text-3xl font-bold text-green-600">{hodPresentCount}</div>
          <div className="text-sm text-gray-500 mt-1">Total HODs: <span className="font-semibold">{totalHods}</span></div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">HODs Absent</div>
          <div className="text-3xl font-bold text-red-600">{hodAbsentCount}</div>
          <div className="text-sm text-gray-500 mt-1">Absent today</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Admins Present</div>
          <div className="text-3xl font-bold text-indigo-600">{adminPresentCount}</div>
          <div className="text-sm text-gray-500 mt-1">Admin presence (today)</div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Admins Absent</div>
          <div className="text-3xl font-bold text-gray-800">—</div>
          <div className="text-sm text-gray-500 mt-1">(not tracked)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4">
          <div className="text-lg font-semibold mb-3">HODs — Today</div>
          <div className="grid grid-cols-1 gap-3">
            {hodList.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{h.name}</div>
                  <div className="text-xs text-gray-500">{h.status === 'present' ? 'Present' : 'Absent'}{h.marked_at ? ` • ${new Date(h.marked_at).toLocaleTimeString()}` : ''}</div>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${h.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {h.status === 'present' ? 'Present' : 'Absent'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <div className="text-lg font-semibold mb-3">Admins — Today</div>
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
            )) : <div className="text-sm text-gray-500">No admin users present today.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeanAttendance;
