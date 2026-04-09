import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  TimeScale,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement, TimeScale);

type HodInfo = {
  hod_id: string;
  hod_name: string;
  contact?: string;
  status?: string;
  marked_at?: string | null;
  notes?: string | null;
};

type BranchRow = {
  branch_id: number;
  branch: string;
  hod: HodInfo | null;
  total_students: number;
  present_today: number;
  percent_present: number;
};

const DeanStats = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<BranchRow[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/today-attendance/`, { method: 'GET' });
        const data = await res.json();
        if (!mounted) return;
        if (data.success) {
          setRows(data.data || []);
          setSummary(data.summary || null);
        } else {
          setError(data.message || 'Failed to load');
        }
      } catch (e: any) {
        setError(e?.message || 'Network error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);


  const totalBranches = summary?.total_branches ?? rows.length;
  const totalStudents = summary?.total_students_all ?? rows.reduce((s, r) => s + (r.total_students || 0), 0);
  const totalPresent = summary?.total_present_all ?? rows.reduce((s, r) => s + (r.present_today || 0), 0);
  const overallPercent = totalStudents ? Math.round((totalPresent / totalStudents) * 100) : 0;

  const topBranches = rows
    .slice()
    .sort((a, b) => (b.percent_present || 0) - (a.percent_present || 0))
    .slice(0, 6);

  const pieData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [totalPresent, Math.max(0, totalStudents - totalPresent)],
        backgroundColor: ["#10b981", "#ef4444"],
      },
    ],
  };

  const barData = {
    labels: topBranches.map((b) => b.branch),
    datasets: [
      {
        label: 'Present %',
        data: topBranches.map((b) => b.percent_present || 0),
        backgroundColor: '#6366f1',
      },
    ],
  };

  if (loading) return <div className="p-4">Loading today's attendance...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, max: 100 } },
  };

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white rounded-lg shadow-lg">
          <div className="text-sm opacity-80">Branches</div>
          <div className="text-3xl font-bold">{totalBranches}</div>
          <div className="text-xs mt-2 opacity-90">Active branches in college</div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-lg">
          <div className="text-sm text-gray-500">Total Students</div>
          <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
          <div className="text-xs text-gray-500 mt-2">Enrolled across branches</div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-lg flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Overall Present</div>
            <div className="text-3xl font-bold text-gray-900">{totalPresent} <span className="text-sm text-gray-500">({overallPercent}%)</span></div>
            <div className="text-xs text-gray-500 mt-2">Today</div>
          </div>
          <div className="w-36">
            <Pie data={pieData} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold">Top Branches by Attendance</div>
            <div className="text-sm text-gray-500">Last 24 hours</div>
          </div>
          <div style={{ height: 220 }}>
            <Bar data={barData} options={barOptions} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {topBranches.map((b) => (
              <div key={b.branch_id} className="p-2 bg-gray-50 rounded">
                <div className="text-sm font-medium">{b.branch}</div>
                <div className="text-xs text-gray-500">{b.present_today}/{b.total_students} present</div>
                <div className="w-full bg-gray-200 h-2 rounded mt-2 overflow-hidden">
                  <div style={{ width: `${b.percent_present}%` }} className="h-2 bg-indigo-500"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <div className="text-lg font-semibold mb-3">HODs Attendance Snapshot</div>
          <div className="space-y-3">
            {rows.slice(0, 6).map((r) => (
              <div key={r.branch_id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{r.branch}</div>
                  <div className="text-xs text-gray-500">{r.hod?.hod_name || 'No HOD'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{r.present_today}/{r.total_students}</div>
                  <div className="text-xs text-gray-500">{r.percent_present}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Branch</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">HOD</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Total</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Present</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">%</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((r) => (
              <tr key={r.branch_id}>
                <td className="px-4 py-3 text-sm text-gray-700">{r.branch}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {r.hod ? (
                    <div>
                      <div className="font-medium">{r.hod.hod_name}</div>
                      <div className="text-xs text-gray-500">{r.hod.contact}</div>
                      <div className="text-xs mt-1">Status: <span className={`font-semibold ${r.hod.status === 'present' ? 'text-green-600' : 'text-red-600'}`}>{r.hod.status || 'absent'}</span></div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No HOD</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-700">{r.total_students}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-700">{r.present_today}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-700">{r.percent_present}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeanStats;
