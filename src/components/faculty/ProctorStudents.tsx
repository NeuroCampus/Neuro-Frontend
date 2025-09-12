import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { ProctorStudent } from "../../utils/faculty_api";
import { useProctorStudents } from "../../context/ProctorStudentsContext";

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
  const { proctorStudents, loading, error } = useProctorStudents();
  const [students, setStudents] = useState<ProctorStudent[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
    return <div className="p-6 text-center text-gray-600">Loading students...</div>;
  }
  if (error) {
    return <div className="p-6 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  return (
    <Card className="bg-[#1c1c1e] text-gray-200 shadow-md">
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
          className="w-full rounded bg-[#232326] border text-gray-200 outline-none focus:ring-2 focus:ring-white"
        />
        <div className="max-h-96 overflow-y-auto overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-md">
            <thead className="bg-[#1c1c1e] text-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">USN</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Semester</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Attendance %</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-200">Avg Mark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedStudents.map((student, index) => (
                <tr key={index} className="hover:bg-gray-500">
                  <td className="px-4 py-2 text-sm text-gray-200">{student.usn}</td>
                  <td className="px-4 py-2 text-sm text-gray-200">{student.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-200">{student.semester}</td>
                  <td className="px-4 py-2 text-sm text-gray-200">
                    {formatAttendancePercentage(student.attendance)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-200">
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
                  <td colSpan={5} className="text-center text-gray-200 py-4">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handlePrevious} disabled={page === 1} className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500">
            Previous
          </Button>
          <span className="text-sm text-gray-200 self-center">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" onClick={handleNext} disabled={page === totalPages} className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500">
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProctorStudents;
