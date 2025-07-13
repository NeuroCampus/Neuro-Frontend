import { useState } from "react";
import { Pencil } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const MySwal = withReactContent(Swal);

// Constants for validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const REQUIRED_HEADERS = ['usn', 'name', 'marks']; // Updated to match sample data format
const MAX_RECORDS = 500;
const SAMPLE_ROW = ['CS001', 'Amit Kumar', '85/100']; // Example row for validation

const fetchStudentData = (branch: string, subject: string, section: string, semester: string, testType: string) => {
  const mockData = {
    "CSE-DSA-A-5-IA1": [
      { usn: "CS001", name: "Amit Kumar", marks: "", total: "100", isEditing: false },
      { usn: "CS002", name: "Priya Sharma", marks: "", total: "100", isEditing: false },
    ],
    "ECE-OS-B-6-IA2": [
      { usn: "EC001", name: "Rahul Verma", marks: "", total: "100", isEditing: false },
      { usn: "EC002", name: "Ananya Patel", marks: "", total: "100", isEditing: false },
    ],
    // Add more mock data as needed
  };

  const key = `${branch}-${subject}-${section}-${semester}-${testType}`;
  return mockData[key] || [];
};

const UploadMarks = () => {
  const [dropdownData, setDropdownData] = useState({
    branch: ["CSE", "ECE", "ME", "CE"],
    subject: ["DSA", "DBMS", "OS", "CN"],
    section: ["A", "B", "C"],
    semester: ["1", "2", "3", "4", "5", "6", "7", "8"],
    testType: ["IA1", "IA2", "IA3", "SEE"],
  });

  const [selected, setSelected] = useState({
    branch: "",
    subject: "",
    section: "",
    semester: "",
    testType: "",
  });

  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tabValue, setTabValue] = useState("manual");
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleSubmit = () => {
    MySwal.fire({
      title: "Marks Saved!",
      icon: "success",
      confirmButtonText: "OK",
    });
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

    reader.onload = (event) => {
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

  const handleSelectChange = (field: string, value: string) => {
    const updated = { ...selected, [field]: value };
    setSelected(updated);

    const { branch, subject, section, semester, testType } = updated;
    if (branch && subject && section && semester && testType) {
      const newStudents = fetchStudentData(branch, subject, section, semester, testType);
      setStudents(newStudents);
      setCurrentPage(1);
    }
  };

  return (
    <Card className="bg-white text-black shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Upload Marks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(dropdownData).map(([key, values]) => (
            <Select key={key} onValueChange={(value) => handleSelectChange(key, value)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${key[0].toUpperCase() + key.slice(1)}`} />
              </SelectTrigger>
              <SelectContent>
                {values.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
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
              {currentStudents.map((student, index) => (
                <div key={student.usn} className="grid grid-cols-5 items-center p-2 border-b text-sm">
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
              ))}
              {currentStudents.length === 0 && (
                <div className="text-center text-gray-500 text-sm p-4">
                  No students found for selected criteria.
                </div>
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
          <Button onClick={handleSubmit}>Save Marks</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadMarks;
