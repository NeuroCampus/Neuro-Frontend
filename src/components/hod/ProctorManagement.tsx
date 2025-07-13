import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/components/ui/use-toast";
import { getProctors, manageStudents, assignProctorsBulk, getSemesters, manageSections, manageProfile } from "../../utils/hod_api";

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
  });

  const studentsPerPage = 10;

  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  // Fetch branch ID from HOD profile
  useEffect(() => {
    const fetchProfile = async () => {
      updateState({ loading: true, error: null });
      try {
        const profileResponse = await manageProfile({}, "GET");
        if (!profileResponse.success || !profileResponse.data?.branch_id) {
          throw new Error(profileResponse.message || "Failed to fetch HOD profile");
        }
        updateState({
          branchId: profileResponse.data.branch_id,
          branchName: profileResponse.data.branch || "Computer Science",
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
    fetchProfile();
  }, [toast]);

  // Fetch students, proctors, semesters, and sections
  useEffect(() => {
    const fetchData = async () => {
      if (!state.branchId) return;
      updateState({ loading: true, error: null });
      try {
        const studentsResponse = await manageStudents({ branch_id: state.branchId }, "GET");
        if (!studentsResponse.success) {
          throw new Error(studentsResponse.message || "Failed to fetch students");
        }
        const students = studentsResponse.data?.map((s) => ({
          usn: s.usn,
          name: s.name,
          semester: s.semester,
          branch: state.branchName,
          section: s.section,
          proctor: s.proctor,
        })) || [];

        const proctorsResponse = await getProctors(state.branchId);
        if (!proctorsResponse.success) {
          throw new Error(proctorsResponse.message || "Failed to fetch proctors");
        }
        const proctors = proctorsResponse.data?.map((f) => ({
          id: f.id,
          name: `${f.first_name} ${f.last_name}`,
        })) || [];

        const semestersResponse = await getSemesters(state.branchId);
        if (!semestersResponse.success) {
          throw new Error(semestersResponse.message || "Failed to fetch semesters");
        }
        const semesters = semestersResponse.data || [];

        const sectionsResponse = await manageSections({ branch_id: state.branchId }, "GET");
        if (!sectionsResponse.success) {
          throw new Error(sectionsResponse.message || "Failed to fetch sections");
        }
        const sections = sectionsResponse.data || [];

        updateState({
          students,
          proctors,
          semesters,
          sections,
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
  }, [state.branchId, state.branchName]);

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
    return <div className="text-center py-6">Loading...</div>;
  }

  if (state.error) {
    return <div className="text-center py-6 text-red-500">{state.error}</div>;
  }

  return (
    <div className="bg-white text-black min-h-screen p-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>Total Students</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{total}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-green-600">Assigned</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-600">{assigned}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-red-600">Unassigned</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-red-600">{unassigned}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Student-Proctor Management</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <Input
            placeholder="Search by name or USN"
            className="w-64 bg-gray-100 text-gray-700"
            value={state.search}
            onChange={(e) => updateState({ search: e.target.value })}
            disabled={state.loading}
          />
          <div className="flex-1" />
          {state.editMode && (
            <Select onValueChange={(value) => updateState({ selectedProctor: value })} disabled={state.proctors.length === 0}>
              <SelectTrigger className="w-64 bg-gray-100 text-gray-700">
                <SelectValue placeholder={state.proctors.length === 0 ? "No proctors available" : "Select Proctor"} />
              </SelectTrigger>
              <SelectContent>
                {state.proctors.map((proctor) => (
                  <SelectItem key={proctor.id} value={proctor.id}>{proctor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={handleEditToggle}
            className="min-w-fit border border-gray-300 text-sm font-medium px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
            disabled={state.loading}
          >
            {state.editMode ? "Save Changes" : "Edit Proctors"}
          </Button>
          <Button
            variant="outline"
            className="min-w-fit border border-gray-300 text-sm font-medium px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-2"
            onClick={handleExportPDF}
            disabled={state.loading || filteredStudents.length === 0}
          >
            <FileDown size={16} />
            Export to PDF
          </Button>
        </CardContent>
      </Card>

      <Card>
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
              <SelectTrigger className="bg-gray-100 text-gray-700">
                <SelectValue placeholder={state.semesters.length === 0 ? "No semesters available" : "All Semesters"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {state.semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
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
              <SelectTrigger className="bg-gray-100 text-gray-700">
                <SelectValue placeholder={state.sections.length === 0 ? "No sections available" : "All Sections"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {state.sections
                  .filter((section) => state.filters.semester_id === "all" || section.semester_id === state.filters.semester_id)
                  .map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      Section {section.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <table className="w-full mt-4 text-left text-sm border border-gray-200">
            <thead className="bg-gray-100 text-gray-600">
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
                  <td colSpan={state.editMode ? 6 : 5} className="text-center py-4">No students found</td>
                </tr>
              ) : (
                currentStudents.map((student) => (
                  <tr
                    key={student.usn}
                    className={`border-t ${state.editMode ? "cursor-pointer hover:bg-gray-50" : ""}`}
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
                    <td className="py-2 px-4">{student.usn}</td>
                    <td className="py-2 px-4">{student.name}</td>
                    <td className="py-2 px-4">{student.semester}</td>
                    <td className="py-2 px-4">{student.section}</td>
                    <td className="py-2 px-4">
                      {student.proctor ? (
                        <span className="text-blue-700">{student.proctor}</span>
                      ) : (
                        <span className="text-red-500">Not assigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm">
              Showing {Math.min((state.currentPage - 1) * studentsPerPage + 1, total)} to{" "}
              {Math.min(state.currentPage * studentsPerPage, total)} of {total}
            </div>
            <div className="flex space-x-2 items-center">
              <Button
                variant="outline"
                disabled={state.currentPage === 1 || state.loading}
                onClick={() => updateState({ currentPage: Math.max(state.currentPage - 1, 1) })}
                className="border border-gray-300 text-sm font-medium px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Previous
              </Button>
              <span className="px-4 text-lg font-medium">{state.currentPage}</span>
              <Button
                variant="outline"
                disabled={state.currentPage === totalPages || state.loading}
                onClick={() => updateState({ currentPage: Math.min(state.currentPage + 1, totalPages) })}
                className="border border-gray-300 text-sm font-medium px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
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