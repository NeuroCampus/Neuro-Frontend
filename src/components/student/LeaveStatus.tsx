import { useEffect, useState, useMemo } from "react";
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
import type { GetLeaveRequestsResponse } from "@/utils/student_api";
import { useStudentLeaveRequestsQuery } from '@/hooks/useApiQueries';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';

type LeaveStatusType = "PENDING" | "APPROVED" | "REJECTED";

// Interface for leave requests from the dedicated API endpoint
interface LeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: string; // API returns string values
}

interface LeaveStatusProps {
  setPage: (page: string) => void;
}

const getStatusStyles = (theme: string, status: string) => {
  const normalizedStatus = status.toUpperCase() as LeaveStatusType;
  
  const styles = {
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
  };
  
  return styles[normalizedStatus] || styles.PENDING;
};

const LeaveStatus: React.FC<LeaveStatusProps> = ({ setPage }) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const { theme } = useTheme();
  const { data: leavesData = [], isLoading, isError, refetch } = useStudentLeaveRequestsQuery();
  const [filter, setFilter] = useState<string>('ALL');
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    setLeaves(leavesData as LeaveRequest[]);
  }, [leavesData]);

  const filteredLeaves = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (leaves || []).filter(l => {
      if (filter !== 'ALL' && l.status.toUpperCase() !== filter) return false;
      if (!q) return true;
      return l.reason.toLowerCase().includes(q) || l.start_date.includes(q) || l.end_date.includes(q);
    });
  }, [leaves, filter, query]);

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Leave Requests</CardTitle>
        <Button 
          className={theme === 'dark' ? 'text-foreground bg-muted hover:bg-accent border-border text-sm px-4 py-1.5' : 'text-gray-900 bg-gray-200 hover:bg-gray-300 border-gray-300 text-sm px-4 py-1.5'}
          onClick={() => setPage("leave-request")}>
          <Bell className="w-4 h-4 mr-2" />
          Apply for Leave
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" className="bg-muted rounded-md" value={filter} onValueChange={(v: any) => setFilter(v || 'ALL')}>
            <ToggleGroupItem value="ALL" className="px-3 py-1">All</ToggleGroupItem>
            <ToggleGroupItem value="PENDING" className="px-3 py-1">Pending</ToggleGroupItem>
            <ToggleGroupItem value="APPROVED" className="px-3 py-1">Approved</ToggleGroupItem>
            <ToggleGroupItem value="REJECTED" className="px-3 py-1">Rejected</ToggleGroupItem>
          </ToggleGroup>
          <div className="ml-3 text-sm text-muted-foreground hidden md:block">Showing {filteredLeaves.length} requests</div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input placeholder="Search reason or dates" value={query} onChange={(e:any) => setQuery(e.target.value)} className="max-w-sm" />
          <Button variant="ghost" onClick={() => { setQuery(''); setFilter('ALL'); }}>Reset</Button>
        </div>
      </div>

      {/* Error Message */}
      {isError && (
        <div className={`p-3 rounded-lg mb-4 shadow ${theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground border border-destructive' : 'bg-red-100 text-red-700 border border-red-200'}`}>
          An error occurred while fetching leave requests.
          <Button 
            variant="link" 
            className="p-0 ml-2"
            onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className={`text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Loading leave requests...</div>
      ) : filteredLeaves.length === 0 ? (
        <div className={`text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
          No leave requests found. 
          <Button 
            variant="link" 
            className="p-0 ml-2"
            onClick={() => setPage && setPage("leave-request")}>
            Apply for one now
          </Button>
        </div>
      ) : (
        <div className="space-y-4" id="leave-status-list">
          {filteredLeaves.map((item) => (
            <div
              key={item.id}
              className={`border rounded-md px-4 py-4 shadow-sm ${theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}
            >
              <div className="flex justify-between items-start">
                {/* Left Section */}
                <div className="space-y-1 text-sm">
                  <p className={`font-medium ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
                    Leave Request #{item.id}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                    {format(parseISO(item.start_date), 'PPP')} — {format(parseISO(item.end_date), 'PPP')}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>
                    {item.reason}
                  </p>
                </div>

                {/* Right Section */}
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border-none flex items-center gap-2 ${getStatusStyles(theme, item.status).bg} ${getStatusStyles(theme, item.status).color}`}
                  >
                    <div className="flex items-center gap-1">
                      {getStatusStyles(theme, item.status).icon}
                      {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                    </div>
                  </Badge>
                  <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{new Date(item.submitted_at).toLocaleString()}</div>
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