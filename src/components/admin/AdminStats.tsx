import { useState, useEffect } from "react";
import { FaUserGraduate, FaChalkboardTeacher, FaUserTie, FaUserCheck } from "react-icons/fa";
import { FiDownload, FiSearch } from "react-icons/fi";
import { motion } from "framer-motion";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DashboardCard from "../common/DashboardCard";
import { User, ClipboardList, GitBranch, UserCheck, Bell, Users } from "lucide-react";
import { getAdminStats } from "../../utils/admin_api";
import { useToast } from "../../hooks/use-toast";
import { useTheme } from "../../context/ThemeContext";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface AdminStatsProps {
  setError: (error: string | null) => void;
  setPage?: (page: string) => void;
}

const AdminStats = ({ setError }: AdminStatsProps) => {
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { theme } = useTheme();
  const normalize = (str: string) => str.toLowerCase().trim();
  const allLabels = Array.isArray(stats?.branch_distribution)
    ? stats.branch_distribution.map((b: any) => b.name || "N/A")
    : [];

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAdminStats();
        console.log("Stats API response:", response);
        if (response.success) {
          setStats(response.data);
        } else {
          setError(response.message || "Failed to fetch stats");
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Failed to fetch stats",
          });
        }
      } catch (err) {
        console.error("Fetch stats error:", err);
        setError("Network error");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Network error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [setError, toast]);

  const filteredBranches = Array.isArray(stats?.branch_distribution)
  ? stats.branch_distribution
      .filter(
        (branch: any) =>
          branch?.name &&
          typeof branch.name === "string" &&
          normalize(branch.name).includes(normalize(search))
      )
      .sort((a: any, b: any) => {
        const aName = normalize(a.name);
        const bName = normalize(b.name);
        const s = normalize(search);

        // 1. Prioritize startsWith over includes
        const aStarts = aName.startsWith(s);
        const bStarts = bName.startsWith(s);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;

        // 2. Prioritize by index of match (earlier is better)
        const aIndex = aName.indexOf(s);
        const bIndex = bName.indexOf(s);
        if (aIndex !== bIndex) return aIndex - bIndex;

        // 3. If equal relevance, sort alphabetically
        return aName.localeCompare(bName);
      })
  : [];

  
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Branch Statistics - Current Term", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Branch", "Student Count", "Faculty Count"]],
      body: filteredBranches.map((b: any) => [
        b.name || "N/A",
        b.students || 0,
        b.faculty || 0,
      ]),
      styles: { fontSize: 11 },
    });
    doc.save("branch_statistics_current_term.pdf");
  };

  const filteredLabels = filteredBranches.map((b: any) => b.name);

  const studentMap = Object.fromEntries(
    filteredBranches.map((b: any) => [b.name, b.students || 0])
  );

  const facultyMap = Object.fromEntries(
    filteredBranches.map((b: any) => [b.name, b.faculty || 0])
  );

  const barData = {
    labels: filteredLabels,
    datasets: [
      {
        label: "Students",
        data: filteredLabels.map((label: string) => studentMap[label] || 0),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
      {
        label: "Faculty",
        data: filteredLabels.map((label: string) => facultyMap[label] || 0),
        backgroundColor: "rgba(168, 85, 247, 0.6)",
        borderColor: "rgba(168, 85, 247, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Pie chart data for role distribution
  const pieData = {
    labels: ["Students", "Faculty", "HODs", "COE"],
    datasets: [
      {
        data: [
          stats?.role_distribution?.students || 0,
          stats?.role_distribution?.faculty || 0,
          stats?.role_distribution?.hods || 0,
          stats?.role_distribution?.coe || 0,
        ],
        backgroundColor: [
          "rgba(59, 130, 246, 0.6)",
          "rgba(168, 85, 247, 0.6)",
          "rgba(234, 179, 8, 0.6)",
          "rgba(34, 197, 94, 0.6)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(168, 85, 247, 1)",
          "rgba(234, 179, 8, 1)",
          "rgba(34, 197, 94, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const chartVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className={`text-center py-12 rounded-[20px] ${
          theme === 'dark' 
            ? 'border-2 border-white/15 bg-slate-950/95 shadow-[0_28px_65px_rgba(2,6,23,0.6)]' 
            : 'border-2 border-gray-200 bg-white shadow-[0_26px_60px_rgba(118,154,224,0.32)]'
        }`}>
          <div className="flex flex-col items-center gap-4">
            <div className={`w-12 h-12 rounded-full animate-spin ${theme === 'dark' ? 'border-2 border-primary border-t-transparent' : 'border-2 border-blue-500 border-t-transparent'}`}></div>
            <p className={`text-lg font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Loading Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className={`text-center py-12 rounded-[20px] ${
          theme === 'dark' 
            ? 'border-2 border-white/15 bg-slate-950/95 shadow-[0_28px_65px_rgba(2,6,23,0.6)]' 
            : 'border-2 border-gray-200 bg-white shadow-[0_26px_60px_rgba(118,154,224,0.32)]'
        }`}>
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-destructive/10' : 'bg-red-100'}`}>
              <FiSearch className={`w-8 h-8 ${theme === 'dark' ? 'text-destructive' : 'text-red-600'}`} />
            </div>
            <div className="text-center">
              <p className={`text-xl font-semibold ${theme === 'dark' ? 'text-destructive' : 'text-red-600'}`}>No statistics available</p>
              <p className={`mt-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Please try refreshing the page or contact support.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 rounded-[34px] p-6 ${
      theme === 'dark' 
        ? 'border-2 border-white/15 bg-slate-950/95 shadow-[0_28px_65px_rgba(2,6,23,0.6)]' 
        : 'border-2 border-gray-200 bg-white shadow-[0_26px_60px_rgba(118,154,224,0.32)]'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Dashboard Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <DashboardCard
              variant="admin"
              title="Total Students"
              value={stats.total_students || 0}
              description="Enrolled in all branches"
              icon={<FaUserGraduate className={theme === 'dark' ? "text-blue-400 text-3xl" : "text-blue-500 text-3xl"} />}
            />
          </motion.div>
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <DashboardCard
              variant="admin"
              title="Total Faculty"
              value={stats.total_faculty || 0}
              description="Teaching staff"
              icon={<FaChalkboardTeacher className={theme === 'dark' ? "text-purple-400 text-3xl" : "text-purple-500 text-3xl"} />}
            />
          </motion.div>
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <DashboardCard
              variant="admin"
              title="Total HODs"
              value={stats.total_hods || 0}
              description="Department heads"
              icon={<FaUserTie className={theme === 'dark' ? "text-yellow-400 text-3xl" : "text-yellow-500 text-3xl"} />}
            />
          </motion.div>
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <DashboardCard
              variant="admin"
              title="Total COE"
              value={stats.total_coe || 0}
              description="Controller of Examinations"
              icon={<FaUserCheck className={theme === 'dark' ? "text-green-400 text-3xl" : "text-green-500 text-3xl"} />}
            />
          </motion.div>
        </div>

        {/* Search and Export Actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={`rounded-[20px] p-4 mb-6 ${
            theme === 'dark' 
              ? 'border-2 border-white/15 bg-slate-950/95 shadow-[0_28px_65px_rgba(2,6,23,0.6)]' 
              : 'border-2 border-gray-200 bg-white shadow-[0_26px_60px_rgba(118,154,224,0.32)]'
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className={`flex items-center w-full sm:w-auto flex-1 max-w-md rounded-xl px-4 py-2.5 ${
              theme === 'dark' 
                ? 'border-2 border-white/10 bg-slate-900/95' 
                : 'border-2 border-gray-200 bg-white/95'
            }`}>
              <FiSearch className={`${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'} mr-3`} />
              <input
                type="text"
                placeholder="Search by branch name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full outline-none text-sm bg-transparent ${theme === 'dark' ? 'text-foreground placeholder:text-muted-foreground' : 'text-gray-900 placeholder:text-gray-500'}`}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPDF}
              className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-200 bg-gradient-to-r from-[#a259ff] to-[#8a4dde] text-white border-0 shadow-lg hover:shadow-xl hover:from-[#8a4dde] hover:to-[#7a3ecc]"
            >
              <FiDownload className="w-4 h-4" />
              Export PDF
            </motion.button>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart */}
          <motion.div
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            className={`rounded-[20px] p-6 ${
              theme === 'dark' 
                ? 'border-2 border-white/15 bg-slate-950/95 shadow-[0_28px_65px_rgba(2,6,23,0.6)]' 
                : 'border-2 border-gray-200 bg-white shadow-[0_26px_60px_rgba(118,154,224,0.32)]'
            }`}
          >
            <div className="mb-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                Branch Distribution
              </h3>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                Students and faculty across branches
              </p>
            </div>

            <div className="h-80 flex items-center justify-center">
              {filteredBranches.length > 0 ? (() => {
                const filteredLabels = filteredBranches.map((b: any) => b.name);

                const barData = {
                  labels: filteredLabels,
                  datasets: [
                    {
                      label: "Students",
                      data: filteredLabels.map((label: string) => studentMap[label] || 0),
                      backgroundColor: "rgba(59, 130, 246, 0.6)",
                      borderColor: "rgba(59, 130, 246, 1)",
                      borderWidth: 1,
                    },
                    {
                      label: "Faculty",
                      data: filteredLabels.map((label: string) => facultyMap[label] || 0),
                      backgroundColor: "rgba(168, 85, 247, 0.6)",
                      borderColor: "rgba(168, 85, 247, 1)",
                      borderWidth: 1,
                    },
                  ],
                };

                const hasData = barData.datasets.some((d) =>
                  d.data.some((val) => val > 0)
                );

                return hasData ? (
                  <Bar
                    data={barData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: {
                        duration: 800,
                        easing: "easeInOutQuart",
                      },
                      plugins: {
                        legend: {
                          position: "top",
                          labels: { 
                            color: theme === 'dark' ? "#fff" : "#000" 
                          },
                        },
                        tooltip: { enabled: true },
                      },
                      scales: {
                        x: { 
                          ticks: { 
                            color: theme === 'dark' ? "#fff" : "#000" 
                          } 
                        },
                        y: {
                          beginAtZero: true,
                          title: { 
                            display: true, 
                            text: "Count", 
                            color: theme === 'dark' ? "#fff" : "#000" 
                          },
                          ticks: { 
                            color: theme === 'dark' ? "#fff" : "#000" 
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-xl p-6 ${
                      theme === 'dark' 
                        ? 'border-2 border-white/10 bg-slate-900/95' 
                        : 'border-2 border-gray-200 bg-white/95'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-muted' : 'bg-gray-200'}`}>
                        <FiSearch className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>No data available</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>This branch has no records</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })() : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-xl p-6 ${
                    theme === 'dark' 
                      ? 'border-2 border-white/10 bg-slate-900/30 backdrop-blur-xl' 
                      : 'border-2 border-white/60 bg-white/30 backdrop-blur-xl'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-muted' : 'bg-gray-200'}`}>
                      <FiSearch className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>No results found</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Try a different search term</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            className={`rounded-[20px] p-6 ${
              theme === 'dark' 
                ? 'border-2 border-white/15 bg-slate-950/95 shadow-[0_28px_65px_rgba(2,6,23,0.6)]' 
                : 'border-2 border-gray-200 bg-white shadow-[0_26px_60px_rgba(118,154,224,0.32)]'
            }`}
          >
            <div className="mb-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                Role Distribution
              </h3>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                Breakdown of users by role
              </p>
            </div>
            <div className="h-80">
              <Pie
                data={pieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      position: "right", 
                      labels: { 
                        color: theme === 'dark' ? "#fff" : "#000" 
                      }
                    },
                    tooltip: { enabled: true },
                  },
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Branch Statistics Table */}
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          className={`rounded-[20px] p-6 ${
            theme === 'dark' 
              ? 'border-2 border-white/15 bg-slate-950/95 shadow-[0_28px_65px_rgba(2,6,23,0.6)]' 
              : 'border-2 border-gray-200 bg-white shadow-[0_26px_60px_rgba(118,154,224,0.32)]'
          }`}
        >
          <div className="mb-4">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
              Branch Statistics
            </h3>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
              Detailed distribution of students and faculty
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b-2 ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}>
                  <th className={`py-3 px-4 text-left font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Branch</th>
                  <th className={`py-3 px-4 text-left font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Student Count</th>
                  <th className={`py-3 px-4 text-left font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Faculty Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.length > 0 ? (
                  filteredBranches.map((branch: any, index: number) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`border-b ${theme === 'dark' ? 'border-border hover:bg-accent/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                    >
                      <td className={`py-3 px-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{branch.name || "N/A"}</td>
                      <td className={`py-3 px-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                          {branch.students || 0}
                        </span>
                      </td>
                      <td className={`py-3 px-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                          {branch.faculty || 0}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className={`py-8`}>
                      <div className={`rounded-xl p-6 ${
                        theme === 'dark' 
                          ? 'border-2 border-white/10 bg-slate-900/95' 
                          : 'border-2 border-gray-200 bg-white/95'
                      }`}>
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-muted' : 'bg-gray-200'}`}>
                            <FiSearch className="w-6 h-6" />
                          </div>
                          <p className={`${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>No branches match your search.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <div className="mb-4">
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
              Quick Actions
            </h3>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
              Manage your institution efficiently
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard
              variant="admin"
              title="Enroll User"
              description="Add new HOD or faculty"
              icon={<User size={20} />}
              onClick={() => setPage?.("enroll-user")}
            />
            <DashboardCard
              variant="admin"
              title="Bulk Upload Faculty"
              description="Upload faculty list"
              icon={<ClipboardList size={20} />}
              onClick={() => setPage?.("bulk-upload")}
            />
            <DashboardCard
              variant="admin"
              title="Manage Branches"
              description="View or edit branches"
              icon={<GitBranch size={20} />}
              onClick={() => setPage?.("branches")}
            />
            <DashboardCard
              variant="admin"
              title="Faculty Assignments"
              description="Assign teachers to branches & subjects"
              icon={<UserCheck size={20} />}
              onClick={() => setPage?.("teacher-assignments")}
            />
            <DashboardCard
              variant="admin"
              title="Manage Batches"
              description="View or manage batches"
              icon={<ClipboardList size={20} />}
              onClick={() => setPage?.("batches")}
            />
            <DashboardCard
              variant="admin"
              title="Notifications"
              description="Send or view notifications"
              icon={<Bell size={20} />}
              onClick={() => setPage?.("notifications")}
            />
            <DashboardCard
              variant="admin"
              title="HOD Leaves"
              description="Manage HOD leave requests"
              icon={<UserCheck size={20} />}
              onClick={() => setPage?.("hod-leaves")}
            />
            <DashboardCard
              variant="admin"
              title="Users Management"
              description="Manage all system users"
              icon={<Users size={20} />}
              onClick={() => setPage?.("users")}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminStats;