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
          <div className="text-2xl font-semibold">{summary?.total_invoices ?? summary?.total_invoices ?? 0}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Collected</div>
          <div className="text-2xl font-semibold">{summary?.total_payments ?? summary?.total_collected ?? summary?.total_revenue ?? 0}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Outstanding</div>
          <div className="text-2xl font-semibold">{summary?.pending_amount ?? summary?.outstanding ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Department-wise</h3>
          {departmentWise.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500"><th>Department</th><th>Students</th><th>Revenue</th><th>Pending</th></tr>
              </thead>
              <tbody>
                {departmentWise.map((d,i) => (
                  <tr key={i} className="border-t"><td className="py-1">{d.department}</td><td className="py-1">{d.students}</td><td className="py-1">{d.revenue}</td><td className="py-1">{d.pending}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <div>No department data</div>}
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Fee Type-wise</h3>
          {feeTypeWise.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500"><th>Fee Type</th><th>Count</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {feeTypeWise.map((f,i) => (
                  <tr key={i} className="border-t"><td className="py-1">{f.fee_type}</td><td className="py-1">{f.count}</td><td className="py-1">{f.revenue}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <div>No fee type data</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Monthly Trends</h3>
          {monthlyTrends.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500"><th>Month</th><th>Payments</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {monthlyTrends.map((m,i) => (
                  <tr key={i} className="border-t"><td className="py-1">{m.month}</td><td className="py-1">{m.payments}</td><td className="py-1">{m.revenue}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <div>No monthly data</div>}
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Overdue Invoices</h3>
          {overdueInvoices.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500"><th>Invoice</th><th>Student</th><th>USN</th><th>Amount</th><th>Due</th><th>Days</th></tr>
              </thead>
              <tbody>
                {overdueInvoices.map((o,i) => (
                  <tr key={i} className="border-t"><td className="py-1">{o.invoice_number}</td><td className="py-1">{o.student_name}</td><td className="py-1">{o.usn}</td><td className="py-1">{o.amount}</td><td className="py-1">{o.due_date}</td><td className="py-1">{o.days_overdue}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <div>No overdue invoices</div>}
        </div>
      </div>
    </div>
  );
};

export default DeanFinance;
