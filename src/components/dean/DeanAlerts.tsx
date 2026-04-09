import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";

const DeanAlerts = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/alerts/`);
        const json = await res.json();
        if (!mounted) return;
        if (json.success) setAlerts(json.data || []);
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

  if (loading) return <div className="p-4">Loading alerts...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Alerts</h2>
      <div className="space-y-2">
        {alerts.length === 0 && <div className="p-4 bg-white rounded shadow">No alerts</div>}
        {alerts.map((a: any) => (
          <div key={a.id || a.pk} className="p-3 bg-white rounded shadow">
            <div className="font-medium">{a.title || a.message || 'Alert'}</div>
            <div className="text-xs text-gray-500">{a.created_at || a.timestamp}</div>
            <div className="text-sm mt-1">{a.summary || a.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeanAlerts;
