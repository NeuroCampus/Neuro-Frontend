import React, { useState, useEffect, ReactNode } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileDown, Loader2, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getAttendance, getSemesters, manageSections, manageSubjects, manageProfile, sendNotification, getLowAttendanceBootstrap, getLowAttendanceStudents, getHODDashboardBootstrap } from "../../utils/hod_api";
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
    selectedSemester: "",
    selectedSection: "",
    students: [] as Student[],
    semesters: [] as Semester[],
    sections: [] as Section[],
    loading: false,
    branchId: "",
    notifyingStudents: {} as Record<string, boolean>,
    notifiedStudents: {} as Record<string, boolean>,
    // Pagination state
    currentPage: 1,
    totalCount: 0,
    pageSize: 50,
    next: null as string | null,
    previous: null as string | null,
  });

  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Pagination functions
  const goToPage = (page: number) => {
    updateState({ currentPage: page });
  };

  const goToNextPage = () => {
    if (state.next) {
      updateState({ currentPage: state.currentPage + 1 });
    }
  };

  const goToPreviousPage = () => {
    if (state.previous) {
      updateState({ currentPage: state.currentPage - 1 });
    }
  };

  // Reset pagination when filters change
  const handleSemesterChange = (value: string) => {
    updateState({
      selectedSemester: value,
      selectedSection: "",
      students: [],
      currentPage: 1,
      totalCount: 0,
      next: null,
      previous: null
    });
  };

  const handleSectionChange = (value: string) => {
    updateState({
      selectedSection: value,
      students: [],
      currentPage: 1,
      totalCount: 0,
      next: null,
      previous: null
    });
  };

  // Load metadata on component mount
  useEffect(() => {
    const loadMetadata = async () => {
      updateState({ loading: true });
      try {
        // Get branch ID and semesters from bootstrap endpoint
        const bootstrapResponse = await getHODDashboardBootstrap(["profile", "semesters"]);
        if (!bootstrapResponse.success || !bootstrapResponse.data) {
          throw new Error("Failed to fetch bootstrap data");
        }

        const branchId = bootstrapResponse.data.profile?.branch_id;
        if (!branchId) {
          throw new Error("Branch ID not found in profile");
        }

        updateState({
          branchId: branchId,
          semesters: bootstrapResponse.data.semesters || [],
          loading: false
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch metadata";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
        setError(errorMessage);
        updateState({ loading: false });
      }
    };
    loadMetadata();
  }, [toast, setError]);

  // Load students when both semester and section are selected
  useEffect(() => {
    const loadStudents = async () => {
      if (!state.selectedSemester || !state.selectedSection) {
        updateState({ students: [] });
        return;
      }

      updateState({ loading: true });
      try {
        const studentsResponse = await getLowAttendanceStudents("", {
          semester_id: state.selectedSemester,
          section_id: state.selectedSection,
          page: state.currentPage,
          page_size: state.pageSize
        });

        if (!studentsResponse.success || !studentsResponse.data) {
          throw new Error(studentsResponse.message || "Failed to fetch students");
        }

        const studentsData = studentsResponse.data.students.map((student) => ({
          student_id: student.student_id,
          usn: student.usn,
          name: student.name,
          subject: student.subject,
          section: student.section || "Section A",
          semester: student.semester || 0,
          attendance_percentage: student.attendance_percentage,
        }));

        updateState({
          students: studentsData,
          loading: false,
          notifiedStudents: {},
          totalCount: studentsResponse.count || 0,
          next: studentsResponse.next,
          previous: studentsResponse.previous,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch students";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
        setError(errorMessage);
        updateState({ loading: false });
      }
    };

    loadStudents();
  }, [state.selectedSemester, state.selectedSection, state.currentPage, state.pageSize, toast, setError]);
  useEffect(() => {
    const loadSections = async () => {
      if (!state.selectedSemester) {
        updateState({ sections: [], selectedSection: "" });
        return;
      }

      try {
        const sectionsResponse = await manageSections({ branch_id: state.branchId, semester_id: state.selectedSemester }, "GET");
        if (!sectionsResponse.success || !sectionsResponse.data) {
          throw new Error("Failed to fetch sections");
        }

        updateState({
          sections: sectionsResponse.data,
          selectedSection: "" // Reset section selection
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch sections";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
        setError(errorMessage);
      }
    };

    loadSections();
  }, [state.selectedSemester, toast, setError]);

  const filteredStudents = state.students; // Server-side filtering now

  const currentStudents = filteredStudents;

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    let currentPageNumber = 1;

    // Use the current filtered students
    const studentsToExport = state.students;

    if (studentsToExport.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "No students to export" });
      return;
    }

    // Get semester and section info for the title
    const semesterNumber = state.semesters.find(s => s.id === state.selectedSemester)?.number;
    const sectionName = state.sections.find(s => s.id === state.selectedSection)?.name;

    doc.setFontSize(16);
    doc.text(`Low Attendance Students - Semester ${semesterNumber} Section ${sectionName}`, margin, 14);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 180, 14);

    const studentChunks = [];
    for (let i = 0; i < studentsToExport.length; i += 40) { // 40 items per page for better readability
      studentChunks.push(studentsToExport.slice(i, i + 40));
    }

    studentChunks.forEach((chunk, chunkIndex) => {
      if (chunkIndex > 0) {
        doc.addPage();
        currentPageNumber++;
        doc.setFontSize(16);
        doc.text(`Low Attendance Students - Semester ${semesterNumber} Section ${sectionName} (Cont.)`, margin, 14);
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

    doc.save("low-attendance-report.pdf");
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
      <div className="pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Low Attendance Management</h1>
            <p className="text-muted-foreground">Monitor and notify students with low attendance</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportPDF}
              disabled={state.loading || state.students.length === 0}
              className="flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Semester</label>
            <Select
              value={state.selectedSemester}
              onValueChange={handleSemesterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                {state.semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    Semester {semester.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Section</label>
            <Select
              value={state.selectedSection}
              onValueChange={handleSectionChange}
              disabled={!state.selectedSemester}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent>
                {state.sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Students Table */}
        {state.loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading students...</span>
          </div>
        ) : state.students.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Students ({state.totalCount > 0 ? `${(state.currentPage - 1) * state.pageSize + 1}-${Math.min(state.currentPage * state.pageSize, state.totalCount)} of ${state.totalCount}` : state.students.length})
              </h2>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <VirtualizedSectionTable
                students={state.students}
                theme={theme}
                notifyingStudents={state.notifyingStudents}
                notifiedStudents={state.notifiedStudents}
                onNotifyStudent={notifyStudent}
              />
            </div>
            
            {/* Pagination Controls */}
            {state.totalCount > state.pageSize && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {state.students.length} of {state.totalCount} students
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={!state.previous || state.loading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from(
                      { length: Math.min(5, Math.ceil(state.totalCount / state.pageSize)) },
                      (_, i) => {
                        const pageNum = Math.max(1, state.currentPage - 2) + i;
                        if (pageNum > Math.ceil(state.totalCount / state.pageSize)) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === state.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            disabled={state.loading}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={!state.next || state.loading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : state.selectedSemester && state.selectedSection ? (
          <div className="text-center py-12 text-muted-foreground">
            No students with low attendance found for the selected semester and section.
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Please select a semester and section to view students with low attendance.
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default LowAttendance;