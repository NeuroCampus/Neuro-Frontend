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
import { getAttendance, getSemesters, manageSections, manageSubjects, manageProfile, sendNotification, getLowAttendanceBootstrap } from "../../utils/hod_api";
import { Component } from "react";
import { useTheme } from "../../context/ThemeContext";

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
  attendance_percentage: number | string;
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
  const { toast } = useToast();
  const { theme } = useTheme();
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
    notifiedStudents: {} as Record<string, boolean>, 
    isNotifyingAll: false,
    hasNotifiedAll: false,
    pagination: {
      page: 1,
      page_size: 50,
      total_students: 0,
      total_pages: 0,
    },
  });

  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Fetch all data using combined endpoint with pagination
  useEffect(() => {
    const fetchData = async () => {
      updateState({ loading: true });
      try {
        const filters: { semester_id?: string; section_id?: string; subject_id?: string; page?: number; page_size?: number } = {
          page: state.pagination.page,
          page_size: state.pagination.page_size,
        };
        if (state.semesterFilter !== "All") {
          filters.semester_id = state.semesterFilter;
        }
        if (state.sectionFilter !== "All") {
          filters.section_id = state.sectionFilter;
        }
        if (state.subjectFilter !== "All") {
          filters.subject_id = state.subjectFilter;
        }

        const response = await getLowAttendanceBootstrap("", filters);
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch data");
        }

        // Set branchId
        updateState({ branchId: response.data.profile.branch_id });

        // Set semesters
        const semestersData = response.data.semesters.map((s) => ({
          id: s.id,
          number: s.number,
        }));

        // Set sections
        const sectionsData = response.data.sections.map((s) => ({
          id: s.id,
          name: s.name,
          semester_id: s.semester_id,
        }));

        // Set subjects
        const subjectsData = response.data.subjects.map((s) => ({
          id: s.id,
          name: s.name,
          semester_id: s.semester_id,
        }));

        // Set low attendance students
        const studentsData = response.data.low_attendance.students.map((student) => ({
          student_id: student.student_id,
          usn: student.usn,
          name: student.name,
          subject: student.subject,
          section: student.section || "Section A",
          semester: student.semester || 0,
          attendance_percentage: student.attendance_percentage,
        }));

        updateState({
          semesters: semestersData,
          sections: sectionsData,
          subjects: subjectsData,
          students: studentsData,
          pagination: response.data.pagination,
          loading: false,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
        setError(errorMessage);
        updateState({ loading: false });
      }
    };
    fetchData();
  }, [state.semesterFilter, state.subjectFilter, state.sectionFilter, state.pagination.page, state.pagination.page_size, toast, setError]);

  const filteredStudents = state.students; // Server-side filtering now

  const totalPages = state.pagination.total_pages;
  const currentStudents = filteredStudents;

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    let currentPageNumber = 1;
    
    // For server-side pagination, we export current page data
    const studentChunks = [];
    for (let i = 0; i < filteredStudents.length; i += 50) { // Use 50 items per page for PDF
      studentChunks.push(filteredStudents.slice(i, i + 50));
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
          formatAttendancePercentage(student.attendance_percentage),
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

      const studentIds = filteredStudents.map((student) => student.student_id); // ✅ use student_id

      const response = await sendNotification({
        action: "notify_all",
        title: "Low Attendance Warning",
        message: "Your attendance is below the required threshold. Please improve.",
        target: "student",
        branch_id: state.branchId,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Notified ${studentIds.length} students!`,
        });

        updateState({
          hasNotifiedAll: true,
          notifiedStudents: studentIds.reduce(
            (acc, id) => ({ ...acc, [id]: true }),
            state.notifiedStudents
          ),
        });
      } else {
        throw new Error(response.message || "Failed to send notifications");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error";
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      updateState({ isNotifyingAll: false });
    }
  };

  const notifyStudent = async (student: Student) => {
    try {
      updateState({
        notifyingStudents: { ...state.notifyingStudents, [student.student_id]: true },
      });

      const response = await sendNotification({
        action: "notify",
        title: "Low Attendance Alert",
        student_id: student.usn,
        message: `Dear ${student.name}, your attendance in ${student.subject} is ${formatAttendancePercentage(
          student.attendance_percentage
        )}. Please improve.`,
        branch_id: state.branchId,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Notification sent to ${student.name}`,
        });

        // ✅ mark as notified
        updateState({
          notifiedStudents: { ...state.notifiedStudents, [student.student_id]: true },
        });
      } else {
        throw new Error(response.message || "Failed to send notification");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error";
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      updateState({
        notifyingStudents: { ...state.notifyingStudents, [student.student_id]: false },
      });
    }
  };

  // Helper function to determine attendance color
  const getAttendanceColorClass = (attendance: number | string): string => {
    if (attendance === "NA" || attendance === null || attendance === undefined) {
      return "text-gray-400";
    }
    if (typeof attendance === "string") {
      return "text-gray-400";
    }
    if (attendance < 40) {
      return "text-red-500";
    }
    if (attendance <= 60) {
      return "text-orange-500";
    }
    return "text-green-500";
  };

  return (
    <ErrorBoundary>
      <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
        <h1 className={`text-2xl font-semibold mb-6 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Low Attendance Students</h1>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Select
            value={state.semesterFilter}
            onValueChange={(value) => updateState({ 
              semesterFilter: value, 
              subjectFilter: "All", 
              sectionFilter: "All",
              pagination: { ...state.pagination, page: 1 }
            })}
            disabled={state.loading || state.semesters.length === 0}
          >
            <SelectTrigger className={`w-48 ${theme === 'dark' ? 'bg-card border-border text-foreground' : 'bg-white border-gray-300 text-gray-900'}`}>
              <SelectValue
          placeholder={state.semesters.length === 0 ? "No semesters available" : "Select Semester"}
          className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}
              />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-card border-border text-foreground' : 'bg-white border-gray-300 text-gray-900'}>
              <SelectItem key="all-semesters" value="All" className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
          All
              </SelectItem>
              {state.semesters.map((semester) => (
          <SelectItem key={semester.id} value={semester.id} className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
            Semester {semester.number}
          </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={state.subjectFilter}
            onValueChange={(value) => updateState({ 
              subjectFilter: value,
              pagination: { ...state.pagination, page: 1 }
            })}
            disabled={state.loading || !state.semesterFilter || state.semesterFilter === "All" || state.subjects.length === 0}
          >
            <SelectTrigger className={`w-48 ${theme === 'dark' ? 'bg-card border-border text-foreground' : 'bg-white border-gray-300 text-gray-900'}`}>
              <SelectValue
          placeholder={state.subjects.length === 0 ? "No subjects available" : "Select Subject"}
          className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}
              />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-card border-border text-foreground' : 'bg-white border-gray-300 text-gray-900'}>
              <SelectItem key="all-subjects" value="All" className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
          All
              </SelectItem>
              {state.subjects
          .filter((subject) => state.semesterFilter === "All" || subject.semester_id === state.semesterFilter)
          .map((subject) => (
            <SelectItem key={subject.id} value={subject.id} className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
              {subject.name}
            </SelectItem>
          ))}
            </SelectContent>
          </Select>
          <Select
            value={state.sectionFilter}
            onValueChange={(value) => updateState({ 
              sectionFilter: value,
              pagination: { ...state.pagination, page: 1 }
            })}
            disabled={state.loading || !state.semesterFilter || state.semesterFilter === "All" || state.sections.length === 0}
          >
            <SelectTrigger className={`w-48 ${theme === 'dark' ? 'bg-card border-border text-foreground' : 'bg-white border-gray-300 text-gray-900'}`}>
              <SelectValue
          placeholder={state.sections.length === 0 ? "No sections available" : "Select Section"}
          className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}
              />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-card border-border text-foreground' : 'bg-white border-gray-300 text-gray-900'}>
              <SelectItem key="all-sections" value="All" className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
          All
              </SelectItem>
              {state.sections
          .filter((section) => state.semesterFilter === "All" || section.semester_id === state.semesterFilter)
          .map((section) => (
            <SelectItem key={section.id} value={section.id} className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
              {section.name}
            </SelectItem>
          ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-4">
            <Button
              onClick={exportPDF}
              className="flex items-center gap-2 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md rounded-md px-4 py-2"
              disabled={state.loading || filteredStudents.length === 0}
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              onClick={notifyAll}
              className={`flex items-center gap-2 rounded-md px-4 py-2 shadow-sm border transition-all duration-200 ease-in-out transform hover:scale-105
                ${
                  state.hasNotifiedAll
                    ? "bg-green-800 border-green-600 text-white cursor-default"
                    : "bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
                }`}
              disabled={
                state.loading ||
                filteredStudents.length === 0 ||
                state.isNotifyingAll ||
                state.hasNotifiedAll
              }
            >
              {state.isNotifyingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : state.hasNotifiedAll ? (
                "All Notified ✓"
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
            className={`pl-10 ${theme === 'dark' ? 'bg-card border-border text-foreground placeholder:text-muted-foreground' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'}`}
            disabled={state.loading}
          />
          <Search className={`absolute left-3 top-2.5 h-4 w-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`} />
        </div>
        <div className={`overflow-auto border rounded-lg ${theme === 'dark' ? 'border-border' : 'border-gray-300'}`}>
          <table className="min-w-full text-sm text-left">
            <thead className={`${theme === 'dark' ? 'bg-card border-b border-border text-foreground' : 'bg-gray-100 border-b border-gray-300 text-gray-900'}`}>
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
            <tbody className={theme === 'dark' ? 'bg-background text-foreground' : 'bg-white text-gray-900'}>
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
                  <tr key={student.student_id} className={`border-b hover:${theme === 'dark' ? 'bg-accent' : 'bg-gray-50'}`}>
                    <td className="px-4 py-2">{student.usn}</td>
                    <td className="px-4 py-2">{student.name}</td>
                    <td className="px-4 py-2">{student.subject}</td>
                    <td className="px-4 py-2">{student.section}</td>
                    <td className="px-4 py-2">{student.semester}</td>
                    <td
                      className={`px-4 py-2 font-medium ${getAttendanceColorClass(student.attendance_percentage)}`}
                    >
                      {formatAttendancePercentage(student.attendance_percentage)}
                    </td>
                    <td className="px-4 py-2">
                     <Button
                        size="sm"
                        onClick={() => notifyStudent(student)}
                        className={`px-4 py-2 flex items-center gap-2 rounded-md shadow-sm border transition-all duration-200 ease-in-out transform hover:scale-105
                          ${
                            state.notifiedStudents?.[student.student_id]
                              ? "bg-green-700 border-green-600 text-white cursor-default"
                              : "bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
                          }`}
                        disabled={
                          state.loading ||
                          state.notifyingStudents?.[student.student_id] ||
                          state.notifiedStudents?.[student.student_id]
                        }
                      >
                        {state.notifyingStudents?.[student.student_id] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : state.notifiedStudents?.[student.student_id] ? (
                          "Notified ✓"
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
        <div className={`mt-4 flex justify-between items-center text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
          <div className="flex items-center space-x-4">
            <div className={`text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
              Showing {(state.pagination.page - 1) * state.pagination.page_size + 1} to {Math.min(state.pagination.page * state.pagination.page_size, state.pagination.total_students)} of {state.pagination.total_students} students
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              size="sm"
              variant="outline"
              disabled={state.pagination.page === 1 || state.loading}
              onClick={() => updateState({
                pagination: { ...state.pagination, page: state.pagination.page - 1 },
                currentPage: state.pagination.page - 1
              })}
              className="flex items-center gap-2 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md rounded-md px-4 py-2"
            >
              Previous
            </Button>
            <span className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
              Page {state.pagination.page} of {state.pagination.total_pages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={state.pagination.page === state.pagination.total_pages || state.loading}
              onClick={() => updateState({
                pagination: { ...state.pagination, page: state.pagination.page + 1 },
                currentPage: state.pagination.page + 1
              })}
              className="flex items-center gap-2 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md rounded-md px-4 py-2"
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