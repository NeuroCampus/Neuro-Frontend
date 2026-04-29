import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../common/DashboardLayout';
import { useTheme } from '@/context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  AlertTriangle,
  Calendar,
  IndianRupee,
  BarChart3,
  Settings,
  Receipt,
  DollarSign,
  Plus,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { API_ENDPOINT } from '../../utils/config';

// Sub-components
import FeeTemplates from './FeeTemplates';
import FeeAssignments from './FeeAssignments';
import FeeComponents from './FeeComponents';
import IndividualFeeAssignment from './IndividualFeeAssignment';
import BulkAssignment from './BulkAssignment';
import InvoiceManagement from './InvoiceManagement';
import PaymentMonitoring from './PaymentMonitoring';
import Reports from './Reports';
import StudentFeeReports from './StudentFeeReports';
import FeesManagerLeave from './FeesManagerLeave';
import FeesManagerProfile from './FeesManagerProfile';

interface DashboardStats {
  total_students: number;
  total_collected: number;
  outstanding_amount: number;
  overdue_amount: number;
  collection_rate: number;
  pending_invoices: number;
  overdue_count: number;
}

interface TrendData {
  month: string;
  amount: number;
}

interface Transaction {
  id: number;
  student_name: string;
  amount: number;
  method: string;
  date: string;
  transaction_id: string;
}

interface DashboardData {
  user: { name: string };
  stats: DashboardStats;
  trends: TrendData[];
  recent_transactions: Transaction[];
}

interface FeesManagerDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const FeesManagerDashboard: React.FC<FeesManagerDashboardProps> = ({ user, setPage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getActivePageFromPath = (pathname: string) => {
    const path = pathname.replace('/fees-manager', '').replace('/', '');
    return path || 'dashboard';
  };

  const activePage = getActivePageFromPath(location.pathname);

  useEffect(() => {
    if (activePage === 'dashboard') {
      fetchDashboardData();
    }
  }, [activePage]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_ENDPOINT}/fees-manager/dashboard/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.clear();
        setPage("login");
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      const data = await response.json();
      setDashboardData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: string) => {
    const path = page === 'dashboard' ? '/fees-manager' : `/fees-manager/${page}`;
    navigate(path);
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderDashboard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Finance Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Real-time fee collection insights and institutional liquidity</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => handlePageChange('reports')} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <BarChart3 className="w-4 h-4 mr-2" />
            Detailed Reports
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
            trendUp: true
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
                <div className="flex items-center mt-4 gap-1.5">
                  {stat.trendUp ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-rose-500" />
                  )}
                  <span className={`text-sm font-bold ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stat.trend}
                  </span>
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
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions Sidebar-style */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: "Assign Fees", icon: <Plus className="w-4 h-4" />, page: "bulk-assignment", color: "bg-blue-500" },
                { label: "New Invoices", icon: <FileText className="w-4 h-4" />, page: "invoices", color: "bg-indigo-500" },
                { label: "Add Comp", icon: <Settings className="w-4 h-4" />, page: "components", color: "bg-emerald-500" },
                { label: "Templates", icon: <FileText className="w-4 h-4" />, page: "templates", color: "bg-violet-500" },
                { label: "Refunds", icon: <DollarSign className="w-4 h-4" />, page: "payments", color: "bg-rose-500" },
                { label: "Audit Log", icon: <BarChart3 className="w-4 h-4" />, page: "reports", color: "bg-slate-500" }
              ].map((action, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl transition-all hover:scale-105"
                  onClick={() => handlePageChange(action.page)}
                >
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    {action.icon}
                  </div>
                  <span className="text-xs font-bold">{action.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <IndianRupee className="w-32 h-32" />
            </div>
            <CardContent className="p-6 relative z-10">
              <h4 className="text-lg font-bold mb-2">Need Financial Assistance?</h4>
              <p className="text-blue-100 text-sm mb-4">Generate automated recovery notices for students with overdue balances exceeding ₹10,000.</p>
              <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold" onClick={() => handlePageChange('invoices')}>
                Run Recovery Notice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800">
          <div>
            <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
            <p className="text-sm text-slate-500">Last 5 successful fee collections</p>
          </div>
          <Button variant="ghost" size="sm" className="font-bold text-blue-500 hover:text-blue-600" onClick={() => handlePageChange('payments')}>
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {dashboardData?.recent_transactions.map((txn, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold">{txn.student_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{txn.transaction_id}</code>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-bold capitalize">{txn.method}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{txn.date}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(txn.amount)}
                    </td>
                  </tr>
                ))}
                {!dashboardData?.recent_transactions?.length && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No recent transactions recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return renderDashboard();
      case 'components': return <FeeComponents />;
      case 'templates': return <FeeTemplates />;
      case 'assignments': return <FeeAssignments />;
      case 'individual-fees': return <IndividualFeeAssignment />;
      case 'bulk-assignment': return <BulkAssignment />;
      case 'invoices': return <InvoiceManagement />;
      case 'payments': return <PaymentMonitoring />;
      case 'reports': return <Reports />;
      case 'student-reports': return <StudentFeeReports />;
      case 'leave': return <FeesManagerLeave />;
      case 'profile': return <FeesManagerProfile user={user} />;
      default: return renderDashboard();
    }
  };

  return (
    <DashboardLayout
      role="fees_manager"
      user={user}
      activePage={activePage}
      onPageChange={handlePageChange}
      pageTitle="Fees Manager Dashboard"
    >
      <div key={activePage}>
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default FeesManagerDashboard;