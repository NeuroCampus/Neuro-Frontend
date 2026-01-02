import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { BookOpen, Users, TrendingUp, Download, BarChart3 } from "lucide-react";
import { fetchWithTokenRefresh } from "../../utils/authService";
import { API_ENDPOINT } from "../../utils/config";
import { useTheme } from "../../context/ThemeContext";

const CourseStatistics = () => {
  const { theme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
  }, []);

  useEffect(() => {
    if (filters.batch && filters.exam_period && filters.branch && filters.semester) {
      fetchCourseStatistics();
    }
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
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

  const fetchCourseStatistics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/exam-applications/courses/?${params}`, {
        method: 'GET',
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching course statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApplicationRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getApplicationRateBadge = (rate: number) => {
    if (rate >= 80) return <Badge variant="secondary" className="bg-green-100 text-green-800">High</Badge>;
    if (rate >= 60) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Low</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Course Statistics</h1>
        <Badge variant="outline" className="text-sm">
          COE Review Panel
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

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.total_subjects}</div>
            </CardContent>
          </Card>

          <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.summary.total_applications}</div>
            </CardContent>
          </Card>

          <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Applications/Subject</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.summary.avg_applications_per_subject}</div>
            </CardContent>
          </Card>

          <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Application Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getApplicationRateColor(data.summary.overall_application_rate)}`}>
                {data.summary.overall_application_rate}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course Statistics Table */}
      {data && (
        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Subject-wise Application Statistics ({data.courses.length})</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Code</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Total Students</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Application Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.courses.map((course: any) => (
                  <TableRow key={course.subject_id}>
                    <TableCell className="font-medium">{course.subject_code}</TableCell>
                    <TableCell>{course.subject_name}</TableCell>
                    <TableCell>{course.total_students}</TableCell>
                    <TableCell>{course.applications}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${getApplicationRateColor(course.application_rate)}`}>
                        {course.application_rate}%
                      </span>
                    </TableCell>
                    <TableCell>{getApplicationRateBadge(course.application_rate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {data.courses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No course statistics found for the selected filters.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading course statistics...</p>
        </div>
      )}
    </div>
  );
};

export default CourseStatistics;