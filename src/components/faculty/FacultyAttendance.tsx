import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/context/ThemeContext";
import { markFacultyAttendance, getFacultyAttendanceRecords, MarkFacultyAttendanceRequest, FacultyAttendanceRecord } from "@/utils/faculty_api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const FacultyAttendance = () => {
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "absent" | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayRecord, setTodayRecord] = useState<FacultyAttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<FacultyAttendanceRecord[]>([]);
  const [historyRecords, setHistoryRecords] = useState<FacultyAttendanceRecord[]>([]);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyPageSize] = useState<number>(10);
  const [historyTotalPages, setHistoryTotalPages] = useState<number>(1);
  const [historyTotalItems, setHistoryTotalItems] = useState<number>(0);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      // Load recent records and today's record in a single paginated call (reduces duplicate requests)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const startDate = weekAgo.toISOString().split('T')[0];

      const resp = await fetchHistoryPage(1, startDate);
      if (resp && resp.success && resp.data) {
        setRecentRecords(resp.data.slice(0, 7));
        const today = new Date().toISOString().split('T')[0];
        const todayRec = resp.data.find((r) => r.date === today) || null;
        setTodayRecord(todayRec);
        if (todayRec) {
          setAttendanceStatus(todayRec.status as "present" | "absent");
          setNotes(todayRec.notes || "");
        }
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryPage = async (page: number, start_date?: string) => {
    try {
      setHistoryLoading(true);
      const params: any = { page, page_size: historyPageSize };
      if (start_date) params.start_date = start_date;
      const response = await getFacultyAttendanceRecords(params);
      if (response.success && response.data) {
        setHistoryRecords(response.data);
        if (response.pagination) {
          setHistoryPage(response.pagination.current_page || page);
          setHistoryTotalPages(response.pagination.total_pages || 1);
          setHistoryTotalItems(response.pagination.total_items || 0);
        }
      }
      return response;
    } catch (e) {
      console.error('Failed to fetch history page', e);
      return null;
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleToggleAttendance = async (status: "present" | "absent") => {
    setIsSubmitting(true);
    setIsAnimating(true);

    try {
      // Location is not required; do not collect or send it.

      const requestData: MarkFacultyAttendanceRequest = {
        status,
        notes: notes.trim() || undefined
      };

      const response = await markFacultyAttendance(requestData);

      if (response.success) {
        const isUpdate = response.data?.updated || false;
        toast.success(isUpdate ? `Attendance updated to ${status}` : `Attendance marked as ${status}`);
        setAttendanceStatus(status);
        await fetchAttendanceData(); // Refresh data
      } else {
        toast.error(response.message || "Failed to mark attendance");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Network error occurred");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const resetAttendance = () => {
    setAttendanceStatus(null);
    setNotes("");
    setTodayRecord(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "absent":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200';
      case "absent":
        return theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200';
      default:
        return theme === 'dark' ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        Loading attendance data...
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 space-y-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      {/* Today's Attendance */}
      <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
            Today's Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Animated Toggle Buttons */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              {/* Present Button */}
              <motion.button
                onClick={() => handleToggleAttendance("present")}
                disabled={isSubmitting}
                className={`flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 shadow-lg ${
                  attendanceStatus === 'present'
                    ? 'bg-green-500 text-white scale-110'
                    : theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
                }`}
                whileHover={{ scale: attendanceStatus === 'present' ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  rotate: attendanceStatus === 'present' ? [0, -10, 10, 0] : 0,
                }}
                transition={{
                  rotate: { duration: 0.5, ease: "easeInOut" }
                }}
              >
                <CheckCircle className="w-8 h-8" />
              </motion.button>

              {/* Absent Button */}
              <motion.button
                onClick={() => handleToggleAttendance("absent")}
                disabled={isSubmitting}
                className={`flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 shadow-lg ${
                  attendanceStatus === 'absent'
                    ? 'bg-red-500 text-white scale-110'
                    : theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
                }`}
                whileHover={{ scale: attendanceStatus === 'absent' ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  rotate: attendanceStatus === 'absent' ? [0, -10, 10, 0] : 0,
                }}
                transition={{
                  rotate: { duration: 0.5, ease: "easeInOut" }
                }}
              >
                <XCircle className="w-8 h-8" />
              </motion.button>
            </div>

            {/* Button Labels */}
            <div className="flex items-center space-x-8 text-sm font-medium">
              <motion.span
                className={attendanceStatus === 'present' ? 'text-green-600' : 'text-gray-500'}
                animate={{
                  scale: attendanceStatus === 'present' ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                Present
              </motion.span>
              <motion.span
                className={attendanceStatus === 'absent' ? 'text-red-600' : 'text-gray-500'}
                animate={{
                  scale: attendanceStatus === 'absent' ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                Absent
              </motion.span>
            </div>

            {/* Status Indicator */}
            <AnimatePresence mode="wait">
              {attendanceStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center mt-4"
                >
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
                    attendanceStatus === 'present'
                      ? theme === 'dark' ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800'
                      : theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-800'
                  }`}>
                    {getStatusIcon(attendanceStatus)}
                    <span className="font-medium capitalize">
                      {attendanceStatus === 'present' ? 'Present' : 'Absent'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reset Button */}
            {attendanceStatus && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  onClick={resetAttendance}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </Button>
              </motion.div>
            )}
          </div>

          {/* Notes Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>
              Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your attendance..."
              className={theme === 'dark' ? 'bg-background border-input text-foreground' : 'bg-white border-gray-300 text-gray-900'}
              rows={3}
            />
          </motion.div>

          {/* Attendance Details */}
          <AnimatePresence>
            {todayRecord && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-lg border ${getStatusColor(todayRecord.status)}`}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(todayRecord.status)}
                  <div>
                    <p className="font-semibold capitalize">{todayRecord.status}</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                      Marked at {new Date(todayRecord.marked_at).toLocaleTimeString()}
                    </p>
                    {/* Location removed from UI */}
                    {todayRecord.notes && (
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                        Notes: {todayRecord.notes}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Recent Attendance Records */}
      <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
            Recent Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRecords.length > 0 ? (
            <div className="space-y-3">
              {recentRecords.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`p-3 rounded-lg border ${getStatusColor(record.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(record.status)}
                      <div>
                        <p className="font-medium capitalize">{record.status}</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                      {new Date(record.marked_at).toLocaleTimeString()}
                    </div>
                  </div>
                  {record.notes && (
                    <div className="mt-2 flex items-start space-x-2">
                      <FileText className="w-4 h-4 mt-0.5 text-gray-500" />
                      <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                        {record.notes}
                      </p>
                    </div>
                  )}
                  {/* Location removed from UI */}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className={`text-center py-8 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
              No attendance records found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attendance History (paginated) */}
      <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <p className={`text-center py-8 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Loading history...</p>
          ) : historyRecords.length > 0 ? (
            <div className="space-y-3">
              {historyRecords.map((record) => (
                <div key={record.id} className={`p-3 rounded-lg border ${getStatusColor(record.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(record.status)}
                      <div>
                        <p className="font-medium capitalize">{record.status}</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                      {new Date(record.marked_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-center py-8 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
              No history available
            </p>
          )}

          {/* Pagination Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={() => fetchHistoryPage(1)} disabled={historyLoading || historyPage === 1}>
                First
              </Button>
              <Button size="sm" onClick={() => fetchHistoryPage(Math.max(1, historyPage - 1))} disabled={historyLoading || historyPage === 1}>
                Prev
              </Button>
              <span className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>
                Page {historyPage} / {historyTotalPages} ({historyTotalItems} records)
              </span>
              <Button size="sm" onClick={() => fetchHistoryPage(Math.min(historyTotalPages, historyPage + 1))} disabled={historyLoading || historyPage === historyTotalPages}>
                Next
              </Button>
              <Button size="sm" onClick={() => fetchHistoryPage(historyTotalPages)} disabled={historyLoading || historyPage === historyTotalPages}>
                Last
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyAttendance;