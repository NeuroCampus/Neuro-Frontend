import { useState, useEffect } from "react";
import { FaUserGraduate, FaChalkboardTeacher, FaUserTie, FaUserShield } from "react-icons/fa";
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
import { getAdminStats } from "../../utils/admin_api";
import { useToast } from "../../hooks/use-toast";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface AdminStatsProps {
  setError: (error: string | null) => void;
}

const AdminStats = ({ setError }: AdminStatsProps) => {
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
    ? stats.branch_distribution.filter(
        (branch: any) =>
          branch?.name &&
          typeof branch.name === "string" &&
          branch.name.toLowerCase().includes(search.toLowerCase())
      )
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

  // Bar chart data for branch distribution
  const barData = {
    labels: filteredBranches.map((b: any) => b.name || "N/A"),
    datasets: [
      {
        label: "Students",
        data: filteredBranches.map((b: any) => b.students || 0),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
      {
        label: "Faculty",
        data: filteredBranches.map((b: any) => b.faculty || 0),
        backgroundColor: "rgba(168, 85, 247, 0.6)",
        borderColor: "rgba(168, 85, 247, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Pie chart data for role distribution
  const pieData = {
    labels: ["Students", "Faculty", "HODs", "Admins"],
    datasets: [
      {
        data: [
          stats?.role_distribution?.students || 0,
          stats?.role_distribution?.faculty || 0,
          stats?.role_distribution?.hods || 0,
          stats?.role_distribution?.admins || 0,
        ],
        backgroundColor: [
          "rgba(59, 130, 246, 0.6)",
          "rgba(168, 85, 247, 0.6)",
          "rgba(234, 179, 8, 0.6)",
          "rgba(239, 68, 68, 0.6)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(168, 85, 247, 1)",
          "rgba(234, 179, 8, 1)",
          "rgba(239, 68, 68, 1)",
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
      <div className="text-center py-6 text-gray-600 animate-pulse">
        Loading Dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-6 text-red-600">
        No statistics available
      </div>
    );
  }

  return (
    <div className="space-y-8 text-gray-800 bg-black-50 min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <DashboardCard
              title="Total Students"
              value={stats.total_students || 0}
              description="Enrolled in all branches"
              icon={<FaUserGraduate className="text-blue-500 text-3xl" />}
            />
          </motion.div>
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <DashboardCard
              title="Total Faculty"
              value={stats.total_faculty || 0}
              description="Teaching staff"
              icon={<FaChalkboardTeacher className="text-purple-500 text-3xl" />}
            />
          </motion.div>
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <DashboardCard
              title="Total HODs"
              value={stats.total_hods || 0}
              description="Department heads"
              icon={<FaUserTie className="text-yellow-500 text-3xl" />}
            />
          </motion.div>
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <DashboardCard
              title="Total Admins"
              value={stats.role_distribution?.admins || 0}
              description="System administrators"
              icon={<FaUserShield className="text-red-500 text-3xl" />}
            />
          </motion.div>
        </div>

        {/* Search and Export */}
        <div className="flex justify-between items-center flex-wrap gap-4 mt-8">
          <div className="flex items-center w-full sm:w-1/2 bg-black-50 border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
            <FiSearch className="text-white mr-3" />
            <input
              type="text"
              placeholder="Search by branch name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none text-sm bg-transparent text-white"
            />
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 text-sm font-medium px-5 py-2.5 rounded-lg shadow-md transition duration-200"
          >
            <FiDownload />
            Export PDF
          </button>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Bar Chart */}
          <motion.div
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            className="text-gray-800 rounded-lg shadow border border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold mb-1 text-gray-100">
              Branch Distribution
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Students and faculty across branches
            </p>
            <div className="h-80">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                      labels: { color: "#fff" } // Legend text white
                    },
                    tooltip: { enabled: true },
                  },
                  scales: {
                    x: { ticks: { color: "#fff" } },
                    y: { 
                      beginAtZero: true, 
                      title: { display: true, text: "Count", color: "#fff" },
                      ticks: { color: "#fff" }
                    },
                  },
                }}
              />
            </div>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            className="text-gray-800 rounded-lg shadow border border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold mb-1 text-gray-100">
              Role Distribution
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Breakdown of users by role
            </p>
            <div className="h-80">
              <Pie
                data={pieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      position: "right", 
                      labels: { color: "#fff" }
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
          className="text-gray-800 rounded-lg shadow border border-gray-700 p-6 mt-5"
        >
          <h3 className="text-lg font-semibold mb-1 text-gray-100">
            Branch Statistics
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Detailed distribution of students and faculty
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead>
                <tr className="text-gray-100 text-gray-200 border-b border-gray-700">
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Student Count</th>
                  <th className="py-3 px-4">Faculty Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.length > 0 ? (
                  filteredBranches.map((branch: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b border-gray-700 hover:bg-[#2E2E40] transition"
                    >
                      <td className="py-3 px-4">{branch.name || "N/A"}</td>
                      <td className="py-3 px-4">{branch.students || 0}</td>
                      <td className="py-3 px-4">{branch.faculty || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-gray-500">
                      No branches match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminStats;