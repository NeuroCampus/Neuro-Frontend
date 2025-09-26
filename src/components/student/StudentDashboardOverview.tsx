import {
  FaBookOpen,
  FaCheckCircle,
  FaClipboardList,
  FaBell,
  FaFileAlt,
  FaNetworkWired,
  FaTree,
  FaCogs,
  FaCalendarAlt,
  FaUsers,
  FaExclamationTriangle,
  FaBullhorn,
  FaLightbulb,
  FaBook,
  FaThumbtack,
  FaDownload,
  FaClock,
} from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import React, { useState, useEffect } from "react";
import { getDashboardOverview } from "../../utils/student_api";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface StudentDashboardOverviewProps {
  user: any;
  setPage: (page: string) => void;
}

interface DashboardData {
  today_lectures: {
    count: number;
    next_lecture: {
      subject: string;
      start_time: string;
      teacher: string;
      room: string;
    } | null;
  };
  attendance_status: {
    percentage: number;
    warnings: Array<{
      subject: string;
      percentage: number;
    }>;
  };
  current_next_session: {
    live_time: string;
    current_session: {
      subject: string;
      teacher: string;
      room: string;
      start_time: string;
      end_time: string;
    } | null;
    next_session: {
      subject: string;
      teacher: string;
      room: string;
      start_time: string;
      starts_at: string;
    } | null;
  };
  performance_overview: {
    correlation: number;
    subject_performance: Array<{
      subject: string;
      attendance_percentage: number;
      average_mark: number;
    }>;
  };
  leave_request_status: Array<{
    period: string;
    reason: string;
    status: string;
  }>;
  notification_panel: Array<{
    title: string;
    message: string;
    created_at: string;
    read: boolean;
  }>;
}

const StudentDashboardOverview: React.FC<StudentDashboardOverviewProps> = ({ user, setPage }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [nextSession, setNextSession] = useState<any>(null);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to parse time string to minutes
  const parseTimeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to check if current time falls within a session
  const isCurrentSession = (startTime: string, endTime: string) => {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  // Helper function to get session status and time remaining
  const getSessionStatus = (session: any) => {
    if (!session || !session.start_time) return null;
    
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMinutes = parseTimeToMinutes(session.start_time);
    const timeDifference = startMinutes - currentMinutes;
    
    if (timeDifference <= 0) return null;
    
    if (timeDifference <= 5) {
      return {
        status: 'starting-soon',
        message: `Starting in ${timeDifference} minute${timeDifference !== 1 ? 's' : ''}`,
        color: 'text-orange-400'
      };
    }
    
    if (timeDifference <= 15) {
      return {
        status: 'upcoming',
        message: `Starting in ${timeDifference} minutes`,
        color: 'text-yellow-400'
      };
    }
    
    return {
      status: 'later',
      message: `Starts at ${session.start_time}`,
      color: 'text-gray-400'
    };
  };

  // Update current and next sessions based on real-time
  useEffect(() => {
    if (dashboardData && dashboardData.current_next_session) {
      // Mock timetable data - in real app, this should come from API
      // For now, we'll use the backend session data to determine sessions
      const backendCurrentSession = dashboardData.current_next_session.current_session;
      const backendNextSession = dashboardData.current_next_session.next_session;
      
      // If backend says there's a current session, verify it's actually current
      if (backendCurrentSession && backendCurrentSession.start_time && backendCurrentSession.end_time) {
        if (isCurrentSession(backendCurrentSession.start_time, backendCurrentSession.end_time)) {
          setCurrentSession(backendCurrentSession);
        } else {
          setCurrentSession(null);
        }
      } else {
        setCurrentSession(null);
      }
      
      // Set next session from backend
      setNextSession(backendNextSession);
    }
  }, [dashboardData, currentTime]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await getDashboardOverview();
        
        if (response.success && response.data) {
          setDashboardData(response.data);
          setError(null);
        } else {
          setError(response.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        setError('Network error occurred');
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchDashboardData();

    // Refresh data every 5 minutes to keep sessions updated
    const dataRefreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(dataRefreshInterval);
  }, []);

  // Generate performance chart data
  const generateChartData = () => {
    if (!dashboardData?.performance_overview.subject_performance) {
      return {
        labels: [],
        datasets: []
      };
    }

    const subjects = dashboardData.performance_overview.subject_performance;
    
    return {
      labels: subjects.map(subject => subject.subject),
      datasets: [
        {
          label: 'Attendance %',
          data: subjects.map(subject => subject.attendance_percentage),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Average Marks',
          data: subjects.map(subject => subject.average_mark),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: "#9ca3af",
        },
      },
      tooltip: {
        backgroundColor: "#1f1f21",
        titleColor: "#e5e7eb",
        bodyColor: "#d1d5db",
        borderColor: "#27272a",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { 
          color: "#9ca3af",
          maxRotation: 45,
        },
        grid: { color: "rgba(255, 255, 255, 0.05)" },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Attendance (%)',
          color: '#9ca3af'
        },
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(255, 255, 255, 0.05)" },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Average Marks',
          color: '#9ca3af'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: { color: "#9ca3af" },
      },
    },
  };

  const getNotificationIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('exam')) return <FaBullhorn className="text-purple-600 mt-1" />;
    if (lowerTitle.includes('tech') || lowerTitle.includes('symposium')) return <FaCalendarAlt className="text-blue-500 mt-1" />;
    if (lowerTitle.includes('curriculum') || lowerTitle.includes('course')) return <FaBook className="text-yellow-600 mt-1" />;
    if (lowerTitle.includes('assignment') || lowerTitle.includes('deadline')) return <FaThumbtack className="text-red-500 mt-1" />;
    return <FaBell className="text-gray-500 mt-1" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 bg-[#1c1c1e] text-gray-200">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 bg-[#1c1c1e] text-gray-200">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
          <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-300">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 hover:bg-red-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6 bg-[#1c1c1e] text-gray-200">
        <div className="text-center py-12">
          <p className="text-gray-400">No dashboard data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#1c1c1e] text-gray-200">
      {/* Top Cards Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Lectures Card */}
        <div className="bg-[#1c1c1e] text-gray-200 border rounded-md p-4 flex items-center gap-4 relative shadow-sm">
          <div className="absolute top-0 left-0 h-full w-1 bg-blue-600 rounded-l-md" />
          <div className="bg-blue-100 p-2 rounded-md text-blue-600">
            <FaBookOpen className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-200">
            <p className="text-gray-200">Today's Lectures</p>
            <p className="text-lg font-semibold">{dashboardData.today_lectures.count}</p>
            <p className="text-xs text-gray-300">
              {dashboardData.today_lectures.next_lecture 
                ? `Next: ${dashboardData.today_lectures.next_lecture.subject} at ${dashboardData.today_lectures.next_lecture.start_time}`
                : "No more lectures today"
              }
            </p>
          </div>
        </div>

        {/* Attendance Status Card */}
        <div className="bg-[#1c1c1e] text-gray-200 border rounded-md p-4 flex items-center gap-4 relative shadow-sm">
          <div className={`absolute top-0 left-0 h-full w-1 rounded-l-md ${
            dashboardData.attendance_status.percentage >= 75 ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          <div className={`p-2 rounded-md ${
            dashboardData.attendance_status.percentage >= 75 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-500'
          }`}>
            <FaCheckCircle className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-200">
            <p className="text-gray-200">Attendance Status</p>
            <p className="text-lg font-semibold">{dashboardData.attendance_status.percentage}%</p>
            <p className="text-xs text-gray-300">
              {dashboardData.attendance_status.warnings.length > 0
                ? `Warning: Low in ${dashboardData.attendance_status.warnings[0].subject} (${dashboardData.attendance_status.warnings[0].percentage}%)`
                : "All subjects above 75%"
              }
            </p>
          </div>
        </div>
      </section>

      {/* Current & Next Session */}
      <section className="w-full px-0 py-4">
        <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-200 shadow-sm w-full max-w-full">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-base text-gray-200">Current & Next Session</CardTitle>
              <div className="flex items-center gap-3 text-sm">
                <FaClock className="w-5 h-5" />
                <span className="flex items-center gap-2 bg-gray-800 text-white px-3 py-1 rounded-full font-medium shadow-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Live: {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="w-full flex flex-col sm:flex-row gap-6">
            {currentSession ? (
              <>
                {/* Current Session Card */}
                <div className="border-2 border-blue-500 rounded-md p-6 w-full sm:w-1/2 bg-blue-900/20 shadow-md flex flex-col items-center sm:items-start gap-2">
                  <h4 className="font-semibold text-lg text-gray-200 mb-2">
                    {currentSession.subject}
                  </h4>
                  <p className="text-sm text-gray-300">
                    Teacher: {currentSession.teacher}
                  </p>
                  <p className="text-sm text-gray-300">
                    Room: {currentSession.room}
                  </p>
                  <p className="text-xs text-gray-400">
                    {currentSession.start_time} - {currentSession.end_time}
                  </p>
                  <p className="text-xs text-blue-400 mt-1 font-medium">Currently Running</p>
                </div>

                {/* Next Session Card */}
                {nextSession && (
                  <div className={`border rounded-md p-6 w-full sm:w-1/2 shadow-md flex flex-col items-center sm:items-start gap-2 ${
                    getSessionStatus(nextSession)?.status === 'starting-soon' 
                      ? 'border-orange-500 bg-orange-900/20' 
                      : getSessionStatus(nextSession)?.status === 'upcoming'
                      ? 'border-yellow-500 bg-yellow-900/20'
                      : 'border-gray-600 bg-[#27272a]'
                  }`}>
                    <h4 className="font-semibold text-lg text-gray-200 mb-2">
                      {nextSession.subject}
                    </h4>
                    <p className="text-sm text-gray-300">
                      Teacher: {nextSession.teacher}
                    </p>
                    <p className="text-sm text-gray-300">
                      Room: {nextSession.room}
                    </p>
                    <p className={`text-xs mt-1 font-medium ${getSessionStatus(nextSession)?.color || 'text-gray-400'}`}>
                      {getSessionStatus(nextSession)?.message || `Starts at ${nextSession.starts_at || nextSession.start_time}`}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full text-center">
                <p className="text-gray-400">No class is currently running</p>
                {nextSession && (
                  <div className={`border rounded-md p-6 mt-4 shadow-md ${
                    getSessionStatus(nextSession)?.status === 'starting-soon' 
                      ? 'border-orange-500 bg-orange-900/20' 
                      : getSessionStatus(nextSession)?.status === 'upcoming'
                      ? 'border-yellow-500 bg-yellow-900/20'
                      : 'border-gray-600 bg-[#27272a]'
                  }`}>
                    <h4 className="font-semibold text-lg text-gray-200 mb-2">
                      Next: {nextSession.subject}
                    </h4>
                    <p className="text-sm text-gray-300">
                      Teacher: {nextSession.teacher}
                    </p>
                    <p className="text-sm text-gray-300">
                      Room: {nextSession.room}
                    </p>
                    <p className={`text-xs mt-1 font-medium ${getSessionStatus(nextSession)?.color || 'text-gray-400'}`}>
                      {getSessionStatus(nextSession)?.message || `Starts at ${nextSession.starts_at || nextSession.start_time}`}
                    </p>
                    {getSessionStatus(nextSession)?.status === 'starting-soon' && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-orange-400 font-medium">Get ready!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Performance Overview */}
      <section>
        <div className="bg-[#1c1c1e] text-gray-200 p-4 border border-gray-200 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold text-gray-200 mb-2">Performance Overview</h2>
          <p className="text-sm text-gray-300 mb-2">
            Subject-wise attendance percentage and average marks comparison
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Correlation coefficient: {dashboardData.performance_overview.correlation}
          </p>
          
          {dashboardData.performance_overview.subject_performance.length > 0 ? (
            <div className="flex items-center justify-center h-[350px] mt-4">
              <div className="w-full max-w-[700px] h-[300px]">
                <Bar data={generateChartData()} options={chartOptions} />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No performance data available</p>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Section (Leave Requests & Notifications) */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        
        {/* Leave Request Status */}
        <div className="bg-[#1c1c1e] border border-gray-200 rounded-lg shadow-sm p-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Leave Request Status</h2>
            <button
              className="flex items-center gap-1 border border-gray-300 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition"
              onClick={() => setPage("leave-request")}
            >
              Apply for Leave
            </button>
          </div>

          <table className="w-full border border-gray-600 rounded-md overflow-hidden">
            <thead className="sticky top-0 bg-[#1c1c1e] z-10">
              <tr className="text-center border-b border-gray-600 text-gray-200 text-xs">
                <th className="py-2">Period</th>
                <th className="py-2">Reason</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(!dashboardData.leave_request_status || dashboardData.leave_request_status.length === 0) ? (
                <tr>
                  <td colSpan={3} className="py-3 text-center text-gray-400">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                dashboardData.leave_request_status.slice(0, 10).map((request, index) => (
                  <tr
                    key={index}
                    className="border-b last:border-none text-sm hover:bg-gray-800 text-center"
                  >
                    <td className="py-3">{request.period}</td>
                    <td className="py-3 text-gray-300">
                      <button
                        className="px-3 py-1 rounded-md bg-gray-800 text-gray-200 text-xs font-medium hover:bg-gray-700 transition"
                        onClick={() => setSelectedReason(request.reason)}
                      >
                        View Reason
                      </button>
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium align-middle ${
                          request.status.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : request.status.toLowerCase() === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Notification Panel */}
        <div className="bg-[#1c1c1e] text-gray-200 border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Notification Panel</h2>
            <button
              className="flex items-center gap-1 border border-gray-500 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition"
              onClick={() => setPage("announcements")}
            >
              View All
            </button>
          </div>

          <ul className="space-y-4 max-h-64 overflow-y-auto">
            {dashboardData.notification_panel.length === 0 ? (
              <li className="text-center text-gray-400 py-4">No notifications available</li>
            ) : (
              dashboardData.notification_panel.slice(0, 5).map((notification, index) => (
                <li key={index} className="flex gap-3">
                  {getNotificationIcon(notification.title)}
                  <div className={notification.read ? '' : 'bg-blue-900/20 p-2 rounded'}>
                    <p className="text-sm font-medium text-gray-200">{notification.title}</p>
                    <p className="text-xs text-gray-300">{notification.message}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                    {!notification.read && (
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2"></span>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Reason Dialog */}
        <Dialog open={!!selectedReason} onOpenChange={() => setSelectedReason(null)}>
          <DialogContent className="bg-[#1c1c1e] text-gray-200 rounded-lg w-80 border border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Leave Reason</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-gray-300 mt-2">{selectedReason}</div>
            <div className="flex justify-end pt-4">
              <Button 
                className="text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-600" 
                onClick={() => setSelectedReason(null)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
};

export default StudentDashboardOverview;
  