import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, ResponsiveContainer,LabelList  } from "recharts";
import { ProctorStudent } from '../../utils/faculty_api';
import { useProctorStudentsQuery } from '../../hooks/useApiQueries';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTheme } from "@/context/ThemeContext";

const GenerateStatistics = () => {
  const { data: proctorStudents = [], isLoading: loading, error } = useProctorStudentsQuery();
  const { theme } = useTheme();

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
    return <div className={`p-6 text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Loading statistics...</div>;
  }
  if (error) {
    return <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground' : 'bg-red-100 text-red-700'}`}>{error.message}</div>;
  }

  return (
    <div className={`p-6 space-y-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
        <h2 className="text-2xl font-bold">Statistics</h2>
      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Attendance Overview */}
        <Card className={theme === 'dark' ? 'shadow-sm bg-card text-foreground' : 'shadow-sm bg-white text-gray-900'}>
          <CardHeader>
            <CardTitle className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceData}>
                <CartesianGrid stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} />
                <XAxis
                  dataKey="name"
                  stroke={theme === 'dark' ? '#d1d5db' : '#6b7280'}
                  interval={0} // show all labels, but we’ll control them
                  tick={{ fontSize: 10 }} // smaller font
                  angle={-45} // rotate labels
                  textAnchor="end"
                  height={60} // extra space for rotated labels
                />
                <YAxis stroke={theme === 'dark' ? '#d1d5db' : '#6b7280'} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1c1c1e' : '#ffffff', 
                    border: theme === 'dark' ? '1px solid #2e2e30' : '1px solid #e5e7eb', 
                    color: theme === 'dark' ? '#f3f4f6' : '#1f2937' 
                  }}
                  itemStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}
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
        <Card className={theme === 'dark' ? 'shadow-sm bg-card text-foreground' : 'shadow-sm bg-white text-gray-900'}>
          <CardHeader>
            <CardTitle className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
              Average Marks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={marksData}>
                <CartesianGrid stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} />
                <XAxis
                  dataKey="name"
                  stroke={theme === 'dark' ? '#d1d5db' : '#6b7280'}
                  interval={0}
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke={theme === 'dark' ? '#d1d5db' : '#6b7280'} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1c1c1e' : '#ffffff', 
                    border: theme === 'dark' ? '1px solid #2e2e30' : '1px solid #e5e7eb', 
                    color: theme === 'dark' ? '#f3f4f6' : '#1f2937' 
                  }}
                  itemStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}
                />
                <Bar dataKey="avgMark" fill="#6366f1">
                  {/* 👇 Label inside each bar */}
                  <LabelList dataKey="avgMark" position="insideTop" fill={theme === 'dark' ? '#f3f4f6' : '#1f2937'} fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className={theme === 'dark' ? 'shadow-sm bg-card text-foreground' : 'shadow-sm bg-white text-gray-900'}>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Proctor Students Table</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportPDF} 
            className="flex items-center bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out shadow-md"
          >
            <FileTextIcon className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm border-collapse">
              <thead className={theme === 'dark' ? 'bg-muted' : 'bg-gray-100'}>
                <tr>
                  <th className={`p-3 text-left ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>USN</th>
                  <th className={`p-3 text-left ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Name</th>
                  <th className={`p-3 text-left ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Attendance %</th>
                  <th className={`p-3 text-left ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Avg Mark</th>
                </tr>
              </thead>
              <tbody>
                {proctorStudents.map((student, idx) => (
                  <tr key={idx} className={theme === 'dark' ? 'border-border' : 'border-gray-200'}>
                    <td className={`p-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{student.usn}</td>
                    <td className={`p-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{student.name}</td>
                    <td className={`p-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{formatAttendancePercentage(student.attendance)}</td>
                    <td className={`p-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
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