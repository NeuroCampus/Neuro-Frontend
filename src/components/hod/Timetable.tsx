import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { DownloadIcon, EditIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../ui/use-toast";
import { getSemesters, manageSections, manageSubjects, manageFaculties, manageTimetable, manageProfile, manageFacultyAssignments,getBranches, getHODTimetableBootstrap, getHODTimetableSemesterData } from "../../utils/hod_api";

// Interfaces
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

interface Faculty {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

interface TimetableEntry {
  id: string;
  faculty_assignment: {
    id: string;
    faculty: string;
    subject: string;
    semester: number;
    section: string;
  };
  day: string;
  start_time: string;
  end_time: string;
  room: string;
}

interface ClassDetails {
  subject: string;
  professor: string;
  room: string;
  start_time: string;
  end_time: string;
  day: string;
  timetable_id?: string;
  assignment_id?: string;
}

// Edit Modal Component
const EditModal = ({ classDetails, onSave, onCancel, subjects, faculties, facultyAssignments, semesterId, sectionId, branchId }: any) => {
  const [newClassDetails, setNewClassDetails] = useState({
    subject: classDetails.subject || "",
    professor: classDetails.professor || "",
    room: classDetails.room || "",
    start_time: classDetails.start_time || "",
    end_time: classDetails.end_time || "",
  });
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  useEffect(() => {
    const fetchFacultyAssignment = async () => {
      if (!newClassDetails.subject || !semesterId || !sectionId) {
        setNewClassDetails((prev) => ({ ...prev, professor: "" }));
        return;
      }

      setIsLoadingAssignments(true);
      try {
        const subject = subjects.find((s: Subject) => s.name === newClassDetails.subject);
        if (!subject) {
          setNewClassDetails((prev) => ({ ...prev, professor: "" }));
          return;
        }

        // Use faculty assignments from props instead of API call
        const assignment = facultyAssignments.find(
          (a: any) => a.subject_id === subject.id && a.semester_id === semesterId && a.section_id === sectionId
        );
        
        if (assignment) {
          setNewClassDetails((prev) => ({
            ...prev,
            professor: assignment.faculty_name,
          }));
        } else {
          setNewClassDetails((prev) => ({ ...prev, professor: "" }));
        }
      } catch (err) {
        console.error("Error finding faculty assignment:", err);
        setNewClassDetails((prev) => ({ ...prev, professor: "" }));
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    fetchFacultyAssignment();
  }, [newClassDetails.subject, semesterId, sectionId, subjects, facultyAssignments]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClassDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewClassDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-[#1c1c1e] bg-opacity-50 text-gray-200">
      <div className="bg-[#1c1c1e] p-6 rounded-md shadow-lg text-gray-200 border-2 border-gray-500">
        <h2 className="text-xl font-semibold mb-4">
          {classDetails.timetable_id ? "Edit Class" : "Add Class"} for {classDetails.day}
        </h2>

        <div className="mb-4">
          <label className="block">Subject:</label>
          <Select value={newClassDetails.subject} onValueChange={(value) => handleSelectChange("subject", value)}>
            <SelectTrigger className="w-full p-2 border rounded text-gray-900">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent className=" bg-[#232326] text-gray-200">
              {subjects.map((subject: Subject) => (
                <SelectItem className=" bg-[#232326] text-gray-200" key={subject.id} value={subject.name}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4">
          <label className="block">Professor:</label>
          <Select
            value={newClassDetails.professor}
            onValueChange={(value) => handleSelectChange("professor", value)}
            disabled={isLoadingAssignments}
          >
            <SelectTrigger className="w-full p-2 border rounded text-gray-900">
              <SelectValue placeholder={isLoadingAssignments ? "Loading..." : "Select Professor"} />
            </SelectTrigger>
            <SelectContent className=" bg-[#232326] text-gray-200">
              {faculties.map((faculty: Faculty) => (
                <SelectItem className=" bg-[#232326] text-gray-200" key={faculty.id} value={`${faculty.first_name} ${faculty.last_name}`}>
                  {faculty.first_name} {faculty.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4">
          <label className="block">Room:</label>
          <input
            type="text"
            name="room"
            value={newClassDetails.room}
            onChange={handleChange}
            className="w-full p-2 border rounded text-gray-900 placeholder-gray-900"
            placeholder="e.g., R103"
          />
        </div>

        <div className="mb-4 text-gray-900">
          <label className="block text-gray-200">Start Time (HH:MM):</label>
          <input
            type="text"
            name="start_time"
            value={newClassDetails.start_time}
            readOnly
            className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
            placeholder="e.g., 11:00"
          />
        </div>

        <div className="mb-4 text-gray-900">
          <label className="block text-gray-200">End Time (HH:MM):</label>
          <input
            type="text"
            name="end_time"
            value={newClassDetails.end_time}
            readOnly
            className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
            placeholder="e.g., 12:00"
          />
        </div>


        <div className="flex justify-end space-x-4 ">
          <Button variant="outline" className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500" onClick={onCancel}>Cancel</Button>
          <Button
            variant="outline"
            onClick={() => {
              onSave(newClassDetails);
            }}
            className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main Timetable Component
const Timetable = () => {
  const { toast } = useToast();
  const [state, setState] = useState({
    branchId: "",
    branches: [] as { id: string; name: string }[],   // ✅ add this
    semesterId: "",
    sectionId: "",
    isEditing: false,
    selectedClass: null as ClassDetails | null,
    semesters: [] as Semester[],
    sections: [] as Section[],
    subjects: [] as Subject[],
    faculties: [] as Faculty[],
    facultyAssignments: [] as Array<{
      id: string;
      faculty: string;
      faculty_id: string;
      faculty_name: string;
      subject: string;
      subject_id: string;
      section: string;
      section_id: string;
      semester: number;
      semester_id: string;
    }>,
    timetable: [] as TimetableEntry[],
    loading: true,
    error: null as string | null,
  });

  const updateState = (newState: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  // Predefined time slots for the grid (9:00 AM to 5:00 PM)
  const timeSlots = [
    { start: "09:00", end: "10:00" },
    { start: "10:00", end: "11:00" },
    { start: "11:00", end: "12:00" },
    { start: "12:00", end: "13:00" },
    { start: "13:00", end: "14:00" },
    { start: "14:00", end: "15:00" },
    { start: "15:00", end: "16:00" },
    { start: "16:00", end: "17:00" },
  ];
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Fetch sections, subjects, and faculty assignments for semester in one call
  const fetchSemesterData = async (semesterId: string) => {
    if (!state.branchId || !semesterId) {
      updateState({ sections: [], subjects: [] });
      return;
    }
    
    try {
      const semesterData = await getHODTimetableSemesterData(semesterId);
      
      if (semesterData.success && semesterData.data) {
        const mappedSections = semesterData.data.sections.map((s: any) => ({
          id: s.id,
          name: s.name,
          semester_id: s.semester_id?.toString() || "",
        }));
        
        const mappedSubjects = semesterData.data.subjects.map((s: any) => ({
          id: s.id,
          name: s.name,
          subject_code: s.subject_code || "",
          semester_id: s.semester_id?.toString() || "",
        }));
        
        updateState({ 
          sections: mappedSections,
          subjects: mappedSubjects,
          facultyAssignments: semesterData.data.faculty_assignments || [],
        });
      } else {
        updateState({ sections: [], subjects: [] });
      }
    } catch (err) {
      console.error("Error fetching semester data:", err);
      updateState({ sections: [], subjects: [] });
    }
  };

  // Fetch branch ID and initial data via bootstrap
  useEffect(() => {
    const fetchProfileAndSemesters = async () => {
      updateState({ loading: true });
      try {
        const boot = await getHODTimetableBootstrap();
        if (!boot.success || !boot.data?.profile?.branch_id) {
          throw new Error(boot.message || "Failed to bootstrap timetable");
        }
        updateState({
          branchId: boot.data.profile.branch_id,
          branches: boot.data.branches || [],
          semesters: boot.data.semesters || [],
          sections: [], // Start with empty sections - will be fetched when semester is selected
          subjects: [], // Start with empty subjects - will be fetched when semester is selected
          faculties: boot.data.faculties || [],
          facultyAssignments: [], // Start with empty assignments - will be fetched when semester is selected
        });
      } catch (err: any) {
        updateState({ error: err.message || "Network error" });
        toast({ variant: "destructive", title: "Error", description: err.message });
      } finally {
        updateState({ loading: false });
      }
    };
    fetchProfileAndSemesters();
  }, [toast]);

  // Fetch sections and subjects when semester changes
  useEffect(() => {
    if (state.semesterId && state.branchId) {
      fetchSemesterData(state.semesterId);
    } else {
      updateState({ sections: [], subjects: [] });
    }
  }, [state.semesterId, state.branchId]);

  // Fetch sections, subjects, faculties, and timetable when semesterId or sectionId changes
  useEffect(() => {
    const fetchData = async () => {
      if (!state.branchId) return;
      updateState({ loading: true });
      try {
        // Fetch timetable only if both semesterId and sectionId are set
        if (state.semesterId && state.sectionId) {
          const timetableResponse = await manageTimetable({
            action: "GET" as "GET",
            branch_id: state.branchId,
            semester_id: state.semesterId,
            section_id: state.sectionId,
          });
          if (timetableResponse.success && timetableResponse.data) {
            const normalizedTimetable = Array.isArray(timetableResponse.data)
              ? timetableResponse.data.map((entry: any) => ({
                  id: entry.id,
                  faculty_assignment: {
                    id: entry.faculty_assignment.id,
                    faculty: entry.faculty_assignment.faculty,
                    subject: entry.faculty_assignment.subject,
                    semester: entry.faculty_assignment.semester,
                    section: entry.faculty_assignment.section,
                  },
                  day: entry.day.toUpperCase(),
                  start_time: entry.start_time,
                  end_time: entry.end_time,
                  room: entry.room,
                }))
              : [];
            updateState({ timetable: normalizedTimetable });
            console.log("Fetched timetable:", normalizedTimetable);
          } else {
            updateState({ timetable: [] });
            console.log("No timetable data received:", timetableResponse);
          }
        } else {
          updateState({ timetable: [] });
        }
      } catch (err: any) {
        updateState({ error: err.message || "Network error" });
        toast({ variant: "destructive", title: "Error", description: err.message });
      } finally {
        updateState({ loading: false });
      }
    };
    fetchData();
  }, [state.branchId, state.semesterId, state.sectionId, toast]);

  // Generate table data for the grid
  const getTableData = () => {
    const timetable = Array.isArray(state.timetable) ? state.timetable : [];
    const tableData = timeSlots.map(({ start, end }) => {
      const row: any = { time: `${start}-${end}` };
      days.forEach((day) => {
        const entry = timetable.find(
          (e) => e.start_time === start && e.end_time === end && e.day === day
        );
        row[day.toLowerCase()] = entry
          ? `${entry.faculty_assignment.subject}\n${entry.faculty_assignment.faculty}\n${entry.room}`
          : "";
      });
      return row;
    });
    console.log("Table data:", tableData);
    return tableData;
  };

  const handleEdit = () => {
    if (!state.semesterId || !state.sectionId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a semester and section to edit" });
      return;
    }
    updateState({ isEditing: !state.isEditing });
  };

  const handleClassClick = (time: string, day: string) => {
    if (!state.isEditing) return;
    const [start_time, end_time] = time.split("-");
    const entry = state.timetable.find(
      (e) => e.start_time === start_time && e.end_time === end_time && e.day === day.toUpperCase()
    );
    if (entry) {
      updateState({
        selectedClass: {
          subject: entry.faculty_assignment.subject,
          professor: entry.faculty_assignment.faculty,
          room: entry.room,
          start_time: entry.start_time,
          end_time: entry.end_time,
          day: entry.day,
          timetable_id: entry.id,
          assignment_id: entry.faculty_assignment.id,
        },
      });
    } else {
      updateState({
        selectedClass: {
          subject: "",
          professor: "",
          room: "",
          start_time,
          end_time,
          day: day.toUpperCase(),
        },
      });
    }
  };

  const handleSaveClass = async (newClassDetails: any) => {
    try {
      if (!state.semesterId || !state.sectionId) {
        throw new Error("Semester and section must be selected");
      }

      const subject = state.subjects.find((s) => s.name === newClassDetails.subject);
      const faculty = state.faculties.find(
        (f) => `${f.first_name} ${f.last_name}` === newClassDetails.professor
      );
      if (!subject || !faculty) {
        throw new Error("Invalid subject or faculty");
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(newClassDetails.start_time) || !timeRegex.test(newClassDetails.end_time)) {
        throw new Error("Invalid time format (use HH:MM)");
      }

      // Fetch or create faculty assignment
      let assignmentId: string | undefined;
      const assignmentResponse = await manageFacultyAssignments({
        action: "GET",
        branch_id: state.branchId,
        semester_id: state.semesterId,
        section_id: state.sectionId,
      });
      if (assignmentResponse.success && assignmentResponse.data?.assignments) {
        const selectedAssignment = assignmentResponse.data.assignments.find(
          (a: any) => a.faculty_id === faculty.id && a.subject_id === subject.id && a.semester_id === state.semesterId && a.section_id === state.sectionId
        );
        assignmentId = selectedAssignment?.id;
      }

      if (!assignmentId) {
        const createAssignmentResponse = await manageFacultyAssignments({
          action: "create",
          branch_id: state.branchId,
          semester_id: state.semesterId,
          section_id: state.sectionId,
          faculty_id: faculty.id,
          subject_id: subject.id,
        });
        if (createAssignmentResponse.success && createAssignmentResponse.data?.assignment_id) {
          assignmentId = createAssignmentResponse.data.assignment_id;
        } else if (createAssignmentResponse.message === "Assignment already exists") {
          const retryAssignmentResponse = await manageFacultyAssignments({
            action: "GET" as const,
            branch_id: state.branchId,
            semester_id: state.semesterId,
            section_id: state.sectionId,
          });
          if (retryAssignmentResponse.success && retryAssignmentResponse.data?.assignments) {
            const selectedAssignment = retryAssignmentResponse.data.assignments.find(
              (a: any) => a.faculty_id === faculty.id && a.subject_id === subject.id && a.semester_id === state.semesterId && a.section_id === state.sectionId
            );
            assignmentId = selectedAssignment?.id;
          }
          if (!assignmentId) {
            throw new Error("Failed to find or create faculty assignment");
          }
        } else {
          throw new Error(createAssignmentResponse.message || "Failed to create faculty assignment");
        }
      }

      const timetableRequest = {
        action: state.selectedClass?.timetable_id ? "update" as const : "create" as const,
        timetable_id: state.selectedClass?.timetable_id,
        assignment_id: assignmentId,
        day: state.selectedClass!.day,
        start_time: newClassDetails.start_time,
        end_time: newClassDetails.end_time,
        room: newClassDetails.room,
        branch_id: state.branchId,
        semester_id: state.semesterId,
        section_id: state.sectionId,
      };

      const response = await manageTimetable(timetableRequest);
      if (response.success) {
        // Re-fetch timetable to ensure consistency
        const fetchTimetableResponse = await manageTimetable({
          action: "GET" as "GET",
          branch_id: state.branchId,
          semester_id: state.semesterId,
          section_id: state.sectionId,
        });
        if (fetchTimetableResponse.success && fetchTimetableResponse.data) {
          const normalizedTimetable = Array.isArray(fetchTimetableResponse.data)
            ? fetchTimetableResponse.data.map((entry: any) => ({
                id: entry.id,
                faculty_assignment: {
                  id: entry.faculty_assignment.id,
                  faculty: entry.faculty_assignment.faculty,
                  subject: entry.faculty_assignment.subject,
                  semester: entry.faculty_assignment.semester,
                  section: entry.faculty_assignment.section,
                },
                day: entry.day.toUpperCase(),
                start_time: entry.start_time,
                end_time: entry.end_time,
                room: entry.room,
              }))
            : [];
          updateState({
            timetable: normalizedTimetable,
            selectedClass: null,
          });
          console.log("Updated timetable:", normalizedTimetable);
          toast({ title: "Success", description: "Timetable updated successfully" });
        } else {
          throw new Error("Failed to fetch updated timetable");
        }
      } else {
        throw new Error(response.message || "Failed to save timetable");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    }
  };

  const handleCancelEdit = () => {
    updateState({ selectedClass: null });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);

    const branchName =
      state.branches.find((b) => b.id === state.branchId)?.name || "Branch";
    const semesterNumber =
      state.semesters.find((s) => s.id === state.semesterId)?.number || "Semester";
    const sectionName =
      state.sections.find((s) => s.id === state.sectionId)?.name || "Section";

    const title =
      state.semesterId && state.sectionId && state.branchId
        ? `${branchName} - ${semesterNumber} Semester - Section ${sectionName} Timetable`
        : "Timetable";

    doc.text(title, 10, 15);

    const headers = ["Time/Day", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const tableData = getTableData();

    autoTable(doc, {
      head: [headers],
      body: tableData.map((row) => [
        row.time,
        row.mon || "",
        row.tue || "",
        row.wed || "",
        row.thu || "",
        row.fri || "",
        row.sat || "",
      ]),
      startY: 25,
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
      },
    });

    // ✅ Save as (branch-semester-section).pdf
    const safeBranch = branchName.replace(/\s+/g, "_");
    doc.save(`${safeBranch}-${semesterNumber}-${sectionName}.pdf`);
  };



  if (state.loading) {
    return <div className="text-center py-6">Loading...</div>;
  }

  if (state.error) {
    return <div className="text-center py-6 text-red-500">{state.error}</div>;
  }

  return (
    <div className="p-6 ">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between bg-[#1c1c1e] px-4 py-3 rounded-t-md">
          <CardTitle className="text-2xl font-semibold text-gray-200">Timetable</CardTitle>
          <div className="flex space-x-2 ">
            <Button
              variant="outline"
              className="flex items-center gap-2 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
              onClick={handleExportPDF}
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Export PDF</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
              onClick={handleEdit}
            >
              <EditIcon className="w-4 h-4" /> {state.isEditing ? "Save Edit" : "Edit"}
            </Button>

          </div>
        </CardHeader>

        <CardContent className="bg-[#1c1c1e]">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4 ">
              <div className="flex gap-4 ">
                <div>
                  <Select
                    value={state.semesterId}
                    onValueChange={(value) =>
                      updateState({ semesterId: value, sectionId: "", sections: [], subjects: [], timetable: [] })
                    }
                  >
                    <SelectTrigger className="w-40  bg-[#232326] text-gray-200">
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#232326] text-gray-200">
                      {state.semesters.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id}>
                          {semester.number} Semester
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={state.sectionId}
                    onValueChange={(value) => updateState({ sectionId: value, timetable: [] })}
                    disabled={!state.semesterId}
                  >
                    <SelectTrigger className="w-40  bg-[#232326] text-gray-200">
                      <SelectValue placeholder="Select Section" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#232326] text-gray-200">
                      {state.sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          Section {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-sm text-gray-200">
                {state.semesterId && state.sectionId
                  ? `${state.semesters.find((s) => s.id === state.semesterId)?.number} Semester - Section ${
                      state.sections.find((s) => s.id === state.sectionId)?.name
                    }`
                  : "Select Semester and Section"}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className=" text-gray-200">
                  <tr>
                    <th className="py-2 px-4 font-semibold">Time/Day</th>
                    <th className="py-2 px-4 font-semibold">Monday</th>
                    <th className="py-2 px-4 font-semibold">Tuesday</th>
                    <th className="py-2 px-4 font-semibold">Wednesday</th>
                    <th className="py-2 px-4 font-semibold">Thursday</th>
                    <th className="py-2 px-4 font-semibold">Friday</th>
                    <th className="py-2 px-4 font-semibold">Saturday</th>
                  </tr>
                </thead>
                <tbody>
                  {getTableData().map((row: any, idx: number) => (
                    <tr key={idx} className="border-t hover:bg-gray-700 transition text-gray-200">
                      <td className="py-3 px-4 font-medium text-gray-200">{row.time}</td>
                      {["mon", "tue", "wed", "thu", "fri", "sat"].map((day, i) => (
                        <td
                          key={i}
                          className="py-3 px-4 whitespace-pre-line text-gray-200 cursor-pointer"
                          onClick={() => handleClassClick(row.time, day.toUpperCase())}
                        >
                          {row[day] ? (
                            <>
                              <span className="font-semibold">{row[day].split("\n")[0]}</span>
                              <br />
                              {row[day].split("\n")[1]}
                              <br />
                              {row[day].split("\n")[2]}
                            </>
                          ) : (
                            state.isEditing && <span className="text-gray-300">Click to add</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {state.isEditing && state.selectedClass && (
        <EditModal
          classDetails={state.selectedClass}
          onSave={handleSaveClass}
          onCancel={handleCancelEdit}
          subjects={state.subjects}
          faculties={state.faculties}
          facultyAssignments={state.facultyAssignments}
          semesterId={state.semesterId}
          sectionId={state.sectionId}
          branchId={state.branchId}
        />
      )}
    </div>
  );
};

export default Timetable;