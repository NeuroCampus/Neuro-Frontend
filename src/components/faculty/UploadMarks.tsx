import { useState, useEffect, Fragment } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UploadCloud, X } from "lucide-react";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import {
  getStudentsForClass,
  ClassStudent,
  uploadInternalMarks,
  FacultyAssignment,
  getUploadMarksBootstrap,
  GetUploadMarksBootstrapResponse,
  createQuestionPaper,
  getStudentsForMarks,
  uploadIAMarks,
  CreateQPRequest,
  StudentsForMarksResponse,
  UploadIAMarksRequest,
  updateQuestionPaper,
  getQuestionPapers
} from "../../utils/faculty_api";
import { useFacultyAssignmentsQuery } from "../../hooks/useApiQueries";
import { useTheme } from "@/context/ThemeContext";

const MySwal = withReactContent(Swal);

// Constants for validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const REQUIRED_HEADERS = ['usn', 'name', 'marks'];
const MAX_RECORDS = 500;
const SAMPLE_ROW = ['1AM22CI064', 'Amit Kumar', '85/100'];

// Type for question format
interface Question {
  id: string;
  number: string; // e.g., "1a", "1b", "2a"
  content: string; // The actual question text
  maxMarks: string;
  co: string; // COs box
  bloomsLevel: string; // Blooms Cognitive Level
}

const normalizeMarks = (value: string): string => {
  const num = parseInt(value, 10);
  if (isNaN(num)) return "00";
  return num.toString().padStart(2, "0");
};

const validateMarks = (marks: string, total: string): boolean => {
  const marksNum = parseInt(marks, 10);
  const totalNum = parseInt(total, 10);
  return (
    !isNaN(marksNum) &&
    !isNaN(totalNum) &&
    marksNum >= 0 &&
    marksNum <= totalNum
  );
};

// New validation function for max marks
const validateMaxMarks = (maxMarks: string): boolean => {
  const maxMarksNum = parseInt(maxMarks, 10);
  return (
    !isNaN(maxMarksNum) &&
    maxMarksNum > 0 &&
    maxMarksNum <= 10
  );
};

// (Removed duplicate helper) calculateTotal logic lives inside the component

// Format test type for display
const formatTestType = (testType: string): string => {
  if (testType.startsWith('IA')) {
    const num = testType.replace('IA', '');
    return `IA Test ${num}`;
  }
  return `${testType} Test`;
};

