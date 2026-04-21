import { useState, useEffect } from "react";
import {
  CalendarDays,
  Users,
  CheckSquare,
  PlusCircle,
  GraduationCap,
  FileBarChart,
  Clock,
  MapPin,
  
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import { getFacultyDashboardBootstrap } from "@/utils/faculty_api";
import { useTheme } from "@/context/ThemeContext";

interface Stat {
  label: string;
  value: string | number;
  icon: JSX.Element;
  sub?: string;
  color?: string;
}

interface SubjectPerformanceTrend {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  avg_attendance_percent_30d: number;
  avg_ia_mark: number;
}

interface TodayClass {
  subject: string;
  section?: string;
  semester?: number | string;
  branch?: string;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  room?: string;
}

interface FacultyStatsProps {
  setActivePage: (page: string) => void;
}

const FacultyStats = ({ setActivePage }: FacultyStatsProps) => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [proctorStudentsCount, setProctorStudentsCount] = useState<number>(0);
  const [performanceTrends, setPerformanceTrends] = useState<{avg_attendance_percent_30d?: number; avg_ia_mark?: number}>({});
  const [subjectPerformanceTrends, setSubjectPerformanceTrends] = useState<SubjectPerformanceTrend[]>([]);
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [ongoingClass, setOngoingClass] = useState<TodayClass | null>(null);
  const [nextClass, setNextClass] = useState<TodayClass | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const { theme } = useTheme();

  // class/section filters removed; use per-subject trends instead
  const subjectOptions = [
    { value: "all", label: "All Subjects" },
    ...subjectPerformanceTrends.map((trend) => ({
      value: trend.subject_id.toString(),
      label: `${trend.subject_name} (${trend.subject_code})`
    }))
  ];

  // Get filtered performance trends based on selected subject
  const getFilteredTrends = () => {
    if (selectedSubject === "all") {
      return subjectPerformanceTrends;
    }
    return subjectPerformanceTrends.filter(trend => trend.subject_id.toString() === selectedSubject);
  };

  // Prepare chart data
  const chartData = getFilteredTrends().map(trend => ({
    subject: trend.subject_code || trend.subject_name,
    attendance: trend.avg_attendance_percent_30d,
    iaMarks: trend.avg_ia_mark
  }));

  // Helper function to determine ongoing and next classes
  const determineClassStatus = (classes: TodayClass[]) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    let ongoing: TodayClass | null = null;
    let next: TodayClass | null = null;
    let earliestFuture: TodayClass | null = null;

    for (const cls of classes) {
      const [startHour, startMin] = cls.start_time.split(':').map(Number);
      const [endHour, endMin] = cls.end_time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (currentTime >= startMinutes && currentTime <= endMinutes) {
        ongoing = cls;
      } else if (currentTime < startMinutes) {
        if (!earliestFuture || startMinutes < (earliestFuture.start_time.split(':').map(Number)[0] * 60 + earliestFuture.start_time.split(':').map(Number)[1])) {
          earliestFuture = cls;
        }
      }
    }

    setOngoingClass(ongoing);
    setNextClass(earliestFuture);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log('Starting to fetch faculty dashboard data...');
      try {
        // Fetch bootstrap data (proctor students, performance trends)
        console.log('Fetching bootstrap data...');
        const bootstrapRes = await getFacultyDashboardBootstrap();
        console.log('Bootstrap response:', bootstrapRes);
        if (bootstrapRes.success && bootstrapRes.data) {
          const { proctor_students_count, performance_trends, subject_performance_trends } = bootstrapRes.data;
          setProctorStudentsCount(proctor_students_count || 0);
          setPerformanceTrends(performance_trends || {});
          setSubjectPerformanceTrends(subject_performance_trends || []);
        } else {
          setError(bootstrapRes.message || "Failed to load dashboard data");
        }

        // Use today's classes from bootstrap response (single-call dashboard)
        const todayClassesFromBootstrap = bootstrapRes.data?.today_classes || [];
        console.log('Today classes (from bootstrap):', todayClassesFromBootstrap);
        setTodayClasses(todayClassesFromBootstrap);
        determineClassStatus(todayClassesFromBootstrap);

        // Set stats after data is loaded
        setStats([
          {
            label: "Total Proctor Students",
            value: bootstrapRes.data?.proctor_students_count || 0,
            icon: <Users className="text-green-600 w-5 h-5" />,
            color: "green",
          },
          {
            label: "Attendance (30d)",
            value: bootstrapRes.data?.attendance_snapshot ?? performance_trends?.avg_attendance_percent_30d ?? 0,
            icon: <CheckSquare className="text-indigo-600 w-5 h-5" />,
            color: "indigo",
          },
        ]);
      } catch (err) {
        setError("Network error occurred while fetching data");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, []);

  // We no longer load the full proctor student list on the dashboard.
  // Charts are replaced by aggregated performance metrics provided by the bootstrap API.

  if (loading) {
    return <div className={`p-6 text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading dashboard...</div>;
  }
  if (error) {
    return <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground' : 'bg-red-100 text-red-700'}`}>{error}</div>;
  }

  return (
    <div className={` md: space-y-6 min-h-screen w-full max-w-full overflow-x-hidden ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className={`${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'} overflow-hidden w-full max-w-full shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-4 flex items-center space-x-4 w-full min-w-0 overflow-hidden break-words">
              <div className={`p-3 rounded-full flex-shrink-0 ${
                stat.color === 'blue' ? (theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100') :
                stat.color === 'green' ? (theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100') :
                (theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')
              }`}>
                {stat.icon}
              </div>
              <div className="w-full min-w-0">
                <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{stat.label}</p>
                <h2 className="text-2xl sm:text-3xl font-bold truncate">{stat.value}</h2>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Ongoing Class Card */}
        <Card className={`${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'} overflow-hidden w-full max-w-full shadow-sm hover:shadow-md transition-shadow`}>
          <CardContent className="p-4 w-full min-w-0 overflow-hidden break-words">
            <div className="flex items-center space-x-3 mb-2">
              <Activity className="text-orange-600 w-5 h-5 flex-shrink-0" />
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Ongoing Class</p>
            </div>
            {ongoingClass ? (
              <div className="space-y-1">
                <h3 className="font-semibold text-sm truncate">{ongoingClass.subject}</h3>
                <p className="text-xs text-orange-600">{ongoingClass.branch ?? ''} • Sem {ongoingClass.semester ?? ''} • {ongoingClass.section} • {ongoingClass.start_time} - {ongoingClass.end_time}</p>
                <p className="text-xs flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {ongoingClass.room}
                </p>
              </div>
            ) : todayClasses.length === 0 ? (
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No classes scheduled for today</p>
            ) : (
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No ongoing class</p>
            )}
          </CardContent>
        </Card>

        {/* Next Class Card */}
        <Card className={`${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'} overflow-hidden w-full max-w-full shadow-sm hover:shadow-md transition-shadow`}>
          <CardContent className="p-4 w-full min-w-0 overflow-hidden break-words">
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="text-purple-600 w-5 h-5 flex-shrink-0" />
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Next Class</p>
            </div>
            {nextClass ? (
              <div className="space-y-1">
                <h3 className="font-semibold text-sm truncate">{nextClass.subject}</h3>
                <p className="text-xs text-purple-600">{nextClass.branch ?? ''} • Sem {nextClass.semester ?? ''} • {nextClass.section} • {nextClass.start_time} - {nextClass.end_time}</p>
                <p className="text-xs flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {nextClass.room}
                </p>
              </div>
            ) : todayClasses.length === 0 ? (
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No classes scheduled for today</p>
            ) : (
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No upcoming classes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trends (span 2 columns) */}
        <Card className={`lg:col-span-2 ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'} shadow-sm`}>
          <CardHeader className="flex items-center justify-between pb-3">
            <div>
              <CardTitle className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Performance Trends</CardTitle>
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Average Attendance and IA marks per subject</p>
            </div>
            <div className="w-48">
              <Select onValueChange={(v) => setSelectedSubject(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              {/* Bar chart - Average Attendance */}
              <div className="flex-1 min-h-[240px]">
                <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>Average Attendance (30 days)</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2a2a2a' : '#eaeaea'} />
                    <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value: any) => `${value}%`} />
                    <Bar dataKey="attendance" fill="#3b82f6" radius={[6,6,0,0]}>
                      <LabelList dataKey="attendance" position="top" formatter={(v: any) => `${v}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Line chart - IA Marks */}
              <div className="flex-1 min-h-[240px]">
                <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>Average IA Marks</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2a2a2a' : '#eaeaea'} />
                    <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="iaMarks" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Quick Actions - bottom horizontal bar */}
      <Card className={`${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'} shadow-sm`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            {[
              { label: "Take Attendance", icon: CheckSquare, page: "take-attendance", color: "indigo" },
              { label: "Schedule Class", icon: PlusCircle, page: "timetable", color: "green" },
              { label: "Mentoring", icon: GraduationCap, page: "proctor-students", color: "blue" },
              { label: "View Reports", icon: FileBarChart, page: "statistics", color: "purple" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => setActivePage(action.page)}
                className={`flex items-center gap-3 px-4 py-2 rounded-md font-semibold shadow-sm transition-colors hover:opacity-95 ${
                  theme === 'dark' ? 'bg-accent text-white' : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <action.icon className={`w-5 h-5 ${action.color === 'indigo' ? 'text-indigo-600' : action.color === 'green' ? 'text-green-600' : action.color === 'blue' ? 'text-blue-600' : 'text-purple-600'}`} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyStats;