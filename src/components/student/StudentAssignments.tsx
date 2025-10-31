import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { format, isBefore } from "date-fns";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { getStudentAssignments } from "@/utils/student_api";
import { useTheme } from "@/context/ThemeContext";

const getStatusBadge = (status: string, dueDate: string, theme: string) => {
  const now = new Date();
  const due = new Date(dueDate);

  if (status === "Submitted") return <Badge className={theme === 'dark' ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"}>Submitted</Badge>;
  if (status === "Pending" && isBefore(due, now)) {
    return <Badge className={theme === 'dark' ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"}>Overdue</Badge>;
  }
  return <Badge className={theme === 'dark' ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700"}>Pending</Badge>;
};

const StudentAssignment = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    const fetchAssignments = async () => {
      const data = await getStudentAssignments();
      if (data.success && Array.isArray(data.data)) {
        setAssignments(data.data);
      }
    };
    fetchAssignments();
  }, []);

  const filtered = useMemo(() => {
    return assignments.filter((a) =>
      a.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, assignments]);

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
      <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Assignments</h2>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="Search assignments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={theme === 'dark' ? 'max-w-sm bg-background text-foreground border-border' : 'max-w-sm bg-white text-gray-900 border-gray-300'}
        />
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className={theme === 'dark' ? 'border-border text-foreground hover:bg-accent' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
          >
            All Statuses
          </Button>
          <Button 
            variant="outline" 
            className={theme === 'dark' ? 'border-border text-foreground hover:bg-accent' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
          >
            All Subjects
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className={theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'}>
        <CardContent className="p-0">
          <table className={`min-w-full text-sm text-left ${theme === 'dark' ? 'divide-border' : 'divide-gray-200'}`}>
            <thead className={theme === 'dark' ? 'bg-muted text-muted-foreground font-medium' : 'bg-gray-100 text-gray-600 font-medium'}>
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className={theme === 'dark' ? 'divide-border' : 'divide-gray-100'}>
              {filtered.map((assignment, idx) => (
                <tr key={idx} className={theme === 'dark' ? 'hover:bg-accent transition' : 'hover:bg-gray-50 transition'}>
                  <td className={`px-4 py-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-800'}`}>{assignment.title}</td>
                  <td className={`px-4 py-3 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                    {format(new Date(assignment.dueDate), "MMM dd, yyyy")}
                  </td>
                  <td className="px-4 py-3">
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
    </div>
  );
};

export default StudentAssignment;