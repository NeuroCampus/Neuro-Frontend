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
  Legend,
} from "recharts";
import { getFacultyAssignments, getProctorStudents, FacultyAssignment, ProctorStudent } from "@/utils/faculty_api";

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch assigned subjects
        const assignmentsRes = await getFacultyAssignments();
        if (assignmentsRes.success && assignmentsRes.data) {
          setSubjects(assignmentsRes.data);
          setStats([
            {
              label: "Assigned Subjects",
              value: assignmentsRes.data.length,
              icon: <CalendarDays className="text-blue-600 w-5 h-5" />,
            },
            {
              label: "Total Proctor Students",
              value: proctorStudents.length,
              icon: <Users className="text-green-600 w-5 h-5" />,
            },
          ]);
        } else {
          setError(assignmentsRes.message || "Failed to load assignments");
        }

        // Fetch proctor students
        const proctorRes = await getProctorStudents();
        if (proctorRes.success && proctorRes.data) {
          setProctorStudents(proctorRes.data);
          setStats((prev) => [
            prev[0],
            {
              label: "Total Proctor Students",
              value: proctorRes.data.length,
              icon: <Users className="text-green-600 w-5 h-5" />,
            },
          ]);
        } else {
          setError(proctorRes.message || "Failed to load proctor students");
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
    attendance: s.attendance,
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

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="p-6 bg-red-100 text-red-700 rounded-lg">{error}</div>;
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

      {/* Courses (Assigned Subjects) + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Assigned Subjects */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Assigned Subjects</CardTitle>
            <Button variant="link" onClick={() => setActivePage("timetable")}>View All</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjects.length > 0 ? (
              subjects.map((subj, idx) => (
                <div key={idx} className="p-4 bg-gray-100 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold">{subj.subject_name} ({subj.subject_code})</h3>
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                      {subj.branch} - Sem {subj.semester} - Sec {subj.section}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No assigned subjects</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="h-full flex flex-col shadow-sm rounded-2xl border border-gray-200">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Quick Actions</CardTitle>
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
                  className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
                  onClick={() => setActivePage(action.page)}
                >
                  <action.icon className="w-6 h-6 text-indigo-600" />
                </button>
                <span className="mt-2 text-sm font-semibold text-gray-600">{action.label}</span>
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
          <div className="w-full h-[250px] grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Attendance Line Chart */}
            <div>
              <h3 className="font-semibold mb-2">Attendance (%)</h3>
              {attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center">No attendance data</p>
              )}
            </div>
            {/* Marks Bar Chart */}
            <div>
              <h3 className="font-semibold mb-2">Average Marks</h3>
              {marksData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={marksData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgMark" fill="#6366f1" name="Avg Mark" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center">No marks data</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyStats;