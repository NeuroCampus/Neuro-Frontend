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
import { getStudentsForClass, ClassStudent, uploadInternalMarks, getFacultyAssignments, FacultyAssignment, getInternalMarksForClass, InternalMarkStudent } from "../../utils/faculty_api";

const MySwal = withReactContent(Swal);

// Constants for validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const REQUIRED_HEADERS = ['usn', 'name', 'marks']; // Updated to match sample data format
const MAX_RECORDS = 500;
const SAMPLE_ROW = ['CS001', 'Amit Kumar', '85/100']; // Example row for validation

const UploadMarks = () => {
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
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

  useEffect(() => {
    // Fetch assignments on mount
    getFacultyAssignments().then(res => {
      if (res.success && res.data) {
        setAssignments(res.data);
        // Populate unique branches (id + name)
        const branches = Array.from(
          new Map(res.data.map(a => [a.branch_id, { id: a.branch_id, name: a.branch }])).values()
        );
        setDropdownData(prev => ({ ...prev, branch: branches }));
      }
    });
  }, []);

  const handleMarksChange = (index: number, field: "marks" | "total", value: string) => {
    if (/^\d*$/.test(value)) {
      const actualIndex = (currentPage - 1) * studentsPerPage + index;
      setStudents((prev) =>
        prev.map((student, i) =>
          i === actualIndex ? { ...student, [field]: value } : student
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
    // Validate selection
    const { branch_id, subject_id, section_id, semester_id, testType } = selected;
    if (!branch_id || !subject_id || !section_id || !semester_id || !testType) {
      MySwal.fire({
        title: "Select all class and test details!",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }
    // Map testType to test_number (e.g., IA1=1, IA2=2, IA3=3, SEE=4)
    const testMap: Record<string, number> = { IA1: 1, IA2: 2, IA3: 3, SEE: 4 };
    const test_number = testMap[testType] || 1;
    // Prepare marks array
    const marks = students.map((s) => ({
      student_id: s.id.toString(),
      mark: parseInt(s.marks || "0"),
    }));
    try {
      const res = await uploadInternalMarks({
        branch_id: branch_id.toString(),
        semester_id: semester_id.toString(),
        section_id: section_id.toString(),
        subject_id: subject_id.toString(),
        test_number,
        marks,
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Validate size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('File size exceeds the 5MB limit.');
      return;
    }

    // 2. Determine file type
    const isCSV = file.name.endsWith('.csv');
    const isExcel = file.name.endsWith('.xls') || file.name.endsWith('.xlsx');

    if (!isCSV && !isExcel) {
      setErrorMessage('Unsupported file type. Please upload CSV or Excel file.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");

    // 3. Parse and validate
    const reader = new FileReader();

    reader.onload = async (event) => {
      let data;
      if (isCSV) {
        // Parse CSV
        const text = event.target.result;
        const parsed = Papa.parse(text, { skipEmptyLines: true });
        data = parsed.data;
      } else {
        // Parse Excel
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
      }

      // 4. Validate header
      const header = data[0]?.map(cell => String(cell).trim().toLowerCase());
      const expectedHeader = REQUIRED_HEADERS.map(h => h.toLowerCase());
      if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) {
        setErrorMessage('Invalid header. Required: usn, name, marks');
        return;
      }

      // 5. Validate first row
      const firstRow = data[1]?.map(cell => String(cell).trim());

      if (!firstRow || firstRow.length < 3) {
        setErrorMessage(
          "Invalid first row. It must contain at least 3 values: USN, Name, and Marks."
        );
        return;
      }

      if (firstRow[0] !== SAMPLE_ROW[0]) {
        setErrorMessage(`Invalid USN in first row. Expected: ${SAMPLE_ROW[0]}`);
        return;
      }

      if (firstRow[1] !== SAMPLE_ROW[1]) {
        setErrorMessage(`Invalid Name in first row. Expected: ${SAMPLE_ROW[1]}`);
        return;
      }

      if (isNaN(firstRow[2].split('/')[0]) || isNaN(firstRow[2].split('/')[1])) {
        setErrorMessage(`Invalid Marks or Total in first row. Expected: Numeric values`);
        return;
      }

      // 6. Validate max records
      const recordCount = data.length - 1; // exclude header
      if (recordCount > MAX_RECORDS) {
        setErrorMessage('File contains more than 500 records.');
        return;
      }

      // Transform data to match the manual entry format
      const studentsData = data.slice(1).map(row => ({
        usn: row[0],
        name: row[1],
        marks: row[2].split('/')[0],
        total: row[2].split('/')[1],
        isEditing: false,
      }));

      // If all validations pass
      setStudents(studentsData);

      // After validation, upload to backend
      const { branch, semester, section, subject, testType } = selected;
      if (!branch || !semester || !section || !subject || !testType) {
        setErrorMessage("Select all class and test details before uploading.");
        return;
      }
      const testMap = { IA1: 1, IA2: 2, IA3: 3, SEE: 4 };
      const test_number = testMap[testType] || 1;
      const assignment = assignments.find(a => a.branch === branch && a.semester.toString() === semester && a.section === section && a.subject_name === subject);
      if (!assignment) {
        setErrorMessage("Assignment not found for upload.");
        return;
      }
      const branch_id = branch.toString();
      const semester_id = semester.toString();
      const section_id = section.toString();
      const subject_id = assignment.subject_code.toString();
      if (isNaN(parseInt(subject_id))) {
        setErrorMessage("Subject ID must be numeric. Please check your assignments data.");
        setLoadingStudents(false);
        return;
      }
      try {
        const res = await uploadInternalMarks({
          branch_id: branch_id.toString(),
          semester_id: semester_id.toString(),
          section_id: section_id.toString(),
          subject_id: subject_id.toString(),
          test_number,
          file,
        });
        if (res.success) {
          MySwal.fire({ title: "Marks uploaded!", icon: "success", confirmButtonText: "OK" });
        } else {
          setErrorMessage(res.message || "Upload failed");
        }
      } catch (err) {
        setErrorMessage("Network error during upload");
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

  const handleUpload = () => {
    if (!selectedFile) {
      setErrorMessage("No file selected.");
      return;
    }

    const fileType = selectedFile.name.split(".").pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        console.log("File content:", content);

        // You can parse CSV here and convert to attendance records
        const rows = content.split("\n").map(row => row.split(","));
        console.log("Parsed rows:", rows);
        alert(`Successfully parsed ${rows.length} rows!`);
      }
    };

    if (fileType === "csv") {
      reader.readAsText(selectedFile);
    } else {
      setErrorMessage("Only CSV file type is supported for now.");
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      ['usn', 'name', 'marks'],  // Headers
      ['CS001', 'Amit Kumar', '85/100'],
      // Add more sample data rows as needed
    ]
      .map((row) => row.join(','))
      .join('\n');

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create a download link and trigger it
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template.csv'); // Filename for download
    link.click();

    // Clean up the URL object
    URL.revokeObjectURL(url);
  };

  const TemplateDownload = () => (
    <div>
      <button onClick={handleDownloadTemplate} className="text-blue-600 underline text-sm">
        Download Template
      </button>
    </div>
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    // logic from handleFileChange, separated out for reuse
    const event = { target: { files: [file] } };
    handleFileChange(event);
  };

  const handleSelectChange = async (field: string, value: string | number) => {
    setErrorMessage(""); // Clear previous error
    const updated = { ...selected };
    if (field.endsWith('_id')) {
      updated[field] = value as number;
      // Also update the corresponding name field
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

    // Dynamically update dependent dropdowns
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

    // Only fetch students and marks if all required fields are selected
    const { branch_id, semester_id, section_id, subject_id, testType } = { ...updated };
    if (branch_id && semester_id && section_id && subject_id && testType) {
      setLoadingStudents(true);
      try {
        // Find the assignment by IDs
        const assignment = assignments.find(a => a.branch_id === branch_id && a.semester_id === semester_id && a.section_id === section_id && a.subject_id === subject_id);
        console.log('Selected IDs:', { branch_id, semester_id, section_id, subject_id });
        console.log('Assignment:', assignment);
        if (!assignment) throw new Error("Assignment not found");
        // Map testType to test_number
        const testMap: Record<string, number> = { IA1: 1, IA2: 2, IA3: 3, SEE: 4 };
        const test_number = testMap[testType] || 1;
        // Fetch students and their marks for this test
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
          marks: s.mark !== '' ? s.mark.toString() : '',
          total: s.max_mark.toString(),
          isEditing: false
        })));
        setCurrentPage(1);
      } catch (err) {
        setStudents([]);
        setErrorMessage(err?.message || "Failed to fetch students/marks");
      }
      setLoadingStudents(false);
    }
  };

  return (
    <Card className="bg-white text-black shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Upload Marks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Branch Dropdown */}
          <Select onValueChange={value => handleSelectChange('branch_id', Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {dropdownData.branch.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Semester Dropdown */}
          <Select onValueChange={value => handleSelectChange('semester_id', Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              {dropdownData.semester.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Section Dropdown */}
          <Select onValueChange={value => handleSelectChange('section_id', Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent>
              {dropdownData.section.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Subject Dropdown */}
          <Select onValueChange={value => handleSelectChange('subject_id', Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {dropdownData.subject.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Test Type Dropdown */}
          <Select onValueChange={value => handleSelectChange('testType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select TestType" />
            </SelectTrigger>
            <SelectContent>
              {dropdownData.testType.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabsList className="mt-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-5 bg-gray-100 font-semibold text-sm p-2 border-b">
                <div>#</div>
                <div>USN</div>
                <div>Name</div>
                <div>Marks</div>
                <div>Action</div>
              </div>
              {loadingStudents ? (
                <div className="text-center text-gray-500 text-sm p-4">Loading students...</div>
              ) : currentStudents.length === 0 ? (
                <div className="text-center text-gray-500 text-sm p-4">
                  No students found for selected criteria.
                </div>
              ) : (
                currentStudents.map((student, index) => (
                  <div key={student.id} className="grid grid-cols-5 items-center p-2 border-b text-sm">
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
                            className="w-16 h-8"
                            placeholder="Marks"
                          />
                          <span>/</span>
                          <Input
                            type="text"
                            value={student.total}
                            onChange={(e) => handleMarksChange(index, "total", e.target.value)}
                            className="w-16 h-8"
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
                        <Button size="sm" variant="outline" onClick={() => saveRow(index)}>
                          Save
                        </Button>
                      ) : (
                        <Pencil
                          className="w-4 h-4 cursor-pointer text-gray-600 hover:text-black"
                          onClick={() => toggleEdit(index)}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center mt-4 px-2 text-sm">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="file">
            <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Upload User Data</h2>
                <p className="text-sm text-gray-600">
                  Upload CSV or Excel files to bulk enroll users
                </p>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border rounded-md p-6 text-center space-y-4 transition-all duration-300 ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-dashed border-gray-300 bg-white"
                }`}
              >
                <UploadCloud
                  className={`mx-auto h-8 w-8 text-gray-400 transition-transform duration-300 ${
                    dragActive ? "scale-110 rotate-6 text-blue-400" : ""
                  }`}
                />
                <p className="text-sm text-gray-700">Drag & drop file here</p>
                <p className="text-xs text-gray-500">
                  Supports CSV, XLS, XLSX (max 5MB)
                </p>

                {!selectedFile ? (
                  <div className="flex justify-center">
                    <button
                      onClick={() => document.getElementById("fileInput")?.click()}
                      className="bg-transparent text-sm border px-4 py-2 rounded-md hover:bg-gray-100 transition"
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
                    <p className="text-sm text-green-600">{selectedFile.name}</p>
                    <Button variant="ghost" size="sm" onClick={handleClearFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Error message */}
              {errorMessage && (
                <div className="text-red-600 text-sm font-medium text-center bg-red-50 border border-red-200 p-2 rounded-md">
                  {errorMessage}
                </div>
              )}

              <Button className="w-full" onClick={handleUpload} disabled={!selectedFile}>
                Upload File
              </Button>

              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">Upload Instructions</p>
                <ul className="list-disc list-inside text-gray-600">
                  <li>Use the provided template for proper data formatting</li>
                  <li>
                    Required columns: <strong>usn</strong>, <strong>name</strong>,{" "}
                    <strong>marks</strong>
                  </li>
                  <li>Maximum 500 records per file</li>
                </ul>
                <button
                  onClick={handleDownloadTemplate}
                  className="text-blue-600 underline text-sm"
                >
                  Download Template
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button onClick={handleSubmit} disabled={savingMarks}>
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
