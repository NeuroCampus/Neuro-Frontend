import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Download, FileText, UploadCloud, X } from "lucide-react";
import { uploadStudyMaterial, getStudyMaterials } from "../../utils/hod_api";
import { useTheme } from "../../context/ThemeContext";

// Interface for study material from API
interface ApiStudyMaterial {
  id: string;
  title: string;
  subject_name: string;
  subject_code: string;
  semester_id: string;
  branch_id: string;
  uploaded_by: string;
  uploaded_at: string;
  file_url: string;
  drive_file_id?: string | null;
  drive_web_view_link?: string | null;
}

// Interface for display study material
interface StudyMaterial {
  id: string;
  title: string;
  subject_name: string;
  subject_code: string;
  semester: number | null;
  branch: string | null;
  uploaded_by: string;
  uploaded_at: string;
  file_url: string;
}

// Hook for managing study materials
const useStudyMaterials = () => {
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        // We need to pass branch_id to getStudyMaterials, but we don't have it here
        // For now, we'll just initialize with an empty array
        // In a real implementation, this would be fetched from the user's profile or context
        setStudyMaterials([]);
      } catch (error) {
        console.error("Error fetching study materials:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const addStudyMaterial = (material: StudyMaterial) => {
    setStudyMaterials([...studyMaterials, material]);
  };

  return { studyMaterials, addStudyMaterial, loading };
};

// Hook for managing upload modal
const useUploadModal = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setSubjectName("");
    setSubjectCode("");
    setSemesterId("");
    setBranchId("");
  };

  return {
    showUploadModal,
    setShowUploadModal,
    file,
    title,
    subjectName,
    subjectCode,
    semesterId,
    branchId,
    uploading,
    setUploading,
    handleFileChange,
    setTitle,
    setSubjectName,
    setSubjectCode,
    setSemesterId,
    setBranchId,
    resetForm,
  };
};

// Row component for each study material
const StudyMaterialRow = ({ material, theme }: { material: StudyMaterial; theme: string }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-7 gap-2 items-center text-sm py-2 ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}>
    <div className="flex items-center">
      <FileText className="text-red-500" size={20} />
    </div>
    <div className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} font-medium cursor-pointer hover:underline truncate`}>
      {material.title}
    </div>
    <div className={`truncate ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{material.subject_name}</div>
    <div className={`truncate ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{material.subject_code}</div>
    <div className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>{material.semester || "N/A"}</div>
    <div className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>{material.uploaded_by}</div>
    <div>
      <a href={material.file_url} download={material.title + ".pdf"} target="_blank" rel="noopener noreferrer">
        <Download className={`cursor-pointer ${theme === 'dark' ? 'text-muted-foreground hover:text-foreground' : 'text-gray-500 hover:text-gray-700'}`} size={20} />
      </a>
    </div>
  </div>
);

// Main component
const StudyMaterials = () => {
  const { theme } = useTheme();
  const { studyMaterials, addStudyMaterial, loading } = useStudyMaterials();
  const {
    showUploadModal,
    setShowUploadModal,
    file,
    title,
    subjectName,
    subjectCode,
    semesterId,
    branchId,
    uploading,
    setUploading,
    handleFileChange,
    setTitle,
    setSubjectName,
    setSubjectCode,
    setSemesterId,
    setBranchId,
    resetForm,
  } = useUploadModal();

  const [searchQuery, setSearchQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("All Semesters");

  // Mock semester options
  const semesters = ["All Semesters", "1", "2", "3", "4", "5", "6", "7", "8"];
  // TODO: Fetch semesters from API in production

  const handleUpload = async () => {
    if (!file || !title) {
      alert("Please provide a title and select a file.");
      return;
    }

    if (!branchId || !semesterId) {
      alert("Please provide branch ID and semester ID.");
      return;
    }

    setUploading(true);
    try {
      const response = await uploadStudyMaterial({
        title,
        subject_name: subjectName,
        subject_code: subjectCode,
        semester_id: semesterId,
        branch_id: branchId,
        file,
      });

      if (response.success && response.data) {
        const apiMaterial: ApiStudyMaterial = response.data;
        const newMaterial: StudyMaterial = {
          id: apiMaterial.id,
          title: apiMaterial.title,
          subject_name: apiMaterial.subject_name,
          subject_code: apiMaterial.subject_code,
          semester: (apiMaterial.semester_id ? parseInt(apiMaterial.semester_id) || null : (apiMaterial.semester ? parseInt(apiMaterial.semester as any) || null : null)),
          branch: apiMaterial.branch_id || apiMaterial.branch || null,
          uploaded_by: apiMaterial.uploaded_by,
          uploaded_at: apiMaterial.uploaded_at,
          // Prefer Drive web view link when available
          file_url: apiMaterial.drive_web_view_link || apiMaterial.file_url,
        };
        addStudyMaterial(newMaterial);
        resetForm();
        setShowUploadModal(false);
      } else {
        alert(response.message || "Upload failed");
      }
    } catch (error) {
      alert("Error uploading material");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // Filter materials
  const filteredMaterials = studyMaterials.filter(
    (material) =>
      (material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (material.semester?.toString() || "").includes(searchQuery.toLowerCase()) ||
        material.uploaded_by.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (semesterFilter === "All Semesters" || material.semester?.toString() === semesterFilter)
  );

  return (
    <div className={`w-full p-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h1 className="text-xl font-semibold">Study Materials</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all duration-200 ease-in-out transform hover:scale-105 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white ${theme === 'dark' ? 'shadow-lg shadow-[#a259ff]/20' : 'shadow-md'}`}
          disabled={uploading}
        >
          <UploadCloud size={16} />
          Upload
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by title, course name, course code, semester, or uploaded by..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`flex-1 px-3 py-2 rounded outline-none focus:ring-2 border ${theme === 'dark' ? 'bg-background text-foreground border-border focus:ring-primary' : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'}`}
        />
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className={`border rounded px-3 py-2 ${theme === 'dark' ? 'border-border bg-background text-foreground' : 'border-gray-300 bg-white text-gray-900'}`}
        >
          {semesters.map((semester) => (
            <option key={semester} value={semester} className={theme === 'dark' ? 'bg-background text-foreground' : 'bg-white text-gray-900'}>
              {semester}
            </option>
          ))}
        </select>
      </div>

      <Card className={theme === 'dark' ? 'bg-card border-border text-foreground' : 'bg-white border-gray-200 text-gray-900'}>
        <CardHeader>
          <div className={`grid grid-cols-1 sm:grid-cols-7 font-semibold text-sm gap-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
            <div>Type</div>
            <div>Title</div>
            <div>Course Name</div>
            <div>Course Code</div>
            <div>Semester</div>
            <div>Uploaded By</div>
            <div>Action</div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {loading ? (
            <div className={`text-center py-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Loading...</div>
          ) : filteredMaterials.length === 0 ? (
            <div className={`text-center py-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No study materials found.</div>
          ) : (
            filteredMaterials.map((material) => (
              <StudyMaterialRow key={material.id} material={material} theme={theme} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 ">
          <div className={`rounded-lg p-6 w-full max-w-md border ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Upload Study Material</h2>
              <button onClick={() => setShowUploadModal(false)} disabled={uploading}>
                <X className={theme === 'dark' ? 'text-muted-foreground hover:text-foreground' : 'text-gray-400 hover:text-gray-700'} />
              </button>
            </div>

            {/* Input fields */}
            <div className="grid gap-3 mb-4">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`px-3 py-2 rounded outline-none focus:ring-2 ${theme === 'dark' ? 'bg-background text-foreground border-border focus:ring-primary' : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'}`}
                disabled={uploading}
              />
              <input
                type="text"
                placeholder="Course Name"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className={`px-3 py-2 rounded outline-none focus:ring-2 ${theme === 'dark' ? 'bg-background text-foreground border-border focus:ring-primary' : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'}`}
                disabled={uploading}
              />
              <input
                type="text"
                placeholder="Course Code"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                className={`px-3 py-2 rounded outline-none focus:ring-2 ${theme === 'dark' ? 'bg-background text-foreground border-border focus:ring-primary' : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'}`}
                disabled={uploading}
              />
              <input
                type="text"
                placeholder="Semester ID"
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                className={`px-3 py-2 rounded outline-none focus:ring-2 ${theme === 'dark' ? 'bg-background text-foreground border-border focus:ring-primary' : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'}`}
                disabled={uploading}
              />
              <input
                type="text"
                placeholder="Branch ID"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className={`px-3 py-2 rounded outline-none focus:ring-2 ${theme === 'dark' ? 'bg-background text-foreground border-border focus:ring-primary' : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'}`}
                disabled={uploading}
              />
            </div>

            {/* File upload box */}
            <div className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'}`}>
              <UploadCloud className={`mx-auto mb-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`} size={40} />
              <p className={`mb-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Drag & drop file here</p>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>Supports PDF, PNG, JPG, JPEG (max 50MB)</p>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
                disabled={uploading}
              />
              <label
                htmlFor="fileInput"
                className={`inline-block px-4 py-2 rounded cursor-pointer ${theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}`}
              >
                {file ? file.name : "Select File"}
              </label>
            </div>

            <button
              onClick={handleUpload}
              className={`w-full py-2 rounded transition-colors disabled:opacity-50 ${theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}`}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterials;