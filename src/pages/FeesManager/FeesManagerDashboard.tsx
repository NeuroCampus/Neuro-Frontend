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
  Plus
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

interface FeesManagerDashboardProps {
  user: any;
}

const FeesManagerDashboard: React.FC<FeesManagerDashboardProps> = ({ user }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        window.location.href = '/';
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
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fees Manager Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage fee structures, assignments, and monitor collections</p>
      </div>

      {/* Welcome Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Welcome back, {dashboardData?.user?.name || user?.first_name}!
              </h2>
              <p className="text-gray-600">
                {dashboardData?.profile?.designation} • {dashboardData?.profile?.department}
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              Fees Manager
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats?.total_students || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Fee Templates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats?.active_fee_structures || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardData?.stats?.pending_invoices || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Collections</p>
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
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="individual-fees">Individual Fees</TabsTrigger>
          <TabsTrigger value="bulk-assignment">Bulk Assignment</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New fee component created</p>
                      <p className="text-xs text-gray-600">Library Fee Component</p>
                    </div>
                    <span className="text-xs text-gray-500">2h ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Fee template updated</p>
                      <p className="text-xs text-gray-600">B.Tech Semester Template</p>
                    </div>
                    <span className="text-xs text-gray-500">4h ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment received</p>
                      <p className="text-xs text-gray-600">₹25,000 from John Doe</p>
                    </div>
                    <span className="text-xs text-gray-500">1d ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Fee Component
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Fee Template
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign Fees to Students
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Fee Assignment
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Receipt className="h-4 w-4 mr-2" />
                  Generate Invoices
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
                <Button className="w-full justify-start" variant="outline">
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
  );
};

export default FeesManagerDashboard;