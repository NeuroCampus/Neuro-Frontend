import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, ResponsiveContainer } from "recharts";
import { getProctorStudents, ProctorStudent } from '../../utils/faculty_api';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const GenerateStatistics = () => {
  const [proctorStudents, setProctorStudents] = useState<ProctorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProctorStudents = async () => {
      setLoading(true);
      try {
        const res = await getProctorStudents();
        if (res.success && res.data) {
          setProctorStudents(res.data);
        } else {
          setError(res.message || 'Failed to fetch proctor students');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchProctorStudents();
  }, []);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Proctor Students Report", 14, 16);
    const tableColumn = ["USN", "Name", "Attendance %", "Avg Mark"];
    const tableRows = proctorStudents.map(student => [
      student.usn,
      student.name,
      `${student.attendance}%`,
      student.marks && student.marks.length > 0
        ? (
            student.marks.reduce((sum, m) => sum + (m.mark || 0), 0) /
            student.marks.length
          ).toFixed(2)
        : '0',
    ]);
    autoTable(doc, {
      startY: 20,
      head: [tableColumn],
      body: tableRows,
    });
    doc.save("proctor_students_report.pdf");
  };

  // Prepare chart data
  const attendanceData = proctorStudents.map(s => ({ name: s.name, attendance: s.attendance }));
  const marksData = proctorStudents.map(s => ({
    name: s.name,
    avgMark:
      s.marks && s.marks.length > 0
        ? (
            s.marks.reduce((sum, m) => sum + (m.mark || 0), 0) /
            s.marks.length
          ).toFixed(2)
        : 0,
  }));

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading statistics...</div>;
  }
  if (error) {
    return <div className="p-6 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="attendance" stroke="#3b82f6" name="Attendance %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Average Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={marksData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgMark" fill="#6366f1" name="Avg Mark" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800">Proctor Students Table</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex items-center">
            <FileTextIcon className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">USN</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Attendance %</th>
                  <th className="p-3 text-left">Avg Mark</th>
                </tr>
              </thead>
              <tbody>
                {proctorStudents.map((student, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">{student.usn}</td>
                    <td className="p-3">{student.name}</td>
                    <td className="p-3">{student.attendance}%</td>
                    <td className="p-3">
                      {student.marks && student.marks.length > 0
                        ? (
                            student.marks.reduce((sum, m) => sum + (m.mark || 0), 0) /
                            student.marks.length
                          ).toFixed(2)
                        : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateStatistics;
