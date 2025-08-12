import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Eye, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../ui/dialog";
import { useToast } from "../ui/use-toast";
import { getAllAttendance, manageProfile, manageSections, manageSubjects, getBranches, getSemesters } from "../../utils/hod_api";

interface Student {
  student_id: string;
  name: string;
  usn: string;
  attendance_percentage: number;
  total_sessions?: number;
  present_sessions?: number;
  semester?: string;
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

  const studentsPerPage = 5;

  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  // Fetch branch ID and branch name
  useEffect(() => {
    const fetchProfileAndData = async () => {
      updateState({ loading: true });
      try {
        // Fetch HOD profile to get branch
        const profileResponse = await manageProfile({}, "GET");
        console.log("Profile response:", profileResponse);
        if (profileResponse.success && profileResponse.data && profileResponse.data.branch) {
          updateState({ branch: profileResponse.data.branch });
        } else {
          throw new Error("Invalid or missing branch in profile");
        }

        // Fetch branches to map branch name to branch_id
        const branchesResponse = await getBranches();
        if (branchesResponse.success && branchesResponse.data) {
          const branchData = branchesResponse.data.find((b: any) => b.name === profileResponse.data.branch);
          if (branchData) {
            updateState({ branchId: branchData.id });
          } else {
            throw new Error("Branch ID not found for branch: " + profileResponse.data.branch);
          }
        } else {
          throw new Error(branchesResponse.message || "Failed to fetch branches");
        }
      } catch (err: any) {
        updateState({ error: err.message || "Network error" });
        toast({ variant: "destructive", title: "Error", description: err.message });
      } finally {
        updateState({ loading: false });
      }
    };
    fetchProfileAndData();
  }, [toast]);

  // Fetch additional data (semesters, sections, subjects, attendance)
  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (!state.branchId) return; // Wait until branchId is set
      updateState({ loading: true, search: "", currentPage: 1 });
      try {
        // Fetch semesters
        const semestersResponse = await getSemesters(state.branchId);
        if (semestersResponse.success && semestersResponse.data) {
          updateState({ semesters: semestersResponse.data });
        } else {
          throw new Error(semestersResponse.message || "Failed to fetch semesters");
        }

        // Fetch sections based on selected semester (or all if no semester selected)
        const sectionsResponse = await manageSections({
          branch_id: state.branchId,
          ...(state.filters.semester_id && { semester_id: state.filters.semester_id }),
        });
        if (sectionsResponse.success && sectionsResponse.data) {
          updateState({
            sections: sectionsResponse.data.map((s: any) => ({
              id: s.id,
              name: s.name,
              semester_id: s.semester_id.toString(),
            })),
          });
        } else {
          throw new Error(sectionsResponse.message || "Failed to fetch sections");
        }

        // Fetch subjects based on selected semester (or all if no semester selected)
        const subjectsResponse = await manageSubjects({
          branch_id: state.branchId,
          ...(state.filters.semester_id && { semester_id: state.filters.semester_id }),
        });
        if (subjectsResponse.success && subjectsResponse.data) {
          updateState({
            subjects: subjectsResponse.data.map((s: any) => ({
              id: s.id,
              name: s.name,
              subject_code: s.subject_code,
              semester_id: s.semester_id.toString(),
            })),
          });
        } else {
          throw new Error(subjectsResponse.message || "Failed to fetch subjects");
        }

        // Fetch all attendance students
        const response = await getAllAttendance(state.branchId, {
          ...(state.filters.semester_id && { semester_id: state.filters.semester_id }),
          ...(state.filters.section_id && { section_id: state.filters.section_id }),
          ...(state.filters.subject_id && { subject_id: state.filters.subject_id }),
        });
        if (response.success && response.data) {
          updateState({ students: response.data.students });
        } else {
          throw new Error(response.message || "Failed to fetch attendance data");
        }
      } catch (err: any) {
        updateState({ error: err.message || "Network error" });
        toast({ variant: "destructive", title: "Error", description: err.message });
      } finally {
        updateState({ loading: false });
      }
    };
    fetchAdditionalData();
  }, [state.branchId, state.filters.semester_id, state.filters.section_id, state.filters.subject_id, toast]);

  // Filter students for search
  const filteredStudents = state.students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(state.search.toLowerCase()) ||
      student.usn.toLowerCase().includes(state.search.toLowerCase());
    return matchesSearch;
  });

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
      `${student.attendance_percentage}%`,
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
            <SelectContent>
              {state.semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id}>
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
            <SelectContent>
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
            <SelectContent>
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

        <div className="flex justify-between items-center mt-4">
          <Input
            className="w-full max-w-md bg-[#232326] text-gray-200"
            placeholder="Search by name or USN..."
            value={state.search}
            onChange={(e) => updateState({ search: e.target.value })}
          />
          <Button
            className="ml-4 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 flex items-center gap-2"
            onClick={handleExportPDF}
          >
            <FileDown size={16} />
            Export Report
          </Button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full table-auto border">
            <thead className="bg-[#232326] text-gray-200 text-left">
              <tr>
                <th className="p-3 border">Student</th>
                <th className="p-3 border">Attendance</th>
                <th className="p-3 border">Semester</th>
                <th className="p-3 border">Section</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.map((student) => (
                <tr key={student.student_id} className="hover:bg-gray-600">
                  <td className="p-3 border">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.usn}</p>
                    </div>
                  </td>
                  <td className="p-3 border">
                    <div className="flex items-center gap-2">
                      <span>{student.attendance_percentage}%</span>
                      <div className="w-full bg-gray-200 h-2 rounded">
                        <div
                          className="h-2 bg-green-500 rounded"
                          style={{ width: `${student.attendance_percentage}%` }}
                        ></div>
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{state.selectedStudent?.name}'s Details</DialogTitle>
              <DialogDescription>Full attendance record</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-4 text-gray-700">
              <p><strong>USN:</strong> {state.selectedStudent?.usn}</p>
              <p><strong>Attendance:</strong> {state.selectedStudent?.attendance_percentage}%</p>
              <p><strong>Total Sessions:</strong> {state.selectedStudent?.total_sessions || "-"}</p>
              <p><strong>Present Sessions:</strong> {state.selectedStudent?.present_sessions || "-"}</p>
              <p><strong>Branch:</strong> {state.branch.toUpperCase()}</p>
              <p><strong>Semester:</strong> {state.selectedStudent?.semester || "-"}</p>
              <p><strong>Section:</strong> {state.selectedStudent?.section?.toUpperCase() || "-"}</p>
            </div>
            <DialogClose asChild>
              <Button className="mt-6 w-full bg-gray-700 text-white hover:bg-gray-800">
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