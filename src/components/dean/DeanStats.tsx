import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";

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

  if (loading) return <div className="p-4">Loading today's attendance...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Branches</div>
          <div className="text-2xl font-semibold">{summary?.total_branches ?? rows.length}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Students</div>
          <div className="text-2xl font-semibold">{summary?.total_students_all ?? 0}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Overall Present</div>
          <div className="text-2xl font-semibold">{summary?.total_present_all ?? 0} ({summary?.overall_percent_present ?? 0}%)</div>
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
                      <div className="text-xs mt-1">Status: <span className="font-semibold">{r.hod.status}</span></div>
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
