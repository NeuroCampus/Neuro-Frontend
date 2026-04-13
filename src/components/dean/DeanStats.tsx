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
  faculty?: number;
};

const DeanStats = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<BranchRow[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [roleDistribution, setRoleDistribution] = useState<{[k:string]:number} | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/today-attendance/`, { method: 'GET' });
        const data = await res.json();
        if (!mounted) return;
        if (data.success) {
          // Backend may return either attendance rows + summary or a summary object with branch_distribution
            // Backend may return two shapes:
            // 1) compact: { success: true, summary: { ... } }
            // 2) full: { success: true, data: [...], summary: { ... } }
            if (data.summary) {
              const s = data.summary || {};
              setSummary(s);
              if (s.role_distribution) setRoleDistribution(s.role_distribution);
              // populate rows from summary.branch_distribution when available
              const branches = (s.branch_distribution || []).map((b: any, idx: number) => ({
                branch_id: idx + 1,
                branch: b.name,
                hod: null,
                total_students: b.students || 0,
                faculty: b.faculty || 0,
                present_today: 0,
                percent_present: 0,
              }));
              setRows(branches);
            } else {
              const payload = data.data || {};
              // If payload is an array of rows (old format)
              if (Array.isArray(payload)) {
                setRows(payload || []);
                setSummary(data.summary || null);
                if (data.summary && data.summary.role_distribution) setRoleDistribution(data.summary.role_distribution);
              } else {
                const s = payload || {};
                setSummary(s);
                const branches = (s.branch_distribution || []).map((b: any, idx: number) => ({
                  branch_id: idx + 1,
                  branch: b.name,
                  hod: null,
                  total_students: b.students || 0,
                  faculty: b.faculty || 0,
                  present_today: 0,
                  percent_present: 0,
                }));
                setRows(branches);
                if (s.role_distribution) setRoleDistribution(s.role_distribution);
              }
            }
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
  const totalStudents = summary?.total_students ?? summary?.total_students_all ?? rows.reduce((s, r) => s + (r.total_students || 0), 0);
  const totalFaculty = summary?.total_faculty ?? rows.reduce((s, r) => s + (r.faculty || 0), 0);
  const totalHods = summary?.total_hods ?? 0;
  const totalCoe = summary?.total_coe ?? 0;
  const totalPresent = summary?.total_present_all ?? rows.reduce((s, r) => s + (r.present_today || 0), 0);
  const overallPercent = totalStudents ? Math.round((totalPresent / totalStudents) * 100) : 0;
  
  // Prefer summary.branch_distribution when available (backend summary-only payload)
  const branchStats = (summary && Array.isArray(summary.branch_distribution))
    ? summary.branch_distribution.map((b: any, idx: number) => ({
        branch_id: idx + 1,
        branch: b.name,
        total_students: b.students || 0,
        faculty: b.faculty || 0,
      }))
    : rows.map((r) => ({ branch_id: r.branch_id, branch: r.branch, total_students: r.total_students || 0, faculty: r.faculty || 0 }));
  
  const topBranches = branchStats.slice().sort((a, b) => (b.total_students || 0) - (a.total_students || 0)).slice(0, 6);

  // Pie: use roleDistribution if provided, otherwise fallback to present/absent pie
  const pieData = roleDistribution
    ? {
        labels: Object.keys(roleDistribution),
        datasets: [
          {
            data: Object.values(roleDistribution),
            backgroundColor: ['#60a5fa', '#34d399', '#f97316', '#ef4444'],
          },
        ],
      }
    : {
        labels: ['Present', 'Absent'],
        datasets: [
          {
            data: [totalPresent, Math.max(0, totalStudents - totalPresent)],
            backgroundColor: ['#10b981', '#ef4444'],
          },
        ],
      };

  const barData = {
    labels: branchStats.map((b) => b.branch),
    datasets: [
      {
        label: 'Students',
        data: branchStats.map((b) => b.total_students || 0),
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

        <div className="p-4 bg-white rounded-lg shadow-lg">
          <div className="text-sm text-gray-500">Total Faculty</div>
          <div className="text-2xl font-bold text-gray-900">{totalFaculty}</div>
          <div className="text-xs text-gray-500 mt-2">Teaching staff</div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-lg">
          <div className="text-sm text-gray-500">HODs</div>
          <div className="text-2xl font-bold text-gray-900">{totalHods}</div>
          <div className="text-xs text-gray-500 mt-2">Department heads</div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-lg flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">COE</div>
            <div className="text-2xl font-bold text-gray-900">{totalCoe}</div>
            <div className="text-xs text-gray-500 mt-2">Controller of exams</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded shadow p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold">Students by Branch</div>
            <div className="text-sm text-gray-500">Current snapshot</div>
          </div>
          <div className="flex-1">
            <div className="h-72 lg:h-96">
              <Bar data={barData} options={{ ...barOptions, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        <div className="col-span-1 bg-white rounded shadow p-4 overflow-auto" style={{ maxHeight: '26rem' }}>
          <div className="text-lg font-semibold mb-3">Top Branches</div>
          <ul className="space-y-3">
            {topBranches.map((b) => (
              <li key={b.branch_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="text-sm font-medium">{b.branch}</div>
                  <div className="text-xs text-gray-500">{b.total_students} students • {b.faculty || 0} faculty</div>
                </div>
                <div className="w-24">
                  <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
                    <div style={{ width: `${Math.min(100, Math.round((b.total_students / (totalStudents || 1)) * 100))}%` }} className="h-2 bg-indigo-500" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Branch</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Students</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Faculty</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((r) => (
              <tr key={r.branch_id}>
                <td className="px-4 py-3 text-sm text-gray-700">{r.branch}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{r.total_students}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{r.faculty ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeanStats;
