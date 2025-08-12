
import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Upload, X } from "lucide-react";
import clsx from "clsx";
import { bulkUploadFaculty } from "../../utils/admin_api";
import { useToast } from "../../hooks/use-toast";

const API_BASE_URL = "http://127.0.0.1:8000";
const REQUIRED_HEADERS = ["name", "email"]; // Updated to match backend

interface BulkUploadProps {
  setError: (error: string | null) => void;
  toast: (options: any) => void;
}

const BulkUpload = ({ setError, toast }: BulkUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const headers = text.slice(0, text.indexOf("\n")).split(",");
        const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
        if (missingHeaders.length > 0) {
          reject(`Missing required column(s): ${missingHeaders.join(", ")}`);
        } else {
          resolve(true);
        }
      };
      reader.onerror = () => reject("Failed to read file");
      reader.readAsText(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file to upload",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await validateFile(file);
      const response = await bulkUploadFaculty(file);
      if (response.success) {
        toast({ title: "Success", description: "Faculty list uploaded successfully" });
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
      } else {
        setError(response.message || "Failed to upload file");
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to upload file",
        });
      }
    } catch (err: any) {
      setError(err || "Network error while uploading file");
      toast({
        variant: "destructive",
        title: "Error",
        description: err || "Network error while uploading file",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `name,email\nJohn Doe,john@example.com\nJane Smith,jane@example.com`; // Updated template
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "faculty_template.csv");
    link.click();
  };

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <Card className="bg-text-gray-800 shadow-md border border-gray-700 text-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold ">Upload User Data</CardTitle>
          <CardDescription className="text-sm text-gray-400">
            Upload CSV or Excel files to bulk enroll users
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onClick={() => inputRef.current?.click()}
            className={clsx(
              "border-2 border-dashed rounded-md px-6 py-10 text-center cursor-pointer transition-all duration-200 relative",
              dragActive
                ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-400"
            )}
          >
            <Upload className="mx-auto mb-2 text-gray-400" size={28} />
            <p className="text-gray-400">Drag & drop file here</p>
            <p className="text-xs text-gray-400">Supports CSV, XLS, XLSX (max 5MB)</p>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
              >
                Select File
              </Button>
            </div>
            {file && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-sm text-gray-400">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <Input
              ref={inputRef}
              id="file"
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <Button
            className="w-full text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
            onClick={handleUpload}
            disabled={loading || !file}
          >
            {loading ? "Uploading..." : "Upload File"}
          </Button>

          <div>
            <p className="font-medium mb-2">Upload Instructions</p>
            <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1 ">
              <li>Use the provided template for proper data formatting</li>
              <li>Required columns: name, email</li>
              <li>role not required, defaults to teacher</li>
              <li>Maximum 500 records per file</li>
              <li>
                <button
                  onClick={handleDownloadTemplate}
                  className="text-blue-600 hover:underline"
                >
                  Download Template
                </button>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkUpload;