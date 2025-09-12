import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Eye, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Fuse from "fuse.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../ui/dialog";
import { useToast } from "../ui/use-toast";
import { getAllAttendance, manageProfile, manageSections, manageSubjects, getBranches, getSemesters, getAttendanceBootstrap } from "../../utils/hod_api";

interface Student {
  student_id: string;
  name: string;
  usn: string;
  attendance_percentage: number | string;
  total_sessions?: number;
  present_sessions?: number;
  semester?: number | string;
  section?: string;
}

interface Semester {
  id: string;
  number: number;
}

interface Section {
  id: string;
  name: string;
  semester_id: string;
}

interface Subject {
  id: string;
  name: string;
  subject_code: string;
  semester_id: string;
}

const AttendanceView = () => {
  const { toast } = useToast();

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

  // Helper function to get progress bar width
  const getProgressBarWidth = (percentage: number | string): string => {
    if (percentage === "NA" || percentage === null || percentage === undefined) {
      return "0%";
    }
    if (typeof percentage === "string") {
      return "0%";
    }
    return `${Math.min(percentage, 100)}%`;
  };

  // Helper function to get numeric value for sorting
  const getNumericPercentage = (percentage: number | string): number => {
    if (percentage === "NA" || percentage === null || percentage === undefined) {
      return -1; // Sort NA values to the end
    }
    if (typeof percentage === "string") {
      return -1;
    }
    return percentage;
  };
  const [state, setState] = useState({
    search: "",
    currentPage: 1,
    selectedStudent: null as Student | null,
    filters: {
      semester_id: "",
      section_id: "",
      subject_id: "",
    },
    students: [] as Student[],
    loading: true,
    error: null as string | null,
    branch: "",
    branchId: "",
    semesters: [] as Semester[],
    sections: [] as Section[],
    subjects: [] as Subject[],
  });

  const studentsPerPage = 10;

  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  // Fetch all data using combined endpoint
  useEffect(() => {
    const fetchData = async () => {
      updateState({ loading: true, search: "", currentPage: 1 });
      try {
        // Fetch all data in one call
        const response = await getAttendanceBootstrap("", {
          ...(state.filters.semester_id && { semester_id: state.filters.semester_id }),
          ...(state.filters.section_id && { section_id: state.filters.section_id }),
          ...(state.filters.subject_id && { subject_id: state.filters.subject_id }),
        });
        if (response.success && response.data) {
          updateState({
            branch: response.data.profile.branch,
            branchId: response.data.profile.branch_id,
            semesters: response.data.semesters,
            sections: response.data.sections.map((s: any) => ({
              id: s.id,
              name: s.name,
              semester_id: s.semester_id.toString(),
            })),
            subjects: response.data.subjects.map((s: any) => ({
              id: s.id,
              name: s.name,
              subject_code: s.subject_code,
              semester_id: s.semester_id.toString(),
            })),
            students: response.data.attendance.students,
          });
        } else {
          throw new Error(response.message || "Failed to fetch data");
        }
      } catch (err: any) {
        updateState({ error: err.message || "Network error" });
        toast({ variant: "destructive", title: "Error", description: err.message });
      } finally {
        updateState({ loading: false });
      }
    };
    fetchData();
  }, [state.filters.semester_id, state.filters.section_id, state.filters.subject_id, toast]);

  // Filter students for search
  const normalizeText = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const fuse = new Fuse(state.students, {
  keys: ["name", "usn", "semester", "section"],
  threshold: 0.3,   // lower = stricter, higher = fuzzier
  includeScore: true,
});

// Use fuzzy search
const filteredStudents = state.search
  ? fuse.search(state.search).map((result) => result.item)
  : state.students;

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const currentStudents = filteredStudents.slice(
    (state.currentPage - 1) * studentsPerPage,
    state.currentPage * studentsPerPage
  );

  const handlePrev = () => {
    if (state.currentPage > 1) updateState({ currentPage: state.currentPage - 1 });
  };

  const handleNext = () => {
    if (state.currentPage < totalPages) updateState({ currentPage: state.currentPage + 1 });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`All Students Attendance Report - ${state.branch.toUpperCase()}`, 14, 16);
    const tableColumn = ["Name", "USN", "Attendance", "Semester", "Section"];
    const tableRows = filteredStudents.map((student) => [
      student.name,
      student.usn,
      formatAttendancePercentage(student.attendance_percentage),
      student.semester || "-",
      student.section || "-",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save(`all-students-attendance-report-${state.branch}.pdf`);
  };

  // Helper to get display text for dropdowns
  const getSemesterDisplay = (semesterId: string) => {
    const semester = state.semesters.find((s) => s.id === semesterId);
    return semester ? `Semester ${semester.number}` : "";
  };

  const getSectionDisplay = (sectionId: string) => {
    const section = state.sections.find((s) => s.id === sectionId);
    return section ? `Section ${section.name}` : "";
  };

  const getSubjectDisplay = (subjectId: string) => {
    const subject = state.subjects.find((s) => s.id === subjectId);
    return subject ? subject.name : "";
  };

  if (state.loading) {
    return <div className="text-center py-6">Loading...</div>;
  }

  if (state.error) {
    return <div className="text-center py-6 text-red-500">{state.error}</div>;
  }

  return (
    <Card className="shadow-md border rounded-lg bg-[#1c1c1e] text-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold mb-4">All Students Attendance</CardTitle>
        <p className="text-sm text-gray-200">
          View and analyze attendance for all students in {state.branch.toUpperCase()}.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={state.filters.semester_id}
            onValueChange={(value) =>
              updateState({
                filters: { semester_id: value, section_id: "", subject_id: "" },
                sections: [],
                subjects: [],
              })
            }
            disabled={state.semesters.length === 0}
          >
            <SelectTrigger className="bg-[#232326] text-gray-200">
              <SelectValue
                placeholder={state.semesters.length === 0 ? "No semesters available" : "Select Semester"}
              />
            </SelectTrigger>
            <SelectContent className=" bg-[#232326] text-gray-200">
              {state.semesters.map((semester) => (
                <SelectItem  key={semester.id} value={semester.id}>
                  Semester {semester.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={state.filters.section_id}
            onValueChange={(value) => updateState({ filters: { ...state.filters, section_id: value } })}
            disabled={state.sections.length === 0 || !state.filters.semester_id}
          >
            <SelectTrigger className="bg-[#232326] text-gray-200">
              <SelectValue
                placeholder={
                  state.sections.length === 0 || !state.filters.semester_id ? "Select semester first" : "Select Section"
                }
              />
            </SelectTrigger>
            <SelectContent className=" bg-[#232326] text-gray-200">
              {state.sections
                .filter((section) => section.semester_id === state.filters.semester_id)
                .map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    Section {section.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select
            value={state.filters.subject_id}
            onValueChange={(value) => updateState({ filters: { ...state.filters, subject_id: value } })}
            disabled={state.subjects.length === 0 || !state.filters.semester_id}
          >
            <SelectTrigger className="bg-[#232326] text-gray-200">
              <SelectValue
                placeholder={
                  state.subjects.length === 0 || !state.filters.semester_id ? "Select semester first" : "Select Subject"
                }
              />
            </SelectTrigger>
            <SelectContent className=" bg-[#232326] text-gray-200">
              {state.subjects
                .filter((subject) => subject.semester_id === state.filters.semester_id)
                .map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-2 md:gap-4 w-full">
          {/* Input + Error */}
          <div className="flex flex-col w-full max-w-md">
            <Input
              className="w-full bg-[#232326] text-gray-200 placeholder:text-gray-500"
              placeholder="Search by name or USN..."
              value={state.search}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[a-zA-Z0-9]*$/.test(value)) {
                  updateState({ search: value });
                }
              }}
            />
            {state.search && /[^a-zA-Z0-9]/.test(state.search) && (
              <span className="text-red-500 text-sm mt-1">
                Only alphanumeric characters are allowed
              </span>
            )}
          </div>

          {/* Export Button */}
          <Button
            className="ml-0 md:ml-4 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 flex items-center gap-2"
            onClick={handleExportPDF}
          >
            <FileDown size={16} />
            Export Report
          </Button>
        </div>


        <div className="overflow-x-auto mt-4">
          {/* Height ≈ 5 rows (5 × h-16 = 80 = 20rem). Adjust if your row height differs */}
          <div className="h-80 overflow-y-auto custom-scrollbar border rounded">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-[#232326] text-gray-200 text-left sticky top-0 z-10">
                <tr>
                  <th className="p-3 border w-[24%]">Student</th>
                  <th className="p-3 border w-[32%]">Attendance</th>
                  <th className="p-3 border w-[12%]">Semester</th>
                  <th className="p-3 border w-[12%]">Section</th>
                  <th className="p-3 border w-[20%]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentStudents.map((student) => (
                  <tr key={student.student_id} className="hover:bg-gray-600 h-16">
                    <td className="p-3 border">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-200">{student.usn}</p>
                      </div>
                    </td>

                    <td className="p-3 border">
                      <div className="flex items-center gap-2">
                        <span>{formatAttendancePercentage(student.attendance_percentage)}</span>
                        <div className="w-full bg-gray-200 h-2 rounded">
                          <div
                            className="h-2 bg-green-500 rounded"
                            style={{ width: getProgressBarWidth(student.attendance_percentage) }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-3 border">{student.semester || "-"}</td>
                    <td className="p-3 border">{student.section || "-"}</td>

                    <td className="p-3 border">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                        onClick={() => updateState({ selectedStudent: student })}
                      >
                        <Eye size={16} /> View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={handlePrev}
            disabled={state.currentPage === 1}
            className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
          >
            Previous
          </Button>
          <p className="text-gray-200">
            Page {state.currentPage} of {totalPages}
          </p>
          <Button
            onClick={handleNext}
            disabled={state.currentPage === totalPages}
            className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
          >
            Next
          </Button>
        </div>

        <Dialog open={!!state.selectedStudent} onOpenChange={() => updateState({ selectedStudent: null })}>
          <DialogContent className="sm:max-w-md bg-[#1c1c1e] text-gray-200 border border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-100">
                {state.selectedStudent?.name}'s Details
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Full attendance record
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 mt-4 text-gray-300">
              <p><strong className="text-gray-100">USN:</strong> {state.selectedStudent?.usn}</p>
              <p><strong className="text-gray-100">Attendance:</strong> {formatAttendancePercentage(state.selectedStudent?.attendance_percentage)}</p>
              <p><strong className="text-gray-100">Total Sessions:</strong> {state.selectedStudent?.total_sessions || "-"}</p>
              <p><strong className="text-gray-100">Present Sessions:</strong> {state.selectedStudent?.present_sessions || "-"}</p>
              <p><strong className="text-gray-100">Branch:</strong> {state.branch.toUpperCase()}</p>
              <p><strong className="text-gray-100">Semester:</strong> {state.selectedStudent?.semester || "-"}</p>
              <p><strong className="text-gray-100">Section:</strong> {state.selectedStudent?.section?.toUpperCase() || "-"}</p>
            </div>

            <DialogClose asChild>
              <Button className="mt-6 w-full  text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500">
                Close
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AttendanceView;