import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Download, FileText, UploadCloud, X } from "lucide-react";
import { getStudyMaterials, uploadStudyMaterial, getAssignedSubjectsGrouped, getBranches, getSemesters, getSections, AssignedSubject } from "../../utils/faculty_api";
import { useTheme } from "../../context/ThemeContext";

interface StudyMaterial {
  id: number;
  title: string;
  subject_name: string;
  subject_code: string;
  semester: string;
  uploaded_by: string;
  file_url: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  branch: string;
  semester: string;
  section: string;
}

interface AssignedSection {
  section: string;
  section_id: string;
  semester: number;
  semester_id: string;
  branch: string;
  branch_id: string;
}

const StudyMaterialRow = ({ material, theme }: { material: StudyMaterial; theme: string }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-7 gap-2 items-center text-sm py-2`}>
    <div className="flex items-center">
      <FileText className="text-red-500" size={20} />
    </div>
    <div className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} font-medium cursor-pointer hover:underline truncate`}>
      {material.title}
    </div>
    <div className={`truncate`}>{material.subject_name}</div>
    <div className={`truncate`}>{material.subject_code}</div>
    <div className="">{material.semester || "N/A"}</div>
    <div className="">{material.uploaded_by}</div>
    <div>
      <a href={material.file_url} download={material.title + ".pdf"} target="_blank" rel="noopener noreferrer">
        <Download className={`cursor-pointer text-gray-500 hover:text-gray-700`} size={20} />
      </a>
    </div>
  </div>
);

const StudyMaterialsFaculty = () => {
  const { theme } = useTheme();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grouped, setGrouped] = useState<AssignedSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("All Branches");
  const [selectedSemester, setSelectedSemester] = useState<string>("All Semesters");
  const [selectedSection, setSelectedSection] = useState<string>("All Sections");
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSubject, setUploadSubject] = useState<string>("");
  const [uploadBranch, setUploadBranch] = useState<string>("");
  const [uploadSemester, setUploadSemester] = useState<string>("");
  const [uploadSection, setUploadSection] = useState<string>("");
  const [uploadTitle, setUploadTitle] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [semesters, setSemesters] = useState<{ id: string; number: number }[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    const loadBranches = async () => {
      const resp = await getBranches();
      if (resp && resp.success) {
        setBranches(resp.data || []);
      }
    };
    loadBranches();
  }, []);

  // Load assigned subjects only when upload modal opens
  useEffect(() => {
    if (showUploadModal) {
      const loadAssignments = async () => {
        const resp = await getAssignedSubjectsGrouped();
        if (resp && resp.success) {
          setSubjects(resp.data || []);
          setGrouped(resp.grouped || []);
        }
      };
      loadAssignments();
    }
  }, [showUploadModal]);

  useEffect(() => {
    if (selectedBranch !== "All Branches") {
      const loadSemesters = async () => {
        const resp = await getSemesters(selectedBranch);
        if (resp && resp.success) {
          setSemesters(resp.data || []);
        } else {
          setSemesters([]);
        }
        setSelectedSemester("All Semesters");
        setSections([]);
        setSelectedSection("All Sections");
      };
      loadSemesters();
    } else {
      setSemesters([]);
      setSelectedSemester("All Semesters");
      setSections([]);
      setSelectedSection("All Sections");
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch !== "All Branches" && selectedSemester !== "All Semesters") {
      const loadSections = async () => {
        const resp = await getSections(selectedBranch, selectedSemester);
        if (resp && resp.success) {
          setSections(resp.data || []);
        } else {
          setSections([]);
        }
        setSelectedSection("All Sections");
      };
      loadSections();
    } else {
      setSections([]);
      setSelectedSection("All Sections");
    }
  }, [selectedBranch, selectedSemester]);

  const loadMaterials = async () => {
    const resp = await getStudyMaterials(selectedBranch === 'All Branches' ? undefined : selectedBranch, selectedSemester === 'All Semesters' ? undefined : selectedSemester, selectedSection === 'All Sections' ? undefined : selectedSection, searchQuery || undefined);
    if (resp && resp.success && Array.isArray(resp.data?.results || resp.data)) {
      setMaterials(resp.data.results || resp.data || []);
    } else if (resp && resp.success && Array.isArray(resp.data)) {
      setMaterials(resp.data);
    } else {
      setMaterials([]);
    }
    setHasSearched(true);
  };

  // Auto-load materials when all filters are selected
  useEffect(() => {
    if (selectedBranch !== "All Branches" && selectedSemester !== "All Semesters" && selectedSection !== "All Sections") {
      loadMaterials();
    }
  }, [selectedBranch, selectedSemester, selectedSection, searchQuery]);

  return (
    <div className={`w-full p-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h1 className="text-xl font-semibold">Study Materials</h1>
        <button onClick={() => setShowUploadModal(true)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 bg-[#a259ff] text-white`}>
          <UploadCloud size={16} /> Upload
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by title, course name, course code, semester, or uploaded by..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`flex-1 px-3 py-2 border rounded ${theme === 'dark' ? 'border-border bg-background text-foreground' : 'border-gray-300 bg-white text-gray-900'}`}
        />

        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="border rounded px-3 py-2">
          <option value="All Branches">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id.toString()}>{b.name}</option>
          ))}
        </select>

        <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className={`border rounded px-3 py-2 ${semesters.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={semesters.length === 0}>
          <option value="All Semesters">All Semesters</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id.toString()}>Semester {s.number}</option>
          ))}
        </select>

        <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className={`border rounded px-3 py-2 ${sections.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={sections.length === 0}>
          <option value="All Sections">All Sections</option>
          {sections.map((sec) => (
            <option key={sec.id} value={sec.id.toString()}>{sec.name}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-7 font-semibold text-sm gap-2">
            <div>Type</div>
            <div>Title</div>
            <div>Course Name</div>
            <div>Course Code</div>
            <div>Semester</div>
            <div>Uploaded By</div>
            <div>Action</div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasSearched ? (
            <div className="text-center py-4 text-gray-500">Select branch, semester, and section to view study materials.</div>
          ) : materials.length === 0 ? (
            <div className="text-center py-4">No study materials found.</div>
          ) : (
            materials.map((m: StudyMaterial) => <StudyMaterialRow key={m.id} material={m} theme={theme} />)
          )}
        </CardContent>
      </Card>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-lg max-w-md w-full ${theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Upload Study Material</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <select
                value={uploadSubject}
                onChange={(e) => {
                  const subjId = e.target.value;
                  setUploadSubject(subjId);
                  const subj = grouped.find(g => String(g.subject_id) === subjId);
                  if (subj && subj.sections.length > 0) {
                    const s = subj.sections[0];
                    setUploadBranch(String(s.branch_id));
                    setUploadSemester(String(s.semester_id));
                    setUploadSection(String(s.section_id));
                  }
                }}
                className={`w-full px-3 py-2 border rounded ${theme === 'dark' ? 'border-border bg-background text-foreground' : 'border-gray-300 bg-white text-gray-900'}`}
              >
                <option value="">Select Subject</option>
                {grouped.map(g => (
                  <option key={g.subject_id} value={g.subject_id}>{g.subject_name} ({g.subject_code})</option>
                ))}
              </select>
              <div className={`px-3 py-2 border rounded ${theme === 'dark' ? 'border-border bg-background text-foreground' : 'border-gray-300 bg-white text-gray-900'}`}>
                Branch: {uploadBranch ? grouped.find(g => String(g.subject_id) === uploadSubject)?.sections.find(s => String(s.branch_id) === uploadBranch)?.branch : 'N/A'}
              </div>
              <div className={`px-3 py-2 border rounded ${theme === 'dark' ? 'border-border bg-background text-foreground' : 'border-gray-300 bg-white text-gray-900'}`}>
                Semester: {uploadSemester ? `Semester ${grouped.find(g => String(g.subject_id) === uploadSubject)?.sections.find(s => String(s.semester_id) === uploadSemester)?.semester}` : 'N/A'}
              </div>
              <div className={`px-3 py-2 border rounded ${theme === 'dark' ? 'border-border bg-background text-foreground' : 'border-gray-300 bg-white text-gray-900'}`}>
                Section: {uploadSection ? grouped.find(g => String(g.subject_id) === uploadSubject)?.sections.find(s => String(s.section_id) === uploadSection)?.section : 'N/A'}
              </div>
              <input
                type="text"
                placeholder="Title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className={`w-full px-3 py-2 border rounded ${theme === 'dark' ? 'border-border bg-background text-foreground' : 'border-gray-300 bg-white text-gray-900'}`}
              />
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                className={`w-full px-3 py-2 border rounded ${theme === 'dark' ? 'border-border bg-background text-foreground' : 'border-gray-300 bg-white text-gray-900'}`}
              />
              <button
                onClick={async () => {
                  if (!uploadFile || !uploadTitle || !uploadSubject) {
                    alert("Please fill all fields");
                    return;
                  }
                  setUploading(true);
                  try {
                    const subj = grouped.find(g => String(g.subject_id) === uploadSubject);
                    const resp = await uploadStudyMaterial({
                      title: uploadTitle,
                      subject_id: uploadSubject,
                      subject_name: subj ? subj.subject_name : '',
                      subject_code: subj ? subj.subject_code : '',
                      semester_id: uploadSemester,
                      branch_id: uploadBranch,
                      section_id: uploadSection,
                      file: uploadFile,
                    });
                    if (resp && resp.success) {
                      alert('Uploaded successfully');
                      setShowUploadModal(false);
                      setUploadSubject('');
                      setUploadBranch('');
                      setUploadSemester('');
                      setUploadSection('');
                      setUploadTitle('');
                      setUploadFile(null);
                      // Materials will automatically reload since filters are already selected
                    } else {
                      alert(resp?.message || 'Upload failed');
                    }
                  } catch (e) {
                    console.error(e);
                    alert('Upload error');
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={uploading}
                className={`w-full px-4 py-2 rounded text-white ${uploading ? 'bg-gray-500' : 'bg-[#a259ff] hover:bg-[#8b47e0]'}`}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudyMaterialsFaculty;
