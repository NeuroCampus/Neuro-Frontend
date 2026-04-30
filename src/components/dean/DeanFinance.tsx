import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { useTheme } from "../../context/ThemeContext";
import { SkeletonStatsGrid, SkeletonPageHeader, SkeletonCard, SkeletonList } from "../ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { TrendingUp, AlertCircle, CreditCard, Wallet, FileText } from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { Badge } from "@/components/ui/badge";

const DeanFinance = () => {
  const { theme } = useTheme();
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


  return (
    <div className={` ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <Card className={theme === 'dark' ? 'bg-card border border-border shadow-md' : 'bg-white border border-gray-200 shadow-md'}>
        <CardContent className="px-6 pb-6 pt-2 space-y-6">
          {loading ? (
            <div className="space-y-6">
              <SkeletonStatsGrid items={3} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonCard className="h-64" />
                <SkeletonCard className="h-64" />
                <SkeletonCard className="h-64" />
                <SkeletonCard className="h-64" />
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-muted/30 border-border' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Total Invoices</div>
                  </div>
                  <div className="text-3xl font-bold">{summary?.total_invoices ?? 0}</div>
                </div>
                <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-muted/30 border-border' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600'}`}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Total Collected</div>
                  </div>
                  <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>₹{(summary?.total_collected ?? 0).toLocaleString()}</div>
                </div>
                <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-muted/30 border-border' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Outstanding</div>
                  </div>
                  <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>₹{(summary?.outstanding ?? 0).toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-muted/30 border-border' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className="text-lg font-semibold mb-4">Department-wise</h3>
                  {departmentWise.length ? (
                    <div className="space-y-3">
                      {departmentWise.map((d,i) => (
                        <div key={i} className={`flex items-center justify-between border-t pt-3 first:border-t-0 first:pt-0 ${theme === 'dark' ? 'border-border' : 'border-gray-100'}`}>
                          <div>
                            <div className="font-semibold">{d.department}</div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Students: {d.students}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">₹{(d.revenue ?? 0).toLocaleString()}</div>
                            <div className="text-xs text-red-500 font-medium">Pending: ₹{(d.pending ?? 0).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-center py-6 text-gray-500 italic">No department data</div>}
                </div>

                <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-muted/30 border-border' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className="text-lg font-semibold mb-4">Fee Type-wise</h3>
                  {feeTypeWise.length ? (
                    <div className="space-y-3">
                      {feeTypeWise.map((f,i) => (
                        <div key={i} className={`flex items-center justify-between border-t pt-3 first:border-t-0 first:pt-0 ${theme === 'dark' ? 'border-border' : 'border-gray-100'}`}>
                          <div>
                            <div className="font-semibold">{f.fee_type}</div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Invoices: {f.count}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">₹{(f.revenue ?? 0).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-center py-6 text-gray-500 italic">No fee type data</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-muted/30 border-border' : 'bg-gray-50 border-gray-200'} lg:col-span-2`}>
                  <div className="flex flex-row items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Revenue Trends</h3>
                      <p className="text-sm text-slate-500">Monthly collection performance</p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none font-bold">Last 6 Months</Badge>
                  </div>
                  <div className="h-[350px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrends}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-muted/30 border-border' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className="text-lg font-semibold mb-4">Overdue Invoices</h3>
                  {overdueInvoices.length ? (
                    <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
                      {overdueInvoices.map((o,i) => (
                        <div key={i} className={`flex items-center justify-between border-t pt-3 first:border-t-0 first:pt-0 ${theme === 'dark' ? 'border-border' : 'border-gray-100'}`}>
                          <div className="flex-1">
                            <div className="font-semibold">{o.invoice_number}</div>
                            <div className="text-sm truncate max-w-[150px]">{o.student_name}</div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{o.usn}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-500">₹{(o.amount ?? 0).toLocaleString()}</div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Due: {o.due_date}</div>
                            <div className="text-xs text-orange-500 font-medium">{o.days_overdue} days overdue</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-center py-6 text-gray-500 italic">No overdue invoices</div>}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeanFinance;
