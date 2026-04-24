import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { format, isBefore } from "date-fns";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Filter, X } from "lucide-react";
import { useHistoricalStudentDataQuery } from "@/hooks/useApiQueries";
import { useTheme } from "@/context/ThemeContext";
import { Skeleton, SkeletonTable } from "../ui/skeleton";

const getStatusBadge = (status: string, dueDate: string, theme: string) => {
  const now = new Date();
  const due = new Date(dueDate);

  if (status === "Submitted") return <Badge className={theme === 'dark' ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"}>Submitted</Badge>;
  if (status === "Pending" && isBefore(due, now)) {
    return <Badge className={theme === 'dark' ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"}>Overdue</Badge>;
  }
  return <Badge className={theme === 'dark' ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700"}>Pending</Badge>;
};

// Filter Modal Component
const FilterModal = ({ isOpen, onClose, statusFilter, setStatusFilter, search, setSearch, theme }: any) => {
  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      {/* BACKDROP */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* MODAL CONTENT */}
      <Card className={`relative z-10 w-96 ${theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'}`}>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Filter Assignments</h3>
            <button 
              onClick={onClose}
              className={theme === 'dark' ? 'text-muted-foreground hover:text-foreground transition' : 'text-gray-500 hover:text-gray-700 transition'}
            >
              <X size={20} />
            </button>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Status</label>
            <div className="space-y-2">
              {["All", "Submitted", "Pending", "Overdue"].map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={statusFilter === status}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => {
                setStatusFilter("All");
                setSearch("");
              }}
              variant="outline"
              className={theme === 'dark' ? 'border-border text-foreground hover:bg-accent' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
            >
              Clear Filters
            </Button>
            <Button
              onClick={onClose}
              className="bg-purple-600 text-white hover:bg-purple-700 ml-auto transition"
            >
              Apply
            </Button>
          </div>
        </div>
      </Card>
    </div>,
    document.body
  );
};

const StudentAssignment = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isAssignmentsLoaded, setIsAssignmentsLoaded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const { theme } = useTheme();

  // Lazy load historical assignments data only when user clicks "Load Assignments"
  const { data: assignmentsResponse, isLoading, refetch } = useHistoricalStudentDataQuery(false);

  useEffect(() => {
    if (assignmentsResponse?.success && Array.isArray(assignmentsResponse.data)) {
      setAssignments(assignmentsResponse.data);
      setIsAssignmentsLoaded(true);
    }
  }, [assignmentsResponse]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [isFilterOpen]);

  const loadAssignments = async () => {
    await refetch();
  };

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, assignments, statusFilter]);

  const summary = useMemo(() => {
    let pending = 0;
    let submitted = 0;
    let overdue = 0;
    const now = new Date();

    assignments.forEach((a) => {
      if (a.status === "Submitted") submitted++;
      else if (isBefore(new Date(a.dueDate), now)) overdue++;
      else pending++;
    });

    return {
      total: assignments.length,
      pending,
      submitted,
      overdue,
    };
  }, [assignments]);

  return (
    <div className={`p-6 space-y-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      {/* Heading */}
      <div className="flex justify-between items-center">
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Assignments</h2>
        {!isAssignmentsLoaded && (
          <Button
            onClick={loadAssignments}
            disabled={isLoading}
            className={theme === 'dark' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-600 text-white hover:bg-purple-700'}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Loading...
              </div>
            ) : 'Load Assignments'}
          </Button>
        )}
      </div>

      {isLoading && !isAssignmentsLoaded && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
          <SkeletonTable rows={8} cols={3} />
        </div>
      )}

      {/* Summary Row */}
      {isAssignmentsLoaded && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        <div className={theme === 'dark' ? 'bg-card rounded-lg p-4' : 'bg-gray-100 rounded-lg p-4'}>
          <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Total</p>
          <p className={`text-xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{summary.total}</p>
        </div>
        <div className={theme === 'dark' ? 'bg-yellow-900/20 rounded-lg p-4' : 'bg-yellow-100 rounded-lg p-4'}>
          <p className={`text-sm ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-800'}`}>Pending</p>
          <p className={`text-xl font-bold ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-900'}`}>{summary.pending}</p>
        </div>
        <div className={theme === 'dark' ? 'bg-blue-900/20 rounded-lg p-4' : 'bg-blue-100 rounded-lg p-4'}>
          <p className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'}`}>Submitted</p>
          <p className={`text-xl font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>{summary.submitted}</p>
        </div>
        <div className={theme === 'dark' ? 'bg-destructive/20 rounded-lg p-4' : 'bg-red-100 rounded-lg p-4'}>
          <p className={`text-sm ${theme === 'dark' ? 'text-destructive' : 'text-red-800'}`}>Overdue</p>
          <p className={`text-xl font-bold ${theme === 'dark' ? 'text-destructive' : 'text-red-900'}`}>{summary.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search assignments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={theme === 'dark' ? 'max-w-sm bg-background text-foreground border-border' : 'max-w-sm bg-white text-gray-900 border-gray-300'}
        />
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setIsFilterOpen(true)}
          className={theme === 'dark' ? 'border-border text-foreground hover:bg-accent' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
        >
          <Filter size={20} />
        </Button>
      </div>

      {/* Filter Modal - Rendered via Portal */}
      <FilterModal 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        search={search}
        setSearch={setSearch}
        theme={theme}
      />

      {/* Table */}
      <Card className={theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'}>
        <CardContent className="p-0 overflow-x-auto">
          <table className={`min-w-full text-sm text-left ${theme === 'dark' ? 'divide-border' : 'divide-gray-200'}`}>
            <thead className={theme === 'dark' ? 'bg-muted text-muted-foreground font-medium' : 'bg-gray-100 text-gray-600 font-medium'}>
              <tr>
                <th className="px-3 md:px-4 py-3">Title</th>
                <th className="px-3 md:px-4 py-3">End Date</th>
                <th className="px-3 md:px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className={theme === 'dark' ? 'divide-border' : 'divide-gray-100'}>
              {filtered.map((assignment, idx) => (
                <tr key={idx} className={theme === 'dark' ? 'hover:bg-accent transition' : 'hover:bg-gray-50 transition'}>
                  <td className={`px-3 md:px-4 py-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-800'}`}>{assignment.title}</td>
                  <td className={`px-3 md:px-4 py-3 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                    {format(new Date(assignment.dueDate), "MMM dd, yyyy")}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    {getStatusBadge(assignment.status, assignment.dueDate, theme)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className={`px-4 py-4 text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                    No assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
};

export default StudentAssignment;