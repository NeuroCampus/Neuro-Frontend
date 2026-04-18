import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { useTheme } from "../../context/ThemeContext";
import { FaUserTie, FaUserCheck, FaUserSlash, FaUserShield } from "react-icons/fa";

const DeanAttendance = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resSummary = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/hod-admin-attendance/`);
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

  const isMonthly = data?.summary?.period;


  if (loading) return <div className={`text-center py-6 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'} animate-pulse`}>Loading attendance...</div>;
  if (error) return <div className={`text-center py-6 ${theme === 'dark' ? 'text-destructive' : 'text-red-600'}`}>{error}</div>;

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

  const statCardClass = theme === 'dark'
    ? 'rounded-lg border border-border bg-card p-4 shadow'
    : 'rounded-lg border border-gray-200 bg-white p-4 shadow';

  return (
    <div className={`space-y-4 px-4 pb-4 pt-1 md:px-5 md:pb-5 md:pt-2 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={statCardClass}>
          <div className="flex items-start justify-between">
            <div>
              <div className={theme === 'dark' ? 'text-sm text-muted-foreground' : 'text-sm text-gray-500'}>HODs Present {isMonthly ? 'Days' : ''}</div>
              <div className={theme === 'dark' ? 'text-3xl font-bold text-foreground mt-2' : 'text-3xl font-bold text-gray-900 mt-2'}>{hodPresentCount}</div>
              <div className={theme === 'dark' ? 'text-sm text-muted-foreground mt-2' : 'text-sm text-gray-500 mt-2'}>Total HODs: {totalHods}</div>
            </div>
            <FaUserTie className={theme === 'dark' ? 'text-green-400 text-3xl' : 'text-green-500 text-3xl'} />
          </div>
        </div>

        <div className={statCardClass}>
          <div className="flex items-start justify-between">
            <div>
              <div className={theme === 'dark' ? 'text-sm text-muted-foreground' : 'text-sm text-gray-500'}>HODs Absent {isMonthly ? 'Days' : ''}</div>
              <div className={theme === 'dark' ? 'text-3xl font-bold text-foreground mt-2' : 'text-3xl font-bold text-gray-900 mt-2'}>{hodAbsentCount}</div>
              <div className={theme === 'dark' ? 'text-sm text-muted-foreground mt-2' : 'text-sm text-gray-500 mt-2'}>{isMonthly ? 'Absent days in period' : 'Absent today'}</div>
            </div>
            <FaUserSlash className={theme === 'dark' ? 'text-red-400 text-3xl' : 'text-red-500 text-3xl'} />
          </div>
        </div>

        <div className={statCardClass}>
          <div className="flex items-start justify-between">
            <div>
              <div className={theme === 'dark' ? 'text-sm text-muted-foreground' : 'text-sm text-gray-500'}>Admins Present</div>
              <div className={theme === 'dark' ? 'text-3xl font-bold text-foreground mt-2' : 'text-3xl font-bold text-gray-900 mt-2'}>{adminPresentCount}</div>
              <div className={theme === 'dark' ? 'text-sm text-muted-foreground mt-2' : 'text-sm text-gray-500 mt-2'}>Admin presence {isMonthly ? 'in period' : '(today)'}</div>
            </div>
            <FaUserShield className={theme === 'dark' ? 'text-indigo-400 text-3xl' : 'text-indigo-500 text-3xl'} />
          </div>
        </div>

        <div className={statCardClass}>
          <div className="flex items-start justify-between">
            <div>
              <div className={theme === 'dark' ? 'text-sm text-muted-foreground' : 'text-sm text-gray-500'}>Admins Absent</div>
              <div className={theme === 'dark' ? 'text-3xl font-bold text-foreground mt-2' : 'text-3xl font-bold text-gray-900 mt-2'}>—</div>
              <div className={theme === 'dark' ? 'text-sm text-muted-foreground mt-2' : 'text-sm text-gray-500 mt-2'}>(not tracked)</div>
            </div>
            <FaUserCheck className={theme === 'dark' ? 'text-gray-400 text-3xl' : 'text-gray-500 text-3xl'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`rounded-lg shadow p-6 ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
          <div className="text-lg font-semibold mb-3">HODs — {isMonthly ? 'Monthly Report' : 'Today'}</div>
          <div className="grid grid-cols-1 gap-3">
            {hodList.map((h) => (
              <div key={h.id} className={`flex items-center justify-between p-3 rounded ${theme === 'dark' ? 'bg-muted' : 'bg-gray-50'}`}>
                <div>
                  <div className="font-medium">{h.name}</div>
                  {isMonthly ? (
                    <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                      Present: {h.present_days} days • Absent: {h.absent_days} days • Branch: {h.branch}
                    </div>
                  ) : (
                    <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
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

        <div className={`rounded-lg shadow p-6 ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
          <div className="text-lg font-semibold mb-3">Admins — {isMonthly ? 'In Period' : 'Today'}</div>
          <div className="grid grid-cols-1 gap-3">
            {adminList.length > 0 ? adminList.map((a: any) => (
              <div key={a.id} className={`flex items-center justify-between p-3 rounded ${theme === 'dark' ? 'bg-muted' : 'bg-gray-50'}`}>
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{a.email || a.mobile || ''}</div>
                </div>
                <div>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">Present</span>
                </div>
              </div>
            )) : <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No admin users {isMonthly ? 'present in the selected period' : 'present today'}.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeanAttendance;
