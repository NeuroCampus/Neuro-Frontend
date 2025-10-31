import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { Bell, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { getLeaveRequests } from "@/utils/student_api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useTheme } from "@/context/ThemeContext";

type LeaveStatusType = "PENDING" | "APPROVED" | "REJECTED";

interface LeaveRequest {
  id: string;
  title?: string;
  reason?: string;
  start_date: string;
  end_date?: string;
  applied_on?: string;
  status: LeaveStatusType;
}

interface LeaveStatusProps {
  setPage: (page: string) => void;
}

const statusStyles = (theme: string): Record<
  LeaveStatusType,
  { icon: JSX.Element; color: string; bg: string }
> => ({
  PENDING: {
    icon: <Clock3 className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`} />,
    color: theme === 'dark' ? "text-yellow-400" : "text-yellow-600",
    bg: theme === 'dark' ? "bg-yellow-900/30" : "bg-yellow-100",
  },
  APPROVED: {
    icon: <CheckCircle2 className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />,
    color: theme === 'dark' ? "text-green-400" : "text-green-600",
    bg: theme === 'dark' ? "bg-green-900/30" : "bg-green-100",
  },
  REJECTED: {
    icon: <XCircle className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />,
    color: theme === 'dark' ? "text-red-400" : "text-red-600",
    bg: theme === 'dark' ? "bg-red-900/30" : "bg-red-100",
  },
});

const LeaveStatus: React.FC<LeaveStatusProps> = ({ setPage }) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchLeaves = async () => {
      const data = await getLeaveRequests();
      if (data.success && Array.isArray(data.data)) {
        setLeaves(data.data);
      }
      setLoading(false);
    };
    fetchLeaves();
  }, []);

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <CardTitle className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>Leave Requests</CardTitle>
        <Button 
          className={theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-600 text-sm px-4 py-1.5' : 'text-gray-900 bg-gray-200 hover:bg-gray-300 border-gray-300 text-sm px-4 py-1.5'}
          onClick={() => setPage("leave-request")}>
          <Bell className="w-4 h-4 mr-2" />
          Apply for Leave
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>Loading leave requests...</div>
      ) : leaves.length === 0 ? (
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>No leave requests found.</div>
      ) : (
        <div className="space-y-4">
          {leaves.map((item) => (
            <div
              key={item.id}
              className={`border rounded-md px-4 py-4 shadow-sm ${theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-300' : 'bg-white text-gray-900 border-gray-200'}`}
            >
              <div className="flex justify-between items-start">
                {/* Left Section */}
                <div className="space-y-1 text-sm">
                  <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{item.title ?? "Leave Request"}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    From: {item.start_date}
                    {item.end_date ? ` To: ${item.end_date}` : ""}
                  </p>
                  {item.reason && (
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{item.reason}</p>
                  )}
                  {item.applied_on && (
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Applied on: {item.applied_on}
                    </p>
                  )}
                </div>

                {/* Right Section */}
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border-none ${statusStyles(theme)[item.status].bg} ${statusStyles(theme)[item.status].color}`}
                  >
                    <div className="flex items-center gap-1">
                      {statusStyles(theme)[item.status].icon}
                      {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                    </div>
                  </Badge>
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>#{item.id.slice(0, 6)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveStatus;