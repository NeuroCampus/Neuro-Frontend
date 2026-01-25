import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { BookOpen, Users, Download } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getCourseApplicationStats, getFilterOptions, FilterOptions } from "../../utils/coe_api";

const CourseStatistics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
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
      fetchCourseStatistics();
    }
  }, [filters]);
  useEffect(() => {
    if (filters.batch && filters.exam_period && filters.branch && filters.semester) {
      fetchCourseStatistics();
    }
  }, [page, pageSize]);

  const fetchFilterOptions = async () => {
    try {
      const options = await getFilterOptions();
      // Deduplicate semesters by number to avoid duplicate 1..8 entries
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

  const fetchCourseStatistics = async () => {
    setLoading(true);
    try {
      const result = await getCourseApplicationStats({ ...filters, page: String(page), page_size: String(pageSize) } as any);
      if (result.success) {
        setData(result.data);
        if (result.data && (result.data as any).pagination) {
          setTotalCount((result.data as any).pagination.count || 0);
        } else {
          setTotalCount(null);
        }
      }
    } catch (error) {
      console.error('Error fetching course statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!filters.batch || !filters.branch || !filters.semester) return;
    setExporting(true);
    try {
      const perPage = 200; // matches backend AdminPagination.max_page_size
      let p = 1;
      const allCourses: any[] = [];

      while (true) {
        const res = await getCourseApplicationStats({ ...filters, page: String(p), page_size: String(perPage) } as any);
        if (!res.success || !res.data) break;
        allCourses.push(...(res.data.courses || []));
        const pagination = (res.data as any).pagination;
        if (!pagination || !pagination.next) break;
        p += 1;
      }

      // Generate PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const head = [['Subject Code', 'Subject Name', 'Total Students', 'Applications', 'Application Rate', 'Faculty']];
      const body = allCourses.map(c => [c.subject_code || '', c.subject_name || '', c.total_students || 0, c.applied_students || 0, `${c.application_rate || 0}%`, c.faculty_name || '']);
      autoTable(doc, { head, body, startY: 20, styles: { fontSize: 9 } });
      const fileName = `course_statistics_${filters.branch}_${filters.semester}.pdf`;
      doc.save(fileName);
    } catch (e) {
      console.error('Export error', e);
    } finally {
      setExporting(false);
    }
  };

  // CSV export removed. Use PDF export handler above (handleExport).

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.total_courses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.summary.total_applications}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course Statistics Table */}
      {data && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Subject-wise Application Statistics ({totalCount !== null ? totalCount : data.courses.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export PDF'}
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
                    <TableCell>{course.applied_students}</TableCell>
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
          {/* Pagination controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">{totalCount !== null ? `Showing page ${page} — ${totalCount} subjects` : `Page ${page}`}</div>
            <div className="space-x-2">
              <Button size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button size="sm" onClick={() => setPage(p => p + 1)} disabled={data.courses.length < pageSize}>Next</Button>
            </div>
          </div>
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