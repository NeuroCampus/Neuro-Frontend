import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, ResponsiveContainer,LabelList  } from "recharts";
import { getProctorStudents, ProctorStudent } from '../../utils/faculty_api';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const GenerateStatistics = () => {
  const [proctorStudents, setProctorStudents] = useState<ProctorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Helper function to get numeric value for charts (NA becomes 0 for visualization)
  const getNumericAttendance = (percentage: number | string): number => {
    if (percentage === "NA" || percentage === null || percentage === undefined) {
      return 0;
    }
    if (typeof percentage === "string") {
      return 0;
    }
    return percentage;
  };

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
      formatAttendancePercentage(student.attendance),
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
  const attendanceData = proctorStudents.map(s => ({ name: s.name, attendance: getNumericAttendance(s.attendance) }));
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
    <div className="p-6 space-y-6 bg-[#1c1c1e] text-gray-200 min-h-screen">
      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Attendance Overview */}
        <Card className="shadow-sm bg-[#1c1c1e] text-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-200">
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceData}>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="#d1d5db"
                  interval={0} // show all labels, but we’ll control them
                  tick={{ fontSize: 10 }} // smaller font
                  angle={-45} // rotate labels
                  textAnchor="end"
                  height={60} // extra space for rotated labels
                />
                <YAxis stroke="#d1d5db" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#2d2d30", border: "none", color: "#f3f4f6" }}
                  itemStyle={{ color: "#f3f4f6" }}
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Attendance %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Marks */}
        <Card className="shadow-sm bg-[#1c1c1e] text-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-200">
              Average Marks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={marksData}>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="#d1d5db"
                  interval={0}
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#d1d5db" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#2d2d30", border: "none", color: "#f3f4f6" }}
                  itemStyle={{ color: "#f3f4f6" }}
                />
                <Bar dataKey="avgMark" fill="#6366f1">
                  {/* 👇 Label inside each bar */}
                  <LabelList dataKey="avgMark" position="insideTop" fill="#fff" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm bg-[#1c1c1e] text-gray-200">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-200">Proctor Students Table</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex items-center text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500">
            <FileTextIcon className="mr-2 h-4 w-4 " />
            Export PDF
          </Button>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-[#232326] sticky top-0 z-10">
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
                    <td className="p-3">{formatAttendancePercentage(student.attendance)}</td>
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
