import { useRef, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Pencil, Trash2, UploadCloud, Upload } from "lucide-react";
// Removed chart imports; performance chart is no longer shown on this page
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { manageStudents, getSemesters, manageSections, manageProfile, manageBatches, getHODStudentBootstrap } from "../../utils/hod_api";
import { useHODBootstrap } from "../../context/HODBootstrapContext";

const mockChartData = [
  { subject: "CS101", attendance: 85, marks: 78, semester: "4th Semester" },
  { subject: "CS102", attendance: 92, marks: 88, semester: "4th Semester" },
  { subject: "CS103", attendance: 75, marks: 69, semester: "4th Semester" },
];

interface Semester {
  id: string;
  number: number;
}

interface Batch {
  id: number;
  name: string;
  start_year: number;
  end_year: number;
}

interface Student {
  usn: string;
  name: string;
  email: string;
  section: string;
  semester: string;
}

const StudentManagement = () => {
  const [state, setState] = useState({
    students: [] as Student[],
    search: "",
    sectionFilter: "All",
    semesterFilter: "All",
    selectedStudent: null as Student | null,
    confirmDelete: false,
    editDialog: false,
    addStudentModal: false,
    editForm: { name: "", email: "", section: "", semester: "" },
    uploadErrors: [] as string[],
    uploadedCount: 0,
    droppedFileName: null as string | null,
    manualForm: { usn: "", name: "", email: "", section: "", semester: "", batch: "" },
    currentPage: 1,
    selectedSemester: "",
    semesters: [] as Semester[],
    manualSections: [] as Section[],
    listSections: [] as Section[],
    editSections: [] as Section[],
    batches: [] as Batch[],
    branchId: "",
    chartData: mockChartData,
    isLoading: false,
    isEditSectionsLoading: false,
  });

  const bootstrap = useHODBootstrap();
  const [sectionsCache, setSectionsCache] = useState<Record<string, Section[]>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;

  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  // Fetch students
  const fetchStudents = async (branchId: string) => {
    try {
      const studentRes = await manageStudents({ branch_id: branchId }, "GET");
      if (studentRes.success && studentRes.data) {
        const students = studentRes.data.map((s: any) => ({
          usn: s.usn,
          name: s.name,
          email: s.email,
          section: s.section || "Unknown",
          semester: s.semester || "Unknown",
        }));
        updateState({ students });
      } else {
        updateState({ uploadErrors: [...state.uploadErrors, `Students API: ${studentRes.message || "No students found"}`] });
      }
    } catch (err) {
      updateState({ uploadErrors: [...state.uploadErrors, "Failed to fetch students"] });
    }
  };

  // Fetch sections for Add Student Manually
  const fetchManualSections = async (branchId: string, semesterId: string) => {
    try {
      const cacheKey = semesterId || "ALL";
      const cached = sectionsCache[cacheKey];
      if (cached) {
        updateState({
          manualSections: cached,
          manualForm: { ...state.manualForm, section: cached[0]?.name || "" },
        });
        return;
      }
      console.log("Fetching manual sections for branch:", branchId, "semester:", semesterId || "None");
      const sectionRes = await manageSections({
        branch_id: branchId,
        ...(semesterId && { semester_id: semesterId }),
      });
      console.log("Manual section response:", sectionRes);
      if (sectionRes.success && sectionRes.data?.length > 0) {
        const mapped = sectionRes.data.map((s: any) => ({ id: s.id, name: s.name, semester_id: s.semester_id.toString() }));
        setSectionsCache((prev) => ({ ...prev, [cacheKey]: mapped }));
        updateState({ manualSections: mapped, manualForm: { ...state.manualForm, section: mapped[0]?.name || "" } });
      } else {
        updateState({
          manualSections: [],
          manualForm: { ...state.manualForm, section: "" },
          uploadErrors: [...state.uploadErrors, `No sections found for semester ${semesterId || "All"}`],
        });
      }
    } catch (err) {
      console.error("Fetch manual sections error:", err);
      updateState({ uploadErrors: [...state.uploadErrors, "Failed to fetch sections"] });
    }
  };

  // Fetch sections for Student List filter
  const fetchListSections = async (branchId: string, semesterId: string) => {
    try {
      const cacheKey = semesterId || "ALL";
      const cached = sectionsCache[cacheKey];
      if (cached) {
        updateState({ listSections: cached });
        return;
      }
      console.log("Fetching list sections for branch:", branchId, "semester:", semesterId || "None");
      const sectionRes = await manageSections({
        branch_id: branchId,
        ...(semesterId && { semester_id: semesterId }),
      });
      console.log("List section response:", sectionRes);
      if (sectionRes.success && sectionRes.data?.length > 0) {
        const mapped = sectionRes.data.map((s: any) => ({ id: s.id, name: s.name, semester_id: s.semester_id.toString() }));
        setSectionsCache((prev) => ({ ...prev, [cacheKey]: mapped }));
        updateState({ listSections: mapped });
      } else {
        updateState({
          listSections: [],
          sectionFilter: "All",
          uploadErrors: [...state.uploadErrors, `No sections found for semester ${semesterId || "All"}`],
        });
      }
    } catch (err) {
      console.error("Fetch list sections error:", err);
      updateState({ uploadErrors: [...state.uploadErrors, "Failed to fetch sections"] });
    }
  };

  // Fetch sections for Edit Dialog
  const fetchEditSections = async (branchId: string, semesterId: string) => {
    try {
      updateState({ isEditSectionsLoading: true });
      const cacheKey = semesterId || "ALL";
      const cached = sectionsCache[cacheKey];
      if (cached) {
        updateState({
          editSections: cached,
          editForm: { ...state.editForm, section: cached.find((s: any) => s.name === state.editForm.section)?.name || cached[0]?.name || "" },
        });
        return;
      }
      console.log("Fetching edit sections for branch:", branchId, "semester:", semesterId || "None");
      const sectionRes = await manageSections({
        branch_id: branchId,
        ...(semesterId && { semester_id: semesterId }),
      });
      console.log("Edit section response:", sectionRes);
      if (sectionRes.success && sectionRes.data?.length > 0) {
        const mapped = sectionRes.data.map((s: any) => ({ id: s.id, name: s.name, semester_id: s.semester_id.toString() }));
        setSectionsCache((prev) => ({ ...prev, [cacheKey]: mapped }));
        updateState({
          editSections: mapped,
          editForm: { ...state.editForm, section: mapped.find((s: any) => s.name === state.editForm.section)?.name || mapped[0]?.name || "" },
        });
      } else {
        updateState({
          editSections: [],
          editForm: { ...state.editForm, section: "" },
          uploadErrors: [...state.uploadErrors, `No sections found for semester ${semesterId || "All"}`],
        });
      }
    } catch (err) {
      console.error("Fetch edit sections error:", err);
      updateState({ uploadErrors: [...state.uploadErrors, "Failed to fetch sections"] });
    } finally {
      updateState({ isEditSectionsLoading: false });
    }
  };

  // Fetch batches
  const fetchBatches = async () => {
    try {
      const batchRes = await manageBatches();
      if (batchRes.success && batchRes.data) {
        const defaultBatch = batchRes.data[0]?.name || "";
        updateState({ 
          batches: batchRes.data,
          manualForm: { ...state.manualForm, batch: defaultBatch }
        });
      } else {
        updateState({ uploadErrors: [...state.uploadErrors, `Batches API: ${batchRes.message || "No batches found"}`] });
      }
    } catch (err) {
      updateState({ uploadErrors: [...state.uploadErrors, "Failed to fetch batches"] });
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      updateState({ isLoading: true });
      try {
        const boot = await getHODStudentBootstrap();
        if (!boot.success || !boot.data?.profile?.branch_id) {
          throw new Error(boot.message || "Failed to bootstrap student management");
        }
        const branchId = boot.data.profile.branch_id;
        updateState({ branchId });

        // Batches
        if (Array.isArray(boot.data.batches)) {
          const defaultBatch = boot.data.batches[0]?.name || "";
          updateState({ batches: boot.data.batches, manualForm: { ...state.manualForm, batch: defaultBatch } });
        } else {
          await fetchBatches();
        }

        // Semesters
        if (Array.isArray(boot.data.semesters) && boot.data.semesters.length > 0) {
          const semesters = boot.data.semesters.map((s: any) => ({ id: s.id.toString(), number: s.number }));
          const defaultSemester = `${semesters[0].number}th Semester`;
          updateState({ semesters, selectedSemester: defaultSemester, manualForm: { ...state.manualForm, semester: defaultSemester } });
          // Manual sections default
          await fetchManualSections(branchId, semesters[0].id);
        } else {
          updateState({ uploadErrors: [...state.uploadErrors, "No semesters found"] });
        }

        // Students
        if (Array.isArray(boot.data.students)) {
          const students = boot.data.students.map((s: any) => ({ usn: s.usn, name: s.name, email: s.email, section: s.section || "Unknown", semester: s.semester || "Unknown" }));
          updateState({ students });
        } else {
          await fetchStudents(branchId);
        }

        // Performance fetch removed (chart not shown on this page)
      } catch (err) {
        console.error("Error fetching initial data:", err);
        updateState({ uploadErrors: [...state.uploadErrors, "Failed to connect to backend"] });
      } finally {
        updateState({ isLoading: false });
      }
    };
    fetchInitialData();
  }, []);

  // Fetch sections when semester changes in Add Student Manually
  useEffect(() => {
    if (state.branchId && state.manualForm.semester) {
      const semesterId = getSemesterId(state.manualForm.semester);
      fetchManualSections(state.branchId, semesterId);
    } else if (state.branchId) {
      updateState({ manualSections: [], manualForm: { ...state.manualForm, section: "" } });
    }
  }, [state.branchId, state.manualForm.semester]);

  // Fetch sections when semester changes in Student List filter
  useEffect(() => {
    if (state.branchId && state.semesterFilter !== "All") {
      fetchListSections(state.branchId, state.semesterFilter);
    } else if (state.branchId) {
      updateState({ listSections: [], sectionFilter: "All" });
    }
  }, [state.branchId, state.semesterFilter]);

  // Fetch sections when semester changes in Edit Dialog
  useEffect(() => {
    if (state.editDialog && state.branchId && state.editForm.semester) {
      const semesterId = getSemesterId(state.editForm.semester);
      if (semesterId) {
        fetchEditSections(state.branchId, semesterId);
      } else {
        updateState({ editSections: [], editForm: { ...state.editForm, section: "" } });
      }
    }
  }, [state.branchId, state.editForm.semester, state.editDialog]);

  // Map semester and section names to IDs
  const getSemesterId = (semesterName: string) =>
    state.semesters.find((s) => `${s.number}th Semester` === semesterName)?.id || "";

  const getSectionId = (sectionName: string, sections: Section[]) =>
    sections.find((s) => s.name === sectionName)?.id || "";

  const getBatchId = (batchName: string) =>
    state.batches.find((b) => b.name === batchName)?.id?.toString() || "";

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!state.manualForm.semester || !state.manualForm.section || !state.manualForm.batch) {
      updateState({ uploadErrors: ["Please select batch, semester and section before uploading"] });
      return;
    }

    const reader = new FileReader();
    const extension = file.name.split(".").pop()?.toLowerCase();

    reader.onload = async (e) => {
      try {
        const result = e.target?.result;
        if (!result) {
          updateState({ uploadErrors: ["No data in file"] });
          return;
        }

        let data: any[] = [];
        if (extension === "csv") {
          const parsed = Papa.parse(result as string, { header: true, skipEmptyLines: true });
          data = parsed.data;
        } else if (extension === "xls" || extension === "xlsx") {
          const workbook = XLSX.read(result, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(worksheet);
        }

        // Validate and sanitize
        const errors: string[] = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usnRegex = /^[1-4][A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;

        const bulkData = data
          .map((entry, index) => {
            const usn = String(entry.usn || entry.USN || "").trim();
            const name = String(entry.name || entry.Name || "").trim();
            const email = String(entry.email || entry.Email || "").trim();
            const row = index + 2;

            if (!usn || !name || !email) {
              errors.push(`Row ${row}: Missing required fields`);
              return null;
            }
            if (!usnRegex.test(usn)) {
              errors.push(`Row ${row}: Invalid USN "${usn}"`);
              return null;
            }
            if (!emailRegex.test(email)) {
              errors.push(`Row ${row}: Invalid email "${email}"`);
              return null;
            }
            return { usn, name, email };
          })
          .filter(Boolean);

        if (errors.length > 0) {
          updateState({ uploadErrors: errors, uploadedCount: 0 });
          return;
        }

        // Get IDs from state
        const selectedBatchId = getBatchId(state.manualForm.batch);
        const selectedSemesterId = getSemesterId(state.manualForm.semester);
        const selectedSectionId = getSectionId(state.manualForm.section, state.manualSections);

        // 🔑 Call bulk_update
        const res = await manageStudents(
          {
            action: "bulk_update",
            branch_id: state.branchId,
            semester_id: selectedSemesterId,
            section_id: selectedSectionId,
            batch_id: selectedBatchId,
            bulk_data: bulkData,
          },
          "POST"
        );

        if (res.success) {
          updateState({
            uploadedCount: bulkData.length,
            uploadErrors: [],
            droppedFileName: null,
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
          await fetchStudents(state.branchId);
        } else {
          updateState({ uploadErrors: [res.message || "Bulk upload failed"], uploadedCount: 0 });
        }
      } catch (err) {
        console.error("File upload error:", err);
        updateState({ uploadErrors: ["Error processing file"], uploadedCount: 0 });
      }
    };

    if (extension === "csv") {
      reader.readAsText(file);
    } else if (extension === "xls" || extension === "xlsx") {
      reader.readAsBinaryString(file);
    } else {
      updateState({
        uploadErrors: ["Unsupported file type (use CSV, XLS, or XLSX)"],
        uploadedCount: 0,
      });
    }
  };



  // Handle manual student entry
  const handleManualEntry = async () => {
    const { usn, name, email, section, semester, batch } = state.manualForm;

    const newErrors: any = {};

    // Strong USN regex (last 3 digits cannot be 000)
    const usnRegex = /^[1-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/;
    if (!usn) newErrors.usn = "USN is required";
    else if (!usnRegex.test(usn.toUpperCase()))
      newErrors.usn = "Invalid USN (e.g., 1AM22CI064)";

    // Name validation
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!name) newErrors.name = "Name is required";
    else if (!nameRegex.test(name)) newErrors.name = "Name should contain only letters and spaces";

    // Strong email validation
    const emailRegex =
      /^[a-zA-Z0-9]+([._%+-]?[a-zA-Z0-9]+)*@([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[A-Za-z]{2,10}$/;
    const consecutiveDotRegex = /\.{2,}/;
    if (!email) newErrors.email = "Email is required";
    else if (!emailRegex.test(email) || consecutiveDotRegex.test(email))
      newErrors.email = "Invalid email format (e.g., user@example.com)";

    // Section, semester, batch
    if (!section) newErrors.section = "Section is required";
    if (!semester) newErrors.semester = "Semester is required";
    if (!batch) newErrors.batch = "Batch is required";

    // If any validation errors, update state and stop
    if (Object.keys(newErrors).length > 0) {
      updateState({ manualErrors: newErrors, uploadErrors: ["Fix errors before submitting"] });
      return;
    }

    // If all valid, call API
    try {
      const res = await manageStudents(
        {
          action: "create",
          branch_id: state.branchId,
          usn,
          name,
          email,
          semester_id: getSemesterId(semester),
          section_id: getSectionId(section, state.manualSections),
          batch_id: getBatchId(batch),
        },
        "POST"
      );

      if (res.success) {
        await fetchStudents(state.branchId);
        updateState({
          manualForm: {
            usn: "",
            name: "",
            email: "",
            section: state.manualSections[0]?.name || "",
            semester: state.semesters[0]?.number
              ? `${state.semesters[0].number}th Semester`
              : "",
            batch: "",
          },
          manualErrors: {},
          uploadErrors: [],
        });
      } else {
        updateState({ uploadErrors: [res.message || "Error adding student"] });
      }
    } catch (err) {
      console.error("Manual entry error:", err);
      updateState({ uploadErrors: ["Failed to add student"] });
    }
  };


  // Handle edit save
  const handleEditSave = async () => {
    try {
      const res = await manageStudents({
        action: "update",
        branch_id: state.branchId,
        student_id: state.selectedStudent!.usn,
        name: state.editForm.name,
        email: state.editForm.email,
        semester_id: getSemesterId(state.editForm.semester),
        section_id: getSectionId(state.editForm.section, state.editSections),
      }, "POST");

      if (res.success) {
        await fetchStudents(state.branchId);
        updateState({ editDialog: false, uploadErrors: [], editSections: [] });
      } else {
        updateState({ uploadErrors: [res.message || "Error updating student"] });
      }
    } catch (err) {
      console.error("Edit save error:", err);
      updateState({ uploadErrors: ["Failed to update student"] });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      const res = await manageStudents({
        action: "delete",
        branch_id: state.branchId,
        student_id: state.selectedStudent!.usn,
      }, "POST");

      if (res.success) {
        await fetchStudents(state.branchId);
        updateState({ confirmDelete: false, uploadErrors: [] });
      } else {
        updateState({ uploadErrors: [res.message || "Error deleting student"] });
      }
    } catch (err) {
      console.error("Delete error:", err);
      updateState({ uploadErrors: ["Failed to delete student"] });
    }
  };

  // Generate CSV template
  const generateTemplate = () => {
    const headers = ["usn", "name", "email"];
    const rows = [
      ["1AM22CI001", "John Doe", "john.doe@example.com"],
      ["1AM22CI002", "Jane Smith", "jane.smith@example.com"],
      ["1AM22CI003", "Alice Johnson", "alice.johnson@example.com"],
    ];
    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = generateTemplate();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "student_bulk_enroll_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
      updateState({ droppedFileName: file.name });
    }
  };

  // Close upload modal
  const closeModal = () => {
    updateState({
      addStudentModal: false,
      uploadErrors: [],
      droppedFileName: null,
      uploadedCount: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Filter students for table
  const filteredStudents = state.students
    .map((student) => {
      const search = state.search.toLowerCase().trim();

      // Match section & semester (exact filter)
      const matchesSection =
        state.sectionFilter === "All" ||
        student.section === state.listSections.find((s) => s.id === state.sectionFilter)?.name;

      const matchesSemester =
        state.semesterFilter === "All" ||
        student.semester ===
          state.semesters.find((s) => s.id === state.semesterFilter)?.number.toString() + "th Semester";

      if (!matchesSection || !matchesSemester) return null;

      if (!search) return { student, score: 0 }; // No search → neutral score

      const name = student.name.toLowerCase();
      const usn = student.usn.toLowerCase();

      // Relevance scoring:
      let score = 0;
      if (name === search || usn === search) score += 100; // Exact match = highest priority
      else if (name.startsWith(search) || usn.startsWith(search)) score += 80; // Starts with = very strong match
      else if (name.includes(search) || usn.includes(search)) score += 50; // Contains = good match
      else {
        // Fuzzy match (levenshtein-like scoring)
        const distanceName = levenshteinDistance(name, search);
        const distanceUSN = levenshteinDistance(usn, search);
        const minDistance = Math.min(distanceName, distanceUSN);
        if (minDistance <= 2) score += 30; // Allow up to 2 typos
      }

      return score > 0 || !search ? { student, score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score) // Sort by relevance
    .map((entry) => entry!.student);

    function levenshteinDistance(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
        else dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
      }
    }
    return dp[a.length][b.length];
  }


  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (state.currentPage - 1) * itemsPerPage,
    state.currentPage * itemsPerPage
  );

  // Open edit dialog
  const openEdit = (student: Student) => {
    const semesterId = getSemesterId(student.semester);
    updateState({
      selectedStudent: student,
      editForm: {
        name: student.name,
        email: student.email,
        section: student.section,
        semester: student.semester,
      },
      editDialog: true,
      editSections: [],
    });
    if (semesterId && state.branchId) {
      fetchEditSections(state.branchId, semesterId);
    }
  };

  // Chart removed

  return (
    <div className="p-6 space-y-6 bg-[#1c1c1e] min-h-screen text-gray-200">
      <h2 className="text-2xl font-semibold">Student Management</h2>
      {state.isLoading && <p className="text-gray-400">Loading data...</p>}
      {state.uploadErrors.length > 0 && (
        <ul className="text-sm text-red-500 mb-4 list-disc list-inside">
          {state.uploadErrors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )}

      {/* Add Student Manually Form */}
      <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Add Student Manually</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            {/* USN */}
            <div className="flex flex-col flex-1">
              <Input
                placeholder="USN"
                value={state.manualForm.usn}
                maxLength={10}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  let error = "";

                  const usnRegex = /^[1-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/;

                  if (value && !usnRegex.test(value)) {
                    error = "Invalid USN (e.g., 1AM22CI064)";
                  } else if (value.slice(-3) === "000") {
                    error = "Invalid USN (cannot end with 000)";
                  }

                  updateState({
                    manualForm: { ...state.manualForm, usn: value },
                    manualErrors: { ...state.manualErrors, usn: error },
                  });
                }}
                onBlur={(e) => {
                  const value = e.target.value.toUpperCase();
                  let error = "";

                  const usnRegex = /^[1-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/;

                  if (value && !usnRegex.test(value)) {
                    error = "Invalid USN (e.g., 1AM22CI064)";
                  } else if (value.slice(-3) === "000") {
                    error = "Invalid USN (cannot end with 000)";
                  }

                  updateState({
                    manualErrors: { ...state.manualErrors, usn: error },
                  });
                }}
                className={`flex-1 bg-[#232326] text-gray-200 border placeholder-gray-400 focus:ring-0 ${
                  state.manualErrors?.usn
                    ? "border-red-500"
                    : "border-gray-700 focus:border-gray-500"
                }`}
              />
              <span className="text-red-500 text-xs mt-1 h-4">
                {state.manualErrors?.usn}
              </span>
            </div>

            {/* Name Field */}
            <div className="flex flex-col flex-1">
              <Input
                placeholder="Name"
                value={state.manualForm.name}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z\s]/g, "");
                  let error = "";

                  // Live validation: only letters and spaces allowed
                  if (value && !/^[A-Za-z\s]*$/.test(value)) {
                    error = "Name should contain only letters and spaces";
                  }

                  updateState({
                    manualForm: { ...state.manualForm, name: value },
                    manualErrors: { ...state.manualErrors, name: error },
                  });
                }}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  const nameRegex = /^[A-Za-z\s]+$/;
                  let error = "";
                  if (!value) error = "Name is required";
                  else if (!nameRegex.test(value)) error = "Name should contain only letters and spaces";

                  updateState({
                    manualErrors: { ...state.manualErrors, name: error },
                  });
                }}
                className={`flex-1 bg-[#232326] text-gray-200 border placeholder-gray-400 focus:ring-0 ${
                  state.manualErrors?.name
                    ? "border-red-500"
                    : "border-gray-700 focus:border-gray-500"
                }`}
              />
              <span className="text-red-500 text-xs mt-1 h-4">
                {state.manualErrors?.name}
              </span>
            </div>


            {/* Email */}
            <div className="flex flex-col flex-1">
              <Input
                placeholder="Email"
                type="text"
                value={state.manualForm.email}
                onChange={(e) => {
                  let value = e.target.value;

                  // Remove spaces and invalid characters commonly not allowed in email
                  value = value.replace(/[!#$%^&*()_+<>?:"{}]/g, "");

                  // Professional-grade email regex
                  const emailRegex =/^[a-zA-Z0-9]+([._%+-]?[a-zA-Z0-9]+)*@([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[A-Za-z]{2,10}$/;
                  const consecutiveDotRegex = /\.{2,}/;

                  const error =
                    value && (!emailRegex.test(value) || consecutiveDotRegex.test(value))
                      ? "Invalid email format (e.g., user@example.com)"
                      : "";

                  updateState({
                    manualForm: { ...state.manualForm, email: value },
                    manualErrors: { ...state.manualErrors, email: error },
                  });
                }}
                className={`flex-1 bg-[#232326] text-gray-200 border placeholder-gray-400 focus:ring-0 ${
                  state.manualErrors?.email
                    ? "border-red-500"
                    : "border-gray-700 focus:border-gray-500"
                }`}
              />
              <span className="text-red-500 text-xs mt-1 h-4">
                {state.manualErrors?.email}
              </span>
            </div>

            <Select
              value={state.manualForm.semester}
              onValueChange={(value) =>
                updateState({
                  manualForm: { ...state.manualForm, semester: value, section: "" },
                  manualSections: [],
                })
              }
              disabled={state.isLoading || state.semesters.length === 0}
            >
              <SelectTrigger className="flex-1 bg-[#232326] text-gray-200 border border-gray-700 placeholder-gray-400 focus:border-gray-500 focus:ring-0">
                <SelectValue
                  placeholder={state.semesters.length === 0 ? "No semesters available" : "Select Semester"}
                />
              </SelectTrigger>
              <SelectContent className="bg-[#232326] text-gray-200 border border-gray-700">
                {state.semesters.map((s) => (
                  <SelectItem key={s.id} value={`${s.number}th Semester`}>
                    Semester {s.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={state.manualForm.section}
              onValueChange={(value) => updateState({ manualForm: { ...state.manualForm, section: value } })}
              disabled={state.isLoading || !state.manualForm.semester || state.manualSections.length === 0}
            >
              <SelectTrigger className="flex-1 bg-[#232326] text-gray-200 border border-gray-700 placeholder-gray-400 focus:border-gray-500 focus:ring-0">
                <SelectValue
                  placeholder={
                    state.manualSections.length === 0 || !state.manualForm.semester
                      ? "Select semester first"
                      : "Select Section"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-[#232326] text-gray-200 border border-gray-700">
                {state.manualSections
                  .filter((section) => section.semester_id === getSemesterId(state.manualForm.semester))
                  .map((section) => (
                    <SelectItem key={section.id} value={section.name}>
                      Section {section.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={state.manualForm.batch}
              onValueChange={(value) => updateState({ manualForm: { ...state.manualForm, batch: value } })}
              disabled={state.isLoading || state.batches.length === 0}
            >
              <SelectTrigger className="flex-1 bg-[#232326] text-gray-200 border border-gray-700 placeholder-gray-400 focus:border-gray-500 focus:ring-0">
                <SelectValue
                  placeholder={state.batches.length === 0 ? "No batches available" : "Select Batch"}
                />
              </SelectTrigger>
              <SelectContent className="bg-[#232326] text-gray-200 border border-gray-700">
                {state.batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.name}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleManualEntry}
              disabled={state.isLoading || !state.branchId || !state.manualForm.semester || !state.manualForm.section || !state.manualForm.batch}
              className="flex items-center gap-1  text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 px-3 py-1.5 rounded-md transition disabled:opacity-50"
            >
              + Add Student
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-gray-100">Student List</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => updateState({ addStudentModal: true })}
                className="flex items-center gap-1  text-sm font-semibold text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 px-3 py-1.5 rounded-md transition"
                disabled={state.isLoading || !state.branchId}
              >
                <Upload className="w-4 h-4" />
                Bulk Upload
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex justify-between items-center mb-4">
            {/* Left side: Search input */}
            <Input
              placeholder="Search students..."
              className="w-64 bg-[#2c2c2e] text-gray-200 border border-gray-700 placeholder-gray-500"
              value={state.search}
              onChange={(e) =>
                updateState({ search: e.target.value, currentPage: 1 })
              }
            />

            {/* Right side: Dropdowns */}
            <div className="flex gap-4">
              <Select
                value={state.semesterFilter}
                onValueChange={(value) =>
                  updateState({
                    semesterFilter: value,
                    sectionFilter: "All",
                    currentPage: 1,
                    listSections: [],
                  })
                }
                disabled={state.isLoading || state.semesters.length === 0}
              >
                <SelectTrigger className="w-48 bg-[#2c2c2e] text-gray-200 border border-gray-700">
                  <SelectValue
                    placeholder={
                      state.semesters.length === 0
                        ? "No semesters available"
                        : "Select Semester"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-[#2c2c2e] text-gray-200 border border-gray-700">
                  <SelectItem value="All">All Semesters</SelectItem>
                  {state.semesters.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      Semester {s.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={state.sectionFilter}
                onValueChange={(value) =>
                  updateState({ sectionFilter: value, currentPage: 1 })
                }
                disabled={
                  state.isLoading ||
                  state.semesterFilter === "All" ||
                  state.listSections.length === 0
                }
              >
                <SelectTrigger className="w-48 bg-[#2c2c2e] text-gray-200 border border-gray-700">
                  <SelectValue
                    placeholder={
                      state.listSections.length === 0 ||
                      state.semesterFilter === "All"
                        ? "Select semester first"
                        : "Select Section"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-[#2c2c2e] text-gray-200 border border-gray-700">
                  <SelectItem value="All">All Sections</SelectItem>
                  {state.listSections
                    .filter((section) => section.semester_id === state.semesterFilter)
                    .map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        Section {section.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-[#2c2c2e] text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="py-2 px-4">USN</th>
                  <th className="py-2 px-4">Name</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">Section</th>
                  <th className="py-2 px-4">Semester</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginatedStudents.map((student) => (
                  <tr key={student.usn}>
                    <td className="py-2 px-4">{student.usn}</td>
                    <td className="py-2 px-4">{student.name}</td>
                    <td className="py-2 px-4">{student.email}</td>
                    <td className="py-2 px-4">Section {student.section}</td>
                    <td className="py-2 px-4">{student.semester}</td>
                    <td className="py-2 px-4 flex gap-2">
                      <button
                        onClick={() => openEdit(student)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() =>
                          updateState({
                            selectedStudent: student,
                            confirmDelete: true,
                          })
                        }
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredStudents.length === 0 && (
              <p className="text-center text-gray-500 mt-4">No students found</p>
            )}

            <div className="text-sm text-gray-500 mt-4">
              Showing {paginatedStudents.length} out of {filteredStudents.length}{" "}
              students
            </div>
          </div>

          <div className="flex justify-end items-center mt-4">
            <Button
              onClick={() =>
                updateState({ currentPage: Math.max(state.currentPage - 1, 1) })
              }
              disabled={state.currentPage === 1}
              className="w-24 flex items-center justify-center gap-1 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed py-1.5 rounded-md transition"
            >
              Previous
            </Button>
            <div className="w-16 text-center text-sm font-medium text-gray-200 bg-gray-800  border border-gray-500 py-1.5 mx-2 rounded-md">
              {state.currentPage}
            </div>
            <Button
              onClick={() =>
                updateState({
                  currentPage: Math.min(state.currentPage + 1, totalPages),
                })
              }
              disabled={state.currentPage === totalPages}
              className="w-24 flex items-center justify-center gap-1 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed py-1.5 rounded-md transition"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student Performance Comparison chart removed to reduce calls and simplify page */}


      <Dialog open={state.addStudentModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-xl bg-[#1c1c1e] text-gray-200 border border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Upload Student Data</DialogTitle>
          </DialogHeader>

          {/* Semester & Section Select */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Select Batch, Semester, and Section
            </label>
            <div className="flex gap-4">
              {/* Batch Dropdown */}
              <Select
                value={state.manualForm.batch}
                onValueChange={(value) =>
                  updateState({
                    manualForm: {
                      ...state.manualForm,
                      batch: value,
                      semester: "",
                      section: "",
                    },
                    manualSemesters: [], // Clear semesters when batch changes (optional)
                    manualSections: [], // Clear sections when batch changes
                  })
                }
                disabled={state.isLoading || state.batches.length === 0}
              >
                <SelectTrigger className="w-full bg-[#2c2c2e] border border-gray-700 text-gray-200">
                  <SelectValue
                    placeholder={
                      state.batches.length === 0
                        ? "No batches available"
                        : "Select Batch"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-[#2c2c2e] text-gray-200 border border-gray-700">
                  {state.batches.map((batch) => (
                    <SelectItem
                      key={batch.id}
                      value={batch.name}
                      className="hover:bg-gray-700"
                    >
                      Batch {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Semester Dropdown */}
              <Select
                value={state.manualForm.semester}
                onValueChange={(value) =>
                  updateState({
                    manualForm: { ...state.manualForm, semester: value, section: "" },
                    manualSections: [],
                  })
                }
                disabled={
                  state.isLoading ||
                  !state.manualForm.batch || // Disable if no batch selected
                  state.semesters.length === 0
                }
              >
                <SelectTrigger className="w-full bg-[#2c2c2e] border border-gray-700 text-gray-200">
                  <SelectValue
                    placeholder={
                      state.semesters.length === 0
                        ? "No semesters available"
                        : "Select Semester"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-[#2c2c2e] text-gray-200 border border-gray-700">
                  {state.semesters.map((s) => (
                    <SelectItem
                      key={s.id}
                      value={`${s.number}th Semester`}
                      className="hover:bg-gray-700"
                    >
                      Semester {s.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Section Dropdown */}
              <Select
                value={state.manualForm.section}
                onValueChange={(value) =>
                  updateState({ manualForm: { ...state.manualForm, section: value } })
                }
                disabled={
                  state.isLoading ||
                  !state.manualForm.semester ||
                  state.manualSections.length === 0
                }
              >
                <SelectTrigger className="w-full bg-[#2c2c2e] border border-gray-700 text-gray-200">
                  <SelectValue
                    placeholder={
                      state.manualSections.length === 0 || !state.manualForm.semester
                        ? "Select semester first"
                        : "Select Section"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-[#2c2c2e] text-gray-200 border border-gray-700">
                  {state.manualSections
                    .filter(
                      (section) =>
                        section.semester_id ===
                        getSemesterId(state.manualForm.semester)
                    )
                    .map((section) => (
                      <SelectItem
                        key={section.id}
                        value={section.name}
                        className="hover:bg-gray-700"
                      >
                        Section {section.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>


          {/* File Upload Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:bg-[#2c2c2e] transition-colors"
          >
            <UploadCloud size={36} className="mx-auto text-gray-400 mb-3" />
            <p className="font-medium text-gray-200">
              Drag & drop file here or click to select
            </p>
            <p className="text-sm text-gray-400">
              Supports CSV, XLS, XLSX (max 5MB, 500 records)
            </p>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                  updateState({ droppedFileName: file.name });
                }
              }}
              style={{ display: "none" }}
            />
            {state.droppedFileName && (
              <p className="text-sm text-gray-300 mt-2">
                Selected file: <strong>{state.droppedFileName}</strong>
              </p>
            )}
            {state.uploadErrors.length > 0 && (
              <ul className="text-sm text-red-400 mt-2 list-disc list-inside">
                {state.uploadErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
            {state.uploadedCount > 0 && (
              <p className="text-sm text-green-400 mt-2">
                {state.uploadedCount} students successfully added.
              </p>
            )}
          </div>

          {/* Upload Instructions */}
          <div className="mt-6 text-sm text-gray-300">
            <h4 className="font-medium mb-2">Upload Instructions</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the provided template for proper data formatting</li>
              <li>
                Required columns: <strong>usn</strong>, <strong>name</strong>,{" "}
                <strong>email</strong>
              </li>
              <li>USN format: e.g., 1AM22CI001 (10 characters, alphanumeric)</li>
              <li>Semester and Section are selected above, not in the file</li>
              <li>Maximum 500 records per file</li>
              <li>
                <a
                  href="#"
                  className="text-blue-400 underline"
                  onClick={downloadTemplate}
                >
                  Download Template
                </a>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={closeModal}
              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
            >
              Cancel
            </Button>
            <Button className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={state.confirmDelete} onOpenChange={() => updateState({ confirmDelete: false })}>
        <DialogContent className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Delete Student</DialogTitle>
          </DialogHeader>
          <div className="text-gray-300">
            Are you sure you want to delete <strong className="text-white">{state.selectedStudent?.name}</strong>?
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => updateState({ confirmDelete: false })}
              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={state.editDialog} onOpenChange={() => updateState({ editDialog: false, editSections: [] })}>
        <DialogContent className="bg-[#1c1c1e] text-gray-100 border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Edit Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              className="bg-[#2c2c2e] border-gray-700 text-gray-100 placeholder-gray-400"
              placeholder="Name"
              value={state.editForm.name}
              onChange={(e) => updateState({ editForm: { ...state.editForm, name: e.target.value } })}
            />
            <Input
              className="bg-[#2c2c2e] border-gray-700 text-gray-100 placeholder-gray-400"
              placeholder="Email"
              value={state.editForm.email}
              onChange={(e) => updateState({ editForm: { ...state.editForm, email: e.target.value } })}
            />
            <Select
              value={state.editForm.semester}
              onValueChange={(value) =>
                updateState({
                  editForm: { ...state.editForm, semester: value, section: "" },
                  editSections: [],
                })
              }
              disabled={state.isLoading || state.semesters.length === 0}
            >
              <SelectTrigger className="bg-[#2c2c2e] border-gray-700 text-gray-100">
                <SelectValue
                  placeholder={state.semesters.length === 0 ? "No semesters available" : "Select Semester"}
                />
              </SelectTrigger>
              <SelectContent className="bg-[#2c2c2e] text-gray-100 border-gray-700">
                {state.semesters.map((s) => (
                  <SelectItem key={s.id} value={`${s.number}th Semester`} className="hover:bg-gray-700">
                    Semester {s.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={state.editForm.section}
              onValueChange={(value) => updateState({ editForm: { ...state.editForm, section: value } })}
              disabled={
                state.isLoading || state.isEditSectionsLoading || !state.editForm.semester || state.editSections.length === 0
              }
            >
              <SelectTrigger className="bg-[#2c2c2e] border-gray-700 text-gray-100">
                <SelectValue
                  placeholder={
                    state.editSections.length === 0 || !state.editForm.semester
                      ? "Select semester first"
                      : state.isEditSectionsLoading
                      ? "Loading sections..."
                      : "Select Section"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-[#2c2c2e] text-gray-100 border-gray-700">
                {state.editSections
                  .filter((section) => section.semester_id === getSemesterId(state.editForm.semester))
                  .map((section) => (
                    <SelectItem key={section.id} value={section.name} className="hover:bg-gray-700">
                      Section {section.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
              onClick={() => updateState({ editDialog: false, editSections: [] })}
            >
              Cancel
            </Button>
            <Button className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500" onClick={handleEditSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentManagement;