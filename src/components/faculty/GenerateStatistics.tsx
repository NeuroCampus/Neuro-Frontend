import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileTextIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const GenerateStatistics = () => {
  const [semester, setSemester] = useState('even');
  const [department, setDepartment] = useState('cs');
  const [section, setSection] = useState('a');
  const [subject, setSubject] = useState('all');
  const [filteredAttendanceData, setFilteredAttendanceData] = useState([]);
  const [filteredPerformanceData, setFilteredPerformanceData] = useState([]);
  const [filteredStudentData, setFilteredStudentData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const attendanceData = [
    { month: 'Jan', CSE: 90, semester: 'even', department: 'cs', section: 'a' },
    { month: 'Feb', CSE: 85, semester: 'even', department: 'cs', section: 'a' },
    { month: 'Mar', CSE: 88, semester: 'even', department: 'cs', section: 'a' },
    { month: 'Apr', CSE: 84, semester: 'even', department: 'cs', section: 'a' },
    { month: 'May', CSE: 89, semester: 'even', department: 'cs', section: 'a' },
    { month: 'Jun', CSE: 92, semester: 'even', department: 'cs', section: 'a' },
    { month: 'Jul', CSE: 91, semester: 'even', department: 'cs', section: 'a' },
    { month: 'Aug', CSE: 90, semester: 'even', department: 'cs', section: 'a' },
  ];

  const performanceData = [
    { name: 'Data Structures', Above90: 15, Above75: 35, Above60: 20, Below60: 10, semester: 'even', department: 'cs', section: 'a', subject: 'Data Structures' },
    { name: 'Database Systems', Above90: 12, Above75: 30, Above60: 22, Below60: 8, semester: 'even', department: 'cs', section: 'a', subject: 'Database Systems' },
    { name: 'Machine Learning', Above90: 10, Above75: 28, Above60: 25, Below60: 12, semester: 'even', department: 'cs', section: 'a', subject: 'Machine Learning' },
  ];

  const studentData = [
    { usn: 'CS006', name: 'Lauren Anderson', total: 40, attended: 39, percent: 98, status: 'Excellent', semester: 'even', department: 'cs', section: 'a', subject: 'Data Structures' },
    { usn: 'CS001', name: 'John Smith', total: 40, attended: 38, percent: 95, status: 'Excellent', semester: 'even', department: 'cs', section: 'a', subject: 'Database Systems' },
    { usn: 'CS005', name: 'David Wilson', total: 40, attended: 36, percent: 90, status: 'Excellent', semester: 'even', department: 'cs', section: 'a', subject: 'Machine Learning' },
    { usn: 'CS002', name: 'Emily Johnson', total: 40, attended: 35, percent: 88, status: 'Good', semester: 'even', department: 'cs', section: 'a', subject: 'Data Structures' },
    { usn: 'CS007', name: 'Daniel Miller', total: 40, attended: 33, percent: 83, status: 'Good', semester: 'even', department: 'cs', section: 'a', subject: 'Database Systems' },
    { usn: 'CS003', name: 'Michael Brown', total: 40, attended: 32, percent: 80, status: 'Good', semester: 'even', department: 'cs', section: 'a', subject: 'Machine Learning' },
    { usn: 'CS004', name: 'Sarah Davis', total: 40, attended: 29, percent: 73, status: 'Low', semester: 'even', department: 'cs', section: 'a', subject: 'Data Structures' },
    { usn: 'CS006', name: 'Jessica Taylor', total: 40, attended: 26, percent: 65, status: 'Low', semester: 'even', department: 'cs', section: 'a', subject: 'Database Systems' },
  ];

  const statusColor = {
    Excellent: "text-green-600 bg-green-100",
    Good: "text-yellow-700 bg-yellow-100",
    Low: "text-red-600 bg-red-100"
  };

  useEffect(() => {
    // Filter data based on the selected filters
    const filteredAttendance = attendanceData.filter(data => {
      return (
        (semester === 'all' || data.semester === semester) &&
        (department === 'all' || data.department === department) &&
        (section === 'all' || data.section === section)
      );
    });

    const filteredPerformance = performanceData.filter(data => {
      return (
        (semester === 'all' || data.semester === semester) &&
        (department === 'all' || data.department === department) &&
        (section === 'all' || data.section === section) &&
        (subject === 'all' || data.subject === subject)
      );
    });

    const filteredStudents = studentData.filter(student => {
      return (
        (semester === 'all' || student.semester === semester) &&
        (department === 'all' || student.department === department) &&
        (section === 'all' || student.section === section) &&
        (subject === 'all' || student.subject === subject)
      );
    });

    setFilteredAttendanceData(filteredAttendance);
    setFilteredPerformanceData(filteredPerformance);
    setFilteredStudentData(filteredStudents);
    setCurrentPage(1); // Reset to first page when filters change
  }, [semester, department, section, subject]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Student Performance Report", 14, 16);

    const tableColumn = ["USN", "Name", "Total Classes", "Classes Attended", "Percentage", "Status"];
    const dataToUse = filteredStudentData.length > 0 ? filteredStudentData : studentData;

    const tableRows = dataToUse.map(student => [
      student.usn,
      student.name,
      student.total,
      student.attended,
      `${student.percent}%`,
      student.status,
    ]);

    autoTable(doc, {
      startY: 20,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("student_performance_report.pdf");
  };

  const totalPages = Math.ceil((filteredStudentData.length > 0 ? filteredStudentData : studentData).length / itemsPerPage);
  const currentItems = (filteredStudentData.length > 0 ? filteredStudentData : studentData).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Advanced Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-5 gap-4">
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Even Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="even">Even Semester</SelectItem>
              <SelectItem value="odd">Odd Semester</SelectItem>
              <SelectItem value="all">All Semesters</SelectItem>
            </SelectContent>
          </Select>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Computer Science" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cs">Computer Science</SelectItem>
              <SelectItem value="all">All Departments</SelectItem>
            </SelectContent>
          </Select>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Section A" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Section A</SelectItem>
              <SelectItem value="all">All Sections</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="Data Structures">Data Structures</SelectItem>
              <SelectItem value="Database Systems">Database Systems</SelectItem>
              <SelectItem value="Machine Learning">Machine Learning</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart width={400} height={200} data={filteredAttendanceData.length > 0 ? filteredAttendanceData : attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="CSE" stroke="#3b82f6" />
            </LineChart>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart width={400} height={200} data={filteredPerformanceData.length > 0 ? filteredPerformanceData : performanceData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Above90" fill="#10b981" />
              <Bar dataKey="Above75" fill="#3b82f6" />
              <Bar dataKey="Above60" fill="#f59e0b" />
              <Bar dataKey="Below60" fill="#ef4444" />
            </BarChart>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800">Student Performance Table</CardTitle>
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
                  <th className="p-3 text-left">Total Classes</th>
                  <th className="p-3 text-left">Classes Attended</th>
                  <th className="p-3 text-left">Percentage</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((student, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">{student.usn}</td>
                    <td className="p-3">{student.name}</td>
                    <td className="p-3">{student.total}</td>
                    <td className="p-3">{student.attended}</td>
                    <td className="p-3">{student.percent}%</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor[student.status]}`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end items-center mt-4 space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center"
            >
              <ChevronLeftIcon className=" h-4 w-4" />
              Back
            </Button>

            <span className="text-sm text-gray-600">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center"
            >
              Next
              <ChevronRightIcon className=" h-4 w-4" />
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateStatistics;