const UploadMarks = () => {
  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError } = useFacultyAssignmentsQuery();
  const [dropdownData, setDropdownData] = useState({
    branch: [] as { id: number; name: string }[],
    semester: [] as { id: number; number: number }[],
    section: [] as { id: number; name: string }[],
    subject: [] as { id: number; name: string }[],
    testType: ["IA1", "IA2", "IA3", "SEE"],
  });
  const [selected, setSelected] = useState({
    branch: "",
    branch_id: undefined as number | undefined,
    subject: "",
    subject_id: undefined as number | undefined,
    section: "",
    section_id: undefined as number | undefined,
    semester: "",
    semester_id: undefined as number | undefined,
    testType: "",
  });
  const [students, setStudents] = useState<(ClassStudent & { marks: string; total: string; isEditing: boolean })[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [savingMarks, setSavingMarks] = useState(false);

  const calculateTotal = (marks: Record<string, string>) => {
    // Group marks by main question number and SUM subpart marks per main question
    const mainMarks: Record<string, number> = {};
    Object.keys(marks).forEach(key => {
      const mainQ = key.charAt(0);
      const mark = parseFloat(marks[key]) || 0;
      mainMarks[mainQ] = (mainMarks[mainQ] || 0) + mark;
    });

    // Attended main questions
    const attended = Object.keys(mainMarks).filter(q => mainMarks[q] > 0);

    // If no questions attempted, return 0
    if (attended.length === 0) return '0';

    // If only one question attempted, return its summed marks
    if (attended.length === 1) {
      return mainMarks[attended[0]].toString();
    }

    // If two questions attempted:
    // - if the pair is an allowed combo (1+3,1+4,2+3,2+4) return sum
    // - otherwise (e.g., 1 and 2 only) return the maximum of the two main marks
    if (attended.length === 2) {
      const a = attended[0];
      const b = attended[1];
      const pairAllowed = (
        (a === '1' && (b === '3' || b === '4')) ||
        (a === '2' && (b === '3' || b === '4')) ||
        (b === '1' && (a === '3' || a === '4')) ||
        (b === '2' && (a === '3' || a === '4'))
      );
      if (pairAllowed) {
        return (mainMarks[a] + mainMarks[b]).toString();
      }
      return Math.max(mainMarks[a], mainMarks[b]).toString();
    }

    // For three or more questions, use combination logic to find best valid combination
    // Possible combos: 1+3, 1+4, 2+3, 2+4
    const combos: number[] = [];
    const has1 = attended.includes('1');
    const has2 = attended.includes('2');
    const has3 = attended.includes('3');
    const has4 = attended.includes('4');

    if (has1 && has3) combos.push(mainMarks['1'] + mainMarks['3']);
    if (has1 && has4) combos.push(mainMarks['1'] + mainMarks['4']);
    if (has2 && has3) combos.push(mainMarks['2'] + mainMarks['3']);
    if (has2 && has4) combos.push(mainMarks['2'] + mainMarks['4']);

    if (combos.length > 0) {
      // If student attempted 1,2,3 then combos include 1+3 and 2+3; pick max
      return Math.max(...combos).toString();
    }

    // If no valid combos but multiple questions attempted, sum all attempted main question marks
    const total = attended.reduce((sum, q) => sum + mainMarks[q], 0);
    return total.toString();
  };
  const studentsPerPage = 10;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tabValue, setTabValue] = useState("manual");
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { theme } = useTheme();
  
  // New state for question paper format
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1a", number: "1a", content: "Question 1a", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
    { id: "1b", number: "1b", content: "Question 1b", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
    { id: "1c", number: "1c", content: "Question 1c", maxMarks: "6", co: "CO1", bloomsLevel: "Remember" },
    { id: "2a", number: "2a", content: "Question 2a", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
    { id: "2b", number: "2b", content: "Question 2b", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
    { id: "2c", number: "2c", content: "Question 2c", maxMarks: "6", co: "CO1", bloomsLevel: "Remember" },
    { id: "3a", number: "3a", content: "Question 3a", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
    { id: "3b", number: "3b", content: "Question 3b", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
    { id: "3c", number: "3c", content: "Question 3c", maxMarks: "6", co: "CO1", bloomsLevel: "Remember" },
    { id: "4a", number: "4a", content: "Question 4a", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
    { id: "4b", number: "4b", content: "Question 4b", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
    { id: "4c", number: "4c", content: "Question 4c", maxMarks: "6", co: "CO1", bloomsLevel: "Remember" },
  ]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [totalMarks, setTotalMarks] = useState(0);
  const [questionFormatSaved, setQuestionFormatSaved] = useState(false);

  // New state for QP ID
  const [qpId, setQpId] = useState<number | null>(null);
  const [studentMarks, setStudentMarks] = useState<Record<string, Record<string, string>>>({});

  // New state for action button modes
  const [actionModes, setActionModes] = useState<Record<string, 'edit' | 'save' | 'view'>>({});

  // Update dropdown data when assignments change
  useEffect(() => {
    const branches = Array.from(
      new Map(assignments.map(a => [a.branch_id, { id: a.branch_id, name: a.branch }])).values()
    );
    setDropdownData(prev => ({ ...prev, branch: branches }));
  }, [assignments]);

  // Calculate total marks when questions change
  useEffect(() => {
    const total = questions.reduce((sum, q) => {
      const marks = parseInt(q.maxMarks) || 0;
      return sum + marks;
    }, 0);
    setTotalMarks(total);
  }, [questions]);

  // Load existing QP when all dropdowns are selected
  useEffect(() => {
    if (areAllDropdownsSelected()) {
      loadExistingQP();
    }
  }, [selected.branch_id, selected.semester_id, selected.section_id, selected.subject_id, selected.testType]);

  const handleMarksChange = (index: number, field: "marks" | "total", value: string) => {
    if (/^\d*$/.test(value)) {
      const actualIndex = (currentPage - 1) * studentsPerPage + index;
      setStudents((prev) =>
        prev.map((student, i) =>
          i === actualIndex
            ? {
                ...student,
                [field]: field === "marks" ? normalizeMarks(value) : value,
              }
            : student
        )
      );
    }
  };

  const toggleEdit = (index: number) => {
    const actualIndex = (currentPage - 1) * studentsPerPage + index;
    setStudents((prev) =>
      prev.map((student, i) =>
        i === actualIndex ? { ...student, isEditing: !student.isEditing } : student
      )
    );
  };

  const saveRow = (index: number) => {
    const actualIndex = (currentPage - 1) * studentsPerPage + index;
    setStudents((prev) =>
      prev.map((student, i) =>
        i === actualIndex ? { ...student, isEditing: false } : student
      )
    );
  };

  // Question management functions
  const addQuestion = () => {
    const lastQuestion = questions[questions.length - 1];
    const lastNumber = lastQuestion.number;
    
    // Parse the last question number to determine next
    const match = lastNumber.match(/(\d+)([a-z]*)/);
    let newNumber = "1a";
    let newContent = "";
    let newMaxMarks = "7";
    let newCo = "CO2";
    let newBlooms = "Apply";
    
    if (match) {
      const [, numPart, letterPart] = match;
      const num = parseInt(numPart);
      
      if (letterPart) {
        // If it has a letter part (like 1a, 1b), increment the letter
        const nextChar = String.fromCharCode(letterPart.charCodeAt(0) + 1);
        newNumber = `${numPart}${nextChar}`;
        newContent = `Question ${numPart}${nextChar}`;
        
        // Set marks and CO based on subpart
        if (nextChar === 'c') {
          newMaxMarks = "6";
          newCo = "CO1";
          newBlooms = "Remember";
        }
      } else {
        // If no letter part, add 'a'
        newNumber = `${num}a`;
        newContent = `Question ${num}a`;
      }
    }
    
    setQuestions([
      ...questions,
      { id: Date.now().toString(), number: newNumber, content: newContent, maxMarks: newMaxMarks, co: newCo, bloomsLevel: newBlooms }
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: "number" | "content" | "maxMarks" | "co" | "bloomsLevel", value: string) => {
    // Only allow numeric input for max marks
    if (field === "maxMarks" && value !== "") {
      // Check if the value is a valid number
      if (!/^\d*$/.test(value)) {
        // Don't update if it's not a valid number
        return;
      }
      
      // Validate max marks range (1-10)
      const maxMarksNum = parseInt(value, 10);
      if (maxMarksNum > 10) {
        // Don't update if greater than 10
        return;
      }
    }
    
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  // Load existing QP if available
  const loadExistingQP = async () => {
    if (!areAllDropdownsSelected()) return;
    
    try {
      const qpResponse = await getQuestionPapers();
      if (qpResponse.success && qpResponse.data) {
        const existingQp = qpResponse.data.find((q: any) => 
          q.branch === selected.branch_id && q.semester === selected.semester_id && q.section === selected.section_id && 
          q.subject === selected.subject_id && q.test_type === selected.testType
        );
        
        if (existingQp) {
          setQpId(existingQp.id);
          setQuestionFormatSaved(true);
          
          // Load questions from existing QP
          const loadedQuestions: Question[] = [];
          existingQp.questions.forEach((q: any) => {
            q.subparts.forEach((sub: any, index: number) => {
              loadedQuestions.push({
                id: `${q.question_number}${sub.subpart_label}`,
                number: `${q.question_number}${sub.subpart_label}`,
                content: sub.content,
                maxMarks: sub.max_marks.toString(),
                co: q.co,
                bloomsLevel: q.blooms_level
              });
            });
          });
          
          if (loadedQuestions.length > 0) {
            setQuestions(loadedQuestions);
          }
        } else {
          // Reset to default if no existing QP
          setQpId(null);
          setQuestionFormatSaved(false);
          setQuestions([
            { id: "1a", number: "1a", content: "Question 1a", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
            { id: "1b", number: "1b", content: "Question 1b", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
            { id: "1c", number: "1c", content: "Question 1c", maxMarks: "6", co: "CO1", bloomsLevel: "Remember" },
            { id: "2a", number: "2a", content: "Question 2a", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
            { id: "2b", number: "2b", content: "Question 2b", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
            { id: "2c", number: "2c", content: "Question 2c", maxMarks: "6", co: "CO1", bloomsLevel: "Remember" },
            { id: "3a", number: "3a", content: "Question 3a", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
            { id: "3b", number: "3b", content: "Question 3b", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
            { id: "3c", number: "3c", content: "Question 3c", maxMarks: "6", co: "CO1", bloomsLevel: "Remember" },
            { id: "4a", number: "4a", content: "Question 4a", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
            { id: "4b", number: "4b", content: "Question 4b", maxMarks: "7", co: "CO2", bloomsLevel: "Apply" },
            { id: "4c", number: "4c", content: "Question 4c", maxMarks: "6", co: "CO1", bloomsLevel: "Remember" },
          ]);
        }
      }
    } catch (error) {
      console.error("Error loading existing QP:", error);
    }
  };

  const saveQuestionFormat = async () => {
    // Validate that all questions have max marks
    const isValid = questions.every(q => 
      q.number.trim() !== "" && 
      q.maxMarks.trim() !== "" && 
      parseInt(q.maxMarks) > 0 && 
      parseInt(q.maxMarks) <= 10
    );
    
    if (!isValid) {
      // Show error message
      setErrorMessage("Please ensure all questions have valid numbers and max marks (1-10)");
      return;
    }
    
    // Clear any previous error messages
    setErrorMessage("");
    
    // Check if QP already exists
    const qpResponse = await getQuestionPapers();
    let existingQp = null;
    if (qpResponse.success && qpResponse.data) {
      existingQp = qpResponse.data.find((q: any) => 
        q.branch === selected.branch_id && q.semester === selected.semester_id && q.section === selected.section_id && 
        q.subject === selected.subject_id && q.test_type === selected.testType
      );
    }
    
    // Prepare QP data - group by main question
    const groupedQuestions: Record<string, { co: string; blooms_level: string; subparts: any[] }> = {};
    questions.forEach(q => {
      const mainQ = q.number.charAt(0);
      if (!groupedQuestions[mainQ]) {
        groupedQuestions[mainQ] = { co: q.co, blooms_level: q.bloomsLevel, subparts: [] };
      }
      groupedQuestions[mainQ].subparts.push({
        subpart_label: q.number.slice(1),
        content: q.content,
        max_marks: parseInt(q.maxMarks)
      });
    });

    const qpData: CreateQPRequest = {
      branch: selected.branch_id!,
      semester: selected.semester_id!,
      section: selected.section_id!,
      subject: selected.subject_id!,
      test_type: selected.testType,
      questions_data: Object.keys(groupedQuestions).map(mainQ => ({
        question_number: mainQ,
        co: groupedQuestions[mainQ].co,
        blooms_level: groupedQuestions[mainQ].blooms_level,
        subparts_data: groupedQuestions[mainQ].subparts
      }))
    };

    try {
      let response;
      if (existingQp) {
        // Update existing QP
        response = await updateQuestionPaper(existingQp.id, qpData);
        setQpId(existingQp.id);
      } else {
        // Create new QP
        response = await createQuestionPaper(qpData);
        if (response.success && response.data) {
          setQpId(response.data.id);
        }
      }
      
      if (response.success) {
        setQuestionFormatSaved(true);
        await loadExistingQP(); // Reload QP data to reflect changes immediately
        MySwal.fire({
          title: existingQp ? "Question Format Updated!" : "Question Format Saved!",
          text: existingQp ? "The question paper format has been successfully updated." : "The question paper format has been successfully saved.",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          setTabValue("questionPaper");
        });
      } else {
        setErrorMessage("Failed to save question format");
      }
    } catch (error) {
      setErrorMessage("Network error while saving question format");
    }
  };

  const handleSubmit = async () => {
    setSavingMarks(true);
    const { branch_id, subject_id, section_id, semester_id, testType } = selected;
    if (!branch_id || !subject_id || !section_id || !semester_id || !testType) {
      MySwal.fire({
        title: "Select all class and test details!",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    // Find QP
    const qpResponse = await getQuestionPapers();
    if (!qpResponse.success || !qpResponse.data) {
      MySwal.fire({
        title: "Question Paper not found",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }
    const qp = qpResponse.data.find((q: any) => 
      q.branch === branch_id && q.semester === semester_id && q.section === section_id && 
      q.subject === subject_id && q.test_type === testType
    );
    if (!qp) {
      MySwal.fire({
        title: "Question Paper not found",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    // Prepare marks data
    const marksData: UploadIAMarksRequest = {
      question_paper_id: qp.id,
      marks_data: students.map(s => ({
        student_id: s.id,
        marks_detail: Object.fromEntries(
          Object.entries(studentMarks[s.id.toString()] || {}).map(([key, value]) => [key, parseFloat(value) || 0])
        )
      }))
    };

    try {
      const res = await uploadIAMarks(marksData);
      if (res.success) {
        MySwal.fire({
          title: "Marks uploaded!",
          icon: "success",
          confirmButtonText: "OK",
        });
      } else {
        MySwal.fire({
          title: "Upload failed",
          text: res.message || "Unknown error",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      MySwal.fire({
        title: "Network error",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setSavingMarks(false);
    }
  };

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(students.length / studentsPerPage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('File size exceeds the 5MB limit.');
      return;
    }
    const isCSV = file.name.endsWith('.csv');
    const isExcel = file.name.endsWith('.xls') || file.name.endsWith('.xlsx');
    if (!isCSV && !isExcel) {
      setErrorMessage('Unsupported file type. Please upload CSV or Excel file.');
      return;
    }
    setSelectedFile(file);
    setErrorMessage("");
    const reader = new FileReader();
    reader.onload = async (event) => {
      let data: (string | number)[][] = [];
      if (isCSV) {
        const text = event.target?.result as string;
        const parsed = Papa.parse(text, { skipEmptyLines: true });
        data = parsed.data;
      } else {
        const workbook = XLSX.read(event.target?.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
      }
      const header = data[0]?.map((cell: string | number) => String(cell).trim().toLowerCase());
      const expectedHeader = REQUIRED_HEADERS.map(h => h.toLowerCase());
      if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) {
        setErrorMessage('Invalid header. Required: usn, name, marks');
        return;
      }
      const firstRow = data[1]?.map((cell: string | number) => String(cell).trim());
      if (!firstRow || firstRow.length < 3) {
        setErrorMessage("Invalid first row. It must contain at least 3 values: USN, Name, and Marks.");
        return;
      }
      if (!firstRow[0]?.trim()) {
        setErrorMessage("USN in the first row is empty.");
        return;
      }
      const [usn, name, marksStr] = firstRow;
      const [marks, total] = (marksStr as string).split("/").map((s: string) => s.trim());
      if (isNaN(parseInt(marks, 10)) || isNaN(parseInt(total, 10))) {
        setErrorMessage(`Invalid Marks or Total in first row. Expected: Numeric values`);
        return;
      }
      const recordCount = data.length - 1;
      if (recordCount > MAX_RECORDS) {
        setErrorMessage('File contains more than 500 records.');
        return;
      }
      try {
        const { branch_id, semester_id, section_id, subject_id } = selected;
        if (!branch_id || !semester_id || !section_id || !subject_id) {
          setErrorMessage("Select all class details before uploading.");
          return;
        }
        const studentsList = await getStudentsForClass(branch_id, semester_id, section_id, subject_id);
        if (!studentsList) {
          setErrorMessage("Failed to fetch student list.");
          return;
        }
        const usnToIdMap = new Map<string, number>();
        studentsList.forEach((student: ClassStudent) => {
          usnToIdMap.set(student.usn.toUpperCase(), student.id);
        });
        const studentsData = data.slice(1).map((row: (string | number)[]) => {
          const [usn, name, marksStr] = row;
          const [marks, total] = (marksStr as string).split("/").map((s: string) => s.trim());
          const normalizedMarks = normalizeMarks(marks);
          if (!validateMarks(normalizedMarks, total)) {
            throw new Error(`Invalid marks or total for student ${name}`);
          }
          const studentId = (usn as string).toUpperCase();
          if (!studentId) {
            throw new Error(`Student with USN ${usn} not found in the selected class.`);
          }
          return {
            id: studentId,
            usn: (usn as string).toUpperCase(),
            name,
            marks: normalizedMarks,
            total,
            isEditing: false,
          };
        });
        setStudents(studentsData.map(item => ({
          id: typeof item.id === 'string' ? parseInt(item.id, 10) : item.id,
          usn: item.usn as string,
          name: item.name as string,
          marks: item.marks,
          total: item.total as string,
          isEditing: item.isEditing
        })));
        setCurrentPage(1);
        setTabValue("manual");
        setErrorMessage("");
        
        // Initialize action modes for all students to 'view' by default
        const initialActionModes: Record<string, 'edit' | 'save' | 'view'> = {};
        studentsData.forEach(student => {
          initialActionModes[student.id] = 'view';
        });
        setActionModes(initialActionModes);
      } catch (err: unknown) {
        setStudents([]); // Clear students on error
        setActionModes({}); // Reset action modes on error
        setErrorMessage((err as { message: string }).message);
        console.error("Error in handleFileChange:", err);
      }
    };
    if (isCSV) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setErrorMessage("");
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      ['usn', 'name', 'marks'],
      ['1AM22CI064', 'Pannaga J A', '85/100'],
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(event);
    }
  };

  const handleSelectChange = async (field: string, value: string | number) => {
    setErrorMessage("");
    const updated = { ...selected };
    if (field.endsWith('_id')) {
      updated[field] = value as number;
      if (field === 'branch_id') {
        const branchObj = dropdownData.branch.find(b => b.id === value);
        updated.branch = branchObj ? branchObj.name : "";
      } else if (field === 'semester_id') {
        const semObj = dropdownData.semester.find(s => s.id === value);
        updated.semester = semObj ? semObj.number.toString() : "";
      } else if (field === 'section_id') {
        const secObj = dropdownData.section.find(s => s.id === value);
        updated.section = secObj ? secObj.name : "";
      } else if (field === 'subject_id') {
        const subjObj = dropdownData.subject.find(s => s.id === value);
        updated.subject = subjObj ? subjObj.name : "";
      }
    } else {
      updated[field] = value as string;
    }
    setSelected(updated);
    let filtered = assignments;
    if (updated.branch_id) filtered = filtered.filter(a => a.branch_id === updated.branch_id);
    if (updated.semester_id) filtered = filtered.filter(a => a.semester_id === updated.semester_id);
    if (updated.section_id) filtered = filtered.filter(a => a.section_id === updated.section_id);
    if (field === "branch_id") {
      const semesters = Array.from(
        new Map(filtered.map(a => [a.semester_id, { id: a.semester_id, number: a.semester }])).values()
      );
      setDropdownData(prev => ({ ...prev, semester: semesters, section: [], subject: [] }));
      setSelected(prev => ({ ...prev, semester: "", semester_id: undefined, section: "", section_id: undefined, subject: "", subject_id: undefined }));
    } else if (field === "semester_id") {
      const sections = Array.from(
        new Map(filtered.map(a => [a.section_id, { id: a.section_id, name: a.section }])).values()
      );
      setDropdownData(prev => ({ ...prev, section: sections, subject: [] }));
      setSelected(prev => ({ ...prev, section: "", section_id: undefined, subject: "", subject_id: undefined }));
    } else if (field === "section_id") {
      const subjects = Array.from(
        new Map(filtered.map(a => [a.subject_id, { id: a.subject_id, name: a.subject_name }])).values()
      );
      setDropdownData(prev => ({ ...prev, subject: subjects }));
      setSelected(prev => ({ ...prev, subject: "", subject_id: undefined }));
    }
    const { branch_id, semester_id, section_id, subject_id, testType } = { ...updated };
    if (branch_id && semester_id && section_id && subject_id && testType) {
      // Reset QP related states when selections change
      setQpId(null);
      setQuestionFormatSaved(false);
      setStudents([]);
      setStudentMarks({});
      setActionModes({});
      
      // Load existing QP
      loadExistingQP();
      
      setLoadingStudents(true);
      try {
        const response: StudentsForMarksResponse = await getStudentsForMarks({
          branch_id: branch_id.toString(),
          semester_id: semester_id.toString(),
          section_id: section_id.toString(),
          subject_id: subject_id.toString(),
          test_type: testType
        });
        if (response.success && response.data) {
          const newStudents = response.data.map(s => ({
            id: s.id,
            name: s.name,
            usn: s.usn,
            marks: s.existing_mark ? s.existing_mark.total_obtained.toString() : '',
            total: totalMarks.toString(),
            isEditing: false
          }));
          
          setStudents(newStudents);
          setCurrentPage(1);
          
          // Initialize student marks with existing data
          const initialMarks: Record<string, Record<string, string>> = {};
          response.data.forEach(s => {
            if (s.existing_mark) {
              initialMarks[s.id.toString()] = {};
              Object.keys(s.existing_mark.marks_detail).forEach(key => {
                initialMarks[s.id.toString()][key] = s.existing_mark!.marks_detail[key].toString();
              });
            }
          });
          setStudentMarks(initialMarks);
          
          // Initialize action modes
          const initialActionModes: Record<string, 'edit' | 'save' | 'view'> = {};
          newStudents.forEach(student => {
            initialActionModes[student.id] = 'view';
          });
          setActionModes(initialActionModes);
        } else {
          throw new Error("Failed to fetch students/marks");
        }
      } catch (err: unknown) {
        setStudents([]);
        setActionModes({});
        setStudentMarks({});
        setErrorMessage((err as { message?: string })?.message || "Failed to fetch students/marks");
      }
      setLoadingStudents(false);
    }
  };

  // Check if all dropdowns are selected
  const areAllDropdownsSelected = () => {
    return (
      selected.branch_id !== undefined &&
      selected.semester_id !== undefined &&
      selected.section_id !== undefined &&
      selected.subject_id !== undefined &&
      selected.testType !== ""
    );
  };

  // Add the download PDF function inside the component
  const downloadQuestionPaperPDF = () => {
    const doc = new jsPDF();
    
    // Set font properties
    doc.setFont('helvetica');
    
    // Add title
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('Question Paper Format', 105, 20, { align: 'center' });
    
    // Add horizontal line
    doc.setDrawColor(162, 89, 255); // Purple color
    doc.line(20, 25, 190, 25);
    
    // Add subject and test type info
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0); // Black color
    doc.text(`Subject: ${selected.subject}`, 20, 35);
    doc.text(`Test Type: ${selected.testType}`, 20, 42);
    doc.text(`Total Marks: ${totalMarks}`, 20, 49);
    
    // Add questions header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(162, 89, 255); // Purple color
    doc.text('Questions:', 20, 65);
    
    // Add questions with improved formatting
    let yPosition = 75;
    questions.forEach((question, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Add question number with purple color
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(162, 89, 255); // Purple color
      doc.text(`${question.number}.`, 20, yPosition);
      
      // Add question content
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0); // Black color
      const questionText = question.content || "No question content entered";
      const splitText = doc.splitTextToSize(questionText, 120);
      doc.text(splitText, 35, yPosition);
      
      // Calculate text height for proper positioning of metadata
      const textHeight = splitText.length * 5;
      const metadataYPosition = yPosition + textHeight + 5;
      
      // Add CO, Blooms Level, and marks information below the question text
      let additionalInfo = `Marks: ${question.maxMarks}`;
      if (question.co) {
        additionalInfo += ` | CO: ${question.co}`;
      }
      if (question.bloomsLevel) {
        additionalInfo += ` | Blooms: ${question.bloomsLevel}`;
      }
      
      doc.setFont(undefined, 'italic');
      doc.setTextColor(100, 100, 100); // Gray color
      doc.text(additionalInfo, 35, metadataYPosition);
      
      // Calculate new Y position based on text height with proper spacing
      const metadataHeight = 5; // Height of metadata line
      yPosition += Math.max(textHeight, 10) + metadataHeight + 15;
      
      // Add a subtle separator line
      doc.setDrawColor(200, 200, 200); // Light gray
      doc.line(25, yPosition - 8, 185, yPosition - 8);
    });
    
    // Add footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(150, 150, 150); // Light gray
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Save the PDF
    const fileName = `Question_Paper_Format_${selected.subject}_${selected.testType}.pdf`;
    doc.save(fileName);
  };

  return (
    <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Upload Marks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select onValueChange={value => handleSelectChange('branch_id', Number(value))}>
            <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              {dropdownData.branch.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={value => handleSelectChange('semester_id', Number(value))}>
            <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              {dropdownData.semester.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={value => handleSelectChange('section_id', Number(value))}>
            <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              {dropdownData.section.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={value => handleSelectChange('subject_id', Number(value))}>
            <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              {dropdownData.subject.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={value => handleSelectChange('testType', value)}>
            <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              <SelectValue placeholder="Select TestType" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              {dropdownData.testType.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Tabs value={tabValue} onValueChange={setTabValue} className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
          <TabsList className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-gray-100 border border-gray-300 text-gray-900'}>
            <TabsTrigger 
              value="manual" 
              className={`data-[state=active]:bg-[#a259ff] data-[state=active]:text-white ${theme === 'dark' ? 'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground' : 'data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-900'}`}
            >
              Marks Entry
            </TabsTrigger>
            <TabsTrigger 
              value="questionFormat" 
              className={`data-[state=active]:bg-[#a259ff] data-[state=active]:text-white ${theme === 'dark' ? 'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground' : 'data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-900'}`}
            >
              Question Format
            </TabsTrigger>
            <TabsTrigger 
              value="questionPaper" 
              className={`data-[state=active]:bg-[#a259ff] data-[state=active]:text-white ${theme === 'dark' ? 'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground' : 'data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-900'}`}
            >
              Question Paper
            </TabsTrigger>
            {/* <TabsTrigger 
              value="file" 
              className={`data-[state=active]:bg-[#a259ff] data-[state=active]:text-white ${theme === 'dark' ? 'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground' : 'data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-900'}`}
            >
              File Upload
            </TabsTrigger> */}
          </TabsList>
          
          <TabsContent value="manual">
            {/* Students Table - only shown after saving question format */}
            {questionFormatSaved && areAllDropdownsSelected() && (
              <div className={`border rounded-lg overflow-hidden ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'}`}>
                {/* Header */}
                <div className={`p-4 border-b ${theme === 'dark' ? 'border-border bg-muted' : 'border-gray-300 bg-gray-50'}`}>
                  <h3 className="text-lg font-semibold">Internal Assessment Test</h3>
                </div>
                        
                {/* Table with new structure based on question format */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-border">
                    <thead>
                      <tr>
                        <th rowSpan={3} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider align-middle">#</th>
                        <th rowSpan={3} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider align-middle">USN</th>
                        <th rowSpan={3} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider align-middle">Name</th>
                        
                        {/* Dynamic Question Groups based on question format */}
                        {questions.map((question) => (
                          <th key={`q-${question.id}`} colSpan={3} className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">
                            Q{question.number}
                          </th>
                        ))}
                        
                        {/* Final Columns - Removed Marks After Weightage */}
                        <th rowSpan={3} className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider align-middle">Total Marks</th>
                        <th rowSpan={3} className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider align-middle">Action</th>
                      </tr>
                      <tr>
                        {/* Sub-columns for each question */}
                        {questions.map((question) => (
                          <Fragment key={`sub-${question.id}`}>
                            <th className="px-2 py-1 text-center text-xs font-medium uppercase tracking-wider">CO</th>
                            <th className="px-2 py-1 text-center text-xs font-medium uppercase tracking-wider">Max Marks</th>
                            <th className="px-2 py-1 text-center text-xs font-medium uppercase tracking-wider">Marks</th>
                          </Fragment>
                        ))}
                      </tr>
                      <tr>
                        {/* CO and Max Marks rows */}
                        {questions.map((question, index) => (
                          <Fragment key={`row-${question.id}`}>
                            <td className="px-2 py-1 text-center text-xs italic">CO</td>
                            <td className="px-2 py-1 text-center text-xs italic">Max marks</td>
                            <td className="px-2 py-1 text-center text-xs italic">{formatTestType(selected.testType)}</td>
                          </Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-border">
                      {loadingStudents ? (
                        <tr>
                          <td colSpan={questions.length * 3 + 5} className={`text-center text-sm p-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                            Loading students...
                          </td>
                        </tr>
                      ) : currentStudents.length === 0 ? (
                        <tr>
                          <td colSpan={questions.length * 3 + 5} className={`text-center text-sm p-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                            No students found for selected criteria.
                          </td>
                        </tr>
                      ) : (
                        currentStudents.map((student, index) => (
                          <tr key={student.id} className={`${theme === 'dark' ? 'hover:bg-muted' : 'hover:bg-gray-50'}`}>
                            <td className="px-4 py-2 text-sm">{indexOfFirstStudent + index + 1}</td>
                            <td className="px-4 py-2 text-sm">{student.usn}</td>
                            <td className="px-4 py-2 text-sm">{student.name}</td>
                            
                            {/* Dynamic question inputs based on question format */}
                            {questions.map((question, qIndex) => (
                              <Fragment key={`input-${question.id}-${student.id}`}>
                                <td className="px-2 py-1 text-center">
                                  <Input 
                                    type="text" 
                                    className="w-16 text-center mx-auto" 
                                    placeholder="CO" 
                                    value={question.co}
                                    readOnly
                                  />
                                </td>
                                <td className="px-2 py-1 text-center">
                                  <Input 
                                    type="text" 
                                    className="w-16 text-center mx-auto" 
                                    placeholder="Max" 
                                    value={question.maxMarks}
                                    readOnly
                                  />
                                </td>
                                <td className="px-2 py-1 text-center">
                                  <Input 
                                    type="number" 
                                    className="w-16 text-center mx-auto" 
                                    placeholder="Marks" 
                                    value={studentMarks[student.id]?.[question.number] || ""}
                                    min="0"
                                    max={question.maxMarks}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const maxMarks = parseInt(question.maxMarks);
                                      const numValue = parseInt(value);
                                      
                                      // Validate that the entered value doesn't exceed max marks
                                      if (value !== "" && (isNaN(numValue) || numValue < 0 || numValue > maxMarks)) {
                                        // If invalid, don't update the state
                                        return;
                                      }
                                      
                                      setStudentMarks(prev => {
                                        const updated = { ...prev };
                                        if (!updated[student.id]) updated[student.id] = {};
                                        updated[student.id][question.number] = value;
                                        return updated;
                                      });
                                    }}
                                  />
                                </td>
                              </Fragment>
                            ))}
                            
                            {/* Final columns */}
                            <td className="px-4 py-2 text-center">
                              <Input 
                                type="text" 
                                className="w-20 text-center mx-auto" 
                                placeholder="Total" 
                                value={calculateTotal(studentMarks[student.id] || {})}
                                readOnly
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              {actionModes[student.id] === 'edit' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-[#a259ff] text-[#a259ff] hover:bg-[#a259ff] hover:text-white"
                                  onClick={() => {
                                    setActionModes(prev => ({
                                      ...prev,
                                      [student.id]: 'save'
                                    }));
                                  }}
                                >
                                  Save
                                </Button>
                              ) : actionModes[student.id] === 'save' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-[#a259ff] text-[#a259ff] hover:bg-[#a259ff] hover:text-white"
                                  onClick={() => {
                                    // Save logic would go here
                                    setActionModes(prev => ({
                                      ...prev,
                                      [student.id]: 'view'
                                    }));
                                  }}
                                >
                                  Save
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-[#a259ff] text-[#a259ff] hover:bg-[#a259ff] hover:text-white"
                                  onClick={() => {
                                    setActionModes(prev => ({
                                      ...prev,
                                      [student.id]: 'edit'
                                    }));
                                  }}
                                >
                                  Edit
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                        
                <div className={`flex justify-between items-center mt-4 px-4 py-2 text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Message to configure question format first */}
            {areAllDropdownsSelected() && !questionFormatSaved && (
              <div className={`p-6 text-center rounded-lg ${theme === 'dark' ? 'bg-card border border-border' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                  Please configure the question paper format first.
                </p>
                <Button 
                  onClick={() => setTabValue("questionFormat")}
                  className="mt-4 bg-[#a259ff] text-white hover:bg-[#8a4dde]"
                >
                  Go to Question Format
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Question Format Tab - For configuring questions */}
          <TabsContent value="questionFormat">
            {areAllDropdownsSelected() ? (
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-card border border-border' : 'bg-gray-50 border border-gray-200'}`}>
                {errorMessage && (
                  <div className={`mb-4 p-3 rounded-md text-sm ${theme === 'dark' ? 'bg-destructive/20 text-destructive' : 'bg-red-100 text-red-700'}`}>
                    {errorMessage}
                  </div>
                )}
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-background border border-border' : 'bg-white border border-gray-300'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Questions</h4>
                    <span className="text-sm">Total Marks: {totalMarks}</span>
                  </div>
                  
                  {questions.map((question, index) => (
                    <div key={question.id} className="flex items-center gap-3 mb-3">
                      <div className="w-20">
                        <Input
                          value={question.number}
                          onChange={(e) => updateQuestion(question.id, "number", e.target.value)}
                          placeholder="1a"
                          className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={question.content}
                          onChange={(e) => updateQuestion(question.id, "content", e.target.value)}
                          placeholder="Enter question"
                          className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          value={question.maxMarks}
                          onChange={(e) => updateQuestion(question.id, "maxMarks", e.target.value)}
                          placeholder="Max Marks"
                          className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          value={question.co}
                          onChange={(e) => updateQuestion(question.id, "co", e.target.value)}
                          placeholder="CO"
                          className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          value={question.bloomsLevel}
                          onChange={(e) => updateQuestion(question.id, "bloomsLevel", e.target.value)}
                          placeholder="Blooms Level"
                          className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        disabled={questions.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={addQuestion}
                      variant="outline"
                      className={theme === 'dark' ? 'border-border text-foreground hover:bg-accent' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                    <Button 
                      onClick={saveQuestionFormat}
                      className="bg-[#a259ff] text-white hover:bg-[#8a4dde]"
                    >
                      Save Format
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-6 text-center rounded-lg ${theme === 'dark' ? 'bg-card border border-border' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                  Please select all the dropdown options first to configure question paper format.
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Question Paper Tab - For viewing the saved format */}
          <TabsContent value="questionPaper">
            {questionFormatSaved && areAllDropdownsSelected() ? (
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-card border border-border' : 'bg-gray-50 border border-gray-200'}`}>
                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-background border border-border' : 'bg-white border border-gray-300'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Question Paper Format</h3>
                    <Button 
                      onClick={downloadQuestionPaperPDF}
                      className="bg-[#a259ff] text-white hover:bg-[#8a4dde]"
                    >
                      Download PDF
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <div key={question.id} className="flex items-start gap-3">
                        <span className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                          {question.number}.
                        </span>
                        <div className="flex-1">
                          <p className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                            {question.content || "No question content entered"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                            ({question.maxMarks} marks)
                          </div>
                          {question.co && (
                            <div className={`text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                              CO: {question.co}
                            </div>
                          )}
                          {question.bloomsLevel && (
                            <div className={`text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                              Blooms: {question.bloomsLevel}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className={`pt-4 border-t ${theme === 'dark' ? 'border-border' : 'border-gray-300'}`}>
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total Marks:</span>
                        <span>{totalMarks}</span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button 
                        onClick={() => setTabValue("questionFormat")}
                        variant="outline"
                        className={theme === 'dark' ? 'border-border text-foreground hover:bg-accent' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                      >
                        Edit Format
                      </Button>
                      <Button 
                        onClick={() => setTabValue("manual")}
                        className="bg-[#a259ff] text-white hover:bg-[#8a4dde]"
                      >
                        Proceed to Marks Entry
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-6 text-center rounded-lg ${theme === 'dark' ? 'bg-card border border-border' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                  {areAllDropdownsSelected() 
                    ? "Please configure the question paper format first." 
                    : "Please select all the dropdown options first."}
                </p>
                {areAllDropdownsSelected() ? (
                  <Button 
                    onClick={() => setTabValue("questionFormat")}
                    className="mt-4 bg-[#a259ff] text-white hover:bg-[#8a4dde]"
                  >
                    Go to Question Format
                  </Button>
                ) : null}
              </div>
            )}
          </TabsContent>

          {/* <TabsContent value="file">
            <div className={`border rounded-lg p-6 max-w-2xl mx-auto space-y-6 ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'}`}>
              <div>
                <h2 className="text-lg font-semibold">Upload User Data</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Upload CSV or Excel files to bulk enroll users</p>
              </div>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border rounded-md p-6 text-center space-y-4 transition-all duration-300 ${
                  dragActive
                    ? (theme === 'dark' ? "border-primary bg-primary/10" : "border-blue-400 bg-blue-50")
                    : (theme === 'dark' ? "border-dashed border-border bg-muted" : "border-dashed border-gray-300 bg-gray-50")
                }`}
              >
                <UploadCloud
                  className={`mx-auto h-8 w-8 transition-transform duration-300 ${
                    dragActive 
                      ? (theme === 'dark' ? "scale-110 text-primary" : "scale-110 text-blue-400") 
                      : (theme === 'dark' ? "text-muted-foreground" : "text-gray-400")
                  }`}
                />
                <p className={`text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-700'}`}>Drag & drop file here</p>
                <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Supports CSV, XLS, XLSX (max 5MB)</p>
                {!selectedFile ? (
                  <div className="flex justify-center">
                    <button
                      onClick={() => document.getElementById("fileInput")?.click()}
                      className={`px-4 py-2 rounded-md transition ${theme === 'dark' ? 'border border-border hover:bg-accent' : 'border border-gray-300 hover:bg-gray-100'}`}
                    >
                      Select File
                    </button>
                    <input
                      id="fileInput"
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{selectedFile.name}</p>
                    <Button variant="ghost" size="sm" onClick={handleClearFile}>
                      <X className={`h-4 w-4 ${theme === 'dark' ? 'text-muted-foreground hover:text-foreground' : 'text-gray-500 hover:text-gray-900'}`} />
                    </Button>
                  </div>
                )}
              </div>
              {errorMessage && (
                <div className={`text-sm font-medium text-center p-2 rounded-md ${theme === 'dark' ? 'text-destructive border border-destructive/30 bg-destructive/10' : 'text-red-600 border border-red-200 bg-red-50'}`}>
                  {errorMessage}
                </div>
              )}
              <div className={`text-sm space-y-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-700'}`}>
                <p className="font-semibold">Upload Instructions</p>
                <ul className={`list-disc list-inside ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                  <li>Use the provided template for proper data formatting</li>
                  <li>
                    Required columns: <strong>usn</strong>, <strong>name</strong>, <strong>marks</strong>
                  </li>
                  <li>Maximum 500 records per file</li>
                </ul>
                <button
                  onClick={handleDownloadTemplate}
                  className={`text-sm ${theme === 'dark' ? 'text-primary hover:underline' : 'text-blue-600 hover:underline'}`}
                >
                  Download Template
                </button>
              </div>
            </div>
          </TabsContent> */}
        </Tabs>
        <div className="flex justify-end mt-4">
          <Button 
            className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out shadow-md"
            onClick={handleSubmit} 
            disabled={savingMarks}
          >
            {savingMarks ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadMarks;

  
