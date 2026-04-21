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
  BookOpen,
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
import { getFacultyDashboardBootstrap, FacultyAssignment, ProctorStudent } from "@/utils/faculty_api";
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

interface FacultyStatsProps {
  setActivePage: (page: string) => void;
}

const FacultyStats = ({ setActivePage }: FacultyStatsProps) => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [subjects, setSubjects] = useState<FacultyAssignment[]>([]);
  const [proctorStudentsCount, setProctorStudentsCount] = useState<number>(0);
  const [performanceTrends, setPerformanceTrends] = useState<{avg_attendance_percent_30d?: number; avg_ia_mark?: number}>({});
  const [subjectPerformanceTrends, setSubjectPerformanceTrends] = useState<SubjectPerformanceTrend[]>([]);
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [ongoingClass, setOngoingClass] = useState<TodayClass | null>(null);
  const [nextClass, setNextClass] = useState<TodayClass | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const { theme } = useTheme();

  // Derive class and section options from assignments (lightweight) to avoid fetching full student list
  const classOptions = [
    "All",
    ...Array.from(new Set(subjects.map((s) => s.branch || ""))).filter(Boolean),
  ];
  const sectionOptions = [
    "All",
    ...Array.from(new Set(subjects.map((s) => s.section || ""))).filter(Boolean),
  ];
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
        // Fetch bootstrap data (assignments, proctor students, performance trends)
        console.log('Fetching bootstrap data...');
        const bootstrapRes = await getFacultyDashboardBootstrap();
        console.log('Bootstrap response:', bootstrapRes);
        if (bootstrapRes.success && bootstrapRes.data) {
          const { assignments, proctor_students_count, performance_trends, subject_performance_trends } = bootstrapRes.data;
          setSubjects(assignments || []);
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
            label: "Assigned Subjects",
            value: (bootstrapRes.data?.assignments || []).length,
            icon: <BookOpen className="text-blue-600 w-5 h-5" />,
            color: "blue",
          },
          {
            label: "Total Proctor Students",
            value: bootstrapRes.data?.proctor_students_count || 0,
            icon: <Users className="text-green-600 w-5 h-5" />,
            color: "green",
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
    <div className={`p-4 md:p-6 space-y-6 min-h-screen w-full max-w-full overflow-x-hidden ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
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
                <p className="text-xs text-orange-600">{ongoingClass.section} • {ongoingClass.start_time} - {ongoingClass.end_time}</p>
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
                <p className="text-xs text-purple-600">{nextClass.section} • {nextClass.start_time} - {nextClass.end_time}</p>
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
        {/* Assigned Subjects */}
        <Card className={`lg:col-span-2 ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'} shadow-sm`}>
          <CardHeader className="flex flex-row justify-between items-center pb-3">
            <CardTitle className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Assigned Subjects</CardTitle>
            <Button
              variant="outline"
              onClick={() => setActivePage("timetable")}
              className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white min-w-0"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-[300px] overflow-y-auto thin-scrollbar space-y-3">
              {subjects.length > 0 ? (
                subjects.map((subj, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border transition-colors ${
                      theme === 'dark'
                        ? 'bg-card border-border hover:bg-accent/50'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm break-words">{subj.subject_name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{subj.subject_code}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                        theme === 'dark'
                          ? 'bg-blue-900/30 text-blue-300'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {subj.branch} • Sem {subj.semester} • Sec {subj.section}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`} />
                  <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>No assigned subjects</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className={`h-fit ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'} shadow-sm`}>
          <CardHeader className="pb-4">
            <CardTitle className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Take Attendance", icon: CheckSquare, page: "take-attendance", color: "indigo" },
                { label: "Schedule Class", icon: PlusCircle, page: "timetable", color: "green" },
                { label: "Mentoring", icon: GraduationCap, page: "proctor-students", color: "blue" },
                { label: "View Reports", icon: FileBarChart, page: "statistics", color: "purple" },
              ].map((action, idx) => (
                <button
                  key={idx}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all hover:scale-105 ${
                    theme === 'dark'
                      ? 'bg-accent hover:bg-accent/80'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setActivePage(action.page)}
                >
                  <action.icon className={`w-6 h-6 mb-2 ${
                    action.color === 'indigo' ? 'text-indigo-600' :
                    action.color === 'green' ? 'text-green-600' :
                    action.color === 'blue' ? 'text-blue-600' :
                    'text-purple-600'
                  }`} />
                  <span className={`text-sm font-semibold text-center leading-tight ${theme === 'dark' ? 'text-foreground' : 'text-gray-700'}`}>
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card className={`${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'} shadow-sm`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <CardTitle className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Performance Trends</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Subject Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex flex-col flex-1 min-w-[200px]">
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className={`${theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'} w-full`}>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  {subjectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Charts */}
          {chartData.length > 0 ? (
            <div className="space-y-6">
              {/* Attendance Chart */}
              <div>
                <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Average Attendance (30 days)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                      <XAxis
                        dataKey="subject"
                        stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <YAxis
                        stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                          borderRadius: '6px'
                        }}
                        labelStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      />
                      <Bar
                        dataKey="attendance"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        name="Attendance %"
                      >
                        <LabelList
                          dataKey="attendance"
                          position="top"
                          formatter={(value: number) => `${value}%`}
                          style={{ fontSize: '12px', fill: theme === 'dark' ? '#f9fafb' : '#111827' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* IA Marks Chart */}
              <div>
                <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Average IA Marks</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                      <XAxis
                        dataKey="subject"
                        stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <YAxis
                        stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                          borderRadius: '6px'
                        }}
                        labelStyle={{ color: theme === 'dark' ? '#f9fafb' : '#111827' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="iaMarks"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
                        name="IA Marks"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>No Performance Data</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                Performance trends will appear here once attendance and IA marks data is available for your subjects.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyStats;