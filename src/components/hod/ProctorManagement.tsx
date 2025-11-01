import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileDown,Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/components/ui/use-toast";
import { getProctors, manageStudents, assignProctorsBulk, getSemesters, manageSections, manageProfile, getProctorBootstrap } from "../../utils/hod_api";
import { useTheme } from "../../context/ThemeContext";

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
    sections: [] as Section[],
    search: "",
    currentPage: 1,
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

  // Fetch all data using combined endpoint
  useEffect(() => {
    const fetchData = async () => {
      updateState({ loading: true, error: null });
      try {
        const response = await getProctorBootstrap();
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch data");
        }

        const data = response.data;

        // Set branch ID and name from profile
        updateState({
          branchId: data.profile.branch_id,
          branchName: data.profile.branch,
        });

        // Process students data
        const students = data.students.map((s) => ({
          usn: s.usn,
          name: s.name,
          semester: s.semester ? `${s.semester}th Semester` : "N/A",
          branch: data.profile.branch,
          section: s.section || "N/A",
          proctor: s.proctor,
        }));

        // Process proctors data
        const proctors = data.proctors.map((f) => ({
          id: f.id,
          name: f.name,
        }));

        // Set all data at once
        updateState({
          students,
          proctors,
          semesters: data.semesters,
          sections: data.sections,
          filters: {
            semester_id: "all",
            section_id: "all",
          },
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
    fetchData();
  }, [toast]);

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

  const filteredStudents = state.students.filter((student) => {
    const matchesSearch =
      state.search === "" ||
      student.name.toLowerCase().includes(state.search.toLowerCase()) ||
      student.usn.toLowerCase().includes(state.search.toLowerCase());

    const studentSemesterId = state.semesters.find((sem) => sem.number === parseInt(student.semester))?.id || "";
    const matchesSemester = state.filters.semester_id === "all" || studentSemesterId === state.filters.semester_id;
    const matchesSection = state.filters.section_id === "all" || student.section === state.sections.find((s) => s.id === state.filters.section_id)?.name;
    return matchesSearch && matchesSemester && matchesSection;
  });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const currentStudents = filteredStudents.slice(
    (state.currentPage - 1) * studentsPerPage,
    state.currentPage * studentsPerPage
  );
  const total = filteredStudents.length;
  const assigned = filteredStudents.filter((s) => s.proctor).length;
  const unassigned = total - assigned;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Student Proctor Assignment - ${state.branchName.toUpperCase()}`, 14, 16);
    const tableColumn = ["USN", "Name", "Semester", "Section", "Proctor"];
    const tableRows = filteredStudents.map((student) => [
      student.usn,
      student.name,
      student.semester,
      student.section,
      student.proctor || "Not assigned",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
    });

    doc.save(`proctor-assignment-${state.branchName}.pdf`);
  };

  if (state.loading && !state.students.length) {
    return <div className={`text-center py-6 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Loading...</div>;
  }

  if (state.error) {
    return <div className={`text-center py-6 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{state.error}</div>;
  }

  return (
    <div className={`min-h-screen p-6 space-y-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <div className="grid grid-cols-3 gap-4 ">
        <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}><CardHeader><CardTitle>Total Students</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{total}</CardContent></Card>
        <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}><CardHeader><CardTitle className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>Assigned</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{assigned}</CardContent></Card>
        <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}><CardHeader><CardTitle className={theme === 'dark' ? 'text-red-400' : 'text-red-600'}>Unassigned</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{unassigned}</CardContent></Card>
      </div>

      <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
        <CardHeader><CardTitle>Student-Proctor Management</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <Input
            placeholder="Search by name or USN"
            className={theme === 'dark' ? 'w-64 bg-background text-foreground border-border' : 'w-64 bg-white text-gray-900 border-gray-300'}
            value={state.search}
            onChange={(e) => updateState({ search: e.target.value })}
            disabled={state.loading}
          />
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
          <Button
            onClick={() => updateState({ editMode: true })}
            className={`min-w-fit text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] ${theme === 'dark' ? 'shadow-lg shadow-[#a259ff]/20' : 'shadow-md'}`}
            disabled={state.loading || state.editMode} // disable when already editing
          >
            Edit Proctors
          </Button>

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


          <Button
            variant="outline"
            className={`min-w-fit text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-200 ease-in-out transform hover:scale-105 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white ${theme === 'dark' ? 'shadow-lg shadow-[#a259ff]/20' : 'shadow-md'}`}
            onClick={handleExportPDF}
            disabled={state.loading || filteredStudents.length === 0}
          >
            <FileDown size={16} />
            Export to PDF
          </Button>
        </CardContent>
      </Card>

      <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
        <CardHeader>
          <CardTitle>Proctor Assignment - {state.branchName.toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent>
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
              Showing {Math.min((state.currentPage - 1) * studentsPerPage + 1, total)} to{" "}
              {Math.min(state.currentPage * studentsPerPage, total)} of {total}
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
                disabled={state.currentPage === totalPages || state.loading}
                onClick={() => updateState({ currentPage: Math.min(state.currentPage + 1, totalPages) })}
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