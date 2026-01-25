import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Users, CheckCircle, XCircle, Search, Download } from "lucide-react";
import { getStudentApplicationStatus, getFilterOptions, FilterOptions } from "../../utils/coe_api";
import { fetchWithTokenRefresh } from "../../utils/authService";
import { API_ENDPOINT } from "../../utils/config";


const StudentStatus = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    batch: "",
    exam_period: "",
    branch: "",
    semester: ""
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    batches: [],
    branches: [],
    semesters: []
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (filters.batch && filters.exam_period && filters.branch && filters.semester) {
      fetchStudentStatus();
    }
  }, [filters]);
  useEffect(() => {
    if (filters.batch && filters.exam_period && filters.branch && filters.semester) {
      fetchStudentStatus();
    }
  }, [page, pageSize]);

  const fetchFilterOptions = async () => {
    try {
      const options = await getFilterOptions();
      // Deduplicate semesters by number (avoid repeated 1..8 entries)
      const semestersRaw = (options && options.semesters) || [];
      const semMap = new Map<number, any>();
      semestersRaw.forEach((s: any) => {
        if (!semMap.has(s.number)) semMap.set(s.number, s);
      });
      const semesters = Array.from(semMap.values()).sort((a: any, b: any) => a.number - b.number);
      setFilterOptions({ ...options, semesters });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchStudentStatus = async () => {
    setLoading(true);
    try {
      const result = await getStudentApplicationStatus({ ...filters, page: String(page), page_size: String(pageSize) } as any);
      if (result.success) {
        setData(result.data);
        if (result.data && (result.data as any).pagination) {
          setTotalCount((result.data as any).pagination.count || 0);
        } else {
          setTotalCount(null);
        }
      }
    } catch (error) {
      console.error('Error fetching student status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Applied</Badge>;
      case 'not_applied':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Not Applied</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleExport = async () => {
    if (!filters.batch || !filters.exam_period || !filters.branch || !filters.semester) return;
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      // Provide immediate feedback and avoid sending unauthenticated requests
      // Frontend uses fetchWithTokenRefresh which requires an access token
      // so inform the user to login
      // eslint-disable-next-line no-alert
      alert('You must be logged in to export. Please login and try again.');
      return;
    }
    setExporting(true);
    try {
      const params = new URLSearchParams({
        batch: filters.batch,
        exam_period: filters.exam_period,
        branch: filters.branch,
        semester: filters.semester,
        format: 'pdf'
      });
      const url = `${API_ENDPOINT}/coe/export-not-applied/?${params.toString()}`;
      const resp = await fetchWithTokenRefresh(url, { method: 'GET' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const disposition = resp.headers.get('content-disposition') || '';
      const match = disposition.match(/filename\*=UTF-8''(.+)|filename="?([^";]+)"?/i);
      let filename = `not_applied_${filters.semester}_${filters.batch}.pdf`;
      if (match) filename = decodeURIComponent((match[1] || match[2] || '').trim());
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);
    } catch (err) {
      console.error('Export error', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Student Status</h1>
      </div>

      {/* Filters */}
      <Card>
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
                  <SelectItem value="nov_dec">November/December</SelectItem>
                  <SelectItem value="jan_feb">January/February</SelectItem>
                  <SelectItem value="apr_may">April/May</SelectItem>
                  <SelectItem value="supplementary">Supplementary</SelectItem>
                  <SelectItem value="revaluation">Revaluation</SelectItem>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.total_students}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applied</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.summary.applied_students}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Not Applied</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.summary.not_applied_students}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Application Rate</CardTitle>
              <Search className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.summary.application_rate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Students Table */}
      {data && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Student Application Status ({totalCount !== null ? totalCount : data.students.length})</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={exporting || !(filters.batch && filters.exam_period && filters.branch && filters.semester)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied Subjects</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.students.map((student: any) => (
                  <TableRow key={student.student_id}>
                    <TableCell className="font-medium">{student.roll_number}</TableCell>
                    <TableCell>{student.student_name}</TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={student.applied_subjects.join(', ')}>
                        {student.applied_subjects.length > 0
                          ? student.applied_subjects.join(', ')
                          : 'None'
                        }
                      </div>
                    </TableCell>
                    <TableCell>{student.applied_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {data.students.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No students found for the selected filters.
              </div>
            )}
            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">{totalCount !== null ? `Showing page ${page} — ${totalCount} students` : `Page ${page}`}</div>
              <div className="space-x-2">
                <Button size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button size="sm" onClick={() => setPage(p => p + 1)} disabled={data.students.length < pageSize}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading student status...</p>
        </div>
      )}
    </div>
  );
};

export default StudentStatus;