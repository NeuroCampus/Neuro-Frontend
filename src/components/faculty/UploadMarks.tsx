import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
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
import {
  getStudentsForClass,
  ClassStudent,
  uploadInternalMarks,
  FacultyAssignment,
  getInternalMarksForClass,
  InternalMarkStudent
} from "../../utils/faculty_api";
import { useFacultyAssignmentsQuery } from "../../hooks/useApiQueries";

const MySwal = withReactContent(Swal);

// Constants for validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const REQUIRED_HEADERS = ['usn', 'name', 'marks'];
const MAX_RECORDS = 500;
const SAMPLE_ROW = ['1AM22CI064', 'Amit Kumar', '85/100'];

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
  const studentsPerPage = 10;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tabValue, setTabValue] = useState("manual");
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Update dropdown data when assignments change
  useEffect(() => {
    const branches = Array.from(
      new Map(assignments.map(a => [a.branch_id, { id: a.branch_id, name: a.branch }])).values()
    );
    setDropdownData(prev => ({ ...prev, branch: branches }));
  }, [assignments]);

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
    const testMap: Record<string, number> = { IA1: 1, IA2: 2, IA3: 3, SEE: 4 };
    const test_number = testMap[testType] || 1;
    try {
      const res = await uploadInternalMarks({
        branch_id: branch_id.toString(),
        semester_id: semester_id.toString(),
        section_id: section_id.toString(),
        subject_id: subject_id.toString(),
        test_number,
        marks: students.map((s) => ({
          student_id: s.id.toString(),
          mark: parseInt(s.marks || "0"),
        })),
      });
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
      let data: any[] = [];
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
      const header = data[0]?.map((cell: any) => String(cell).trim().toLowerCase());
      const expectedHeader = REQUIRED_HEADERS.map(h => h.toLowerCase());
      if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) {
        setErrorMessage('Invalid header. Required: usn, name, marks');
        return;
      }
      const firstRow = data[1]?.map((cell: any) => String(cell).trim());
      if (!firstRow || firstRow.length < 3) {
        setErrorMessage("Invalid first row. It must contain at least 3 values: USN, Name, and Marks.");
        return;
      }
      if (!firstRow[0]?.trim()) {
        setErrorMessage("USN in the first row is empty.");
        return;
      }
      const [usn, name, marksStr] = firstRow;
      const [marks, total] = marksStr.split("/").map((s: string) => s.trim());
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
        const studentsData = data.slice(1).map((row: any[]) => {
          const [usn, name, marksStr] = row;
          const [marks, total] = marksStr.split("/").map((s: string) => s.trim());
          const normalizedMarks = normalizeMarks(marks);
          if (!validateMarks(normalizedMarks, total)) {
            throw new Error(`Invalid marks or total for student ${name}`);
          }
          const studentId = usnToIdMap.get(usn.toUpperCase());
          if (!studentId) {
            throw new Error(`Student with USN ${usn} not found in the selected class.`);
          }
          return {
            id: studentId,
            usn: usn.toUpperCase(),
            name,
            marks: normalizedMarks,
            total,
            isEditing: false,
          };
        });
        setStudents(studentsData);
        setCurrentPage(1);
        setTabValue("manual");
        setErrorMessage("");
      } catch (err: any) {
        setErrorMessage(err.message);
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
      const event = { target: { files: [file] } } as React.ChangeEvent<HTMLInputElement>;
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
      setLoadingStudents(true);
      try {
        const assignment = assignments.find(a =>
          a.branch_id === branch_id &&
          a.semester_id === semester_id &&
          a.section_id === section_id &&
          a.subject_id === subject_id
        );
        if (!assignment) throw new Error("Assignment not found");
        const testMap: Record<string, number> = { IA1: 1, IA2: 2, IA3: 3, SEE: 4 };
        const test_number = testMap[testType] || 1;
        const marksList: InternalMarkStudent[] = await getInternalMarksForClass(
          branch_id,
          semester_id,
          section_id,
          subject_id,
          test_number
        );
        setStudents(marksList.map(s => ({
          id: s.id,
          name: s.name,
          usn: s.usn,
          marks: s.mark !== '' ? normalizeMarks(s.mark.toString()) : '',
          total: s.max_mark.toString(),
          isEditing: false
        })));
        setCurrentPage(1);
      } catch (err: any) {
        setStudents([]);
        setErrorMessage(err?.message || "Failed to fetch students/marks");
      }
      setLoadingStudents(false);
    }
  };

  return (
    <Card className="bg-[#1c1c1e] text-gray-200 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Upload Marks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select onValueChange={value => handleSelectChange('branch_id', Number(value))}>
            <SelectTrigger className="bg-[#232326] text-gray-200">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent className="bg-[#232326] text-gray-200">
              {dropdownData.branch.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={value => handleSelectChange('semester_id', Number(value))}>
            <SelectTrigger className="bg-[#232326] text-gray-200">
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent className="bg-[#232326] text-gray-200">
              {dropdownData.semester.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={value => handleSelectChange('section_id', Number(value))}>
            <SelectTrigger className="bg-[#232326] text-gray-200">
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent className="bg-[#232326] text-gray-200">
              {dropdownData.section.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={value => handleSelectChange('subject_id', Number(value))}>
            <SelectTrigger className="bg-[#232326] text-gray-200">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent className="bg-[#232326] text-gray-200">
              {dropdownData.subject.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={value => handleSelectChange('testType', value)}>
            <SelectTrigger className="bg-[#232326] text-gray-200">
              <SelectValue placeholder="Select TestType" />
            </SelectTrigger>
            <SelectContent className="bg-[#232326] text-gray-200">
              {dropdownData.testType.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Tabs value={tabValue} onValueChange={setTabValue} className="text-gray-200">
          <TabsList className="mt-2 bg-[#232326] text-gray-200 rounded-md">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="manual">
            <div className="border border-[#2e2e30] rounded-lg overflow-hidden bg-[#1c1c1e]">
              <div className="grid grid-cols-5 bg-[#1c1c1e] font-semibold text-sm p-2 border-b border-[#2e2e30]">
                <div>#</div>
                <div>USN</div>
                <div>Name</div>
                <div>Marks</div>
                <div>Action</div>
              </div>
              {loadingStudents ? (
                <div className="text-center text-gray-400 text-sm p-4">Loading students...</div>
              ) : currentStudents.length === 0 ? (
                <div className="text-center text-gray-400 text-sm p-4">
                  No students found for selected criteria.
                </div>
              ) : (
                currentStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className="grid grid-cols-5 items-center p-2 border-b border-[#2e2e30] text-sm"
                  >
                    <div>{indexOfFirstStudent + index + 1}</div>
                    <div>{student.usn}</div>
                    <div>{student.name}</div>
                    <div className="flex items-center gap-1">
                      {student.isEditing ? (
                        <>
                          <Input
                            type="text"
                            value={student.marks}
                            onChange={(e) => handleMarksChange(index, "marks", e.target.value)}
                            className="w-16 h-8 bg-[#1c1c1e] border border-[#2e2e30] text-gray-200"
                            placeholder="Marks"
                          />
                          <span>/</span>
                          <Input
                            type="text"
                            value={student.total}
                            onChange={(e) => handleMarksChange(index, "total", e.target.value)}
                            className="w-16 h-8 bg-[#1c1c1e] border border-[#2e2e30] text-gray-200"
                            placeholder="Total"
                          />
                        </>
                      ) : (
                        <span>
                          {student.marks && student.total ? `${student.marks} / ${student.total}` : "—"}
                        </span>
                      )}
                    </div>
                    <div>
                      {student.isEditing ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border border-[#3b82f6] text-blue-400 hover:bg-blue-500/20"
                          onClick={() => saveRow(index)}
                        >
                          Save
                        </Button>
                      ) : (
                        <Pencil
                          className="w-4 h-4 cursor-pointer text-gray-400 hover:text-gray-200"
                          onClick={() => toggleEdit(index)}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-between items-center mt-4 px-2 text-sm text-gray-300">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="file">
            <div className="bg-[#232326] border border-[#2e2e30] rounded-lg p-6 max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Upload User Data</h2>
                <p className="text-sm text-gray-400">Upload CSV or Excel files to bulk enroll users</p>
              </div>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border rounded-md p-6 text-center space-y-4 transition-all duration-300 ${
                  dragActive
                    ? "border-blue-400 bg-blue-900/30"
                    : "border-dashed border-[#2e2e30] bg-[#1c1c1e]"
                }`}
              >
                <UploadCloud
                  className={`mx-auto h-8 w-8 text-gray-400 transition-transform duration-300 ${
                    dragActive ? "scale-110 rotate-6 text-blue-400" : ""
                  }`}
                />
                <p className="text-sm text-gray-300">Drag & drop file here</p>
                <p className="text-xs text-gray-500">Supports CSV, XLS, XLSX (max 5MB)</p>
                {!selectedFile ? (
                  <div className="flex justify-center">
                    <button
                      onClick={() => document.getElementById("fileInput")?.click()}
                      className="bg-transparent text-sm border border-[#2e2e30] px-4 py-2 rounded-md hover:bg-[#2c2c2e] transition"
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
                    <p className="text-sm text-green-400">{selectedFile.name}</p>
                    <Button variant="ghost" size="sm" onClick={handleClearFile}>
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-200" />
                    </Button>
                  </div>
                )}
              </div>
              {errorMessage && (
                <div className="text-red-400 text-sm font-medium text-center bg-red-900/30 border border-red-800 p-2 rounded-md">
                  {errorMessage}
                </div>
              )}
              <div className="text-sm text-gray-300 space-y-1">
                <p className="font-semibold">Upload Instructions</p>
                <ul className="list-disc list-inside text-gray-400">
                  <li>Use the provided template for proper data formatting</li>
                  <li>
                    Required columns: <strong>usn</strong>, <strong>name</strong>, <strong>marks</strong>
                  </li>
                  <li>Maximum 500 records per file</li>
                </ul>
                <button
                  onClick={handleDownloadTemplate}
                  className="text-blue-400 hover:underline text-sm"
                >
                  Download Template
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end mt-4">
          <Button className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500" onClick={handleSubmit} disabled={savingMarks}>
            {savingMarks ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Marks"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadMarks;
