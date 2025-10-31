import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getStudentAttendance } from "../../utils/student_api";
import { useTheme } from "@/context/ThemeContext";

interface AttendanceRecord {
  date: string;
  status: "Present" | "Absent";
}

interface SubjectAttendance {
  records: AttendanceRecord[];
  present: number;
  total: number;
  percentage: number;
}

interface AttendanceData {
  [subject: string]: SubjectAttendance;
}

const StudentAttendance = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await getStudentAttendance();
        
        // Check if response is valid
        if (!response) {
          console.error("Failed to fetch attendance data: No response received");
          return;
        }
        
        if (response.success && response.data) {
          // Backend already returns data in the expected format
          setAttendanceData(response.data);
        } else {
          console.error("Failed to fetch attendance data:", response.message || "Unknown error");
        }
      } catch (error) {
        console.error("Failed to fetch attendance data:", error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const generateTrendData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May"];
    const subjects = Object.keys(attendanceData);
    return months.map((month) => {
      const obj: any = { name: month };
      subjects.forEach((sub) => {
        obj[sub] = attendanceData[sub]?.percentage || 0;
      });
      return obj;
    });
  };

  const overview = Object.values(attendanceData).reduce(
    (acc, subject) => {
      acc.total += subject.total;
      acc.attended += subject.present;
      return acc;
    },
    { total: 0, attended: 0 }
  );

  const overallPercentage =
    overview.total > 0
      ? `${Math.round((overview.attended / overview.total) * 100)}%`
      : "0%";

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <div>
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Attendance Tracker</h2>
        <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
          Monitor your subject-wise attendance and trends
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className={theme === 'dark' ? 'col-span-2 bg-card text-card-foreground border-border' : 'col-span-2 bg-white text-gray-900 border-gray-200'}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-base text-card-foreground' : 'text-base text-gray-900'}>Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent className={`h-[300px] ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateTrendData()}>
                {/* Add Grid for better visibility */}
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#444" : "#ddd"} />

                {/* X Axis - Visible with ticks */}
                <XAxis
                  dataKey="name"
                  stroke={theme === 'dark' ? "#ccc" : "#666"}
                  tick={{ fill: theme === 'dark' ? "#ccc" : "#666", fontSize: 12 }}
                  axisLine={{ stroke: theme === 'dark' ? "#ccc" : "#666" }}
                  tickLine={{ stroke: theme === 'dark' ? "#ccc" : "#666" }}
                />

                {/* Y Axis - Visible with ticks */}
                <YAxis
                  stroke={theme === 'dark' ? "#ccc" : "#666"}
                  tick={{ fill: theme === 'dark' ? "#ccc" : "#666", fontSize: 12 }}
                  axisLine={{ stroke: theme === 'dark' ? "#ccc" : "#666" }}
                  tickLine={{ stroke: theme === 'dark' ? "#ccc" : "#666" }}
                  domain={[0, 100]}
                />

                {/* Tooltip */}
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? "#1c1c1e" : "#fff",
                    border: theme === 'dark' ? "1px solid #333" : "1px solid #ddd",
                    color: theme === 'dark' ? "#fff" : "#000",
                  }}
                />

                {/* Lines for subjects */}
                {Object.keys(attendanceData).map((subject, idx) => (
                  <Line
                    key={subject}
                    type="monotone"
                    dataKey={subject}
                    stroke={
                      ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444"][
                        idx % 5
                      ]
                    }
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-base text-card-foreground' : 'text-base text-gray-900'}>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`space-y-2 text-sm ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
              <div className="flex justify-between">
                <span>Total Classes</span>
                <span>{overview.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Classes Attended</span>
                <span>{overview.attended}</span>
              </div>
              <div className="flex justify-between">
                <span>Overall Percentage</span>
                <span className={theme === 'dark' ? 'text-primary' : 'text-blue-600'}>{overallPercentage}</span>
              </div>
              <div className="flex justify-between">
                <span>Minimum Required</span>
                <span className={theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}>75%</span>
              </div>
              <div className="flex justify-between">
                <span>Classes to Attend</span>
                <span>{Math.max(0, Math.ceil((0.75 * overview.total - overview.attended) / 0.25))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-base text-card-foreground' : 'text-base text-gray-900'}>Subject-wise Attendance</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className={`min-w-full text-sm text-left ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
            <thead className={theme === 'dark' ? 'border-b border-gray-300' : 'border-b border-gray-200'}>
              <tr className={`uppercase text-xs ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                <th className="p-3">Subject</th>
                <th className="p-3">Total Classes</th>
                <th className="p-3">Present</th>
                <th className="p-3">Percentage</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(attendanceData).map(([subject, data], index) => {
                const percentage = Math.round(data.percentage);
                const status = percentage < 75 ? "At Risk" : "Good";
                return (
                  <tr key={index} className={theme === 'dark' ? 'border-t border-gray-300' : 'border-t border-gray-200'}>
                    <td className="p-3">{subject}</td>
                    <td className="p-3">{data.total}</td>
                    <td className="p-3">{data.present}</td>
                    <td className="p-3">{percentage}%</td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-xl ${
                          status === "Good"
                            ? (theme === 'dark' ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700")
                            : (theme === 'dark' ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700")
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendance;