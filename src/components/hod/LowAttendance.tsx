import React, { useState, useEffect, ReactNode } from "react";
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
import { useVirtualizer } from '@tanstack/react-virtual';

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
};

// Virtualized Attendance Table Component
const VirtualizedSectionTable = React.memo(({
  students,
  theme,
  notifyingStudents,
  notifiedStudents,
  onNotifyStudent
}: {
  students: Student[];
  theme: string;
  notifyingStudents: Record<string, boolean>;
  notifiedStudents: Record<string, boolean>;
  onNotifyStudent: (student: Student) => void;
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: students.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 5,
  });

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

  const formatAttendancePercentage = (percentage: number | string): string => {
    if (percentage === "NA" || percentage === null || percentage === undefined) {
      return "NA";
    }
    if (typeof percentage === "string") {
      return percentage;
    }
    return `${percentage}%`;
  };

  return (
    <div
      ref={parentRef}
      className="h-96 overflow-auto custom-scrollbar"
      style={{ contain: 'strict' }}
    >
      {/* Fixed Header */}
      <div className={`sticky top-0 z-10 border-b ${theme === 'dark' ? 'border-gray-600 bg-card' : 'border-gray-300 bg-white'}`}>
        <div className={`grid grid-cols-5 gap-4 p-3 text-xs font-medium ${theme === 'dark' ? 'text-gray-200 bg-card' : 'text-gray-900 bg-white'}`}>
          <div>USN</div>
          <div>Name</div>
          <div>Course</div>
          <div>Attendance %</div>
          <div>Actions</div>
        </div>
      </div>

      {/* Virtualized Rows */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const student = students[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              className={`grid grid-cols-5 gap-4 p-3 text-sm border-b ${theme === 'dark' ? 'border-gray-600 text-card-foreground hover:bg-accent' : 'border-gray-200 text-gray-900 hover:bg-gray-50'}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="truncate">{student.usn}</div>
              <div className="truncate">{student.name}</div>
              <div className="truncate">{student.subject}</div>
              <div
                className={`font-medium ${getAttendanceColorClass(student.attendance_percentage)}`}
              >
                {formatAttendancePercentage(student.attendance_percentage)}
              </div>
              <div>
                <Button
                  size="sm"
                  onClick={() => onNotifyStudent(student)}
                  className={`px-3 py-1 text-xs flex items-center gap-1 rounded-md shadow-sm border transition-all duration-200 ease-in-out transform hover:scale-105
                    ${
                      notifiedStudents?.[student.student_id]
                        ? "bg-green-700 border-green-600 text-white cursor-default"
                        : "bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
                    }`}
                  disabled={
                    notifyingStudents?.[student.student_id] ||
                    notifiedStudents?.[student.student_id]
                  }
                >
                  {notifyingStudents?.[student.student_id] ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Sending...
                    </>
                  ) : notifiedStudents?.[student.student_id] ? (
                    <><CheckCircle className="w-3 h-3" /> Notified</>
                  ) : (
                    "Notify"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

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
  });

  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Fetch all low attendance data (no pagination for complete dataset)
  useEffect(() => {
    const fetchData = async () => {
      updateState({ loading: true });
      try {
        // Fetch all low attendance students without pagination
        const response = await getLowAttendanceBootstrap("", {});
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
  }, [toast, setError]);

  const filteredStudents = state.students; // Server-side filtering now

  const currentStudents = filteredStudents;

  // Group students by semester and section for organized display
  const groupedStudents = React.useMemo(() => {
    const groups: Record<string, Record<string, Student[]>> = {};

    state.students.forEach(student => {
      const semesterKey = `Semester ${student.semester}`;
      const sectionKey = student.section;

      if (!groups[semesterKey]) {
        groups[semesterKey] = {};
      }
      if (!groups[semesterKey][sectionKey]) {
        groups[semesterKey][sectionKey] = [];
      }
      groups[semesterKey][sectionKey].push(student);
    });

    // Sort semesters and sections
    const sortedGroups: Record<string, Record<string, Student[]>> = {};
    Object.keys(groups)
      .sort((a, b) => {
        const numA = parseInt(a.replace('Semester ', ''));
        const numB = parseInt(b.replace('Semester ', ''));
        return numA - numB;
      })
      .forEach(semester => {
        sortedGroups[semester] = {};
        Object.keys(groups[semester])
          .sort()
          .forEach(section => {
            sortedGroups[semester][section] = groups[semester][section];
          });
      });

    return sortedGroups;
  }, [state.students]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    let currentPageNumber = 1;

    // Collect all students from grouped data
    const allStudents: Student[] = [];
    Object.values(groupedStudents).forEach(semesterData => {
      Object.values(semesterData).forEach(sectionStudents => {
        allStudents.push(...sectionStudents);
      });
    });

    // Apply search filter if present
    const filteredStudents = state.searchTerm
      ? allStudents.filter(student =>
          student.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
          student.usn.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
          student.subject.toLowerCase().includes(state.searchTerm.toLowerCase())
        )
      : allStudents;

    // Group by semester for PDF
    const pdfData: { semester: string; students: Student[] }[] = [];
    Object.entries(groupedStudents).forEach(([semester, sections]) => {
      const semesterStudents: Student[] = [];
      Object.values(sections).forEach(sectionStudents => {
        semesterStudents.push(...sectionStudents);
      });

      const filteredSemesterStudents = state.searchTerm
        ? semesterStudents.filter(student =>
            student.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
            student.usn.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
            student.subject.toLowerCase().includes(state.searchTerm.toLowerCase())
          )
        : semesterStudents;

      if (filteredSemesterStudents.length > 0) {
        pdfData.push({ semester, students: filteredSemesterStudents });
      }
    });

    pdfData.forEach((semesterData, semesterIndex) => {
      if (semesterIndex > 0) {
        doc.addPage();
        currentPageNumber = 1;
      }

      doc.setFontSize(16);
      doc.text(`${semesterData.semester} - Low Attendance Students`, margin, 14);
      doc.setFontSize(10);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 180, 14);

      const studentChunks = [];
      for (let i = 0; i < semesterData.students.length; i += 40) { // 40 items per page for better readability
        studentChunks.push(semesterData.students.slice(i, i + 40));
      }

      studentChunks.forEach((chunk, chunkIndex) => {
        if (chunkIndex > 0) {
          doc.addPage();
          currentPageNumber++;
          doc.setFontSize(16);
          doc.text(`${semesterData.semester} - Low Attendance Students (Cont.)`, margin, 14);
          doc.setFontSize(10);
          doc.text(`Page ${currentPageNumber}`, 180, 14);
        }

        autoTable(doc, {
          startY: 20,
          head: [["USN", "Name", "Subject", "Section", "Attendance %"]],
          body: chunk.map((student) => [
            student.usn,
            student.name,
            student.subject,
            student.section,
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
    });

    doc.save("low-attendance-report.pdf");
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

        {/* Grouped Display by Semester and Section */}
        <div className="space-y-6">
          {Object.entries(groupedStudents).map(([semester, sections]) => (
            <div key={semester} className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                {semester} Details
              </h3>

              {Object.entries(sections).map(([section, students]) => {
                // Filter students by search term
                const filteredSectionStudents = students.filter(student =>
                  state.searchTerm === "" ||
                  student.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                  student.usn.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                  student.subject.toLowerCase().includes(state.searchTerm.toLowerCase())
                );

                if (filteredSectionStudents.length === 0) return null;

                return (
                  <div key={section} className="mb-4">
                    <h4 className={`text-md font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                      Section {section} ({filteredSectionStudents.length} students)
                    </h4>

                    <VirtualizedSectionTable
                      students={filteredSectionStudents}
                      theme={theme}
                      notifyingStudents={state.notifyingStudents}
                      notifiedStudents={state.notifiedStudents}
                      onNotifyStudent={notifyStudent}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {state.loading && (
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
            Loading low attendance data...
          </div>
        )}

        {!state.loading && Object.keys(groupedStudents).length === 0 && (
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
            No low attendance students found.
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default LowAttendance;