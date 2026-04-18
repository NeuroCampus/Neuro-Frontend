import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, Loader } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { getStaffEnrollment } from "../../utils/hms_api";
import { useTheme } from "../../context/ThemeContext";

interface Warden {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  designation?: string;
  experience?: string;
}

interface Caretaker {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  experience?: string;
}

const StaffManagementOverview = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [wardensTotal, setWardensTotal] = useState(0);
  const [caretakersTotal, setCaretakersTotal] = useState(0);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const response = await getStaffEnrollment();

      if (response.success) {
        // Handle the response data structure - check if it's double-wrapped
        const actualData = response.data?.data || response.data;
        const { wardens: wardensData, caretakers: caretakersData } = actualData;

        setWardens(wardensData?.items || []);
        setWardensTotal(wardensData?.total || 0);

        setCaretakers(caretakersData?.items || []);
        setCaretakersTotal(caretakersData?.total || 0);
      } else {
        throw new Error(response.message || "Failed to fetch staff data");
      }
    } catch (error) {
      console.error("Error fetching staff data:", error);
      toast({
        title: "Error",
        description: "Failed to load staff enrollment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Staff Management</h1>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
          View all enrolled wardens and caretakers
        </p>
      </div>

      {/* Statistics Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={containerVariants}
      >
        {/* Total Wardens */}
        <motion.div
          variants={itemVariants}
          className={`p-6 rounded-lg border-2 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-orange-900 to-orange-800 border-orange-700'
              : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'
          } hover:shadow-lg transition-shadow`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-orange-300' : 'text-orange-600'}`}>
                Total Wardens
              </p>
              <p className={`text-3xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-orange-900'}`}>
                {wardensTotal}
              </p>
            </div>
            <UserCheck className={`w-12 h-12 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
          </div>
        </motion.div>

        {/* Total Caretakers */}
        <motion.div
          variants={itemVariants}
          className={`p-6 rounded-lg border-2 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700'
              : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300'
          } hover:shadow-lg transition-shadow`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                Total Caretakers
              </p>
              <p className={`text-3xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>
                {caretakersTotal}
              </p>
            </div>
            <Users className={`w-12 h-12 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
          </div>
        </motion.div>
      </motion.div>

      {/* Staff Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wardens */}
        <motion.div
          variants={itemVariants}
          className={`p-6 rounded-lg border-2 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-orange-500" />
            Wardens ({wardensTotal})
          </h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {wardens.length > 0 ? (
              wardens.map((warden, index) => (
                <motion.div
                  key={warden.id}
                  variants={itemVariants}
                  className={`p-4 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  } transition-colors`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {index + 1}. {warden.name}
                    </p>
                    <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-semibold">
                      Warden
                    </span>
                  </div>
                  {warden.designation && (
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      🏢 {warden.designation}
                    </p>
                  )}
                  {warden.email && (
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      📧 {warden.email}
                    </p>
                  )}
                  {warden.phone && (
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      📱 {warden.phone}
                    </p>
                  )}
                  {warden.experience && (
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      ⭐ {warden.experience} years experience
                    </p>
                  )}
                </motion.div>
              ))
            ) : (
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                No wardens enrolled yet
              </p>
            )}
          </div>
        </motion.div>

        {/* Caretakers */}
        <motion.div
          variants={itemVariants}
          className={`p-6 rounded-lg border-2 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Caretakers ({caretakersTotal})
          </h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {caretakers.length > 0 ? (
              caretakers.map((caretaker, index) => (
                <motion.div
                  key={caretaker.id}
                  variants={itemVariants}
                  className={`p-4 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  } transition-colors`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {index + 1}. {caretaker.name}
                    </p>
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold">
                      Caretaker
                    </span>
                  </div>
                  {caretaker.phone && (
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      📱 {caretaker.phone}
                    </p>
                  )}
                  {caretaker.email && (
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      📧 {caretaker.email}
                    </p>
                  )}
                  {caretaker.address && (
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      🏠 {caretaker.address}
                    </p>
                  )}
                  {caretaker.experience && (
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      ⭐ {caretaker.experience} years experience
                    </p>
                  )}
                </motion.div>
              ))
            ) : (
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                No caretakers enrolled yet
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StaffManagementOverview;
