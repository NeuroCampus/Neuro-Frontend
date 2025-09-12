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
    return <div className="p-6 text-center text-gray-600">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="p-6 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6 bg-[#1c1c1e] text-gray-200 space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 ">
        {stats.map((stat, idx) => (
          <Card key={idx} className="flex flex-col justify-center bg-[#1c1c1e] text-gray-200">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="p-2 bg-gray-200 rounded-full">{stat.icon}</div>
              <div>
                <p className="text-sm text-gray-200">{stat.label}</p>
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
        <Card className="lg:col-span-2 bg-[#1c1c1e] text-gray-200">
          <CardHeader className="flex flex-row justify-between items-center text-gray-200">
            <CardTitle>Assigned Subjects</CardTitle>
            <Button variant="link" onClick={() => setActivePage("timetable")} className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500">View All</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjects.length > 0 ? (
              subjects.map((subj, idx) => (
                <div key={idx} className="p-4 bg-[#1c1c1e] text-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold">{subj.subject_name} ({subj.subject_code})</h3>
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                      {subj.branch} - Sem {subj.semester} - Sec {subj.section}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-200">No assigned subjects</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="h-full flex flex-col shadow-sm rounded-2xl border bg-[#1c1c1e] text-gray-200">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-lg font-semibold text-gray-200">Quick Actions</CardTitle>
          </CardHeader>
          <div className="flex-grow grid grid-cols-2 grid-rows-2 gap-4 p-4 text-gray-200">
            {[
              { label: "Take Attendance", icon: CheckSquare, page: "take-attendance" },
              { label: "Schedule Class", icon: PlusCircle, page: "timetable" },
              { label: "Mentoring", icon: GraduationCap, page: "proctor-students" },
              { label: "View Reports", icon: FileBarChart, page: "statistics" },
            ].map((action, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center">
                <button
                  className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
                  onClick={() => setActivePage(action.page)}
                >
                  <action.icon className="w-6 h-6 text-indigo-600" />
                </button>
                <span className="mt-2 text-sm font-semibold text-gray-300">{action.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card className="bg-[#1c1c1e] text-gray-200">
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Class */}
            <div className="flex flex-col">
              <label className="block text-sm font-medium mb-1 text-gray-200">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-[#232326] text-gray-200 border border-gray-600 h-10 w-20 px-3 rounded focus:ring-0 focus:ring-white">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent className="bg-[#232326] text-gray-200 border border-gray-600">
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
              <label className="block text-sm font-medium mb-1 text-gray-200">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="bg-[#232326] text-gray-200 border border-gray-600 h-10 w-20 px-3 rounded focus:ring-0 focus:ring-white">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent className="bg-[#232326] text-gray-200 border border-gray-600">
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
            <div className={attendanceData.length > 10 ? "overflow-x-auto" : ""}>
              <h3 className="font-semibold mb-2">Performance</h3>

              {/* Dynamic chart width */}
              <div
                style={{
                  width: attendanceData.length > 10 
                    ? `${attendanceData.length * 80}px` // give each student ~80px
                    : "100%",
                  height: "250px",
                }}
              >
                {/* Remove ResponsiveContainer width="100%" */}
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e2e30" />
                    <XAxis
                      dataKey="name"
                      stroke="#d1d5db"
                      interval={0}
                      angle={attendanceData.length > 10 ? -45 : 0}
                      textAnchor={attendanceData.length > 10 ? "end" : "middle"}
                      height={attendanceData.length > 10 ? 80 : 40}
                    />
                    <YAxis stroke="#d1d5db" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#2c2c2e",
                        border: "none",
                        color: "#f3f4f6",
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
            </div>


            {/* Marks Bar Chart */}
            <div className={marksData.length > 10 ? "overflow-x-auto" : ""}>
              <h3 className="font-semibold mb-2">Average Marks</h3>
              {marksData.length > 0 ? (
                <div
                  style={{
                    width: marksData.length > 10 
                      ? `${marksData.length * 80}px`
                      : "100%",
                    height: "250px",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marksData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2e2e30" />
                      <XAxis
                        dataKey="name"
                        stroke="#d1d5db"
                        interval={0}
                        angle={marksData.length > 10 ? -45 : 0}
                        textAnchor={marksData.length > 10 ? "end" : "middle"}
                        height={marksData.length > 10 ? 80 : 40}
                      />
                      <YAxis stroke="#d1d5db" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#2c2c2e",
                          border: "none",
                          color: "#f3f4f6",
                        }}
                      />
                      {/* Removed <Legend /> */}
                      <Bar dataKey="avgMark" fill="#818cf8">
                        <LabelList 
                          dataKey="avgMark" 
                          position="top" 
                          fill="#f3f4f6" 
                          fontSize={12} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-400 text-center">No marks data</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyStats;