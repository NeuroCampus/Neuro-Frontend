import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";

const DeanFinance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [departmentWise, setDepartmentWise] = useState<any[]>([]);
  const [feeTypeWise, setFeeTypeWise] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/finance-summary/`);
        const json = await res.json();
        if (!mounted) return;
        if (json.success) {
          const data = json.data || {};
          // normalize shapes: some responses put metrics under data.summary
          const s = data.summary || data || {};
          setSummary(s);
          setDepartmentWise(data.department_wise || data.departmentWise || []);
          setFeeTypeWise(data.fee_type_wise || data.feeTypeWise || []);
          setMonthlyTrends(data.monthly_trends || data.monthlyTrends || []);
          setOverdueInvoices(data.overdue_invoices || data.overdueInvoices || []);
        }
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

  if (loading) return <div className="p-4">Loading finance summary...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Finance Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Invoices</div>
          <div className="text-2xl font-semibold">{summary?.total_invoices ?? 0}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Collected</div>
          <div className="text-2xl font-semibold">{(summary?.total_collected ?? 0).toLocaleString()}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Outstanding</div>
          <div className="text-2xl font-semibold">{(summary?.outstanding ?? 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Department-wise</h3>
          {departmentWise.length ? (
            <div className="space-y-2">
              {departmentWise.map((d,i) => (
                <div key={i} className="flex items-center justify-between border-t py-2">
                  <div className="font-medium">{d.department}</div>
                  <div className="text-sm text-gray-600">Students: {d.students}</div>
                  <div className="text-sm font-semibold">{(d.revenue ?? 0).toLocaleString()}</div>
                  <div className="text-sm text-red-600">{(d.pending ?? 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : <div>No department data</div>}
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Fee Type-wise</h3>
          {feeTypeWise.length ? (
            <div className="space-y-2">
              {feeTypeWise.map((f,i) => (
                <div key={i} className="flex items-center justify-between border-t py-2">
                  <div className="font-medium">{f.fee_type}</div>
                  <div className="text-sm text-gray-600">Count: {f.count}</div>
                  <div className="text-sm font-semibold">{(f.revenue ?? 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : <div>No fee type data</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Monthly Trends</h3>
          {monthlyTrends.length ? (
            <div className="space-y-2">
              {monthlyTrends.map((m,i) => (
                <div key={i} className="flex items-center justify-between border-t py-2">
                  <div className="font-medium">{m.month}</div>
                  <div className="text-sm text-gray-600">Payments: {m.payments}</div>
                  <div className="text-sm font-semibold">{(m.revenue ?? 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : <div>No monthly data</div>}
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Overdue Invoices</h3>
          {overdueInvoices.length ? (
            <div className="space-y-2">
              {overdueInvoices.map((o,i) => (
                <div key={i} className="flex items-center justify-between border-t py-2">
                  <div className="font-medium">{o.invoice_number}</div>
                  <div className="text-sm">{o.student_name} ({o.usn})</div>
                  <div className="text-sm font-semibold text-red-600">{(o.amount ?? 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{o.due_date}</div>
                  <div className="text-sm text-gray-500">{o.days_overdue}d</div>
                </div>
              ))}
            </div>
          ) : <div>No overdue invoices</div>}
        </div>
      </div>
    </div>
  );
};

export default DeanFinance;
