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
import { useTheme } from "../../context/ThemeContext";

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
  id: string;
  name: string;
  start_year: number;
  end_year: number;
}

interface Section {
  id: string;
  name: string;
  semester_id: string;
}

interface Student {
  usn: string;
  name: string;
  email: string;
  section: string;
  semester: string;
}

const StudentManagement = () => {
  const { theme } = useTheme();
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
    manualErrors: {} as Record<string, string>,
    manualSemesters: [] as Semester[],
    totalStudents: 0,
    pageSize: 50,
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
  const fetchStudents = async (branchId: string, page: number = 1, pageSize: number = 50) => {
    try {
      const studentRes = await manageStudents({ 
        branch_id: branchId,
        page: page,
        page_size: pageSize
      }, "GET");
      if (studentRes.success && studentRes.data) {
        // Handle paginated response - check if results exist (regular API) or students (bootstrap)
        const students = studentRes.data.results && Array.isArray(studentRes.data.results) 
          ? studentRes.data.results.map((s: any) => ({
              usn: s.usn,
              name: s.name,
              email: s.email,
              section: s.section || "Unknown",
              semester: s.semester || "Unknown",
            })) 
          : [];
        updateState({ 
          students,
          totalStudents: studentRes.data.count || 0,
          currentPage: page
        });
      } else {
        updateState({ uploadErrors: [...state.uploadErrors, `Students API: ${studentRes.message || "No students found"}`] });
      }
    } catch (err) {
      updateState({ uploadErrors: [...state.uploadErrors, "Failed to fetch students"] });
    }
  };

  // Fetch batches
  const fetchBatches = async () => {
    try {
      const batchRes = await manageBatches();
      if (batchRes.success && batchRes.batches) {
        const defaultBatch = batchRes.batches[0]?.name || "";
        updateState({ 
          batches: batchRes.batches,
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
          const batches = boot.data.batches.map((b: any) => ({ ...b, id: b.id.toString() }));
          const defaultBatch = batches[0]?.name || "";
          updateState({ batches, manualForm: { ...state.manualForm, batch: defaultBatch } });
        } else {
          await fetchBatches();
        }

        // Semesters
        if (Array.isArray(boot.data.semesters) && boot.data.semesters.length > 0) {
          const semesters = boot.data.semesters.map((s: any) => ({ id: s.id.toString(), number: s.number }));
          const defaultSemester = `${semesters[0].number}th Semester`;
          updateState({ semesters, selectedSemester: defaultSemester, manualForm: { ...state.manualForm, semester: defaultSemester } });
          // Manual sections will be populated by useEffect based on semester selection
        } else {
          updateState({ uploadErrors: [...state.uploadErrors, "No semesters found"] });
        }

        // Sections - populate cache with all sections from bootstrap
        if (Array.isArray(boot.data.sections) && boot.data.sections.length > 0) {
          const sectionsBySemester: Record<string, Section[]> = {};
          boot.data.sections.forEach((sec: any) => {
            const semesterId = sec.semester_id || "ALL";
            if (!sectionsBySemester[semesterId]) {
              sectionsBySemester[semesterId] = [];
            }
            sectionsBySemester[semesterId].push({
              id: sec.id,
              name: sec.name,
              semester_id: sec.semester_id || "",
            });
          });
          setSectionsCache(sectionsBySemester);
        }

        // Students
        if (Array.isArray(boot.data?.students)) {
          const students = boot.data.students.map((s: any) => ({ usn: s.usn, name: s.name, email: s.email, section: s.section || "Unknown", semester: s.semester || "Unknown" }));
          updateState({ 
            students,
            totalStudents: boot.count || students.length,
            currentPage: 1, // Bootstrap returns first page
            pageSize: 50 // Default page size
          });
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
      // Use cached sections instead of making API call
      const cacheKey = semesterId || "ALL";
      const cached = sectionsCache[cacheKey];
      if (cached) {
        updateState({
          manualSections: cached,
          manualForm: { ...state.manualForm, section: cached[0]?.name || "" },
        });
      } else {
        updateState({
          manualSections: [],
          manualForm: { ...state.manualForm, section: "" },
        });
      }
    } else if (state.branchId) {
      updateState({ manualSections: [], manualForm: { ...state.manualForm, section: "" } });
    }
  }, [state.branchId, state.manualForm.semester, sectionsCache]);

  // Fetch sections when semester changes in Student List filter
  useEffect(() => {
    if (state.branchId && state.semesterFilter !== "All") {
      // Use cached sections instead of making API call
      const cached = sectionsCache[state.semesterFilter];
      if (cached) {
        updateState({ listSections: cached });
      } else {
        updateState({ listSections: [] });
      }
    } else if (state.branchId) {
      // For "All" semesters, show all sections
      const allSections = Object.values(sectionsCache).flat();
      const uniqueSections = allSections.filter((section, index, self) =>
        index === self.findIndex(s => s.id === section.id)
      );
      updateState({ listSections: uniqueSections });
    }
  }, [state.branchId, state.semesterFilter, sectionsCache]);

  // Fetch sections when semester changes in Edit Dialog
  useEffect(() => {
    if (state.editDialog && state.branchId && state.editForm.semester) {
      const semesterId = getSemesterId(state.editForm.semester);
      if (semesterId) {
        // Use cached sections instead of making API call
        const cacheKey = semesterId || "ALL";
        const cached = sectionsCache[cacheKey];
        if (cached) {
          updateState({
            editSections: cached,
            editForm: { ...state.editForm, section: cached.find((s: any) => s.name === state.editForm.section)?.name || cached[0]?.name || "" },
          });
        } else {
          updateState({
            editSections: [],
            editForm: { ...state.editForm, section: "" },
          });
        }
      } else {
        updateState({ editSections: [], editForm: { ...state.editForm, section: "" } });
      }
    }
  }, [state.branchId, state.editForm.semester, state.editDialog, sectionsCache]);

  // Map semester and section names to IDs
  const getSemesterId = (semesterName: string) =>
    state.semesters.find((s) => `${s.number}th Semester` === semesterName)?.id || "";

  const getSectionId = (sectionName: string, sections: Section[]) =>
    sections.find((s) => s.name === sectionName)?.id || "";

  const getBatchId = (batchName: string) =>
    state.batches.find((b) => b.name === batchName)?.id || "";

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
          updateState({ uploadErrors: ["No data in file"], uploadedCount: 0 });
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
        } else {
          updateState({
            uploadErrors: ["Unsupported file type (use CSV, XLS, or XLSX)"],
            uploadedCount: 0,
          });
          return;
        }

        // Validate and sanitize
        const errors: string[] = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usnRegex = /^[1-4][A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;

        const selectedBatchId = getBatchId(state.manualForm.batch);
        const selectedSemesterId = getSemesterId(state.manualForm.semester);
        const selectedSectionId = getSectionId(state.manualForm.section, state.manualSections);

        const bulkData = data
          .map((entry, index) => {
            const usn = String(entry.usn || entry.USN || "").trim();
            const name = String(entry.name || entry.Name || "").trim();
            const email = String(entry.email || entry.Email || "").trim();
            const parent_name = String(entry.parent_name || entry.ParentName || "").trim() || "";
            const parent_contact = String(entry.parent_contact || entry.ParentContact || "").trim() || "";
            const emergency_contact = String(entry.emergency_contact || entry.EmergencyContact || "").trim() || "";
            const blood_group = String(entry.blood_group || entry.BloodGroup || "").trim() || "";
            const date_of_admission = entry.date_of_admission || entry.DateOfAdmission || new Date().toISOString().split("T")[0];
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

            return {
              usn,
              name,
              email,
              parent_name,
              parent_contact,
              emergency_contact,
              blood_group,
              date_of_admission,
              semester_id: selectedSemesterId,
              section_id: selectedSectionId,
              batch_id: selectedBatchId,
              branch_id: state.branchId
            };
          })
          .filter(Boolean);

        if (errors.length > 0) {
          updateState({ uploadErrors: errors, uploadedCount: 0 });
          return;
        }

        // Send to backend
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

  // Paginate the filtered students
  const paginatedFilteredStudents = filteredStudents.slice(
    (state.currentPage - 1) * itemsPerPage,
    state.currentPage * itemsPerPage
  );

  const totalFilteredPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalFilteredPages) {
      updateState({ currentPage: newPage });
    }
  };

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
    // Sections will be populated by useEffect based on semester
  };

  // Chart removed

  return (
    <div className={`p-6 space-y-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Student Management</h2>
      {state.isLoading && <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>Loading data...</p>}
      {state.uploadErrors.length > 0 && (
        <ul className={`text-sm ${theme === 'dark' ? 'text-destructive' : 'text-red-500'} mb-4 list-disc list-inside`}>
          {state.uploadErrors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )}

      {/* Add Student Manually Form */}
      <Card className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Add Student Manually</CardTitle>
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
                className={`flex-1 ${theme === 'dark' ? 'bg-card text-foreground border-border placeholder:text-muted-foreground' : 'bg-white text-gray-900 border-gray-300 placeholder:text-gray-500'} focus:ring-0 ${
                  state.manualErrors?.usn
                    ? "border-red-500"
                    : theme === 'dark' ? 'border-border focus:border-primary' : 'border-gray-300 focus:border-blue-500'
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
                className={`flex-1 ${theme === 'dark' ? 'bg-card text-foreground border-border placeholder:text-muted-foreground' : 'bg-white text-gray-900 border-gray-300 placeholder:text-gray-500'} focus:ring-0 ${
                  state.manualErrors?.name
                    ? "border-red-500"
                    : theme === 'dark' ? 'border-border focus:border-primary' : 'border-gray-300 focus:border-blue-500'
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
                className={`flex-1 ${theme === 'dark' ? 'bg-card text-foreground border-border placeholder:text-muted-foreground' : 'bg-white text-gray-900 border-gray-300 placeholder:text-gray-500'} focus:ring-0 ${
                  state.manualErrors?.email
                    ? "border-red-500"
                    : theme === 'dark' ? 'border-border focus:border-primary' : 'border-gray-300 focus:border-blue-500'
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
              <SelectTrigger className={`flex-1 ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'} placeholder:text-muted-foreground focus:ring-0`}>
                <SelectValue
                  placeholder={state.semesters.length === 0 ? "No semesters available" : "Select Semester"}
                />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                {state.semesters.map((s) => (
                  <SelectItem key={s.id} value={`${s.number}th Semester`} className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
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
              <SelectTrigger className={`flex-1 ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'} placeholder:text-muted-foreground focus:ring-0`}>
                <SelectValue
                  placeholder={
                    state.manualSections.length === 0 || !state.manualForm.semester
                      ? "Select semester first"
                      : "Select Section"
                  }
                />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                {state.manualSections
                  .filter((section) => section.semester_id === getSemesterId(state.manualForm.semester))
                  .map((section) => (
                    <SelectItem key={section.id} value={section.name} className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
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
              <SelectTrigger className={`flex-1 ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'} placeholder:text-muted-foreground focus:ring-0`}>
                <SelectValue
                  placeholder={state.batches.length === 0 ? "No batches available" : "Select Batch"}
                />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                {state.batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.name} className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleManualEntry}
              disabled={state.isLoading || !state.branchId || !state.manualForm.semester || !state.manualForm.section || !state.manualForm.batch}
              className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md transition disabled:opacity-50 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
            >
              + Add Student
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Student List</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => updateState({ addStudentModal: true })}
                className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-md transition bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
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
              className={`w-64 ${theme === 'dark' ? 'bg-card text-foreground border-border placeholder:text-muted-foreground' : 'bg-white text-gray-900 border-gray-300 placeholder:text-gray-500'}`}
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
                <SelectTrigger className={`w-48 ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}`}>
                  <SelectValue
                    placeholder={
                      state.semesters.length === 0
                        ? "No semesters available"
                        : "Select Semester"
                    }
                  />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                  <SelectItem value="All" className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>All Semesters</SelectItem>
                  {state.semesters.map((s) => (
                    <SelectItem key={s.id} value={s.id} className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
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
                <SelectTrigger className={`w-48 ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}`}>
                  <SelectValue
                    placeholder={
                      state.listSections.length === 0 ||
                      state.semesterFilter === "All"
                        ? "Select semester first"
                        : "Select Section"
                    }
                  />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                  <SelectItem value="All" className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>All Sections</SelectItem>
                  {state.listSections
                    .filter((section) => section.semester_id === state.semesterFilter)
                    .map((section) => (
                      <SelectItem key={section.id} value={section.id} className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
                        Section {section.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-gray-100 text-gray-900 border-gray-300'}>
                <tr className="border-b">
                  <th className="py-2 px-4">USN</th>
                  <th className="py-2 px-4">Name</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">Section</th>
                  <th className="py-2 px-4">Semester</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className={theme === 'dark' ? 'divide-y divide-border' : 'divide-y divide-gray-200'}>
                {paginatedFilteredStudents.map((student) => (
                  <tr key={student.usn} className={theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-50'}>
                    <td className="py-2 px-4">{student.usn}</td>
                    <td className="py-2 px-4">{student.name}</td>
                    <td className="py-2 px-4">{student.email}</td>
                    <td className="py-2 px-4">Section {student.section}</td>
                    <td className="py-2 px-4">{student.semester}</td>
                    <td className="py-2 px-4 flex gap-2">
                      <button
                        onClick={() => openEdit(student)}
                        className={theme === 'dark' ? 'text-primary hover:text-primary/80' : 'text-blue-600 hover:text-blue-800'}
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
                        className={theme === 'dark' ? 'text-destructive hover:text-destructive/80' : 'text-red-600 hover:text-red-800'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedFilteredStudents.length === 0 && (
              <p className={`text-center mt-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No students found</p>
            )}

            <div className="text-sm text-gray-500 mt-4">
              Showing {paginatedFilteredStudents.length} out of {filteredStudents.length}{" "}
              students (Page {state.currentPage} of {totalFilteredPages})
            </div>
          </div>

          <div className="flex justify-end items-center mt-4">
            <Button
              onClick={() => handlePageChange(state.currentPage - 1)}
              disabled={state.currentPage === 1}
              className="w-24 flex items-center justify-center gap-1 text-sm font-medium py-1.5 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
            >
              Previous
            </Button>
            <div className={`w-16 text-center text-sm font-medium py-1.5 mx-2 rounded-md ${theme === 'dark' ? 'text-foreground bg-card border-border' : 'text-gray-900 bg-white border-gray-300'}`}>
              {state.currentPage}
            </div>
            <Button
              onClick={() => handlePageChange(state.currentPage + 1)}
              disabled={state.currentPage === totalFilteredPages}
              className="w-24 flex items-center justify-center gap-1 text-sm font-medium py-1.5 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student Performance Comparison chart removed to reduce calls and simplify page */}


      <Dialog open={state.addStudentModal} onOpenChange={closeModal}>
        <DialogContent className={`max-w-xl ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}`}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Upload Student Data</DialogTitle>
          </DialogHeader>

          {/* Semester & Section Select */}
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
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
                <SelectTrigger className={`w-full ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}`}>
                  <SelectValue
                    placeholder={
                      state.batches.length === 0
                        ? "No batches available"
                        : "Select Batch"
                    }
                  />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                  {state.batches.map((batch) => (
                    <SelectItem
                      key={batch.id}
                      value={batch.name}
                      className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}
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
                <SelectTrigger className={`w-full ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}`}>
                  <SelectValue
                    placeholder={
                      state.semesters.length === 0
                        ? "No semesters available"
                        : "Select Semester"
                    }
                  />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                  {state.semesters.map((s) => (
                    <SelectItem
                      key={s.id}
                      value={`${s.number}th Semester`}
                      className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}
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
                <SelectTrigger className={`w-full ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}`}>
                  <SelectValue
                    placeholder={
                      state.manualSections.length === 0 || !state.manualForm.semester
                        ? "Select semester first"
                        : "Select Section"
                    }
                  />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
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
                        className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}
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
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${theme === 'dark' ? 'border-border hover:bg-accent' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            <UploadCloud size={36} className={`mx-auto mb-3 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`} />
            <p className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
              Drag & drop file here or click to select
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
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
              <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                Selected file: <strong className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>{state.droppedFileName}</strong>
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
              <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                {state.uploadedCount} students successfully added.
              </p>
            )}
          </div>

          {/* Upload Instructions */}
          <div className={`mt-6 text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
            <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Upload Instructions</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the provided template for proper data formatting</li>
              <li>
                Required columns: <strong className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>usn</strong>, <strong className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>name</strong>,{" "}
                <strong className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>email</strong>
              </li>
              <li>USN format: e.g., 1AM22CI001 (10 characters, alphanumeric)</li>
              <li>Semester and Section are selected above, not in the file</li>
              <li>Maximum 500 records per file</li>
              <li>
                <a
                  href="#"
                  className={theme === 'dark' ? 'text-primary underline' : 'text-blue-600 underline'}
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
              className={`text-foreground ${theme === 'dark' ? 'bg-card border-border hover:bg-accent' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
            >
              Cancel
            </Button>
            <Button className={`text-foreground ${theme === 'dark' ? 'bg-card border-border hover:bg-accent' : 'bg-white border-gray-300 hover:bg-gray-100'}`}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={state.confirmDelete} onOpenChange={() => updateState({ confirmDelete: false })}>
        <DialogContent className={`bg-[#1c1c1e] ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}`}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Delete Student</DialogTitle>
          </DialogHeader>
          <div className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>
            Are you sure you want to delete <strong className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>{state.selectedStudent?.name}</strong>?
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => updateState({ confirmDelete: false })}
              className={`text-foreground ${theme === 'dark' ? 'bg-card border-border hover:bg-accent' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
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
        <DialogContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Edit Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              className={` ${theme === 'dark' ? 'bg-card text-foreground border-border placeholder:text-muted-foreground' : 'bg-white text-gray-900 border-gray-300 placeholder:text-gray-500'}`}
              placeholder="Name"
              value={state.editForm.name}
              onChange={(e) => updateState({ editForm: { ...state.editForm, name: e.target.value } })}
            />
            <Input
              className={` ${theme === 'dark' ? 'bg-card text-foreground border-border placeholder:text-muted-foreground' : 'bg-white text-gray-900 border-gray-300 placeholder:text-gray-500'}`}
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
              <SelectTrigger className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                <SelectValue
                  placeholder={state.semesters.length === 0 ? "No semesters available" : "Select Semester"}
                />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                {state.semesters.map((s) => (
                  <SelectItem key={s.id} value={`${s.number}th Semester`} className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
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
              <SelectTrigger className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
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
              <SelectContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                {state.editSections
                  .filter((section) => section.semester_id === getSemesterId(state.editForm.semester))
                  .map((section) => (
                    <SelectItem key={section.id} value={section.name} className={theme === 'dark' ? 'text-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}>
                      Section {section.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className={`text-foreground ${theme === 'dark' ? 'bg-card border-border hover:bg-accent' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
              onClick={() => updateState({ editDialog: false, editSections: [] })}
            >
              Cancel
            </Button>
            <Button className={`text-foreground ${theme === 'dark' ? 'bg-card border-border hover:bg-accent' : 'bg-white border-gray-300 hover:bg-gray-100'}`} onClick={handleEditSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentManagement;