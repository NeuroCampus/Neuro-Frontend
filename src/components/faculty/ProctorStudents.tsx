import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { ProctorStudent } from "../../utils/faculty_api";
import { useTheme } from "@/context/ThemeContext";

const ITEMS_PER_PAGE = 10;

interface ProctorStudentsProps {
  proctorStudents: ProctorStudent[];
  proctorStudentsLoading: boolean;
}

const ProctorStudents = ({ proctorStudents, proctorStudentsLoading }: ProctorStudentsProps) => {
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
  const [search, setSearch] = useState("");
  const { theme } = useTheme();

  if (proctorStudentsLoading) {
    return <div className={`p-6 text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Loading students...</div>;
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
              {proctorStudents.map((student, index) => (
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
              {proctorStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className={`text-center py-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProctorStudents;