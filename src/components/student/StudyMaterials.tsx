import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Download, FileText } from "lucide-react";
import { getBranches, getSemesters, getSections, getAllStudyMaterials } from "../../utils/student_api";
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

const StudyMaterialsStudent = () => {
  const { theme } = useTheme();
  const [selectedBranch, setSelectedBranch] = useState<string>("All Branches");
  const [selectedSemester, setSelectedSemester] = useState<string>("All Semesters");
  const [selectedSection, setSelectedSection] = useState<string>("All Sections");
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
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
    const resp = await getAllStudyMaterials(selectedBranch === 'All Branches' ? undefined : selectedBranch, selectedSemester === 'All Semesters' ? undefined : selectedSemester, selectedSection === 'All Sections' ? undefined : selectedSection, searchQuery || undefined);
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
    </div>
  );
};

export default StudyMaterialsStudent;