import { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  BarChart2,
  CheckSquare,
  PlusCircle,
  GraduationCap,
  FileBarChart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDashboardOverview, generateStatistics } from "../../utils/faculty_api";

interface Stat {
  label: string;
  value: string | number;
  icon: JSX.Element;
  sub?: string;
}

interface Class {
  title: string;
  status: string;
  time: string;
  room: string;
  students: number;
}

interface PerformanceData {
  month: string;
  attendance: number;
}

interface FacultyStatsProps {
  setActivePage: (page: string) => void;
}

const FacultyStats = ({ setActivePage }: FacultyStatsProps) => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch dashboard overview
        const dashboardResponse = await getDashboardOverview();
        if (dashboardResponse.success && dashboardResponse.data) {
          const { today_classes, attendance_snapshot } = dashboardResponse.data;
          setClasses(
            today_classes.map((cls) => ({
              title: cls.subject,
              status:
                new Date(cls.start_time) > new Date()
                  ? "Upcoming"
                  : new Date(cls.end_time) < new Date()
                  ? "Completed"
                  : "Ongoing",
              time: `${cls.start_time} - ${cls.end_time}`,
              room: cls.room,
              students: 0, // Backend doesn't provide student count; set to 0
            }))
          );
          setStats([
            {
              label: "Total Classes",
              value: today_classes.length,
              icon: <CalendarDays className="text-blue-600 w-5 h-5" />,
              sub: "+0% vs last month", // Placeholder as backend doesn't provide comparison
            },
            {
              label: "Upcoming Classes",
              value: today_classes.filter(
                (cls) => new Date(cls.start_time) > new Date()
              ).length,
              icon: <Clock className="text-purple-600 w-5 h-5" />,
            },
            {
              label: "Total Students",
              value: 0, // Backend doesn't provide total students
              icon: <Users className="text-green-600 w-5 h-5" />,
            },
            {
              label: "Attendance Rate",
              value: `${attendance_snapshot}%`,
              icon: <BarChart2 className="text-indigo-600 w-5 h-5" />,
              sub: "+0% vs last month", // Placeholder
            },
          ]);
        } else {
          setError(dashboardResponse.message || "Failed to load dashboard data");
        }

        // Fetch performance trends
        const statsResponse = await generateStatistics({ file_id: "" }); // Adjust file_id if needed
        if (statsResponse.success && statsResponse.data?.stats) {
          const performance = statsResponse.data.stats.map((stat, idx) => ({
            month: new Date(2025, idx % 12).toLocaleString("default", {
              month: "short",
            }),
            attendance: stat.percentage,
          }));
          setPerformanceData(performance);
        } else {
          setError(
            statsResponse.message || "Failed to load performance statistics"
          );
        }
      } catch (err) {
        setError("Network error occurred while fetching data");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">Loading dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 text-red-700 rounded-lg">{error}</div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-white text-gray-900 space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="flex flex-col justify-center">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="p-2 bg-gray-100 rounded-full">{stat.icon}</div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <h2 className="text-2xl font-bold">{stat.value}</h2>
                {stat.sub && (
                  <p className="text-xs text-green-600 mt-1">{stat.sub}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Classes + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Classes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Courses</CardTitle>
            <Button variant="link" onClick={() => setActivePage("timetable")}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {classes.length > 0 ? (
              classes.map((cls, idx) => (
                <div key={idx} className="p-4 bg-gray-100 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold">{cls.title}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        cls.status === "Completed"
                          ? "bg-gray-300 text-gray-800"
                          : cls.status === "Ongoing"
                          ? "bg-green-200 text-green-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {cls.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {cls.time} • {cls.room} • {cls.students} students
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No classes scheduled for today</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="h-full flex flex-col shadow-sm rounded-2xl border border-gray-200">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <div className="flex-grow grid grid-cols-2 grid-rows-2 gap-4 p-4">
            {[
              {
                label: "Take Attendance",
                icon: CheckSquare,
                page: "take-attendance",
              },
              { label: "Schedule Class", icon: PlusCircle, page: "timetable" },
              {
                label: "Mentoring",
                icon: GraduationCap,
                page: "proctor-students",
              },
              { label: "View Reports", icon: FileBarChart, page: "statistics" },
            ].map((action, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center"
              >
                <button
                  className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
                  onClick={() => setActivePage(action.page)}
                >
                  <action.icon className="w-6 h-6 text-indigo-600" />
                </button>
                <span className="mt-2 text-sm font-semibold text-gray-600">
                  {action.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[250px]">
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center">
                No performance data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyStats;