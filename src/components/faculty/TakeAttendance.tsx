import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Check, X, UploadCloud } from "lucide-react";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const mockStudents = {
  "CSE-Maths-A-1": [
    { usn: "CS001", name: "Amit Kumar" },
    { usn: "CS002", name: "Priya Sharma" },
  ],
  "CSE-Physics-B-2": [
    { usn: "CS003", name: "Rahul Verma" },
    { usn: "CS004", name: "Ananya Patel" },
  ],
  "ECE-Maths-A-1": [
    { usn: "EC001", name: "Vikram Singh" },
    { usn: "EC002", name: "Neha Gupta" },
  ],
};

const TakeAttendance = () => {
  const [branch, setBranch] = useState("");
  const [subject, setSubject] = useState("");
  const [section, setSection] = useState("");
  const [semester, setSemester] = useState("");
  const [students, setStudents] = useState<{ usn: string; name: string }[]>([]);
  const [attendance, setAttendance] = useState<{ [usn: string]: boolean }>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const REQUIRED_HEADERS = ['usn', 'name', 'attendance'];
  const SAMPLE_ROW = ['1AM22CI000', 'John Doe', 'Present'];
  const MAX_RECORDS = 500;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (branch && subject && section && semester) {
      const key = `${branch}-${subject}-${section}-${semester}`;
      const studentList = mockStudents[key] || [];
      setStudents(studentList);
      setAttendance({});
    }
  }, [branch, subject, section, semester]);

  const handleAttendance = (usn: string, present: boolean) => {
    setAttendance((prev) => ({ ...prev, [usn]: present }));
  };

  const handleSubmit = () => {
    console.log("Attendance Submitted:", {
      branch,
      subject,
      section,
      semester,
      attendance,
    });
    alert("Attendance submitted successfully!");
  };

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
        setErrorMessage('Invalid header. Required: usn, name, attendance');
        return;
      }

      // 5. Validate first row
      const firstRow = data[1]?.map(cell => String(cell).trim());

      if (!firstRow || firstRow.length < 3) {
        setErrorMessage(
          "Invalid first row. It must contain at least 3 values: USN, Name, and Attendance."
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

      if (!["present", "absent"].includes(firstRow[2]?.toLowerCase())) {
        setErrorMessage(`Invalid Attendance value in first row. Expected: Present or Absent`);
        return;
      }

      // 6. Validate max records
      const recordCount = data.length - 1; // exclude header
      if (recordCount > MAX_RECORDS) {
        setErrorMessage('File contains more than 500 records.');
        return;
      }

      // If all validations pass
      setSelectedFile(file);
      setErrorMessage("");
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
      ['usn', 'name', 'attendance'],  // Headers
      ['1AM22CI000', 'John Doe', 'Present'],
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

  return (
    <div className="space-y-4 p-6 bg-white min-h-screen">
      <Card>
        <CardHeader>
          <CardTitle>Take Attendance</CardTitle>
          <CardDescription>Record student attendance for your classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Select onValueChange={setBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSE">CSE</SelectItem>
                  <SelectItem value="ECE">ECE</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={setSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maths">Maths</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                </SelectContent>
              </Select>
              
            </div>

            <Tabs defaultValue="manual">
              <TabsList>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="ai">AI Processing</TabsTrigger>
              </TabsList>

              <TabsContent value="manual">
                {students.length > 0 ? (
                  <div className="border rounded-md mt-4">
                    <div className="p-4 font-semibold border-b">Student Attendance</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left px-4 py-2">#</th>
                            <th className="text-left px-4 py-2">USN</th>
                            <th className="text-left px-4 py-2">Name</th>
                            <th className="text-left px-4 py-2">Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((s, idx) => (
                            <tr key={s.usn} className="border-t">
                              <td className="px-4 py-2">{idx + 1}</td>
                              <td className="px-4 py-2">{s.usn}</td>
                              <td className="px-4 py-2">{s.name}</td>
                              <td className="px-4 py-2 flex items-center gap-4">
                                <button
                                  onClick={() => handleAttendance(s.usn, true)}
                                  className={`p-1 rounded ${attendance[s.usn] === true ? "bg-green-100" : ""}`}
                                >
                                  <Check className="text-green-500" size={16} />
                                </button>
                                <button
                                  onClick={() => handleAttendance(s.usn, false)}
                                  className={`p-1 rounded ${attendance[s.usn] === false ? "bg-red-100" : ""}`}
                                >
                                  <X className="text-red-500" size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 justify-end flex">
                      <Button onClick={handleSubmit}>Submit Attendance</Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 mt-6">Select class details to load students.</div>
                )}
              </TabsContent>

              <TabsContent value="ai">
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
                        <strong>attendance</strong>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TakeAttendance;
