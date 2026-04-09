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
        const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/today-attendance/`);
        const json = await res.json();
        if (!mounted) return;
        if (json.success) setData(json);
        else setError(json.message || 'Failed to load');
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

  const chartData = (data?.data || []).map((r: any) => ({ name: r.branch, percent: Number(r.percent_present || 0), present: Number(r.present_today || 0) }));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Today's Attendance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow flex flex-col justify-center">
          <div className="text-sm text-gray-500">Present</div>
          <div className="text-3xl font-bold text-green-600">{data?.summary?.total_present_all ?? 0}</div>
          <div className="text-sm text-gray-500 mt-1">Overall: <span className="font-semibold">{data?.summary?.overall_percent_present ?? 0}%</span></div>
          {data?.summary?.admin_present && (
            <div className="mt-2 text-sm text-indigo-600">Admin(s) present today</div>
          )}
        </div>

        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Attendance by Branch (%)</div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percent" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">HOD</th>
              <th className="px-4 py-2 text-right">Present</th>
              <th className="px-4 py-2 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((r: any) => (
              <tr key={r.branch_id} className="border-t">
                <td className="px-4 py-3">{r.branch}</td>
                <td className="px-4 py-3">{r.hod ? r.hod.hod_name : '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">{r.present_today}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">{r.percent_present}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeanAttendance;
