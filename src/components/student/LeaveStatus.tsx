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

const statusStyles: Record<
  LeaveStatusType,
  { icon: JSX.Element; color: string; bg: string }
> = {
  PENDING: {
    icon: <Clock3 className="w-3.5 h-3.5 text-yellow-500" />,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
  },
  APPROVED: {
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  REJECTED: {
    icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
    color: "text-red-600",
    bg: "bg-red-100",
  },
};

const LeaveStatus: React.FC<LeaveStatusProps> = ({ setPage }) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="bg-[#1c1c1e] text-gray-200 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <CardTitle>Leave Requests</CardTitle>
        <Button className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 text-sm px-4 py-1.5"
          onClick={() => setPage("leave-request")}>
          <Bell className="w-4 h-4 mr-2" />
          Apply for Leave
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-sm text-gray-200">Loading leave requests...</div>
      ) : leaves.length === 0 ? (
        <div className="text-sm text-gray-200">No leave requests found.</div>
      ) : (
        <div className="space-y-4">
          {leaves.map((item) => (
            <div
              key={item.id}
              className="bg-[#1c1c1e] text-gray-200 border border-gray-200 rounded-md px-4 py-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                {/* Left Section */}
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{item.title ?? "Leave Request"}</p>
                  <p className="text-xs text-gray-200">
                    From: {item.start_date}
                    {item.end_date ? ` To: ${item.end_date}` : ""}
                  </p>
                  {item.reason && (
                    <p className="text-xs text-gray-200">{item.reason}</p>
                  )}
                  {item.applied_on && (
                    <p className="text-xs text-gray-300">
                      Applied on: {item.applied_on}
                    </p>
                  )}
                </div>

                {/* Right Section */}
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border-none ${statusStyles[item.status].bg} ${statusStyles[item.status].color}`}
                  >
                    <div className="flex items-center gap-1">
                      {statusStyles[item.status].icon}
                      {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                    </div>
                  </Badge>
                  <span className="text-xs text-gray-200">#{item.id.slice(0, 6)}</span>
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
