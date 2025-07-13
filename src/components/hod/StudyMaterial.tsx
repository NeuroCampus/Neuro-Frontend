import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Download, FileText, UploadCloud, X } from "lucide-react";
import { uploadStudyMaterial, getStudyMaterials } from "../../utils/hod_api";

// Interface for study material
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const response = await getStudyMaterials();
        if (response.success && response.data) {
          setStudyMaterials(response.data);
        } else {
          console.error(response.message || "Failed to fetch study materials");
        }
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
const StudyMaterialRow = ({ material }: { material: StudyMaterial }) => (
  <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-center text-sm py-2 border-t border-gray-200">
    <div className="flex items-center">
      <FileText className="text-red-500" size={20} />
    </div>
    <div className="text-blue-600 font-medium cursor-pointer hover:underline truncate">
      {material.title}
    </div>
    <div className="truncate">{material.subject_name}</div>
    <div className="truncate">{material.subject_code}</div>
    <div>{material.semester || "N/A"}</div>
    <div>{material.uploaded_by}</div>
    <div>
      <a href={material.file_url} download={material.title + ".pdf"} target="_blank" rel="noopener noreferrer">
        <Download className="cursor-pointer text-gray-500 hover:text-gray-700" size={20} />
      </a>
    </div>
  </div>
);

// Main component
const StudyMaterials = () => {
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

    setUploading(true);
    try {
      const response = await uploadStudyMaterial({
        title,
        subject_name: subjectName,
        subject_code: subjectCode,
        semester_id: semesterId,
        file,
        branch_id: branchId,
      });

      if (response.success && response.data) {
        const newMaterial: StudyMaterial = {
          id: response.data.material_id,
          title: response.data.title,
          subject_name: subjectName || "N/A",
          subject_code: subjectCode || "N/A",
          semester: semesterId ? parseInt(semesterId) || null : null,
          branch: branchId || null,
          uploaded_by: "HOD",
          uploaded_at: new Date().toISOString(),
          file_url: (response.data as any).file_url ? (response.data as any).file_url : URL.createObjectURL(file),
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
    <div className="w-full p-4 text-gray-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h1 className="text-xl font-semibold">Study Materials</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
          disabled={uploading}
        >
          + Upload
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by title, subject name, subject code, semester, or uploaded by..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-700"
        >
          {semesters.map((semester) => (
            <option key={semester} value={semester}>
              {semester}
            </option>
          ))}
        </select>
      </div>

      <Card className="bg-white border border-gray-200 shadow rounded-lg">
        <CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-7 font-semibold text-gray-500 text-sm gap-2">
            <div>Type</div>
            <div>Title</div>
            <div>Subject Name</div>
            <div>Subject Code</div>
            <div>Semester</div>
            <div>Uploaded By</div>
            <div>Action</div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No study materials found.</div>
          ) : (
            filteredMaterials.map((material) => (
              <StudyMaterialRow key={material.id} material={material} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Upload Study Material</h2>
              <button onClick={() => setShowUploadModal(false)} disabled={uploading}>
                <X className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {/* Input fields */}
            <div className="grid gap-3 mb-4">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
              <input
                type="text"
                placeholder="Subject Name"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
              <input
                type="text"
                placeholder="Subject Code"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
              <input
                type="text"
                placeholder="Semester"
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
              <input
                type="text"
                placeholder="Branch"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
            </div>

            {/* File upload box */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 bg-gray-50">
              <UploadCloud className="mx-auto text-gray-400 mb-2" size={40} />
              <p className="text-gray-600 mb-2">Drag & drop file here</p>
              <p className="text-gray-400 text-sm mb-4">Supports PDF, PNG, JPG, JPEG (max 50MB)</p>
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
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-500"
              >
                {file ? file.name : "Select File"}
              </label>
            </div>

            <button
              onClick={handleUpload}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-600/90 transition-colors disabled:bg-gray-400"
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