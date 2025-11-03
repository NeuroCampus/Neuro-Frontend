import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Calendar,
  IndianRupee,
  BarChart3,
  Settings,
  UserCheck,
  Receipt,
  DollarSign,
  Plus,
  LogOut
} from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import FeeTemplates from './FeeTemplates';
import FeeAssignments from './FeeAssignments';
import FeeComponents from './FeeComponents';
import IndividualFeeAssignment from './IndividualFeeAssignment';
import BulkAssignment from './BulkAssignment';
import InvoiceManagement from './InvoiceManagement';
import PaymentMonitoring from './PaymentMonitoring';
import Reports from './Reports';
import Navbar from '@/components/common/Navbar'; // Added Navbar import

interface User {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string | null;
}

interface DashboardStats {
  total_students?: number;
  active_fee_structures?: number;
  pending_invoices?: number;
  total_collections?: number;
  outstanding_amount?: number;
}

interface DashboardProfile {
  designation?: string;
  department?: string;
}

interface DashboardData {
  user?: {
    name?: string;
  };
  stats?: DashboardStats;
  profile?: DashboardProfile;
}

interface FeesManagerDashboardProps {
  user: User;
  setPage: (page: string) => void;
}

const FeesManagerDashboard: React.FC<FeesManagerDashboardProps> = ({ user, setPage }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview'); // Add this state for tab management

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/fees-manager/dashboard/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.clear();
        setPage("login");
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setPage("login");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="max-w-2xl mx-auto mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Added Navbar */}
      <Navbar 
        role="fees_manager" 
        user={{
          username: user?.username || '',
          email: user?.email || '',
          first_name: user?.first_name || '',
          last_name: user?.last_name || '',
          role: 'fees_manager',
          profile_picture: user?.profile_picture || null
        }}
        setPage={setPage}
      />
      
      {/* Main content with top margin to account for fixed navbar */}
      <div className="container mx-auto p-6 max-w-7xl pt-20 mt-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Fees Manager Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage fee structures, assignments, and monitor collections</p>
        </div>

        {/* Welcome Section */}
        <Card className="mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <IndianRupee className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    Welcome back, {dashboardData?.user?.name || user?.first_name}!
                  </h2>
                  <p className="text-purple-100">
                    {dashboardData?.profile?.designation} • {dashboardData?.profile?.department}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-white/20 text-white px-3 py-1">
                  Fees Manager
                </Badge>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleLogout}
                  className="bg-white text-purple-600 hover:bg-gray-100 border-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold text-foreground">
                    {dashboardData?.stats?.total_students || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Fee Templates</p>
                  <p className="text-2xl font-bold text-foreground">
                    {dashboardData?.stats?.active_fee_structures || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Invoices</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {dashboardData?.stats?.pending_invoices || 0}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Collections</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(dashboardData?.stats?.total_collections || 0)}
                  </p>
                </div>
                <IndianRupee className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Outstanding Amount Alert */}
        {(dashboardData?.stats?.outstanding_amount || 0) > 0 && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Outstanding Amount:</strong> {formatCurrency(dashboardData.stats.outstanding_amount)}
              {' '}from pending invoices. Monitor closely and follow up with students.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 bg-muted border border-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white border border-border">Overview</TabsTrigger>
            <TabsTrigger value="components" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white border border-border">Components</TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white border border-border">Templates</TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white border border-border">Assignments</TabsTrigger>
            <TabsTrigger value="individual-fees" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white border border-border">Individual Fees</TabsTrigger>
            <TabsTrigger value="bulk-assignment" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white border border-border">Bulk Assignment</TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white border border-border">Invoices</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white border border-border">Payments</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white border border-border">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New fee component created</p>
                        <p className="text-xs text-muted-foreground">Library Fee Component</p>
                      </div>
                      <span className="text-xs text-muted-foreground">2h ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Fee template updated</p>
                      <p className="text-xs text-muted-foreground">B.Tech Semester Template</p>
                    </div>
                    <span className="text-xs text-muted-foreground">4h ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment received</p>
                      <p className="text-xs text-muted-foreground">₹25,000 from John Doe</p>
                    </div>
                    <span className="text-xs text-muted-foreground">1d ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab("components")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Fee Component
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab("templates")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Fee Template
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab("individual-fees")}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign Fees to Students
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab("bulk-assignment")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Fee Assignment
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab("invoices")}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Generate Invoices
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab("reports")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab("payments")}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Refunds
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components">
          <FeeComponents />
        </TabsContent>

        <TabsContent value="templates">
          <FeeTemplates />
        </TabsContent>

        <TabsContent value="assignments">
          <FeeAssignments />
        </TabsContent>

        <TabsContent value="individual-fees">
          <IndividualFeeAssignment />
        </TabsContent>

        <TabsContent value="bulk-assignment">
          <BulkAssignment />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceManagement />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentMonitoring />
        </TabsContent>

        <TabsContent value="reports">
          <Reports />
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
};

export default FeesManagerDashboard;