import { useState, useEffect, ReactNode, Component } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { useToast } from "../ui/use-toast";
import { Pencil, Trash2, Loader2, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "../ui/dialog";
import { manageFacultyAssignments, manageSubjects, manageSections, manageProfile, getSemesters, manageFaculties } from "../../utils/hod_api";

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
}

interface Faculty {
  id: string;
  username: string;
  first_name: string;
  last_name: string | null;
}

interface Subject {
  id: string;
  name: string;
  subject_code: string;
  semester_id: string;
}

interface Section {
  id: string;
  name: string;
  semester_id: string;
}

interface Semester {
  id: string;
  number: number;
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
        const profileResponse = await manageProfile({}, "GET");
        if (!profileResponse.success || !profileResponse.data?.branch_id) {
          throw new Error(profileResponse.message || "Failed to fetch HOD profile");
        }
        const branchId = profileResponse.data.branch_id;
        const semestersResponse = await getSemesters(branchId);
        if (!semestersResponse.success || !semestersResponse.data) {
          throw new Error(semestersResponse.message || "Failed to fetch semesters");
        }
        const facultiesResponse = await manageFaculties({ branch_id: branchId }, "GET");
        if (!facultiesResponse.success || !facultiesResponse.data) {
          throw new Error(facultiesResponse.message || "Failed to fetch faculties");
        }
        const assignmentsResponse = await manageFacultyAssignments({ branch_id: branchId }, "GET");
        if (!assignmentsResponse.success || !assignmentsResponse.data?.assignments) {
          throw new Error(assignmentsResponse.message || "Failed to fetch assignments");
        }
        updateState({
          branchId,
          semesters: semestersResponse.data.map((s: any) => ({ id: s.id.toString(), number: s.number })),
          faculties: facultiesResponse.data,
          assignments: assignmentsResponse.data.assignments,
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

  // Fetch subjects and sections when semester changes
  useEffect(() => {
    const fetchSemesterData = async () => {
      if (!state.semesterId || !state.branchId) return;
      updateState({ loading: true });
      try {
        const subjectsResponse = await manageSubjects({ branch_id: state.branchId, semester_id: state.semesterId }, "GET");
        if (!subjectsResponse.success || !subjectsResponse.data) {
          throw new Error(subjectsResponse.message || "Failed to fetch subjects");
        }
        const sectionsResponse = await manageSections({ branch_id: state.branchId, semester_id: state.semesterId }, "GET");
        if (!sectionsResponse.success || !sectionsResponse.data) {
          throw new Error(sectionsResponse.message || "Failed to fetch sections");
        }
        updateState({
          subjects: subjectsResponse.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            subject_code: s.subject_code,
            semester_id: s.semester_id.toString(),
          })),
          sections: sectionsResponse.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            semester_id: s.semester_id.toString(),
          })),
        });
      } catch (err: any) {
        const errorMessage = err.message || "Network error";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
      } finally {
        updateState({ loading: false });
      }
    };
    fetchSemesterData();
  }, [state.semesterId, state.branchId, toast]);

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
    if (!state.subjects.find(s => s.id === state.subjectId && s.semester_id === state.semesterId)) {
      toast({ title: "Error", description: "Invalid subject for selected semester", variant: "destructive" });
      return false;
    }
    if (!state.sections.find(s => s.id === state.sectionId && s.semester_id === state.semesterId)) {
      toast({ title: "Error", description: "Invalid section for selected semester", variant: "destructive" });
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

  // 🚨 Prevent multiple faculties for same subject + section + semester
  const duplicate = state.assignments.find(
    (a) =>
      a.subject_id === state.subjectId &&
      a.section_id === state.sectionId &&
      a.semester_id === state.semesterId &&
      a.branch_id === state.branchId &&
      a.id !== state.editingId // allow editing the same assignment
  );

  if (duplicate) {
    toast({
      variant: "destructive",
      title: "Duplicate Assignment",
      description: `Faculty is already assigned for ${duplicate.subject} - Section ${duplicate.section}, Semester ${duplicate.semester}.`,
    });
    return; // ❌ stop here, don’t assign again
  }

  updateState({ isAssigning: true });

  try {
    const data = {
      action: state.editingId ? "update" : "create",
      assignment_id: state.editingId,
      faculty_id: state.facultyId,
      subject_id: state.subjectId,
      semester_id: state.semesterId,
      section_id: state.sectionId,
      branch_id: state.branchId,
    };

    const response = await manageFacultyAssignments(data, "POST");
    if (response.success) {
      const assignmentsResponse = await manageFacultyAssignments({ branch_id: state.branchId }, "GET");
      if (assignmentsResponse.success && assignmentsResponse.data?.assignments) {
        updateState({ assignments: assignmentsResponse.data.assignments });
      }
      toast({
        title: state.editingId ? "Updated" : "Success",
        description: state.editingId
          ? "Assignment updated successfully"
          : "Faculty assigned successfully",
        className: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-5 h-5" />,
      });
      resetForm();
    } else {
      throw new Error(response.message || "Failed to save assignment");
    }
  } catch (err: any) {
    const errorMessage = err.message || "Network error";
    toast({ variant: "destructive", title: "Error", description: errorMessage });
    setError(errorMessage);
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
    updateState({ loading: true });
    try {
      const data = {
        action: "delete",
        assignment_id: state.deleteId,
        branch_id: state.branchId,
      };
      const response = await manageFacultyAssignments(data, "POST");
      if (response.success) {
        const assignmentsResponse = await manageFacultyAssignments({ branch_id: state.branchId }, "GET");
        if (assignmentsResponse.success && assignmentsResponse.data?.assignments) {
          updateState({ assignments: assignmentsResponse.data.assignments });
        }
        toast({
          title: "Deleted",
          description: "Assignment deleted successfully",
          className: "bg-green-100 text-green-800",
          icon: <CheckCircle className="w-5 h-5" />,
        });
      } else {
        throw new Error(response.message || "Failed to delete assignment");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Network error";
      toast({ variant: "destructive", title: "Error", description: errorMessage });
      setError(errorMessage);
    } finally {
      updateState({ deleteId: null, openDeleteModal: false, loading: false });
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
      <div className="p-6 space-y-6 text-gray-200">
        <h1 className="text-xl font-semibold">Faculty Assignments</h1>
        <Card className="bg-[#1c1c1e] text-gray-200">
          <CardHeader>
            <CardTitle>{state.editingId ? "Edit Faculty Assignment" : "Add Faculty Assignment"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm">Faculty</label>
                <Select
                  value={state.facultyId}
                  onValueChange={(value) => updateState({ facultyId: value })}
                  disabled={state.loading || state.isAssigning || state.faculties.length === 0}
                >
                  <SelectTrigger className="bg-[#2c2c2e] text-gray-200 border-gray-600">
                    <SelectValue placeholder={state.faculties.length === 0 ? "No faculties available" : "Select Faculty"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2c2c2e] text-gray-200">
                    {state.faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.first_name} {faculty.last_name || ""} ({faculty.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 text-sm">Semester</label>
                <Select
                  value={state.semesterId}
                  onValueChange={(value) => updateState({ semesterId: value, subjectId: "", sectionId: "" })}
                  disabled={state.loading || state.isAssigning || state.semesters.length === 0}
                >
                  <SelectTrigger className="bg-[#2c2c2e] text-gray-200 border-gray-600">
                    <SelectValue placeholder={state.semesters.length === 0 ? "No semesters available" : "Select Semester"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2c2c2e] text-gray-200">
                    {state.semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id}>
                        Semester {semester.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 text-sm">Subject</label>
                <Select
                  value={state.subjectId}
                  onValueChange={(value) => updateState({ subjectId: value })}
                  disabled={state.loading || state.isAssigning || !state.semesterId || state.subjects.length === 0}
                >
                  <SelectTrigger className="bg-[#2c2c2e] text-gray-200 border-gray-600">
                    <SelectValue placeholder={state.subjects.length === 0 ? "No subjects available" : "Select Subject"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2c2c2e] text-gray-200">
                    {state.subjects
                      .filter((subject) => subject.semester_id === state.semesterId)
                      .map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.subject_code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 text-sm">Section</label>
                <Select
                  value={state.sectionId}
                  onValueChange={(value) => updateState({ sectionId: value })}
                  disabled={state.loading || state.isAssigning || !state.semesterId || state.sections.length === 0}
                >
                  <SelectTrigger className="bg-[#2c2c2e] text-gray-200 border-gray-600">
                    <SelectValue placeholder={state.sections.length === 0 ? "No sections available" : "Select Section"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2c2c2e] text-gray-200">
                    {state.sections
                      .filter((section) => section.semester_id === state.semesterId)
                      .map((section) => (
                        <SelectItem key={section.id} value={section.id}>
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
                  className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                >
                  Cancel
                </Button>

              )}
              <Button
                onClick={handleAssignFaculty}
                disabled={state.loading || state.isAssigning}
                className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
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

        <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-100">Faculty Assignments List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              className="bg-[#2c2c2e] text-gray-200 border-gray-700 placeholder-gray-400"
              placeholder="Search by faculty, subject, section or semester..."
              value={state.search}
              onChange={(e) => updateState({ search: e.target.value })}
              disabled={state.loading || state.isAssigning}
            />
            {state.loading ? (
              <div className="text-center py-4 text-gray-400">Loading...</div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-4 text-gray-400">No assignments found.</div>
            ) : (
              <div className="rounded-md border border-gray-700 overflow-x-auto">
                <table className="w-full text-sm text-gray-200">
                  <thead className="bg-[#2c2c2e]">
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2">Subject</th>
                      <th className="text-left p-2">Section</th>
                      <th className="text-left p-2">Semester</th>
                      <th className="text-left p-2">Assigned Faculty</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((assignment) => (
                      <tr key={assignment.id} className="border-b border-gray-700 hover:bg-[#2c2c2e]">
                        <td className="p-2">{assignment.subject}</td>
                        <td className="p-2">{assignment.section}</td>
                        <td className="p-2">{assignment.semester}</td>
                        <td className="p-2">
                          {facultyMap[assignment.faculty_id]?.name || assignment.faculty}
                          <div className="text-xs text-gray-400">
                            {facultyMap[assignment.faculty_id]?.email}
                          </div>
                        </td>
                        <td className="p-2 flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="hover:bg-gray-700"
                            onClick={() => handleEdit(assignment)}
                            disabled={state.loading || state.isAssigning}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="hover:bg-gray-700"
                            onClick={() => updateState({ deleteId: assignment.id, openDeleteModal: true })}
                            disabled={state.loading || state.isAssigning}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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
          <DialogContent className="bg-[#1c1c1e] text-white">
            <DialogHeader>
              <h2 className="text-lg font-semibold">Delete Assignment?</h2>
              <p className="text-sm text-gray-400">Are you sure you want to delete this assignment?</p>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                onClick={() => updateState({ openDeleteModal: false })}
                disabled={state.loading || state.isAssigning}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-500 text-white"
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