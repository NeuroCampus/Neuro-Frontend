import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../common/DashboardLayout';
import { useTheme } from '@/context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardCard from '../common/DashboardCard';
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
  ArrowRight,
  ClipboardList,
  UserCheck,
  Bell
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
  department_wise: any[];
  fee_type_wise: any[];
  overdue_invoices: any[];
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderDashboard = () => (
    <div className="space-y-8 pb-10">
      {/* Dashboard Cards - Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Collected"
          value={formatCurrency(dashboardData?.stats?.total_collected || 0)}
          description="Cumulative fee collection"
          icon={<IndianRupee className={theme === 'dark' ? "text-emerald-400" : "text-emerald-500"} />}
        />
        <DashboardCard
          title="Outstanding Amount"
          value={formatCurrency(dashboardData?.stats?.outstanding_amount || 0)}
          description="Pending fee balance"
          icon={<AlertTriangle className={theme === 'dark' ? "text-amber-400" : "text-amber-500"} />}
        />
        <DashboardCard
          title="Overdue Amount"
          value={formatCurrency(dashboardData?.stats?.overdue_amount || 0)}
          description="Requires immediate attention"
        />
        <DashboardCard
          title="Collection Rate"
          value={`${dashboardData?.stats?.collection_rate || 0}%`}
          description="Efficiency Target: 95%"
          icon={<TrendingUp className={theme === 'dark' ? "text-blue-400" : "text-blue-500"} />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend Chart */}
        <div className={`lg:col-span-2 rounded-lg shadow p-6 ${theme === 'dark' ? 'border border-border bg-card' : 'border border-gray-200 bg-white'}`}>
          <div className="flex flex-row items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Revenue Trends</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Monthly collection performance</p>
            </div>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none font-bold">Last 6 Months</Badge>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData?.trends || []}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info Card */}
        <div className="space-y-6">
          <div className={`rounded-lg shadow p-6 overflow-hidden relative min-h-[200px] flex flex-col justify-center border transition-all ${
            theme === 'dark' 
              ? 'bg-blue-950/20 border-blue-800/30 text-blue-100' 
              : 'bg-blue-50 border-blue-100 text-blue-900'
          }`}>
            <div className={`absolute -right-4 -bottom-4 opacity-10 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-200'}`}>
              <IndianRupee className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-2">Need Financial Assistance?</h4>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-blue-200/70' : 'text-blue-700/80'}`}>Generate automated recovery notices for students with overdue balances exceeding ₹10,000.</p>
              <Button 
                className="w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                onClick={() => handlePageChange('invoices')}
              >
                Run Recovery Notice
              </Button>
            </div>
          </div>

          <div className={`rounded-lg shadow p-6 ${theme === 'dark' ? 'border border-border bg-card' : 'border border-gray-200 bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Quick Stats</h3>
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Pending Invoices</span>
                <span className="font-bold">{dashboardData?.stats?.pending_invoices || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Overdue Count</span>
                <span className="font-bold text-rose-500">{dashboardData?.stats?.overdue_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Total Students</span>
                <span className="font-bold">{dashboardData?.stats?.total_students || 0}</span>
              </div>
            </div>
          </div>
        </div>
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
              {dashboardData?.department_wise.map((dept, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
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
              {dashboardData?.fee_type_wise.map((fee, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
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
      <div className={`rounded-lg shadow mt-5 overflow-hidden ${theme === 'dark' ? 'border border-border bg-card' : 'border border-gray-200 bg-white'}`}>
        <div className="flex flex-row items-center justify-between p-6 border-b dark:border-slate-800">
          <div>
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Overdue Invoices</h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Pending collections requiring immediate attention</p>
          </div>
          <Button variant="ghost" size="sm" className="font-bold text-rose-500 hover:text-rose-600" onClick={() => handlePageChange('invoices')}>
            Manage All <ArrowRight className="w-4 h-4 ml-1" />
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
                {dashboardData?.overdue_invoices.map((inv, i) => (
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