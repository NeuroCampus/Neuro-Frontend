import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { FileText, Users, Calendar, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { fetchWithTokenRefresh } from "../../utils/authService";
import { API_ENDPOINT } from "../../utils/config";
import { useTheme } from "../../context/ThemeContext";

interface COEStatsProps {
  user: any;
}

const COEStats = ({ user }: COEStatsProps) => {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    total_applications: 0,
    pending_applications: 0,
    approved_applications: 0,
    rejected_applications: 0,
    total_students: 0,
    upcoming_exams: 0,
    recent_activity: []
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    batch: "",
    exam_period: "",
    branch: "",
    semester: ""
  });
  const [filterOptions, setFilterOptions] = useState({
    batches: [],
    branches: [],
    semesters: []
  });

  useEffect(() => {
    fetchFilterOptions();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch available batches, branches, semesters
      const [batchesRes, branchesRes, semestersRes] = await Promise.all([
        fetchWithTokenRefresh(`${API_ENDPOINT}/admin/batches/`, { method: 'GET' }),
        fetchWithTokenRefresh(`${API_ENDPOINT}/admin/branches/`, { method: 'GET' }),
        fetchWithTokenRefresh(`${API_ENDPOINT}/hod/semesters/`, { method: 'GET' })
      ]);

      const batches = await batchesRes.json();
      const branches = await branchesRes.json();
      const semesters = await semestersRes.json();

      setFilterOptions({
        batches: batches.success ? batches.data : [],
        branches: branches.success ? branches.data : [],
        semesters: semesters.success ? semesters.data : []
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchStats = async () => {
    try {
      let url = `${API_ENDPOINT}/coe/dashboard-stats/`;
      const params = new URLSearchParams();

      if (filters.batch) params.append('batch', filters.batch);
      if (filters.exam_period) params.append('exam_period', filters.exam_period);
      if (filters.branch) params.append('branch', filters.branch);
      if (filters.semester) params.append('semester', filters.semester);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetchWithTokenRefresh(url, {
        method: 'GET',
      });
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching COE stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">COE Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          Controller of Examinations
        </Badge>
      </div>

      {/* Filters */}
      <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Batch</label>
              <Select value={filters.batch} onValueChange={(value) => setFilters({...filters, batch: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.batches.map((batch: any) => (
                    <SelectItem key={batch.id} value={batch.id.toString()}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Exam Period</label>
              <Select value={filters.exam_period} onValueChange={(value) => setFilters({...filters, exam_period: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="june_july">June/July</SelectItem>
                  <SelectItem value="jan_feb">January/February</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Branch</label>
              <Select value={filters.branch} onValueChange={(value) => setFilters({...filters, branch: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.branches.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Semester</label>
              <Select value={filters.semester} onValueChange={(value) => setFilters({...filters, semester: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.semesters.map((semester: any) => (
                    <SelectItem key={semester.id} value={semester.id.toString()}>
                      Semester {semester.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_applications}</div>
            <p className="text-xs text-muted-foreground">
              Exam applications received
            </p>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_applications}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved_applications}</div>
            <p className="text-xs text-muted-foreground">
              Applications approved
            </p>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming_exams}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_activity.length > 0 ? (
                stats.recent_activity.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => window.location.href = '/coe/exam-applications'}
            >
              <FileText className="mr-2 h-4 w-4" />
              Review Applications
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => window.location.href = '/coe/reports'}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Reports
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => window.location.href = '/coe/exam-schedule'}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Manage Schedule
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default COEStats;