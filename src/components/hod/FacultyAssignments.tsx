import { useState, useEffect, ReactNode, Component } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { useToast } from "../ui/use-toast";
import { Pencil, Trash2, Loader2, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "../ui/dialog";
import { manageFacultyAssignments, manageSubjects, manageSections, manageProfile, getSemesters, manageFaculties, getFacultyAssignmentsBootstrap } from "../../utils/hod_api";
import { useTheme } from "../../context/ThemeContext";

// Interfaces
interface FacultyAssignmentsProps {
  setError: (error: string | null) => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

interface ManageFacultyAssignmentsRequest {
  action: "create" | "update" | "delete";
  assignment_id?: string;
  faculty_id?: string;
  subject_id?: string;
  semester_id?: string;
  section_id?: string;
  branch_id: string;
}

interface Assignment {
  id: string;
  faculty: string;
  subject: string;
  section: string;
  semester: number;
  faculty_id: string;
  subject_id: string;
  section_id: string;
  semester_id: string;
  branch_id?: string; // Add optional branch_id property
}

interface Faculty {
  id: string;
  username: string;
  first_name: string;
  last_name: string | null;
  name?: string; // Add optional name property
}

interface Subject {
  id: string;
  name: string;
  subject_code: string;
  semester_id: string; // Only string type
}

interface Section {
  id: string;
  name: string;
  semester_id: string; // Only string type
}

interface Semester {
  id: string;
  number: number;
}

// Define types for API responses
interface SemesterData {
  id: number | string; // Allow both types
  number: number;
}

interface FacultyData {
  id: string;
  username: string;
  first_name: string;
  last_name: string | null;
}

interface SubjectData {
  id: string;
  name: string;
  subject_code: string;
  semester_id: number;
}

interface SectionData {
  id: string;
  name: string;
  semester_id: number;
}

interface AssignmentData {
  id: string;
  faculty: string;
  subject: string;
  section: string;
  semester: number;
  faculty_id: string;
  subject_id: string;
  section_id: string;
  semester_id: string;
}

interface ProfileData {
  branch_id: string;
}

interface HODSubjectBootstrapResponse {
  profile: ProfileData;
  semesters: SemesterData[];
  faculties: FacultyData[];
  assignments: AssignmentData[];
}

// Define error type for catch blocks
interface ErrorWithMessage {
  message: string;
}

// Type guard to check if an object has a message property
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
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

const FacultyAssignments = ({ setError }: FacultyAssignmentsProps) => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [state, setState] = useState({
    facultyId: "",
    subjectId: "",
    sectionId: "",
    semesterId: "",
    search: "",
    assignments: [] as Assignment[],
    editingId: null as string | null,
    deleteId: null as string | null,
    openDeleteModal: false,
    loading: true,
    isAssigning: false, // New loading state for assignment
    subjects: [] as Subject[],
    sections: [] as Section[],
    semesters: [] as Semester[],
    faculties: [] as Faculty[],
    branchId: "",
  });

  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      updateState({ loading: true });
      try {
        const boot = await getFacultyAssignmentsBootstrap();
        if (!boot.success || !boot.data) {
          throw new Error(boot.message || "Failed to bootstrap faculty assignments");
        }
        
        const profile = boot.data.profile;
        const semesters = boot.data.semesters.map((s) => ({ 
          id: s.id.toString(), 
          number: s.number 
        }));
        const sections = boot.data.sections.map((s) => ({
          id: s.id,
          name: s.name,
          semester_id: s.semester_id?.toString() || '',
        }));
        const subjects = boot.data.subjects.map((s) => ({
          id: s.id,
          name: s.name,
          subject_code: s.subject_code,
          semester_id: s.semester_id?.toString() || '',
        }));
        const faculties = boot.data.faculties;
        const assignments = boot.data.assignments;
        
        updateState({ 
          branchId: profile.branch_id, 
          semesters, 
          sections,
          subjects,
          faculties, 
          assignments 
        });
      } catch (err) {
        if (isErrorWithMessage(err)) {
          const errorMessage = err.message || "Network error";
          setError(errorMessage);
          toast({ variant: "destructive", title: "Error", description: errorMessage });
        } else {
          const errorMessage = "Network error";
          setError(errorMessage);
          toast({ variant: "destructive", title: "Error", description: errorMessage });
        }
      } finally {
        updateState({ loading: false });
      }
    };
    fetchInitialData();
  }, [toast, setError]);

  // Fetch subjects and sections when semester changes - REMOVED: All data loaded in bootstrap

  const resetForm = () => {
    updateState({
      facultyId: "",
      subjectId: "",
      sectionId: "",
      semesterId: "",
      editingId: null,
    });
  };

  const validateForm = () => {
    if (!state.facultyId || !state.subjectId || !state.sectionId || !state.semesterId) {
      toast({
        title: "Error",
        description: "Please select all required fields",
        variant: "destructive",
      });
      return false;
    }
    if (!state.faculties.find(f => f.id === state.facultyId)) {
      toast({ title: "Error", description: "Invalid faculty selected", variant: "destructive" });
      return false;
    }
    if (!state.subjects.find(s => s.id === state.subjectId)) {
      toast({ title: "Error", description: "Invalid subject selected", variant: "destructive" });
      return false;
    }
    if (!state.sections.find(s => s.id === state.sectionId)) {
      toast({ title: "Error", description: "Invalid section selected", variant: "destructive" });
      return false;
    }
    if (!state.semesters.find(s => s.id === state.semesterId)) {
      toast({ title: "Error", description: "Invalid semester selected", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleAssignFaculty = async () => {
    if (!validateForm() || !state.branchId) return;

    // 🚨 Case 1: Prevent multiple faculties for the SAME subject + section + semester
    const duplicateAssignment = state.assignments.find(
      (a) =>
        a.subject_id === state.subjectId &&
        a.section_id === state.sectionId &&
        a.semester_id === state.semesterId &&
        a.id !== state.editingId
    );

    if (duplicateAssignment) {
      toast({
        variant: "destructive",
        title: "Duplicate Assignment",
        description: `Subject "${duplicateAssignment.subject}" is already assigned to Section ${duplicateAssignment.section}, Semester ${duplicateAssignment.semester}. Only one faculty can be assigned.`,
      });
      return; // Stop here
    }

    // 🚨 Case 2: Prevent same faculty being assigned again to the SAME subject + section + semester
    const duplicateFaculty = state.assignments.find(
      (a) =>
        a.faculty_id === state.facultyId &&
        a.subject_id === state.subjectId &&
        a.section_id === state.sectionId &&
        a.semester_id === state.semesterId &&
        a.id !== state.editingId
    );

    if (duplicateFaculty) {
      const facultyName =
        state.faculties.find((f) => f.id === state.facultyId)?.first_name + " " + 
        (state.faculties.find((f) => f.id === state.facultyId)?.last_name || "") || "This faculty";

      toast({
        variant: "destructive",
        title: "Duplicate Faculty Assignment",
        description: `${facultyName} is already assigned to ${duplicateFaculty.subject} - Section ${duplicateFaculty.section}, Semester ${duplicateFaculty.semester}.`,
      });
      return; // Stop here
    }

    // ✅ Proceed if no duplicates
    const isEditing = !!state.editingId;
    const originalAssignments = [...state.assignments];
    const originalFormState = {
      facultyId: state.facultyId,
      subjectId: state.subjectId,
      sectionId: state.sectionId,
      semesterId: state.semesterId,
      editingId: state.editingId,
    };

    // Optimistic update
    if (isEditing) {
      // Update existing assignment optimistically
      const updatedAssignments = state.assignments.map(assignment =>
        assignment.id === state.editingId
          ? {
              ...assignment,
              faculty_id: state.facultyId,
              subject_id: state.subjectId,
              section_id: state.sectionId,
              semester_id: state.semesterId,
              faculty: `${state.faculties.find(f => f.id === state.facultyId)?.first_name} ${state.faculties.find(f => f.id === state.facultyId)?.last_name || ''}`.trim(),
              subject: state.subjects.find(s => s.id === state.subjectId)?.name || '',
              section: state.sections.find(s => s.id === state.sectionId)?.name || '',
              semester: state.semesters.find(s => s.id === state.semesterId)?.number || 0,
            }
          : assignment
      );
      updateState({ assignments: updatedAssignments });
    } else {
      // Add new assignment optimistically
      const newAssignment: Assignment = {
        id: `temp-${Date.now()}`, // Temporary ID
        faculty_id: state.facultyId,
        subject_id: state.subjectId,
        section_id: state.sectionId,
        semester_id: state.semesterId,
        faculty: `${state.faculties.find(f => f.id === state.facultyId)?.first_name} ${state.faculties.find(f => f.id === state.facultyId)?.last_name || ''}`.trim(),
        subject: state.subjects.find(s => s.id === state.subjectId)?.name || '',
        section: state.sections.find(s => s.id === state.sectionId)?.name || '',
        semester: state.semesters.find(s => s.id === state.semesterId)?.number || 0,
      };
      updateState({ assignments: [...state.assignments, newAssignment] });
    }

    // Clear form optimistically
    resetForm();

    // Show success toast optimistically
    toast({
      title: isEditing ? "Updated" : "Success",
      description: isEditing
        ? "Assignment updated successfully"
        : "Faculty assigned successfully",
      className: "bg-green-100 text-green-800",
    });

    updateState({ isAssigning: true });

    try {
      const data: ManageFacultyAssignmentsRequest = {
        action: isEditing ? "update" : "create",
        assignment_id: state.editingId,
        faculty_id: originalFormState.facultyId,
        subject_id: originalFormState.subjectId,
        semester_id: originalFormState.semesterId,
        section_id: originalFormState.sectionId,
        branch_id: state.branchId,
      };

      const response = await manageFacultyAssignments(data, "POST");

      if (response.success) {
        // Refresh assignments list to get real data
        const assignmentsResponse = await manageFacultyAssignments(
          { branch_id: state.branchId },
          "GET"
        );

        if (assignmentsResponse.success && assignmentsResponse.data?.assignments) {
          updateState({ assignments: assignmentsResponse.data.assignments });
        }
        // Success toast already shown optimistically
      } else {
        throw new Error(response.message || "Failed to save assignment");
      }
    } catch (err) {
      // Revert optimistic changes
      updateState({
        assignments: originalAssignments,
        facultyId: originalFormState.facultyId,
        subjectId: originalFormState.subjectId,
        sectionId: originalFormState.sectionId,
        semesterId: originalFormState.semesterId,
        editingId: originalFormState.editingId,
      });

      if (isErrorWithMessage(err)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Network error",
        });
        setError(err.message || "Network error");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Network error",
        });
        setError("Network error");
      }
    } finally {
      updateState({ isAssigning: false });
    }
  };

  const handleEdit = (assignment: Assignment) => {
    updateState({
      editingId: assignment.id,
      facultyId: assignment.faculty_id,
      subjectId: assignment.subject_id,
      sectionId: assignment.section_id,
      semesterId: assignment.semester_id,
    });
  };

  const handleConfirmDelete = async () => {
    if (!state.deleteId || !state.branchId) return;

    // Store original state for potential reversion
    const originalAssignments = [...state.assignments];
    const assignmentToDelete = state.assignments.find(a => a.id === state.deleteId);

    // Optimistic update: remove assignment from list
    const updatedAssignments = state.assignments.filter(a => a.id !== state.deleteId);
    updateState({ assignments: updatedAssignments });

    // Close modal optimistically
    updateState({ deleteId: null, openDeleteModal: false });

    // Show success toast optimistically
    toast({
      title: "Deleted",
      description: "Assignment deleted successfully",
      className: "bg-green-100 text-green-800",
    });

    updateState({ loading: true });

    try {
      const data: ManageFacultyAssignmentsRequest = {
        action: "delete",
        assignment_id: state.deleteId,
        branch_id: state.branchId,
      };
      const response = await manageFacultyAssignments(data, "POST");
      if (response.success) {
        // Refresh assignments list to get real data (in case there were any issues)
        const assignmentsResponse = await manageFacultyAssignments({ branch_id: state.branchId }, "GET");
        if (assignmentsResponse.success && assignmentsResponse.data?.assignments) {
          updateState({ assignments: assignmentsResponse.data.assignments });
        }
        // Success toast already shown optimistically
      } else {
        throw new Error(response.message || "Failed to delete assignment");
      }
    } catch (err) {
      // Revert optimistic changes
      updateState({ assignments: originalAssignments });

      if (isErrorWithMessage(err)) {
        const errorMessage = err.message || "Network error";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
        setError(errorMessage);
      } else {
        const errorMessage = "Network error";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
        setError(errorMessage);
      }
    } finally {
      updateState({ loading: false });
    }
  };

  const filteredAssignments = state.assignments.filter((assignment) =>
    `${assignment.subject} ${assignment.section} ${assignment.semester} ${assignment.faculty}`
      .toLowerCase()
      .includes(state.search.toLowerCase())
  );
  const facultyMap = state.faculties.reduce((acc, f) => {
    acc[f.id] = {
      name: `${f.first_name} ${f.last_name || ""}`.trim(),
      email: f.username,
    };
    return acc;
  }, {} as Record<string, { name: string; email: string }>);
  

  return (
    <ErrorBoundary>
      <div className={`p-6 space-y-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
        <h1 className={`text-xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Faculty Assignments</h1>
        <Card className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>{state.editingId ? "Edit Faculty Assignment" : "Add Faculty Assignment"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block mb-1 text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Faculty</label>
                <Select
                  value={state.facultyId}
                  onValueChange={(value) => updateState({ facultyId: value })}
                  disabled={state.loading || state.isAssigning || state.faculties.length === 0}
                >
                  <SelectTrigger className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                    <SelectValue placeholder={state.faculties.length === 0 ? "No faculties available" : "Select Faculty"} />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                    {state.faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id} className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                        {faculty.first_name} {faculty.last_name || ""} ({faculty.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={`block mb-1 text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Semester</label>
                <Select
                  value={state.semesterId}
                  onValueChange={(value) => updateState({ semesterId: value, subjectId: "", sectionId: "" })}
                  disabled={state.loading || state.isAssigning || state.semesters.length === 0}
                >
                  <SelectTrigger className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                    <SelectValue placeholder={state.semesters.length === 0 ? "No semesters available" : "Select Semester"} />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                    {state.semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id} className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                        Semester {semester.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={`block mb-1 text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Subject</label>
                <Select
                  value={state.subjectId}
                  onValueChange={(value) => updateState({ subjectId: value })}
                  disabled={state.loading || state.isAssigning || !state.semesterId || state.subjects.length === 0}
                >
                  <SelectTrigger className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                    <SelectValue placeholder={state.subjects.length === 0 ? "No subjects available" : "Select Subject"} />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                    {state.subjects
                      .filter((subject) => subject.semester_id === state.semesterId)
                      .map((subject) => (
                        <SelectItem key={subject.id} value={subject.id} className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                          {subject.name} ({subject.subject_code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={`block mb-1 text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Section</label>
                <Select
                  value={state.sectionId}
                  onValueChange={(value) => updateState({ sectionId: value })}
                  disabled={state.loading || state.isAssigning || !state.semesterId || state.sections.length === 0}
                >
                  <SelectTrigger className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                    <SelectValue placeholder={state.sections.length === 0 ? "No sections available" : "Select Section"} />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                    {state.sections
                      .filter((section) => section.semester_id === state.semesterId)
                      .map((section) => (
                        <SelectItem key={section.id} value={section.id} className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                          Section {section.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {(state.facultyId || state.subjectId || state.sectionId || state.semesterId || state.editingId) && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={state.loading || state.isAssigning}
                  className={theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}
                >
                  Cancel
                </Button>

              )}
              <Button
                onClick={handleAssignFaculty}
                disabled={state.loading || state.isAssigning}
                className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
              >
                {state.isAssigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {state.editingId ? "Updating..." : "Assigning..."}
                  </>
                ) : (
                  state.editingId ? "Update Assignment" : "+ Assign Faculty"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Faculty Assignments List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              className={theme === 'dark' ? 'bg-card text-foreground border-border placeholder-muted-foreground' : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'}
              placeholder="Search by faculty, subject, section or semester..."
              value={state.search}
              onChange={(e) => updateState({ search: e.target.value })}
              disabled={state.loading || state.isAssigning}
            />
            {state.loading ? (
              <div className={`text-center py-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Loading...</div>
            ) : filteredAssignments.length === 0 ? (
              <div className={`text-center py-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No assignments found.</div>
            ) : (
              <div className={`rounded-md overflow-x-auto max-h-80 overflow-y-auto custom-scrollbar ${theme === 'dark' ? 'border-border' : 'border-gray-300'}`}>
                <table className="w-full text-sm scroll-smooth">
                  <thead className={theme === 'dark' ? 'bg-card sticky top-0 z-10 border-border' : 'bg-gray-100 sticky top-0 z-10 border-gray-300'}>
                    <tr className="border-b">
                      <th className="text-left p-2">Subject</th>
                      <th className="text-left p-2">Section</th>
                      <th className="text-left p-2">Semester</th>
                      <th className="text-left p-2">Assigned Faculty</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((assignment) => (
                      <tr
                        key={assignment.id}
                        className={`border-b ${theme === 'dark' ? 'border-border hover:bg-accent' : 'border-gray-300 hover:bg-gray-100'}`}
                      >
                        <td className="p-2">{assignment.subject}</td>
                        <td className="p-2">{assignment.section}</td>
                        <td className="p-2">{assignment.semester}</td>
                        <td className="p-2">
                          {facultyMap[assignment.faculty_id]?.name || assignment.faculty}
                          <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                            {facultyMap[assignment.faculty_id]?.email}
                          </div>
                        </td>
                        <td className="p-2 flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-200'}
                            onClick={() => handleEdit(assignment)}
                            disabled={state.loading || state.isAssigning}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-200'}
                            onClick={() =>
                              updateState({
                                deleteId: assignment.id,
                                openDeleteModal: true,
                              })
                            }
                            disabled={state.loading || state.isAssigning}
                          >
                            <Trash2 className={`h-4 w-4 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            )}
          </CardContent>
        </Card>

        <Dialog open={state.openDeleteModal} onOpenChange={(open) => updateState({ openDeleteModal: open })}>
          <DialogContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
            <DialogHeader>
              <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Delete Assignment?</DialogTitle>
              <DialogDescription className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>Are you sure you want to delete this assignment?</DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                className={theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}
                onClick={() => updateState({ openDeleteModal: false })}
                disabled={state.loading || state.isAssigning}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmDelete}
                disabled={state.loading || state.isAssigning}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default FacultyAssignments;