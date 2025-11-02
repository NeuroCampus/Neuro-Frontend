import { useState, useEffect } from "react";
import {
  CalendarDays,
  Users,
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
}

interface FacultyStatsProps {
  setActivePage: (page: string) => void;
}

const FacultyStats = ({ setActivePage }: FacultyStatsProps) => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [subjects, setSubjects] = useState<FacultyAssignment[]>([]);
  const [proctorStudents, setProctorStudents] = useState<ProctorStudent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [selectedSection, setSelectedSection] = useState<string>("All");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const { theme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch both assignments and proctor students in single call
        const bootstrapRes = await getFacultyDashboardBootstrap();
        if (bootstrapRes.success && bootstrapRes.data) {
          const { assignments, proctor_students } = bootstrapRes.data;
          setSubjects(assignments);
          setProctorStudents(proctor_students);
          setStats([
            {
              label: "Assigned Subjects",
              value: assignments.length,
              icon: <CalendarDays className="text-blue-600 w-5 h-5" />,
            },
            {
              label: "Total Proctor Students",
              value: proctor_students.length,
              icon: <Users className="text-green-600 w-5 h-5" />,
            },
          ]);
        } else {
          setError(bootstrapRes.message || "Failed to load dashboard data");
        }
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

  // Prepare data for charts
  const attendanceData = proctorStudents.map((s) => ({
    name: s.name,
    attendance: s.attendance === "NA" || s.attendance === null || s.attendance === undefined ? 0 : typeof s.attendance === "string" ? 0 : s.attendance,
  }));
  const marksData = proctorStudents.map((s) => ({
    name: s.name,
    avgMark:
      s.marks && s.marks.length > 0
        ? (
            s.marks.reduce((sum, m) => sum + (m.mark || 0), 0) /
            s.marks.length
          ).toFixed(2)
        : 0,
  }));

  // Get unique classes and sections from proctorStudents
  const classOptions = [
    "All",
    ...Array.from(new Set(proctorStudents.map((s) => s.branch || ""))).filter(Boolean),
  ];
  const sectionOptions = [
    "All",
    ...Array.from(new Set(proctorStudents.map((s) => s.section || ""))).filter(Boolean),
  ];

  // Filter data based on selections
  const filteredStudents = proctorStudents.filter((s) => {
    const classMatch = selectedClass === "All" || s.branch === selectedClass;
    const sectionMatch = selectedSection === "All" || s.section === selectedSection;
    return classMatch && sectionMatch;
  });

  if (loading) {
    return <div className={`p-6 text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading dashboard...</div>;
  }
  if (error) {
    return <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground' : 'bg-red-100 text-red-700'}`}>{error}</div>;
  }

  return (
    <div className={`p-4 md:p-6 space-y-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 ">
        {stats.map((stat, idx) => (
          <Card key={idx} className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {stat.icon}
              </div>
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{stat.label}</p>
                <h2 className="text-2xl font-bold">{stat.value}</h2>
                {stat.sub && (
                  <p className="text-xs text-green-600 mt-1">{stat.sub}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Courses (Assigned Subjects) + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Assigned Subjects */}
        <Card className={`lg:col-span-2 ${theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}`}>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Assigned Subjects</CardTitle>
            <Button 
              variant="outline" 
              onClick={() => setActivePage("timetable")}
              className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md transition bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-80 overflow-y-auto">
              {subjects.length > 0 ? (
                subjects.map((subj, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-lg mb-2 ${theme === 'dark' ? 'bg-card' : 'bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold">{subj.subject_name} ({subj.subject_code})</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                        {subj.branch} - Sem {subj.semester} - Sec {subj.section}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>No assigned subjects</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className={`h-full flex flex-col shadow-sm rounded-2xl border ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Quick Actions</CardTitle>
          </CardHeader>
          <div className="flex-grow grid grid-cols-2 grid-rows-2 gap-4 p-4">
            {[
              { label: "Take Attendance", icon: CheckSquare, page: "take-attendance" },
              { label: "Schedule Class", icon: PlusCircle, page: "timetable" },
              { label: "Mentoring", icon: GraduationCap, page: "proctor-students" },
              { label: "View Reports", icon: FileBarChart, page: "statistics" },
            ].map((action, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center">
                <button
                  className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors ${theme === 'dark' ? 'bg-accent hover:bg-accent/80' : 'bg-indigo-100 hover:bg-indigo-200'}`}
                  onClick={() => setActivePage(action.page)}
                >
                  <action.icon className={`w-6 h-6 ${theme === 'dark' ? 'text-foreground' : 'text-indigo-600'}`} />
                </button>
                <span className={`mt-2 text-sm font-semibold ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>{action.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Class */}
            <div className="flex flex-col">
              <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  {classOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section */}
            <div className="flex flex-col">
              <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  {sectionOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="w-full h-[250px] grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Attendance Line Chart */}
            <div className="relative">
              <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={attendanceData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2e2e30' : '#e5e7eb'} />
                  <XAxis
                    dataKey="name"
                    stroke={theme === 'dark' ? '#d1d5db' : '#6b7280'}
                    interval={0}
                    angle={attendanceData.length > 10 ? -45 : 0}
                    textAnchor={attendanceData.length > 10 ? "end" : "middle"}
                    height={attendanceData.length > 10 ? 60 : 40}
                  />
                  <YAxis stroke={theme === 'dark' ? '#d1d5db' : '#6b7280'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1c1c1e' : '#ffffff',
                      border: theme === 'dark' ? '1px solid #2e2e30' : '1px solid #e5e7eb',
                      color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={{ fill: "#93c5fd" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Marks Bar Chart */}
            <div className="relative">
              <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Average Marks</h3>
              {marksData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={marksData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2e2e30' : '#e5e7eb'} />
                    <XAxis
                      dataKey="name"
                      stroke={theme === 'dark' ? '#d1d5db' : '#6b7280'}
                      interval={0}
                      angle={marksData.length > 10 ? -45 : 0}
                      textAnchor={marksData.length > 10 ? "end" : "middle"}
                      height={marksData.length > 10 ? 60 : 40}
                    />
                    <YAxis stroke={theme === 'dark' ? '#d1d5db' : '#6b7280'} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1c1c1e' : '#ffffff',
                        border: theme === 'dark' ? '1px solid #2e2e30' : '1px solid #e5e7eb',
                        color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                      }}
                    />
                    <Bar dataKey="avgMark" fill="#818cf8">
                      <LabelList dataKey="avgMark" position="top" fill={theme === 'dark' ? '#f3f4f6' : '#1f2937'} fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className={theme === 'dark' ? 'text-muted-foreground text-center' : 'text-gray-500 text-center'}>No marks data</p>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyStats;