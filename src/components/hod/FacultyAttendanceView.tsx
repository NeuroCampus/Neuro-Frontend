import React, { useState, useEffect } from "react";
import { Calendar, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { getFacultyAttendanceToday, getFacultyAttendanceRecords } from "../../utils/hod_api";
import { useTheme } from "../../context/ThemeContext";
import Swal from "sweetalert2";

interface FacultyAttendanceTodayRecord {
  id: string;
  faculty_name: string;
  faculty_id: string;
  status: string;
  marked_at: string | null;
  notes: string | null;
}

interface FacultyAttendanceRecord {
  id: string;
  faculty_name: string;
  faculty_id: string;
  date: string;
  status: string;
  marked_at: string;
  notes: string;
}

interface FacultySummary {
  name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  attendance_percentage: number;
}

const FacultyAttendanceView: React.FC = () => {
  const [todayAttendance, setTodayAttendance] = useState<FacultyAttendanceTodayRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<FacultyAttendanceRecord[]>([]);
  const [facultySummary, setFacultySummary] = useState<FacultySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'records'>('today');
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end_date: new Date().toISOString().split('T')[0] // today
  });
  const [todayPagination, setTodayPagination] = useState({
    page: 1,
    page_size: 50,
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_prev: false,
    next_page: null as number | null,
    prev_page: null as number | null
  });
  const [recordsPagination, setRecordsPagination] = useState({
    page: 1,
    page_size: 50,
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_prev: false,
    next_page: null as number | null,
    prev_page: null as number | null
  });
  const [todaySummary, setTodaySummary] = useState({
    total_faculty: 0,
    present: 0,
    absent: 0,
    not_marked: 0
  });
  const { theme } = useTheme();

  const fetchTodayAttendance = async (page: number = 1, pageSize: number = 50) => {
    setIsLoading(true);
    try {
      const response = await getFacultyAttendanceToday({ page, page_size: pageSize });
      if (response.success && response.data) {
        setTodayAttendance(response.data);
        if (response.pagination) {
          setTodayPagination(response.pagination);
        }
        if (response.summary) {
          setTodaySummary(response.summary);
        }
      } else {
        console.error("Failed to fetch today's faculty attendance:", response.message);
        // Reset pagination and summary on error
        setTodayPagination({
          page: 1,
          page_size: pageSize,
          total_pages: 1,
          total_items: 0,
          has_next: false,
          has_prev: false,
          next_page: null,
          prev_page: null
        });
        setTodaySummary({
          total_faculty: 0,
          present: 0,
          absent: 0,
          not_marked: 0
        });
      }
    } catch (error) {
      console.error("Error fetching today's faculty attendance:", error);
      Swal.fire("Error", "Failed to load today's attendance data", "error");
      // Reset state on error
      setTodayAttendance([]);
      setTodayPagination({
        page: 1,
        page_size: pageSize,
        total_pages: 1,
        total_items: 0,
        has_next: false,
        has_prev: false,
        next_page: null,
        prev_page: null
      });
      setTodaySummary({
        total_faculty: 0,
        present: 0,
        absent: 0,
        not_marked: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceRecords = async (page: number = 1, pageSize: number = 50) => {
    setIsLoading(true);
    try {
      const response = await getFacultyAttendanceRecords({
        ...dateRange,
        page,
        page_size: pageSize
      });
      if (response.success) {
        setAttendanceRecords(response.data || []);
        setFacultySummary(response.faculty_summary || []);
        if (response.pagination) {
          setRecordsPagination(response.pagination);
        }
      } else {
        console.error("Failed to fetch faculty attendance records:", response.message);
        // Reset pagination on error
        setRecordsPagination({
          page: 1,
          page_size: pageSize,
          total_pages: 1,
          total_items: 0,
          has_next: false,
          has_prev: false,
          next_page: null,
          prev_page: null
        });
      }
    } catch (error) {
      console.error("Error fetching faculty attendance records:", error);
      Swal.fire("Error", "Failed to load attendance records", "error");
      // Reset state on error
      setAttendanceRecords([]);
      setFacultySummary([]);
      setRecordsPagination({
        page: 1,
        page_size: pageSize,
        total_pages: 1,
        total_items: 0,
        has_next: false,
        has_prev: false,
        next_page: null,
        prev_page: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'today') {
      fetchTodayAttendance(todayPagination.page, todayPagination.page_size);
    } else if (activeTab === 'records') {
      fetchAttendanceRecords(recordsPagination.page, recordsPagination.page_size);
    }
  }, [activeTab, dateRange, todayPagination.page, todayPagination.page_size, recordsPagination.page, recordsPagination.page_size]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status.toLowerCase()) {
      case 'present':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'absent':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString || dateString === 'Invalid Date') return 'Not marked';

    try {
      // Handle different date formats
      let date: Date;

      // If it's just a time string like "08:37:48", create a date for today
      if (/^\d{2}:\d{2}:\d{2}$/.test(dateString)) {
        const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
        date = new Date(`${today}T${dateString}`);
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return 'Invalid Date';
      }

      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const handlePageChange = (newPage: number) => {
    setTodayPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRecordsPageChange = (newPage: number) => {
    setRecordsPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRecordsPageSizeChange = (newPageSize: number) => {
    setRecordsPagination(prev => ({ ...prev, page_size: newPageSize, page: 1 })); // Reset to page 1 when changing page size
  };

  const loadAllData = async () => {
    // Load all data by setting a large page size
    await fetchTodayAttendance(1, 1000); // Load up to 1000 records
  };

  return (
    <div className={`p-6 space-y-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
          Faculty Attendance Management
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className={`flex space-x-1 p-1 rounded-lg ${theme === 'dark' ? 'bg-card' : 'bg-white'} border ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}>
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'today'
              ? 'bg-[#a259ff] text-white'
              : theme === 'dark'
                ? 'text-muted-foreground hover:text-foreground'
                : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Today's Attendance
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'records'
              ? 'bg-[#a259ff] text-white'
              : theme === 'dark'
                ? 'text-muted-foreground hover:text-foreground'
                : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Attendance Records
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {activeTab === 'today' && !isLoading && todaySummary.total_faculty > 0 && (
        <>
          {/* Today's Stats Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}>
            <div className={`p-4 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Total Faculty</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{todaySummary.total_faculty}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className={`p-4 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Present</p>
                  <p className={`text-2xl font-bold text-green-600`}>{todaySummary.present}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className={`p-4 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Absent</p>
                  <p className={`text-2xl font-bold text-red-600`}>{todaySummary.absent}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className={`p-4 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Not Marked</p>
                  <p className={`text-2xl font-bold text-gray-600`}>{todaySummary.not_marked}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 p-4 ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'} rounded-lg`}>
            <div className="flex items-center gap-4">
              <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                Showing {todayAttendance.length > 0 ? ((todayPagination.page - 1) * todayPagination.page_size) + 1 : 0} to{' '}
                {Math.min(todayPagination.page * todayPagination.page_size, todayPagination.total_items)} of{' '}
                {todayPagination.total_items} faculty
              </div>
            </div>

            <div className="flex items-center gap-2">
              {todayPagination.total_items > todayPagination.page_size && (
                <button
                  onClick={loadAllData}
                  disabled={isLoading}
                  className={`px-3 py-1 text-sm border border-green-500 text-green-600 rounded-md hover:bg-green-50 transition-colors disabled:opacity-50 ${
                    theme === 'dark' ? 'hover:bg-accent' : ''
                  }`}
                >
                  {isLoading ? 'Loading...' : 'Load All'}
                </button>
              )}

              <button
                onClick={() => handlePageChange(todayPagination.page - 1)}
                disabled={!todayPagination.has_prev || isLoading}
                className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                  todayPagination.has_prev && !isLoading
                    ? 'border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50'
                    : 'border-gray-300 text-gray-400 cursor-not-allowed'
                } ${theme === 'dark' ? 'hover:bg-accent' : ''}`}
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, todayPagination.total_pages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(todayPagination.total_pages - 4, todayPagination.page - 2)) + i;
                  if (pageNum > todayPagination.total_pages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      className={`px-3 py-1 text-sm border rounded-md transition-colors disabled:opacity-50 ${
                        pageNum === todayPagination.page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : `border-gray-300 text-gray-700 hover:bg-gray-50 ${theme === 'dark' ? 'hover:bg-accent' : ''}`
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(todayPagination.page + 1)}
                disabled={!todayPagination.has_next || isLoading}
                className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                  todayPagination.has_next && !isLoading
                    ? 'border-blue-500 text-blue-600 hover:bg-blue-50'
                    : 'border-gray-300 text-gray-400 cursor-not-allowed'
                } ${theme === 'dark' ? 'hover:bg-accent' : ''}`}
              >
                Next
              </button>
            </div>
          </div>

          {/* Today's Attendance Table */}
          <div className={`rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'} overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                Today's Faculty Attendance ({new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`sticky top-0 ${theme === 'dark' ? 'bg-card' : 'bg-gray-50'}`}>
                  <tr className={`border-b ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Faculty</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Status</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Marked At</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Notes</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-border' : 'divide-gray-200'}`}>
                  {todayAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={`px-6 py-4 text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                        No attendance records for today
                      </td>
                    </tr>
                  ) : (
                    todayAttendance.map((record) => (
                      <tr key={record.id} className={`hover:${theme === 'dark' ? 'bg-accent' : 'bg-gray-50'}`}>
                        <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                          <div className="font-medium">{record.faculty_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            <span className={getStatusBadge(record.status)}>{record.status}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                          {record.marked_at ? formatTime(record.marked_at) : 'Not marked'}
                        </td>
                        <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                          {record.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'records' && !isLoading && (
        <>
          {/* Date Range Filter */}
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
            <div className="flex gap-4 items-end">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-700'}`}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                  className={`px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-background border-border text-foreground'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-700'}`}>
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                  className={`px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-background border-border text-foreground'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Faculty Summary */}
          {facultySummary.length > 0 && (
            <div className={`rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'} overflow-hidden`}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                  Faculty Attendance Summary
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`sticky top-0 ${theme === 'dark' ? 'bg-card' : 'bg-gray-50'}`}>
                    <tr className={`border-b ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Faculty</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Total Days</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Present</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Absent</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-border' : 'divide-gray-200'}`}>
                    {facultySummary.map((summary, index) => (
                      <tr key={index} className={`hover:${theme === 'dark' ? 'bg-accent' : 'bg-gray-50'}`}>
                        <td className={`px-6 py-4 whitespace-nowrap font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                          {summary.name}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                          {summary.total_days}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                          {summary.present_days}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">
                          {summary.absent_days}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap font-medium ${
                          summary.attendance_percentage >= 75 ? 'text-green-600' :
                          summary.attendance_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {summary.attendance_percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed Records */}
          <div className={`rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'} overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                Detailed Attendance Records
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`sticky top-0 ${theme === 'dark' ? 'bg-card' : 'bg-gray-50'}`}>
                  <tr className={`border-b ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Faculty</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Status</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Marked At</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Notes</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-border' : 'divide-gray-200'}`}>
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`px-6 py-4 text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                        No attendance records found for the selected date range
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((record) => (
                      <tr key={record.id} className={`hover:${theme === 'dark' ? 'bg-accent' : 'bg-gray-50'}`}>
                        <td className={`px-6 py-4 whitespace-nowrap font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                          {record.faculty_name}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                          {formatDate(record.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            <span className={getStatusBadge(record.status)}>{record.status}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                          {record.marked_at ? formatTime(record.marked_at) : 'Not marked'}
                        </td>
                        <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                          {record.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Records Pagination Controls */}
          {recordsPagination.total_items > recordsPagination.page_size && (
            <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 p-4 ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'} rounded-lg mt-4`}>
              <div className="flex items-center gap-4">
                <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                  Showing {attendanceRecords.length > 0 ? ((recordsPagination.page - 1) * recordsPagination.page_size) + 1 : 0} to{' '}
                  {Math.min(recordsPagination.page * recordsPagination.page_size, recordsPagination.total_items)} of{' '}
                  {recordsPagination.total_items} records
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRecordsPageChange(recordsPagination.page - 1)}
                  disabled={!recordsPagination.has_prev || isLoading}
                  className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                    recordsPagination.has_prev && !isLoading
                      ? 'border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed'
                  } ${theme === 'dark' ? 'hover:bg-accent' : ''}`}
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, recordsPagination.total_pages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(recordsPagination.total_pages - 4, recordsPagination.page - 2)) + i;
                    if (pageNum > recordsPagination.total_pages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handleRecordsPageChange(pageNum)}
                        disabled={isLoading}
                        className={`px-3 py-1 text-sm border rounded-md transition-colors disabled:opacity-50 ${
                          pageNum === recordsPagination.page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : `border-gray-300 text-gray-700 hover:bg-gray-50 ${theme === 'dark' ? 'hover:bg-accent' : ''}`
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handleRecordsPageChange(recordsPagination.page + 1)}
                  disabled={!recordsPagination.has_next || isLoading}
                  className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                    recordsPagination.has_next && !isLoading
                      ? 'border-blue-500 text-blue-600 hover:bg-blue-50'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed'
                  } ${theme === 'dark' ? 'hover:bg-accent' : ''}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FacultyAttendanceView;