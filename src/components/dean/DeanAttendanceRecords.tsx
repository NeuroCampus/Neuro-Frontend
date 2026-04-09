import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";

const DeanAttendanceRecords = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/attendance-records/?page=${p}`);
      const json = await res.json();
      if (json.success) {
        setRecords(prev => p === 1 ? (json.data || []) : [...prev, ...(json.data || [])]);
        setHasMore((json.next !== null) && (json.data?.length > 0));
      } else {
        setError(json.message || 'Failed to load');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Attendance Records</h2>
      {loading && <div className="p-4">Loading...</div>}
      {error && <div className="p-4 text-red-600">{error}</div>}
      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Present</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-3">{r.date || r.day}</td>
                <td className="px-4 py-3">{r.branch_name || r.branch}</td>
                <td className="px-4 py-3">{r.total_students}</td>
                <td className="px-4 py-3">{r.present_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-outline" onClick={() => { if (page>1) { setPage(p=>p-1); load(page-1); } }} disabled={page===1}>Prev</button>
        <button className="btn btn-primary" onClick={() => { if (hasMore) { setPage(p=>p+1); load(page+1); } }} disabled={!hasMore}>Load more</button>
      </div>
    </div>
  );
};

export default DeanAttendanceRecords;
