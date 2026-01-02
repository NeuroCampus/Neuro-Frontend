import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp, Users, BookOpen } from "lucide-react";
import { fetchWithTokenRefresh } from "../../utils/authService";
import { API_ENDPOINT } from "../../utils/config";
import { useTheme } from "../../context/ThemeContext";

interface Report {
  id: number;
  title: string;
  type: string;
  generated_date: string;
  status: 'completed' | 'processing' | 'failed';
  download_url?: string;
  parameters: any;
}

const COEReports = () => {
  const { theme } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [reportType, setReportType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/reports/`, {
        method: 'GET',
      });
      const result = await response.json();
      if (result.success) {
        setReports(result.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!reportType || !startDate || !endDate) return;

    setGenerating(true);
    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/reports/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_type: reportType,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowGenerateDialog(false);
        setReportType("");
        setStartDate("");
        setEndDate("");
        await fetchReports(); // Refresh the list
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId: number) => {
    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/reports/${reportId}/download/`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'exam_applications':
        return <FileText className="h-4 w-4" />;
      case 'exam_statistics':
        return <BarChart3 className="h-4 w-4" />;
      case 'student_performance':
        return <TrendingUp className="h-4 w-4" />;
      case 'faculty_workload':
        return <Users className="h-4 w-4" />;
      case 'subject_wise':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const reportTypes = [
    { value: 'exam_applications', label: 'Exam Applications Report', description: 'Summary of all exam applications' },
    { value: 'exam_statistics', label: 'Exam Statistics Report', description: 'Statistical analysis of exams conducted' },
    { value: 'student_performance', label: 'Student Performance Report', description: 'Performance metrics for students' },
    { value: 'faculty_workload', label: 'Faculty Workload Report', description: 'Workload analysis for faculty members' },
    { value: 'subject_wise', label: 'Subject-wise Report', description: 'Reports organized by subjects' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex space-x-2">
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <DialogHeader>
                <DialogTitle>Generate New Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            {getReportTypeIcon(type.value)}
                            <span className="ml-2">{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {reportType && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {reportTypes.find(t => t.value === reportType)?.description}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={generateReport}
                    disabled={!reportType || !startDate || !endDate || generating}
                  >
                    {generating ? 'Generating...' : 'Generate Report'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">
              Generated this month
            </p>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for download
            </p>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <PieChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reports.filter(r => r.status === 'processing').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently generating
            </p>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {reports.filter(r => {
                const reportDate = new Date(r.generated_date);
                const now = new Date();
                return reportDate.getMonth() === now.getMonth() &&
                       reportDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Reports generated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Generated Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-center">
                      {getReportTypeIcon(report.type)}
                      <span className="ml-2 capitalize">{report.type.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {new Date(report.generated_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    {report.status === 'completed' && report.download_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadReport(report.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    {report.status === 'processing' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Processing...
                      </Badge>
                    )}
                    {report.status === 'failed' && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {reports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No reports generated yet. Click "Generate Report" to create your first report.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default COEReports;