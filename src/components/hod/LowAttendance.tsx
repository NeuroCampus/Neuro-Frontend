import { useState, useEffect, ReactNode } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileDown, Loader2, CheckCircle } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getLowAttendance, getSemesters, manageSections, manageSubjects, manageProfile, manageNotifications } from "../../utils/hod_api";
import { Component } from "react";

// Interfaces
interface LowAttendanceProps {
  setError: (error: string | null) => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

interface Student {
  student_id: string;
  usn: string;
  name: string;
  subject: string;
  section: string;
  semester: number;
  attendance_percentage: number;
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
  semester_id: string;
}

// Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-6 text-red-500">
          <h2>Error: {this.state.errorMessage}</h2>
          <p>Please try refreshing the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const LowAttendance = ({ setError }: LowAttendanceProps) => {
  const { toast } = useToast();
  const [state, setState] = useState({
    searchTerm: "",
    subjectFilter: "All",
    sectionFilter: "All",
    semesterFilter: "All",
    currentPage: 1,
    students: [] as Student[],
    semesters: [] as Semester[],
    sections: [] as Section[],
    subjects: [] as Subject[],
    loading: true,
    branchId: "",
    notifyingStudents: {} as Record<string, boolean>,
    isNotifyingAll: false,
  });

  const studentsPerPage = 10;

  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      updateState({ loading: true });
      try {
        const profileResponse = await manageProfile({}, "GET");
        if (!profileResponse.success || !profileResponse.data?.branch_id) {
          throw new Error(profileResponse.message || "Failed to fetch HOD profile");
        }
        const branchId = profileResponse.data.branch_id;
        const semesterResponse = await getSemesters(branchId);
        if (!semesterResponse.success || !semesterResponse.data) {
          throw new Error(semesterResponse.message || "Failed to fetch semesters");
        }
        updateState({
          branchId,
          semesters: semesterResponse.data.map((s: any) => ({
            id: s.id.toString(),
            number: s.number,
          })),
        });
      } catch (err: any) {
        const errorMessage = err.message || "Network error";
        setError(errorMessage);
        toast({ variant: "destructive", title: "Error", description: errorMessage });
      } finally {
        updateState({ loading: false });
      }
    };
    fetchInitialData();
  }, [toast, setError]);

  // Fetch subjects, sections, and low attendance data
  useEffect(() => {
    const fetchSemesterData = async () => {
      if (!state.branchId) return;
      updateState({ loading: true });
      try {
        const subjectsResponse = await manageSubjects({
          branch_id: state.branchId,
          ...(state.semesterFilter !== "All" && { semester_id: state.semesterFilter }),
        });
        if (!subjectsResponse.success || !subjectsResponse.data) {
          throw new Error(subjectsResponse.message || "Failed to fetch subjects");
        }
        const sectionResponse = await manageSections({
          branch_id: state.branchId,
          ...(state.semesterFilter !== "All" && { semester_id: state.semesterFilter }),
        });
        if (!sectionResponse.success || !sectionResponse.data) {
          throw new Error(sectionResponse.message || "Failed to fetch sections");
        }
        const filters = {
          semester_id: state.semesterFilter !== "All" ? state.semesterFilter : undefined,
          section_id: state.sectionFilter !== "All" ? state.sectionFilter : undefined,
          subject_id: state.subjectFilter !== "All" ? state.subjectFilter : undefined,
        };
        const response = await getLowAttendance(state.branchId, 75, filters);
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch low attendance data");
        }
        updateState({
          subjects: subjectsResponse.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            semester_id: s.semester_id.toString(),
          })),
          sections: sectionResponse.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            semester_id: s.semester_id.toString(),
          })),
          students: response.data.students.map((student: any) => ({
            student_id: student.student_id,
            usn: student.usn,
            name: student.name,
            subject: student.subject,
            section: student.section || "Section A",
            semester: student.semester || 0,
            attendance_percentage: student.attendance_percentage,
          })),
        });
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch data";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
        setError(errorMessage);
      } finally {
        updateState({ loading: false });
      }
    };
    fetchSemesterData();
  }, [state.semesterFilter, state.subjectFilter, state.sectionFilter, state.branchId, toast, setError]);

  const filteredStudents = state.students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      student.usn.toLowerCase().includes(state.searchTerm.toLowerCase());
    const matchesSubject =
      state.subjectFilter === "All" ||
      student.subject === state.subjects.find(s => s.id === state.subjectFilter)?.name;
    const matchesSection =
      state.sectionFilter === "All" ||
      student.section === state.sections.find(s => s.id === state.sectionFilter)?.name;
    const matchesSemester =
      state.semesterFilter === "All" ||
      student.semester.toString() === state.semesters.find(s => s.id === state.semesterFilter)?.number.toString();
    return matchesSearch && matchesSubject && matchesSection && matchesSemester;
  });

  const indexOfLastStudent = state.currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    let currentPageNumber = 1;
    const studentChunks = [];
    for (let i = 0; i < filteredStudents.length; i += studentsPerPage) {
      studentChunks.push(filteredStudents.slice(i, i + studentsPerPage));
    }
    studentChunks.forEach((chunk, index) => {
      if (index > 0) {
        doc.addPage();
        currentPageNumber++;
      }
      doc.setFontSize(16);
      doc.text("Low Attendance Students", margin, 14);
      doc.setFontSize(10);
      doc.text(`Page ${currentPageNumber} of ${studentChunks.length}`, 180, 14);
      autoTable(doc, {
        startY: 20,
        head: [["USN", "Name", "Subject", "Section", "Semester", "Attendance %"]],
        body: chunk.map((student) => [
          student.usn,
          student.name,
          student.subject,
          student.section,
          student.semester,
          `${student.attendance_percentage}%`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [200, 200, 200], textColor: "black" },
        bodyStyles: { fontSize: 10 },
        margin: { top: 20, left: margin, right: margin },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.text(
            `Generated on ${new Date().toLocaleDateString()}`,
            margin,
            pageHeight - 10
          );
        },
      });
    });
    doc.save("low-attendance.pdf");
  };

  const notifyAll = async () => {
    try {
      updateState({ isNotifyingAll: true });
      const studentIds = filteredStudents.map(student => student.usn);
      const response = await manageNotifications({
        action: "notify_low_attendance",
        title: "Low Attendance Warning",
        message: "Your attendance is below the required threshold. Please improve.",
        student_ids: studentIds,
        branch_id: state.branchId,
      }, "POST");
      if (response.success) {
        toast({
          title: "Success",
          description: `Notified ${studentIds.length} students!`,
          className: "bg-green-100 text-green-800",
          icon: <CheckCircle className="w-5 h-5" />,
        });
      } else {
        throw new Error(response.message || "Failed to send notifications");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Network error";
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      updateState({ isNotifyingAll: false });
    }
  };

  const notifyStudent = async (student: Student) => {
    try {
      updateState({ notifyingStudents: { ...state.notifyingStudents, [student.student_id]: true } });
      const response = await manageNotifications({
        action: "notify",
        title: "Low Attendance Alert",
        student_id: student.usn,
        message: `Dear ${student.name}, your attendance in ${student.subject} is ${student.attendance_percentage}%. Please improve.`,
        branch_id: state.branchId,
      }, "POST");
      if (response.success) {
        toast({
          title: "Success",
          description: `Notification sent to ${student.name}`,
          className: "bg-green-100 text-gray-800",
          icon: <CheckCircle className="w-5 h-5" />,
        });
      } else {
        throw new Error(response.message || "Failed to send notification");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Network error";
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      updateState({ notifyingStudents: { ...state.notifyingStudents, [student.student_id]: false } });
    }
  };

  return (
    <ErrorBoundary>
      <div className="p-6 bg-[#1c1c1e] min-h-screen text-gray-900">
        <h1 className="text-2xl font-semibold mb-6 text-gray-200">Low Attendance Students</h1>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Select
            value={state.semesterFilter}
            onValueChange={(value) => updateState({ semesterFilter: value, subjectFilter: "All", sectionFilter: "All" })}
            disabled={state.loading || state.semesters.length === 0}
          >
            <SelectTrigger className="w-48 bg-[#232326] border border-gray-700 text-gray-200">
              <SelectValue
          placeholder={state.semesters.length === 0 ? "No semesters available" : "Select Semester"}
          className="text-gray-300"
              />
            </SelectTrigger>
            <SelectContent className="bg-[#232326] border border-gray-700 text-gray-200">
              <SelectItem key="all-semesters" value="All" className="text-gray-200 hover:bg-[#2a2a2e]">
          All
              </SelectItem>
              {state.semesters.map((semester) => (
          <SelectItem key={semester.id} value={semester.id} className="text-gray-200 hover:bg-[#2a2a2e]">
            Semester {semester.number}
          </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={state.subjectFilter}
            onValueChange={(value) => updateState({ subjectFilter: value })}
            disabled={state.loading || !state.semesterFilter || state.semesterFilter === "All" || state.subjects.length === 0}
          >
            <SelectTrigger className="w-48 bg-[#232326] border border-gray-700 text-gray-200">
              <SelectValue
          placeholder={state.subjects.length === 0 ? "No subjects available" : "Select Subject"}
          className="text-gray-300"
              />
            </SelectTrigger>
            <SelectContent className="bg-[#232326] border border-gray-700 text-gray-200">
              <SelectItem key="all-subjects" value="All" className="text-gray-200 hover:bg-[#2a2a2e]">
          All
              </SelectItem>
              {state.subjects
          .filter((subject) => state.semesterFilter === "All" || subject.semester_id === state.semesterFilter)
          .map((subject) => (
            <SelectItem key={subject.id} value={subject.id} className="text-gray-200 hover:bg-[#2a2a2e]">
              {subject.name}
            </SelectItem>
          ))}
            </SelectContent>
          </Select>
          <Select
            value={state.sectionFilter}
            onValueChange={(value) => updateState({ sectionFilter: value })}
            disabled={state.loading || !state.semesterFilter || state.semesterFilter === "All" || state.sections.length === 0}
          >
            <SelectTrigger className="w-48 bg-[#232326] border border-gray-700 text-gray-200">
              <SelectValue
          placeholder={state.sections.length === 0 ? "No sections available" : "Select Section"}
          className="text-gray-300"
              />
            </SelectTrigger>
            <SelectContent className="bg-[#232326] border border-gray-700 text-gray-200">
              <SelectItem key="all-sections" value="All" className="text-gray-200 hover:bg-[#2a2a2e]">
          All
              </SelectItem>
              {state.sections
          .filter((section) => state.semesterFilter === "All" || section.semester_id === state.semesterFilter)
          .map((section) => (
            <SelectItem key={section.id} value={section.id} className="text-gray-200 hover:bg-[#2a2a2e]">
              {section.name}
            </SelectItem>
          ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-4">
            <Button
              onClick={exportPDF}
              className="flex items-center gap-2 bg-[#232326] text-gray-200 border border-gray-700 hover:bg-[#2a2a2e] rounded-md px-4 py-2 shadow-sm"
              disabled={state.loading || filteredStudents.length === 0}
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              onClick={notifyAll}
              className="flex items-center gap-2 bg-[#232326] text-gray-200 border border-gray-700 hover:bg-[#2a2a2e] rounded-md px-4 py-2 shadow-sm"
              disabled={state.loading || filteredStudents.length === 0 || state.isNotifyingAll}
            >
              {state.isNotifyingAll ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
              ) : (
          "Notify All"
              )}
            </Button>
          </div>
        </div>
        <div className="mb-4 relative w-full md:w-1/3">
          <Input
            placeholder="Search students..."
            value={state.searchTerm}
            onChange={(e) => updateState({ searchTerm: e.target.value })}
            className="pl-10 bg-[#232326] text-gray-200 border border-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#232326] focus:border-gray-600"
            disabled={state.loading}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        <div className="overflow-auto border rounded-lg ">
          <table className="min-w-full text-sm text-left ">
            <thead className="bg-[#1c1c1e] border-b text-gray-200">
              <tr>
                <th className="px-4 py-2">USN</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Subject</th>
                <th className="px-4 py-2">Section</th>
                <th className="px-4 py-2">Semester</th>
                <th className="px-4 py-2">Attendance %</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-[#1c1c1e] text-gray-400">
              {state.loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">Loading...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">No students found.</td>
                </tr>
              ) : (
                currentStudents.map((student) => (
                  <tr key={student.student_id} className="border-b hover:bg-gray-800">
                    <td className="px-4 py-2">{student.usn}</td>
                    <td className="px-4 py-2">{student.name}</td>
                    <td className="px-4 py-2">{student.subject}</td>
                    <td className="px-4 py-2">{student.section}</td>
                    <td className="px-4 py-2">{student.semester}</td>
                    <td className="px-4 py-2 text-yellow-600 font-medium">
                      {student.attendance_percentage}%
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        size="sm"
                        onClick={() => notifyStudent(student)}
                        className="bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 rounded-md px-4 py-2 flex items-center gap-2 shadow-sm"
                        disabled={state.loading || state.notifyingStudents[student.student_id]}
                      >
                        {state.notifyingStudents[student.student_id] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Notify"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between items-center text-sm text-gray-200">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-200">
              Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length} students
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              size="sm"
              variant="outline"
              disabled={state.currentPage === 1 || state.loading}
              onClick={() => updateState({ currentPage: state.currentPage - 1 })}
              className="bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 rounded-md px-4 py-2 flex items-center gap-2 shadow-sm"
            >
              Previous
            </Button>
            <span className="text-gray-200">
              Page {state.currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={state.currentPage === totalPages || state.loading}
              onClick={() => updateState({ currentPage: state.currentPage + 1 })}
              className="bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 rounded-md px-4 py-2 flex items-center gap-2 shadow-sm"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default LowAttendance;