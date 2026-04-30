import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { useTheme } from "../../context/ThemeContext";
import { SkeletonStatsGrid, SkeletonPageHeader, SkeletonCard } from "../ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  AlertCircle, 
  IndianRupee, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { motion } from "framer-motion";

const DeanFinance = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/finance-summary/`);
        const json = await res.json();
        if (!mounted) return;
        if (json.success) {
          setDashboardData(json.data);
        }
        else setError(json.message || 'Failed to load dashboard data');
      } catch (e: any) {
        setError(e?.message || 'Network error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonStatsGrid items={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <SkeletonCard className="lg:col-span-2 h-[400px]" />
          <SkeletonCard className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Finance Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Institutional financial health and fee collection analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Finance Report
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Collected",
            value: formatCurrency(dashboardData?.stats?.total_collected || 0),
            icon: <IndianRupee className="w-6 h-6" />,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            trend: "+12.5%",
            trendUp: true,
            subValue: `Invoices: ${dashboardData?.stats?.total_invoices || 0}`
          },
          {
            label: "Outstanding",
            value: formatCurrency(dashboardData?.stats?.outstanding_amount || 0),
            icon: <AlertTriangle className="w-6 h-6" />,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            trend: "-2.4%",
            trendUp: false
          },
          {
            label: "Overdue Amount",
            value: formatCurrency(dashboardData?.stats?.overdue_amount || 0),
            icon: <Clock className="w-6 h-6" />,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            trend: "Requires Attention",
            trendUp: false
          },
          {
            label: "Collection Rate",
            value: `${dashboardData?.stats?.collection_rate || 0}%`,
            icon: <TrendingUp className="w-6 h-6" />,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            trend: "Target: 95%",
            trendUp: true
          }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
              <div className="relative z-10">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} w-fit mb-4`}>
                  {stat.icon}
                </div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</h3>
                <div className="flex items-center mt-4 justify-between">
                   <div className="flex items-center gap-1.5">
                    {stat.trendUp ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                        <ArrowDownRight className="w-4 h-4 text-rose-500" />
                    )}
                    <span className={`text-sm font-bold ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stat.trend}
                    </span>
                   </div>
                   {stat.subValue && <span className="text-xs text-slate-400 font-medium">{stat.subValue}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Revenue Trends</CardTitle>
              <p className="text-sm text-slate-500">Monthly collection performance</p>
            </div>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none font-bold">Last 6 Months</Badge>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData?.trends || []}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Insights/Actions */}
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
               <h4 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4" />
                 Collection Target
               </h4>
               <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">Institutional target is 95%. Current rate is at {dashboardData?.stats?.collection_rate}%.</p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Summary Highlights</h4>
              <div className="flex justify-between items-center py-2 border-b dark:border-slate-800">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Students</span>
                <span className="font-bold">{dashboardData?.stats?.total_students}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b dark:border-slate-800">
                <span className="text-sm text-slate-600 dark:text-slate-400">Pending Invoices</span>
                <span className="font-bold text-amber-500">{dashboardData?.stats?.pending_invoices}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Overdue Count</span>
                <span className="font-bold text-rose-500">{dashboardData?.stats?.overdue_count}</span>
              </div>
            </div>

            <Button variant="outline" className="w-full border-slate-200 dark:border-slate-700 font-bold group">
                View Full Audit Logs
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

       {/* Breakdowns */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Department-wise Breakdown</CardTitle>
            <p className="text-sm text-slate-500">Revenue and pending by department</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.department_wise.map((dept: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{dept.department}</h4>
                    <p className="text-xs text-slate-500 font-medium">Students: {dept.students}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 dark:text-white">{formatCurrency(dept.revenue)}</p>
                    <p className="text-xs text-rose-500 font-bold">Pending: {formatCurrency(dept.pending)}</p>
                  </div>
                </div>
              ))}
              {!dashboardData?.department_wise?.length && (
                <p className="text-center py-6 text-slate-400 italic">No department data available.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Fee Type-wise Breakdown</CardTitle>
            <p className="text-sm text-slate-500">Distribution by invoice type</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.fee_type_wise.map((fee: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white capitalize">{fee.fee_type.replace('_', ' ')}</h4>
                    <p className="text-xs text-slate-500 font-medium">Invoices: {fee.count}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 dark:text-white">{formatCurrency(fee.revenue)}</p>
                  </div>
                </div>
              ))}
              {!dashboardData?.fee_type_wise?.length && (
                <p className="text-center py-6 text-slate-400 italic">No fee type data available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800">
          <div>
            <CardTitle className="text-xl font-bold">Overdue Invoices</CardTitle>
            <p className="text-sm text-slate-500">Pending collections requiring immediate attention</p>
          </div>
          <Button variant="ghost" size="sm" className="font-bold text-rose-500 hover:text-rose-600">
            View All Reports <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Invoice</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Overdue</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {dashboardData?.overdue_invoices.map((inv: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-bold">{inv.invoice_number}</code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{inv.student_name}</div>
                      <div className="text-xs text-slate-500">{inv.usn}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{inv.due_date}</td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-none font-bold">
                        {inv.days_overdue} days
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-rose-600 dark:text-rose-400">
                      {formatCurrency(inv.amount)}
                    </td>
                  </tr>
                ))}
                {!dashboardData?.overdue_invoices?.length && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No overdue invoices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DeanFinance;
