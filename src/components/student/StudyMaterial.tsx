import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Download, FileText, ChevronDown } from "lucide-react";
import { getAllStudyMaterials, getBranches, getSemesters, getSections } from "../../utils/student_api";
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

// Custom Dropdown Component
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  theme: string;
}

const CustomSelect = ({ value, onChange, options, disabled = false, theme }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const selectedLabel = options.find(opt => opt.value === value)?.label || "Select...";

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full border rounded px-3 py-2 text-sm md:text-base flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${theme === 'dark' ? 'border-border bg-background text-foreground' : 'border-gray-300 bg-white text-gray-900'}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />,
        document.body
      )}

      {isOpen && createPortal(
        <div
          className={`absolute z-[9999] border rounded shadow-lg ${
            theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'
          }`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            maxHeight: '240px',
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition ${
                value === opt.value
                  ? theme === 'dark'
                    ? 'bg-accent text-foreground'
                    : 'bg-blue-50 text-blue-600'
                  : theme === 'dark'
                  ? 'text-foreground'
                  : 'text-gray-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

const StudyMaterialRow = ({ material, theme }: { material: StudyMaterial; theme: string }) => (
  <div className={`grid grid-cols-3 md:grid-cols-7 gap-2 md:gap-2 items-start md:items-center text-xs md:text-sm py-3 md:py-2 px-3 md:px-0 md:border-b ${theme === 'dark' ? 'md:border-border' : 'md:border-gray-200'}`}>
    <div className="hidden md:flex items-center">
      <FileText className="text-red-500" size={18} />
    </div>
    <div className="col-span-1">
      <span className={`md:hidden text-xs font-bold mr-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Title:</span>
      <div className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} font-medium cursor-pointer hover:underline truncate`}>
        {material.title}
      </div>
    </div>
    <div className="col-span-1">
      <span className={`md:hidden text-xs font-bold mr-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Course:</span>
      <div className={`truncate`}>{material.subject_name}</div>
    </div>
    <div className="col-span-1 hidden md:block">
      <span className={`truncate`}>{material.subject_code}</span>
    </div>
    <div className="hidden md:block col-span-1">{material.semester || "N/A"}</div>
    <div className="hidden md:block col-span-1">{material.uploaded_by}</div>
    <div className="col-span-1">
      <a href={material.file_url} download={material.title + ".pdf"} target="_blank" rel="noopener noreferrer">
        <Download className={`cursor-pointer ${theme === 'dark' ? 'text-muted-foreground hover:text-foreground' : 'text-gray-500 hover:text-gray-700'}`} size={18} />
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
    <div className={`w-full p-3 md:p-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2">
        <h1 className="text-lg md:text-xl font-semibold">Study Materials</h1>
      </div>

      <div className="flex flex-col gap-3 md:gap-4 mb-3 md:mb-4">
        <div className="flex flex-col gap-2 md:gap-4 md:flex-row">
          <CustomSelect
            value={selectedBranch}
            onChange={(value) => setSelectedBranch(value)}
            options={[
              { value: "All Branches", label: "All Branches" },
              ...branches.map((b) => ({ value: b.id.toString(), label: b.name })),
            ]}
            theme={theme}
          />

          <CustomSelect
            value={selectedSemester}
            onChange={(value) => setSelectedSemester(value)}
            options={[
              { value: "All Semesters", label: "All Semesters" },
              ...semesters.map((s) => ({ value: s.id.toString(), label: `Sem ${s.number}` })),
            ]}
            disabled={semesters.length === 0}
            theme={theme}
          />

          <CustomSelect
            value={selectedSection}
            onChange={(value) => setSelectedSection(value)}
            options={[
              { value: "All Sections", label: "All Sections" },
              ...sections.map((sec) => ({ value: sec.id.toString(), label: sec.name })),
            ]}
            disabled={sections.length === 0}
            theme={theme}
          />
        </div>

        <input
          type="text"
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full px-3 py-2 text-sm md:text-base border rounded ${theme === 'dark' ? 'border-border bg-background text-foreground' : 'border-gray-300 bg-white text-gray-900'}`}
        />
      </div>

      <Card className={theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'}>
        <CardHeader className="hidden md:block">
          <div className="grid grid-cols-1 md:grid-cols-7 font-semibold text-xs md:text-sm gap-2">
            <div>Type</div>
            <div>Title</div>
            <div>Course Name</div>
            <div>Course Code</div>
            <div>Semester</div>
            <div>Uploaded By</div>
            <div>Action</div>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          {!hasSearched ? (
            <div className={`text-center py-6 md:py-4 text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Select branch, semester, and section to view study materials.</div>
          ) : materials.length === 0 ? (
            <div className={`text-center py-6 md:py-4 text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No study materials found.</div>
          ) : (
            materials.map((m: StudyMaterial) => <StudyMaterialRow key={m.id} material={m} theme={theme} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyMaterialsStudent;