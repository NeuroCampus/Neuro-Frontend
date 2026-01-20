import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getProctors, manageStudents, assignProctorsBulk, getSemesters, manageSections, manageProfile, getProctorBootstrap } from "../../utils/hod_api";
import { useTheme } from "../../context/ThemeContext";
import { API_ENDPOINT } from "../../utils/config";
import { fetchWithTokenRefresh } from "../../utils/authService";

interface Student {
  usn: string;
  name: string;
  semester: string;
  branch: string;
  section: string;
  proctor: string | null;
}

interface Proctor {
  id: string;
  name: string;
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

const ProctorStudents = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [state, setState] = useState({
    students: [] as Student[],
    proctors: [] as Proctor[],
    semesters: [] as Semester[],
    sections: [] as Semester[],
    search: "",
    currentPage: 1,
    totalCount: 0,
    totalAssigned: 0,
    totalUnassigned: 0,
    editMode: false,
    selectedUSNs: [] as string[],
    selectedProctor: "",
    loading: true,
    error: null as string | null,
    branchId: "",
    branchName: "Computer Science", // Fallback
    filters: {
      semester_id: "all",
      section_id: "all",
    },
    saving: false,
    cancelling: false,
  });

  const studentsPerPage = 10;

  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  // Load metadata (semesters, sections, proctors) once
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/hod/proctor-bootstrap/?include=profile,semesters,sections,proctors`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error(data.message || "Failed to fetch metadata");
        }

        updateState({
          branchId: data.data.profile.branch_id,
          branchName: data.data.profile.branch,
          semesters: data.data.semesters,
          sections: data.data.sections,
          proctors: data.data.proctors.map((f: any) => ({
            id: f.id,
            name: f.name,
          })),
        });
      } catch (error) {
        const errorMessage = (error as Error).message || "Network error";
        updateState({ error: errorMessage });
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
      }
    };
    loadMetadata();
  }, [toast]);

  // Separate function to load students
  const loadStudents = async (searchTerm?: string) => {
    updateState({ loading: true, error: null });
    try {
      const params = new URLSearchParams({
        include: "students",
        page: state.currentPage.toString(),
        page_size: studentsPerPage.toString(),
      });

      if (state.filters.semester_id !== "all") {
        params.append("semester_id", state.filters.semester_id);
      }

      if (state.filters.section_id !== "all") {
        params.append("section_id", state.filters.section_id);
      }

      const searchValue = searchTerm !== undefined ? searchTerm : state.search;
      if (searchValue.trim()) {
        params.append("search", searchValue.trim());
      }

      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/hod/proctor-bootstrap/?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.message || "Failed to fetch students");
      }

      // Process students data
      const students = data.data.students.map((s: any) => ({
        usn: s.usn,
        name: s.name,
        semester: s.semester ? `${s.semester}th Semester` : "N/A",
        branch: state.branchName,
        section: s.section || "N/A",
        proctor: s.proctor,
      }));

      updateState({
        students,
        totalCount: data.count,
        totalAssigned: data.total_assigned || 0,
        totalUnassigned: data.total_unassigned || 0,
        totalPages: Math.ceil(data.count / studentsPerPage),
      });
    } catch (error) {
      const errorMessage = (error as Error).message || "Network error";
      updateState({ error: errorMessage });
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      updateState({ loading: false });
    }
  };

  // Load students with filters and pagination (but not on every search keystroke)
  useEffect(() => {
    // Only load students if we have metadata loaded
    if (state.branchId && state.semesters.length > 0) {
      loadStudents();
    }
  }, [toast, state.currentPage, state.filters.semester_id, state.filters.section_id, state.branchId, state.branchName, state.semesters.length]);

  const handleFilterChange = (field: string, value: string) => {
    updateState({
      filters: {
        ...state.filters,
        [field]: value,
        ...(field === "semester_id" && { section_id: "all" }),
      },
      currentPage: 1,
    });
  };

  const handleSearch = () => {
    // Trigger search with current search term
    updateState({ currentPage: 1 });
    if (state.branchId && state.semesters.length > 0) {
      loadStudents(state.search);
    }
  };

  const handleCheckboxToggle = (usn: string) => {
    updateState({
      selectedUSNs: state.selectedUSNs.includes(usn)
        ? state.selectedUSNs.filter((id) => id !== usn)
        : [...state.selectedUSNs, usn],
    });
  };

  const handleSaveProctor = async () => {
    if (state.selectedProctor && state.selectedUSNs.length > 0) {
      updateState({ loading: true });
      try {
        const response = await assignProctorsBulk({
          usns: state.selectedUSNs,
          faculty_id: state.selectedProctor,
          branch_id: state.branchId,
        });
        if (!response.success) {
          throw new Error(response.message || "Failed to assign proctors");
        }

        const updatedStudents = state.students.map((student) =>
          state.selectedUSNs.includes(student.usn)
            ? { ...student, proctor: state.proctors.find((p) => p.id === state.selectedProctor)?.name || null }
            : student
        );

        updateState({
          students: updatedStudents,
          editMode: false,
          selectedUSNs: [],
          selectedProctor: "",
        });

        toast({
          title: "Success",
          description: `${state.selectedUSNs.length} students assigned to ${state.proctors.find((p) => p.id === state.selectedProctor)?.name}`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message,
        });
      } finally {
        updateState({ loading: false });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one student and a proctor",
      });
    }
  };

  const handleCancelEdit = () => {
    updateState({
      editMode: false,
      selectedUSNs: [],
      selectedProctor: "",
    });
  };


  const handleEditToggle = async () => {
    if (state.editMode) {
      if (state.selectedProctor && state.selectedUSNs.length > 0) {
        updateState({ loading: true });
        try {
          const response = await assignProctorsBulk({
            usns: state.selectedUSNs,
            faculty_id: state.selectedProctor,
            branch_id: state.branchId,
          });
          if (!response.success) {
            throw new Error(response.message || "Failed to assign proctors");
          }

          const updatedStudents = state.students.map((student) =>
            state.selectedUSNs.includes(student.usn)
              ? { ...student, proctor: state.proctors.find((p) => p.id === state.selectedProctor)?.name || null }
              : student
          );

          updateState({
            students: updatedStudents,
            editMode: false,
            selectedUSNs: [],
            selectedProctor: "",
          });
          toast({
            title: "Success",
            description: `${state.selectedUSNs.length} students assigned to ${state.proctors.find((p) => p.id === state.selectedProctor)?.name}`,
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: (error as Error).message,
          });
        } finally {
          updateState({ loading: false });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select at least one student and a proctor",
        });
      }
    } else {
      updateState({ editMode: true });
    }
  };

  // Since we're doing server-side filtering and pagination, 
  // state.students already contains the filtered results for current page
  const currentStudents = state.students;
  const assigned = state.totalAssigned;
  const unassigned = state.totalUnassigned;

  if (state.loading && !state.students.length) {
    return <div className={`text-center py-6 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Loading...</div>;
  }

  if (state.error) {
    return <div className={`text-center py-6 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{state.error}</div>;
  }

  return (
    <div className={`min-h-screen p-6 space-y-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <div className="grid grid-cols-3 gap-4 ">
        <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}><CardHeader><CardTitle>Total Students</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{state.totalCount}</CardContent></Card>
        <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}><CardHeader><CardTitle className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>Assigned</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{assigned}</CardContent></Card>
        <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}><CardHeader><CardTitle className={theme === 'dark' ? 'text-red-400' : 'text-red-600'}>Unassigned</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{unassigned}</CardContent></Card>
      </div>

      <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
        <CardHeader><CardTitle>Student-Proctor Management</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex-1" />
          {state.editMode && (
            <Select onValueChange={(value) => updateState({ selectedProctor: value })} disabled={state.proctors.length === 0}>
              <SelectTrigger className={theme === 'dark' ? 'w-64 bg-background text-foreground border-border' : 'w-64 bg-white text-gray-900 border-gray-300'}>
                <SelectValue placeholder={state.proctors.length === 0 ? "No proctors available" : "Select Proctor"} />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                {state.proctors.map((proctor) => (
                  <SelectItem key={proctor.id} value={proctor.id} className={theme === 'dark' ? 'focus:bg-accent' : 'focus:bg-gray-100'}>{proctor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {state.editMode && (
            <div className="flex gap-2">
              <Button
              className={`min-w-fit text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 flex items-center gap-2 ${theme === 'dark' ? 'text-foreground bg-green-700 hover:bg-green-800' : 'text-gray-200 bg-green-600 hover:bg-green-700'}`}
                onClick={async () => {
                  updateState({ saving: true });
                  await handleEditToggle(); // your save logic
                  updateState({ saving: false });
                }}
                disabled={state.saving || state.selectedUSNs.length === 0 || !state.selectedProctor}
              >
                {state.saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Changes"}
              </Button>
              <Button
              className={`min-w-fit text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 flex items-center gap-2 ${theme === 'dark' ? 'text-foreground bg-gray-700 hover:bg-gray-800' : 'text-gray-200 bg-gray-500 hover:bg-gray-600'}`}
                onClick={async () => {
                  updateState({ cancelling: true });
                  await handleCancelEdit();
                  updateState({ cancelling: false });
                }}
                disabled={state.cancelling}
              >
                {state.cancelling ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</> : "Cancel"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Proctor Assignment - {state.branchName.toUpperCase()}</CardTitle>
          <Button
            onClick={() => updateState({ editMode: true })}
            className={`min-w-fit text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] ${theme === 'dark' ? 'shadow-lg shadow-[#a259ff]/20' : 'shadow-md'}`}
            disabled={state.loading || state.editMode}
          >
            Edit Proctors
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            {/* Left side: Search input and button */}
            <div className="flex gap-2">
              <Input
                placeholder="Search students..."
                className={`w-64 ${theme === 'dark' ? 'bg-card text-foreground border-border placeholder:text-muted-foreground' : 'bg-white text-gray-900 border-gray-300 placeholder:text-gray-500'}`}
                value={state.search}
                onChange={(e) => updateState({ search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={state.loading}
              />
              <Button onClick={handleSearch} variant="outline" disabled={state.loading}>
                Search
              </Button>
            </div>
            <div className="flex-1" />
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Select
              value={state.filters.semester_id}
              onValueChange={(value) => handleFilterChange("semester_id", value)}
              disabled={state.loading || state.semesters.length === 0}
            >
              <SelectTrigger className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                <SelectValue placeholder={state.semesters.length === 0 ? "No semesters available" : "All Semesters"} />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                <SelectItem value="all" className={theme === 'dark' ? 'focus:bg-accent' : 'focus:bg-gray-100'}>All Semesters</SelectItem>
                {state.semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id} className={theme === 'dark' ? 'focus:bg-accent' : 'focus:bg-gray-100'}>
                    Semester {semester.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={state.filters.section_id}
              onValueChange={(value) => handleFilterChange("section_id", value)}
              disabled={state.loading || state.sections.length === 0}
            >
              <SelectTrigger className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                <SelectValue placeholder={state.sections.length === 0 ? "No sections available" : "All Sections"} />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                <SelectItem value="all" className={theme === 'dark' ? 'focus:bg-accent' : 'focus:bg-gray-100'}>All Sections</SelectItem>
                {state.sections
                  .filter((section) => state.filters.semester_id === "all" || section.semester_id === state.filters.semester_id)
                  .map((section) => (
                    <SelectItem key={section.id} value={section.id} className={theme === 'dark' ? 'focus:bg-accent' : 'focus:bg-gray-100'}>
                      Section {section.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <table className={`w-full mt-4 text-left text-sm ${theme === 'dark' ? 'border-border' : 'border-gray-300'}`}>
            <thead className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-gray-100 text-gray-900'}>
              <tr>
                {state.editMode && <th className="py-2 px-4">Select</th>}
                <th className="py-2 px-4">USN</th>
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Semester</th>
                <th className="py-2 px-4">Section</th>
                <th className="py-2 px-4">Proctor</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan={state.editMode ? 6 : 5} className={`text-center py-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>No students found</td>
                </tr>
              ) : (
                currentStudents.map((student) => (
                  <tr
                    key={student.usn}
                    className={`border-t ${state.editMode ? (theme === 'dark' ? 'cursor-pointer hover:bg-accent' : 'cursor-pointer hover:bg-gray-100') : ''} ${theme === 'dark' ? 'border-border' : 'border-gray-300'}`}
                    onClick={() => state.editMode && handleCheckboxToggle(student.usn)}
                  >
                    {state.editMode && (
                      <td className="py-2 px-4">
                        <input
                          type="checkbox"
                          checked={state.selectedUSNs.includes(student.usn)}
                          onChange={() => handleCheckboxToggle(student.usn)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    <td className={`py-2 px-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{student.usn}</td>
                    <td className={`py-2 px-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{student.name}</td>
                    <td className={`py-2 px-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{student.semester}</td>
                    <td className={`py-2 px-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{student.section}</td>
                    <td className="py-2 px-4">
                      {student.proctor ? (
                        <span className={theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}>{student.proctor}</span>
                      ) : (
                        <span className={theme === 'dark' ? 'text-red-400' : 'text-red-500'}>Not assigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-4">
            <div className={`text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
              Showing {Math.min((state.currentPage - 1) * studentsPerPage + 1, state.totalCount)} to{" "}
              {Math.min(state.currentPage * studentsPerPage, state.totalCount)} of {state.totalCount}
            </div>
            <div className="flex space-x-2 items-center">
              <Button
                variant="outline"
                disabled={state.currentPage === 1 || state.loading}
                onClick={() => updateState({ currentPage: Math.max(state.currentPage - 1, 1) })}
                className={`text-sm font-medium px-4 py-2 rounded-md bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white ${theme === 'dark' ? 'shadow-lg shadow-[#a259ff]/20' : 'shadow-md'}`}
              >
                Previous
              </Button>
              <span className={`px-4 text-lg font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{state.currentPage}</span>
              <Button
                variant="outline"
                disabled={state.currentPage === state.totalPages || state.loading}
                onClick={() => updateState({ currentPage: Math.min(state.currentPage + 1, state.totalPages) })}
                className={`text-sm font-medium px-4 py-2 rounded-md bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white ${theme === 'dark' ? 'shadow-lg shadow-[#a259ff]/20' : 'shadow-md'}`}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProctorStudents;