import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { UploadIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "../ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { useToast } from "../ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import { manageProfile, getStudentPerformance, getSemesters, manageSections, manageSubjects, getMarks, getAttendanceBootstrap } from "../../utils/hod_api";
import type { Mark } from "../../utils/hod_api";

interface Student {
  name: string;
  rollNo: string;
  subject_marks: { [key: string]: { average: number; tests: { test_number: number; mark: number; max_mark: number }[] } };
}

interface ChartData {
  subject: string;
  subject_code: string;
  average: number;
  max: number;
  attendance: number;
  semester: string;
}

interface Semester {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
  semester_id: string;
}

interface Subject {
  id: string;
  name: string;
  semester_id: string;
}

const MarksView = () => {
  const { toast } = useToast();
  const [state, setState] = useState({
    searchTerm: "",
    semesterFilter: "all", // Default to "All Semesters"
    sectionFilter: "",
    subjectFilter: "",
    students: [] as Student[],
    chartData: [] as ChartData[],
    semesters: [] as Semester[],
    sections: [] as Section[],
    subjects: [] as Subject[],
    loading: true,
    branchId: "",
    selectedStudent: null as Student | null,
    error: null as string | null,
  });

  const reportRef = useRef<HTMLDivElement>(null);

  const updateState = (newState: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  useEffect(() => {
    const fetchData = async () => {
      updateState({ loading: true, error: null });
      try {
        const filters: { semester_id?: string; section_id?: string; subject_id?: string } = {};
        if (state.semesterFilter !== "all") {
          filters.semester_id = state.semesterFilter;
        }
        if (state.sectionFilter && state.sectionFilter !== "all") {
          filters.section_id = state.sectionFilter;
        }
        if (state.subjectFilter && state.subjectFilter !== "all") {
          filters.subject_id = state.subjectFilter;
        }

        const response = await getAttendanceBootstrap("", filters);
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch data");
        }

        const data = response.data;

        // Set branchId
        updateState({ branchId: data.profile.branch_id });

        // Set semesters
        const semestersData = data.semesters.map((s: any) => ({
          id: s.id,
          name: `${s.number}th Semester`,
        }));

        // Set sections
        const sectionsData = data.sections.map((s: any) => ({
          id: s.id,
          name: s.name,
          semester_id: s.semester_id,
        }));

        // Set subjects
        const subjectsData = data.subjects.map((s: any) => ({
          id: s.id,
          name: s.name,
          semester_id: s.semester_id,
        }));

        // Process performance data for chart
        const chartData = state.semesterFilter === "all"
          ? data.performance.map((p: any) => ({
              subject: p.subject,
              subject_code: p.subject,
              average: p.marks,
              max: 100,
              attendance: p.attendance,
              semester: p.semester,
            }))
          : data.performance
              .filter((p: any) => {
                const selectedSemester = semestersData.find(s => s.id === state.semesterFilter);
                return p.semester === selectedSemester?.name;
              })
              .map((p: any) => ({
                subject: p.subject,
                subject_code: p.subject,
                average: p.marks,
                max: 100,
                attendance: p.attendance,
                semester: p.semester,
              }));

        // Process marks data
        const studentsMap = new Map<string, Student>();
        data.marks.forEach((mark: any) => {
          const studentId = mark.student_id;
          if (!studentsMap.has(studentId)) {
            studentsMap.set(studentId, {
              name: mark.student,
              rollNo: mark.usn,
              subject_marks: {},
            });
          }
          const student = studentsMap.get(studentId)!;
          student.subject_marks[mark.subject] = {
            average: mark.average_mark,
            tests: mark.test_marks,
          };
        });
        const studentsData = Array.from(studentsMap.values());

        updateState({
          semesters: semestersData,
          sections: sectionsData,
          subjects: subjectsData,
          chartData,
          students: studentsData,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch data";
        console.error("Error fetching data:", err);
        updateState({
          students: [],
          chartData: [],
          sections: [],
          subjects: [],
          loading: false,
          error: errorMessage,
        });
        toast({ variant: "destructive", title: "Error", description: errorMessage });
      }
    };
    fetchData();
  }, [state.semesterFilter, state.sectionFilter, state.subjectFilter, toast]);

  const subjectKeys = state.subjects.map((s) => s.name);

  const filteredStudents = state.students.filter(
    (student) =>
      student.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const handleExportPDF = (type: "marks" | "attendance") => {
    const doc = new jsPDF();
    let headers: string[] = [];
    let data: string[][] = [];

    if (type === "marks") {
      headers = ["Name", "Roll No", ...subjectKeys];
      data = filteredStudents.map((student) => [
        student.name,
        student.rollNo,
        ...subjectKeys.map((key) => student.subject_marks[key] || "-"),
      ]);
    } else {
      headers = ["Name", "Roll No", ...subjectKeys];
      data = filteredStudents.map((student) => [
        student.name,
        student.rollNo,
        ...subjectKeys.map((key) => student.subject_marks[key] ? `${state.chartData.find(c => c.subject === key)?.attendance || 0}%` : "-"),
      ]);
    }

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 20,
      theme: "grid",
    });

    doc.save(`${type}_report.pdf`);
  };

  // Custom Tooltip for BarChart
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isMarksChart = payload.some((p: any) => p.dataKey === "average");
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
          <p className="font-semibold text-gray-800">{`Subject: ${label}`}</p>
          {isMarksChart ? (
            <>
              <p className="text-gray-600">{`Average Marks: ${data.average}`}</p>
              <p className="text-gray-600">{`Max Marks: ${data.max}`}</p>
            </>
          ) : (
            <p className="text-gray-600">{`Attendance: ${data.attendance}%`}</p>
          )}
          <p className="text-gray-600">{`Semester: ${data.semester}`}</p>
        </div>
      );
    }
    return null;
  };

  const getSemesterDisplay = () =>
    state.semesterFilter === "all" ? "All Semesters" : state.semesters.find((s) => s.id === state.semesterFilter)?.name || "Select Semester";
  const getSectionDisplay = () =>
    state.sectionFilter === "all" ? "All Sections" : state.sections.find((s) => s.id === state.sectionFilter)?.name || "All Sections";
  const getSubjectDisplay = () =>
    state.subjectFilter === "all" ? "All Subjects" : state.subjects.find((s) => s.id === state.subjectFilter)?.name || "All Subjects";

  return (
    <div className="p-6 bg-[#1c1c1e] text-gray-200 min-h-screen " ref={reportRef}>
      <div>
        <h2 className="text-2xl font-semibold">Internal Marks & Attendance</h2>
        <p className="text-gray-200 text-sm">
          View and analyze student performance and generate reports.
        </p>
      </div>

      {state.loading && <p className="text-gray-200 my-4">Loading data...</p>}

      <div className="flex flex-wrap gap-4 my-6">
        <Select
          value={state.semesterFilter}
          onValueChange={(value) =>
            updateState({ semesterFilter: value, sectionFilter: "all", subjectFilter: "all" })
          }
          disabled={state.loading || state.semesters.length === 0}
        >
          <SelectTrigger className="w-48 bg-[#232326] text-gray-200">
            <SelectValue placeholder={getSemesterDisplay()} />
          </SelectTrigger>
          <SelectContent className="bg-[#232326] text-gray-200">
            <SelectItem value="all" className="bg-[#232326] text-gray-200">All Semesters</SelectItem>
            {state.semesters.map((semester) => (
              <SelectItem key={semester.id} value={semester.id}>
                {semester.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={state.sectionFilter}
          onValueChange={(value) => updateState({ sectionFilter: value })}
          disabled={
            state.loading ||
            state.sections.length === 0
          }
        >
          <SelectTrigger className="w-48 bg-[#232326] text-gray-200">
            <SelectValue placeholder={getSectionDisplay()} />
          </SelectTrigger>
          <SelectContent className="bg-[#232326] text-gray-200">
            <SelectItem value="all">All Sections</SelectItem>
            {state.sections
              .filter((section) => state.semesterFilter === "all" || section.semester_id === state.semesterFilter)
              .map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select
          value={state.subjectFilter}
          onValueChange={(value) => updateState({ subjectFilter: value })}
          disabled={
            state.loading ||
            state.subjects.length === 0
          }
        >
          <SelectTrigger className="w-48 bg-[#232326] text-gray-200">
            <SelectValue placeholder={getSubjectDisplay()} />
          </SelectTrigger>
          <SelectContent className="bg-[#232326] text-gray-200">
            <SelectItem value="all">All Subjects</SelectItem>
            {state.subjects
              .filter((subject) => state.semesterFilter === "all" || subject.semester_id === state.semesterFilter)
              .map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {state.error && (
        <Card className="my-4">
          <CardContent>
            <p className="text-center text-red-500">{state.error}</p>
          </CardContent>
        </Card>
      )}

      {!state.loading && !state.error && (
        <Tabs defaultValue="marks">
          <TabsList className="w-full bg-gray-100 justify-center rounded-md p-1">
            <TabsTrigger value="marks" className="w-full">
              Marks Report
            </TabsTrigger>
            <TabsTrigger value="attendance" className="w-full">
              Attendance Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marks">
            <Card>
              <CardHeader>
                <CardTitle>Class Average Marks by Subject</CardTitle>
                <span className="text-sm text-gray-200">
                  {getSemesterDisplay()}, {getSectionDisplay()}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {state.chartData.length === 0 ? (
                  <p className="text-center text-gray-200">No chart data available</p>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={state.chartData}>
                        <XAxis dataKey="subject" stroke="#888888" />
                        <YAxis stroke="#888888" />
                        <Tooltip content={customTooltip} />
                        <Legend />
                        <Bar dataKey="average" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Class Average" />
                        <Bar dataKey="max" fill="#64748b" radius={[4, 4, 0, 0]} name="Maximum Marks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between items-center mt-6">
              <Input
                placeholder="Search by name or roll number..."
                className="w-1/3"
                value={state.searchTerm}
                onChange={(e) => updateState({ searchTerm: e.target.value })}
                disabled={state.loading}
              />
              <Button
                className="flex items-center gap-2 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 rounded-md px-4 py-2 shadow-sm"
                onClick={() => handleExportPDF("marks")}
                disabled={state.loading || filteredStudents.length === 0}
              >
                <UploadIcon className="w-4 h-4" />
                Export Marks to PDF
              </Button>
            </div>

            <Card className="mt-4">
              <CardContent className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">Student</th>
                      {subjectKeys.map((subject) => (
                        <th key={subject} className="text-left py-2 px-4 font-medium">
                          {subject}
                        </th>
                      ))}
                      <th className="text-left py-2 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={subjectKeys.length + 2} className="py-3 text-center text-gray-200">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.rollNo} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">
                            <div className="font-semibold">{student.name}</div>
                            <div className="text-gray-500 text-xs">{student.rollNo}</div>
                          </td>
                          {subjectKeys.map((subject) => (
                            <td key={subject} className="py-2 px-4">
                              {student.subject_marks[subject] ? (
                                <>
                                  <p className="text-sm text-gray-600">Average: {student.subject_marks[subject]?.average || "-"}</p>
                                  <p className="text-sm text-gray-600">Tests:</p>
                                  <ul className="list-disc list-inside text-sm text-gray-600">
                                    {student.subject_marks[subject]?.tests.map((test) => (
                                      <li key={test.test_number}>
                                        Test {test.test_number}: {test.mark}/{test.max_mark}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              ) : (
                                "-"
                              )}
                            </td>
                          ))}
                          <td className="py-2 px-4">
                            <Button
                              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 rounded-md px-4 py-2 shadow-sm"
                              size="sm"
                              onClick={() => updateState({ selectedStudent: student })}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Class Average Attendance by Subject</CardTitle>
                <span className="text-sm text-gray-200">
                  {getSemesterDisplay()}, {getSectionDisplay()}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {state.chartData.length === 0 ? (
                  <p className="text-center text-gray-500">No chart data available</p>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={state.chartData}>
                        <XAxis dataKey="subject" stroke="#888888" />
                        <YAxis stroke="#888888" unit="%" />
                        <Tooltip content={customTooltip} />
                        <Legend />
                        <Bar dataKey="attendance" fill="#10b981" radius={[4, 4, 0, 0]} name="Class Average Attendance" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between items-center mt-6">
              <Input
                placeholder="Search by name or roll number..."
                className="w-1/3"
                value={state.searchTerm}
                onChange={(e) => updateState({ searchTerm: e.target.value })}
                disabled={state.loading}
              />
              <Button
                className="flex items-center gap-2 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 rounded-md px-4 py-2 shadow-sm"
                onClick={() => handleExportPDF("attendance")}
                disabled={state.loading || filteredStudents.length === 0}
              >
                <UploadIcon className="w-4 h-4" />
                Export Attendance to PDF
              </Button>
            </div>

            <Card className="mt-4">
              <CardContent className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">Student</th>
                      {subjectKeys.map((subject) => (
                        <th key={subject} className="text-left py-2 px-4 font-medium">
                          {subject}
                        </th>
                      ))}
                      <th className="text-left py-2 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={subjectKeys.length + 2} className="py-3 text-center text-gray-500">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.rollNo} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">
                            <div className="font-semibold">{student.name}</div>
                            <div className="text-gray-500 text-xs">{student.rollNo}</div>
                          </td>
                          {subjectKeys.map((subject) => (
                            <td key={subject} className="py-2 px-4">
                              {student.subject_marks[subject]
                                ? `${state.chartData.find((c) => c.subject === subject)?.attendance || 0}%`
                                : "-"}
                            </td>
                          ))}
                          <td className="py-2 px-4">
                            <Button
                              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 rounded-md px-4 py-2 shadow-sm"
                              size="sm"
                              onClick={() => updateState({ selectedStudent: student })}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!state.selectedStudent} onOpenChange={() => updateState({ selectedStudent: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {state.selectedStudent && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-200">Name</h4>
                <p className="text-base">{state.selectedStudent.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-200">Roll Number</h4>
                <p className="text-base">{state.selectedStudent.rollNo}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-200">Marks</h4>
                {Object.keys(state.selectedStudent.subject_marks).length === 0 ? (
                  <p className="text-sm text-gray-200">No marks available</p>
                ) : (
                  <table className="min-w-full text-sm border-t">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium">Subject</th>
                        <th className="text-left py-2 px-3 font-medium">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(state.selectedStudent.subject_marks).map(([subject, marks]) => (
                        <tr key={subject} className="border-b">
                          <td className="py-2 px-3">{subject}</td>
                          <td className="py-2 px-3">
                            <p className="text-sm text-gray-600">Average: {marks.average || "-"}</p>
                            <p className="text-sm text-gray-600">Tests:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {marks.tests.map((test) => (
                                <li key={test.test_number}>
                                  Test {test.test_number}: {test.mark}/{test.max_mark}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
          <DialogClose asChild>
            <Button
              variant="outline"
              className="mt-4 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 rounded-md px-4 py-2 shadow-sm"
            >
              Close
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarksView;
