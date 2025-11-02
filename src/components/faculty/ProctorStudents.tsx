import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { ProctorStudent } from "../../utils/faculty_api";
import { useProctorStudentsQuery } from "../../hooks/useApiQueries";
import { useTheme } from "@/context/ThemeContext";

const ITEMS_PER_PAGE = 10;

const ProctorStudents = () => {
  // Helper function to format attendance percentage
  const formatAttendancePercentage = (percentage: number | string): string => {
    if (percentage === "NA" || percentage === null || percentage === undefined) {
      return "NA";
    }
    if (typeof percentage === "string") {
      return percentage;
    }
    return `${percentage}%`;
  };
  const { data: proctorStudents = [], isLoading: loading, error } = useProctorStudentsQuery();
  const [students, setStudents] = useState<ProctorStudent[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { theme } = useTheme();

  useEffect(() => {
    setStudents(proctorStudents);
  }, [proctorStudents]);

  const filteredStudents = students.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.usn.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handlePrevious = () => {
    setPage(prev => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setPage(prev => Math.min(prev + 1, totalPages));
  };

  if (loading) {
    return <div className={`p-6 text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Loading students...</div>;
  }
  if (error) {
    return <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground' : 'bg-red-100 text-red-700'}`}>{error.message}</div>;
  }

  return (
    <Card className={theme === 'dark' ? 'bg-card text-foreground shadow-md' : 'bg-white text-gray-900 shadow-md'}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Proctor Students</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by USN or name..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}
        />
        <div className="max-h-max overflow-y-auto overflow-x-auto">
          <table className={`min-w-full rounded-md ${theme === 'dark' ? 'border border-border' : 'border border-gray-200'}`}>
            <thead className={theme === 'dark' ? 'bg-muted text-foreground' : 'bg-gray-100 text-gray-900'}>
              <tr>
                <th className={`px-4 py-2 text-left text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>USN</th>
                <th className={`px-4 py-2 text-left text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Name</th>
                <th className={`px-4 py-2 text-left text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Semester</th>
                <th className={`px-4 py-2 text-left text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Attendance %</th>
                <th className={`px-4 py-2 text-left text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Avg Mark</th>
              </tr>
            </thead>
            <tbody className={theme === 'dark' ? 'divide-border' : 'divide-gray-200'}>
              {paginatedStudents.map((student, index) => (
                <tr key={index} className={theme === 'dark' ? 'hover:bg-muted' : 'hover:bg-gray-100'}>
                  <td className={`px-4 py-2 text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{student.usn}</td>
                  <td className={`px-4 py-2 text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{student.name}</td>
                  <td className={`px-4 py-2 text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{student.semester}</td>
                  <td className={`px-4 py-2 text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                    {formatAttendancePercentage(student.attendance)}
                  </td>
                  <td className={`px-4 py-2 text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                    {student.marks && student.marks.length > 0
                      ? (
                          student.marks.reduce((sum, m) => sum + (m.mark || 0), 0) /
                          student.marks.length
                        ).toFixed(2)
                      : 0}
                  </td>
                </tr>
              ))}
              {paginatedStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className={`text-center py-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={page === 1}
            className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
          >
            Previous
          </Button>
          <span className={`text-sm self-center ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
            Page {page} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            onClick={handleNext} 
            disabled={page === totalPages}
            className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProctorStudents;