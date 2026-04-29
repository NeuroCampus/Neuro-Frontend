import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Calendar,
  Users,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { getStaffAttendanceAudit, STAFF_ROLES } from '../../utils/fees_manager_api';

interface AttendanceSummary {
  id: number;
  name: string;
  role: string;
  branch_dept: string;
  total_days: number;
  present: number;
  absent: number;
  attendance_percentage: number;
}

const Reports: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('all');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchAttendanceAudit();
  }, [selectedRole, currentPage]);

  const fetchAttendanceAudit = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStaffAttendanceAudit(selectedRole, startDate, endDate, currentPage);
      
      if (response.success) {
        setAttendanceData(response.results.attendance_summary || []);
        setTotalItems(response.count || 0);
        setTotalPages(Math.ceil((response.count || 0) / 10));
      } else {
        setError(response.message || 'Failed to fetch attendance data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setCurrentPage(1);
    fetchAttendanceAudit();
  };

  const downloadReport = async (format: 'pdf' | 'excel') => {
    try {
      setLoading(true);
      const response = await getStaffAttendanceAudit(selectedRole, startDate, endDate, 1, format);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Staff_Attendance_${startDate}_to_${endDate}.${format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError(`Failed to download ${format.toUpperCase()} report`);
      }
    } catch (err) {
      setError(`Error downloading ${format.toUpperCase()} report`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Attendance Audit</h1>
          <p className="text-muted-foreground mt-1">Monitor attendance across all institutional roles</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => downloadReport('pdf')}
            className="bg-primary hover:bg-primary/90 text-white border-primary"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={() => downloadReport('excel')}
            className="bg-primary hover:bg-primary/90 text-white border-primary"
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters Card */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="bg-white dark:bg-slate-900">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleApplyFilter}
              className="bg-primary hover:bg-primary/90 w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary Table */}
      <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Staff Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="font-bold">Staff Name</TableHead>
                <TableHead className="font-bold">Role</TableHead>
                <TableHead className="font-bold">Dept/Branch</TableHead>
                <TableHead className="font-bold text-center">Total Days</TableHead>
                <TableHead className="font-bold text-center">Present</TableHead>
                <TableHead className="font-bold text-center">Absent</TableHead>
                <TableHead className="font-bold text-center">Attendance %</TableHead>
                <TableHead className="font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : attendanceData.length > 0 ? (
                attendanceData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal capitalize">
                        {item.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.branch_dept}</TableCell>
                    <TableCell className="text-center font-semibold">{item.total_days}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 dark:text-green-400 font-bold">{item.present}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-red-600 dark:text-red-400 font-bold">{item.absent}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={`font-bold ${
                          item.attendance_percentage >= 75 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : item.attendance_percentage >= 50
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                        variant="secondary"
                      >
                        {item.attendance_percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No attendance records found for the selected criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-800/50">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{(currentPage - 1) * 10 + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * 10, totalItems)}</span> of <span className="font-medium text-foreground">{totalItems}</span> results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center justify-center min-w-[32px] text-sm font-medium">
                {currentPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || loading}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;