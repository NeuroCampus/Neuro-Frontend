import React, { useState, useEffect } from "react";
import { Calendar, Users, CheckCircle, XCircle, Clock, Download } from "lucide-react";
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
  const { theme } = useTheme();

  const fetchTodayAttendance = async () => {
    setIsLoading(true);
    try {
      const response = await getFacultyAttendanceToday();
      if (response.success && response.data) {
        setTodayAttendance(response.data);
      } else {
        console.error("Failed to fetch today's faculty attendance:", response.message);
      }
    } catch (error) {
      console.error("Error fetching today's faculty attendance:", error);
      Swal.fire("Error", "Failed to load today's attendance data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    setIsLoading(true);
    try {
      const response = await getFacultyAttendanceRecords(dateRange);
      if (response.success) {
        setAttendanceRecords(response.data || []);
        setFacultySummary(response.faculty_summary || []);
      } else {
        console.error("Failed to fetch faculty attendance records:", response.message);
      }
    } catch (error) {
      console.error("Error fetching faculty attendance records:", error);
      Swal.fire("Error", "Failed to load attendance records", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'today') {
      fetchTodayAttendance();
    } else {
      fetchAttendanceRecords();
    }
  }, [activeTab, dateRange]);

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

  const exportToCSV = () => {
    if (attendanceRecords.length === 0) {
      Swal.fire("No Data", "No attendance records to export", "info");
      return;
    }

    const headers = ['Faculty Name', 'Date', 'Status', 'Marked At', 'Notes'];
    const csvData = attendanceRecords.map(record => [
      record.faculty_name,
      formatDate(record.date),
      record.status,
      record.marked_at ? formatTime(record.marked_at) : 'Not marked',
      record.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `faculty_attendance_${dateRange.start_date}_to_${dateRange.end_date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayStats = {
    total: todayAttendance.length,
    present: todayAttendance.filter(a => a.status.toLowerCase() === 'present').length,
    absent: todayAttendance.filter(a => a.status.toLowerCase() === 'absent').length,
    notMarked: todayAttendance.filter(a => a.status.toLowerCase() === 'not_marked').length
  };

  return (
    <div className={`p-6 space-y-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
          Faculty Attendance Management
        </h1>
        {activeTab === 'records' && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#a259ff] text-white rounded-lg hover:bg-[#8a4dde] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
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

      {activeTab === 'today' && !isLoading && (
        <>
          {/* Today's Stats Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}>
            <div className={`p-4 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Total Faculty</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{todayStats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className={`p-4 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Present</p>
                  <p className={`text-2xl font-bold text-green-600`}>{todayStats.present}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className={`p-4 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Absent</p>
                  <p className={`text-2xl font-bold text-red-600`}>{todayStats.absent}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className={`p-4 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Not Marked</p>
                  <p className={`text-2xl font-bold text-gray-600`}>{todayStats.notMarked}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
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
        </>
      )}
    </div>
  );
};

export default FacultyAttendanceView;