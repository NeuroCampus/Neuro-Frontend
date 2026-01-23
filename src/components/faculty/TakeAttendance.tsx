import { useEffect, useState, useRef } from "react";
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
import { getSubjectDetail, takeAttendance, aiAttendance, getStudentsForRegular, getStudentsForElective, getStudentsForOpenElective, FacultyAssignment, ClassStudent, GetTakeAttendanceBootstrapResponse } from "@/utils/faculty_api";
import { useFacultyAssignmentsQuery } from "@/hooks/useApiQueries";
import { useTheme } from "@/context/ThemeContext";

const TakeAttendance = () => {
  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError } = useFacultyAssignmentsQuery();
  const { theme } = useTheme();
  const [branchId, setBranchId] = useState<number | null>(null);
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [subjectStudents, setSubjectStudents] = useState<any[]>([]); // students returned for subject-only bootstrap
  const [bootstrapParams, setBootstrapParams] = useState<any | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalStudentsCount, setTotalStudentsCount] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<{ [studentId: number]: boolean }>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [recentRecords, setRecentRecords] = useState<GetTakeAttendanceBootstrapResponse['data']['recent_records']>([]);
  const [aiPhoto, setAiPhoto] = useState<File | null>(null);
  const [aiResults, setAiResults] = useState<any>(null);
  const [subjectType, setSubjectType] = useState<string | null>(null);
  const [processingAI, setProcessingAI] = useState(false);
  const [lastBootstrapParams, setLastBootstrapParams] = useState<any>(null);

  // Simple debounced value hook to avoid rapid-fire API calls when user changes selections
  const useDebounced = <T,>(value: T, delay = 300) => {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
      const id = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
  };
  // Map to hold in-flight requests to deduplicate identical calls
  const inFlightRequests = useRef<Map<string, Promise<any>>>(new Map());
  // Mirror of lastBootstrapParams in a ref for synchronous checks (avoids state update timing races)
  const lastBootstrapParamsRef = useRef<any>(null);

  // Central runLoader function (moved to component scope so multiple effects can use it)
  const runLoader = (loader: any, paramsObj: any, mapStudents: boolean = true) => {
    setLoadingStudents(true);
    const params: any = makeParams(paramsObj);
    // Prevent duplicate calls by comparing against lastBootstrapParams (use ref for synchronous check)
    if (lastBootstrapParamsRef.current && JSON.stringify(params) === JSON.stringify(lastBootstrapParamsRef.current)) {
      setLoadingStudents(false);
      return Promise.resolve();
    }
    setLastBootstrapParams(params);
    lastBootstrapParamsRef.current = params;
    setBootstrapParams(params);

    // Use a key to dedupe identical in-flight requests
    const key = JSON.stringify(params);
    console.debug("runLoader start", key, params);
    const existing = inFlightRequests.current.get(key);
    if (existing) {
      // Return the existing promise so callers share the same network request
      console.debug("Deduping student-list request", key);
      console.trace();
      return existing;
    }

    const p = loader(params)
      .then((response: any) => {
        if (response && response.success && response.data) {
          const studentsArr = response.data.students || [];
          if (mapStudents) {
            setStudents(studentsArr.map((s: any) => ({ id: s.id, name: s.name, usn: s.usn })));
          } else {
            setStudents(studentsArr);
          }
          setRecentRecords(response.data.recent_records || []);
          if (response.data.pagination) {
            setPage(response.data.pagination.page);
            setPageSize(response.data.pagination.page_size);
            setTotalPages(response.data.pagination.total_pages);
            setTotalStudentsCount(response.data.pagination.total_students);
          } else {
            setTotalPages(1);
            setTotalStudentsCount(studentsArr.length || 0);
          }
        } else {
          setErrorMsg(response?.message || "Failed to load data");
        }
        return response;
      })
      .catch((e: any) => {
        setErrorMsg(e?.message || "Failed to load data");
        throw e;
      })
      .finally(() => {
        setLoadingStudents(false);
        inFlightRequests.current.delete(key);
      });

    inFlightRequests.current.set(key, p);
    return p;
  };

  const debouncedSubjectId = useDebounced(subjectId, 300);
  const debouncedBranchId = useDebounced(branchId, 300);
  const debouncedSemesterId = useDebounced(semesterId, 300);
  const debouncedSectionId = useDebounced(sectionId, 300);
  const debouncedPage = useDebounced(page, 300);
  const debouncedPageSize = useDebounced(pageSize, 300);

  // Helper to build query params: omit null/undefined/'undefined' values and stringify
  const makeParams = (obj: Record<string, any>) => {
    const out: Record<string, any> = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      const s = String(v);
      if (s === '' || s === 'undefined' || s === 'null' || s === 'NaN') return;
      out[k] = s;
    });
    return out;
  };

  // Reset last params when subject changes
  useEffect(() => {
    setLastBootstrapParams(null);
    lastBootstrapParamsRef.current = null;
  }, [subjectId]);

  // Assignments are now loaded via context

  // Reset selections and load students when debounced subject or class selection changes
  useEffect(() => {
    setStudents([]);
    setAttendance({});
    setRecentRecords([]);
    setSuccessMsg("");
    setErrorMsg("");

    if (!debouncedSubjectId) return;

    

    // CASE 0: Elective (Branch + Semester + Subject, section optional)
    if (debouncedSubjectId && debouncedBranchId && debouncedSemesterId && subjectType === 'elective') {
      runLoader(getStudentsForElective, { subject_id: debouncedSubjectId, branch_id: debouncedBranchId, semester_id: debouncedSemesterId, section_id: debouncedSectionId, page: debouncedPage, page_size: debouncedPageSize });
      return;
    }

    // CASE 1: Combined class (Subject only)
    if (debouncedSubjectId && !debouncedBranchId) {
      if (subjectStudents.length) {
        const mapped = subjectStudents.map(s => ({ id: s.id, name: s.name, usn: s.usn }));
        setStudents(mapped);
        // recentRecords already set by subject-only bootstrap
      }
      return;
    }

    // CASE 2: Branch-specific class (Subject + Branch)
    if (debouncedSubjectId && debouncedBranchId && !debouncedSemesterId && !debouncedSectionId) {
      // For elective subjects we require semester selection before calling the elective endpoint
      if (subjectType === 'elective') return;
      const loader = subjectType === 'open_elective' ? getStudentsForOpenElective : getStudentsForRegular;
      runLoader(loader, { subject_id: debouncedSubjectId, branch_id: debouncedBranchId, page: debouncedPage, page_size: debouncedPageSize });
      return;
    }

    // CASE 2b: Branch + Semester selected (section optional)
    if (debouncedSubjectId && debouncedBranchId && debouncedSemesterId && !debouncedSectionId) {
      if (subjectType === 'elective') {
        // Elective requires semester selection; call elective loader
        runLoader(getStudentsForElective, { subject_id: debouncedSubjectId, branch_id: debouncedBranchId, semester_id: debouncedSemesterId, page: debouncedPage, page_size: debouncedPageSize });
        return;
      }

      if (subjectType === 'open_elective') {
        // For open electives: avoid server call on semester-only selection when we already have subject-level registrations.
        if (subjectStudents && subjectStudents.length) {
          const filtered = subjectStudents.filter((s: any) => String(s.branch_id) === String(debouncedBranchId) && String(s.semester_id) === String(debouncedSemesterId));
          setStudents(filtered.map((s: any) => ({ id: s.id, name: s.name, usn: s.usn })));
          // Update pagination/counts based on filtered result
          setTotalPages(1);
          setTotalStudentsCount(filtered.length || 0);
          return;
        }
        // Fallback: if we don't have subjectStudents cached, fetch from server
        runLoader(getStudentsForOpenElective, { subject_id: debouncedSubjectId, branch_id: debouncedBranchId, semester_id: debouncedSemesterId, page: debouncedPage, page_size: debouncedPageSize });
        return;
      }

      // Regular subject: call regular loader
      const loader = getStudentsForRegular;
      runLoader(loader, { subject_id: debouncedSubjectId, branch_id: debouncedBranchId, semester_id: debouncedSemesterId, page: debouncedPage, page_size: debouncedPageSize });
      return;
    }

    // CASE 3: Section-specific class (Subject + Branch + Semester + Section)
    if (debouncedSubjectId && debouncedBranchId && debouncedSemesterId && debouncedSectionId) {
      const loader = subjectType === 'regular' || !subjectType ? getStudentsForRegular : (subjectType === 'elective' ? getStudentsForElective : getStudentsForOpenElective);
      runLoader(loader, { subject_id: debouncedSubjectId, branch_id: debouncedBranchId, semester_id: debouncedSemesterId, section_id: debouncedSectionId, page: debouncedPage, page_size: debouncedPageSize }, subjectType === 'regular');
      return;
    }
  }, [debouncedSubjectId, debouncedBranchId, debouncedSemesterId, debouncedSectionId, debouncedPage, debouncedPageSize]);

  // When subject changes, reset branch/semester/section selections
  useEffect(() => {
    setBranchId(null);
    setSemesterId(null);
    setSectionId(null);
    setStudents([]);
    setAttendance({});
    setRecentRecords([]);
    setSuccessMsg("");
    setErrorMsg("");
  }, [subjectId]);

  // When branch changes, clear dependent selections so the UI recomputes semesters/sections
  useEffect(() => {
    setSemesterId(null);
    setSectionId(null);
    setStudents([]);
    // For open electives keep the subject-level registrations so branch dropdown labels remain available
    if (subjectType !== 'open_elective') {
      setSubjectStudents([]);
    }
    setAttendance({});
    setRecentRecords([]);
    setSuccessMsg("");
    setErrorMsg("");
  }, [branchId]);

  // When semester changes, clear section and refresh students derived from registrations
  useEffect(() => {
    setSectionId(null);
    setStudents([]);
    // Preserve subjectStudents for open electives to allow branch/semester dropdown derivation
    if (subjectType !== 'open_elective') {
      setSubjectStudents([]);
    }
    setAttendance({});
    setRecentRecords([]);
    setSuccessMsg("");
    setErrorMsg("");
  }, [semesterId]);

  // When page or pageSize changes, re-fetch current bootstrap results if any
  useEffect(() => {
    if (!bootstrapParams || !bootstrapParams.subject_id) return;
    const params = { ...bootstrapParams, page, page_size: pageSize };
    // Avoid duplicate reloads when the params equal the last bootstrap params
    try {
      if (lastBootstrapParamsRef.current && JSON.stringify(params) === JSON.stringify(lastBootstrapParamsRef.current)) {
        console.debug('Skipping page reload; params equal lastBootstrapParamsRef', params);
        return;
      }
    } catch (e) {
      // Fallback: if JSON stringify fails for any reason, continue with reload
    }
    // Choose loader based on subjectType so we call the correct endpoint
    const loader = subjectType === 'elective'
      ? getStudentsForElective
      : (subjectType === 'open_elective' ? getStudentsForOpenElective : getStudentsForRegular);

    // Use runLoader (dedupes in-flight requests). If this is a subject-only bootstrap (no branch_id),
    // update `subjectStudents` from the response so downstream UI uses registration-derived branches/semesters.
    runLoader(loader, params, subjectType === 'regular')
      .then((response: any) => {
        if (response && response.success && response.data) {
          if (!params.branch_id) {
            setSubjectStudents(response.data.students || []);
          }
        }
      })
      .catch(() => {});
  }, [page, pageSize, bootstrapParams]);

  // When a subject is selected, fetch subject detail first. For open electives, fetch subject-only bootstrap to discover available registrations.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setSubjectStudents([]);
      if (!subjectId) return;
      setLoadingStudents(true);
      try {
        const subjRes = await getSubjectDetail(subjectId.toString());
        if (cancelled) return;
          if (subjRes.success && subjRes.data) {
          const subjType = subjRes.data.subject_type;
          setSubjectType(subjType);
          if (subjType === 'open_elective') {
            // For open electives use the open-elective students endpoint (registration-driven)
            const params = makeParams({ subject_id: subjectId, page, page_size: pageSize });
            setBootstrapParams(params);
            // Use runLoader (dedupes) and then set subjectStudents from the response
            try {
              const bsRes: any = await runLoader(getStudentsForOpenElective, params, false);
              if (!cancelled && bsRes && bsRes.success && bsRes.data) {
                setSubjectStudents(bsRes.data.students || []);
                setRecentRecords(bsRes.data.recent_records || []);
                if (bsRes.data.pagination) {
                  setPage(bsRes.data.pagination.page);
                  setPageSize(bsRes.data.pagination.page_size);
                  setTotalPages(bsRes.data.pagination.total_pages);
                  setTotalStudentsCount(bsRes.data.pagination.total_students);
                } else {
                  setTotalPages(1);
                  setTotalStudentsCount(bsRes.data.students.length || 0);
                }
              }
            } catch (e) {
              // error already handled in runLoader
            }
          } else {
            // normal subject: do not call subject-only bootstrap; wait for branch/sem/section selection
            setSubjectStudents([]);
          }
        }
      } catch (e) {
        setSubjectStudents([]);
      } finally {
        if (!cancelled) setLoadingStudents(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [subjectId]);

  // Dropdown options (deduplicated by id)
  // Subject-first behavior: list all subjects assigned to this faculty
  const assignedSubjects = Array.from(new Map(assignments.map(a => [a.subject_id, { id: a.subject_id, name: a.subject_name }])).values());

  // Branch options: if subjectStudents available (subject-only bootstrap), use branches from registrations; otherwise use assignment branches
  const branchesFromAssignments = Array.from(new Map(assignments.map(a => [a.branch_id, { id: a.branch_id, name: a.branch }])).values());
  // If registration entries don't include branch names, fall back to assignment labels
  const branchesFromRegistrations = subjectStudents.length ? Array.from(new Map(subjectStudents.filter(s => s.branch_id).map(s => [s.branch_id, { id: s.branch_id, name: s.branch || (branchesFromAssignments.find(b => b.id === s.branch_id)?.name) }])).values()) : [];
  // Prefer registrations-derived branches but ensure current selection remains available
  const preferredBranches = branchesFromRegistrations.length ? branchesFromRegistrations : branchesFromAssignments;
  const branches = preferredBranches.slice();
  if (branchId && !branches.find(b => b.id === branchId)) {
    const match = branchesFromAssignments.find(b => b.id === branchId);
    if (match) branches.unshift(match);
  }

  // Semesters: derive from subjectStudents when available for chosen branch, else fall back to assignments
  const subjectAssignments = subjectId ? assignments.filter(a => a.subject_id === subjectId) : [];
  const semestersFromRegistrations = (subjectStudents.length && branchId)
    ? Array.from(new Map(subjectStudents.filter(s => s.branch_id === branchId && s.semester_id).map(s => [s.semester_id, { id: s.semester_id, name: s.semester || (subjectAssignments.length ? (subjectAssignments.find(a => a.semester_id === s.semester_id)?.semester?.toString()) : (assignments.find(a => a.semester_id === s.semester_id && a.branch_id === branchId)?.semester?.toString())) }])).values())
    : [];
  // Prefer registrations-derived semesters but ensure current selection remains available
  const preferredSemesters = semestersFromRegistrations.length
    ? semestersFromRegistrations
    : (subjectAssignments.length
      ? Array.from(new Map(subjectAssignments.map(a => [a.semester_id, { id: a.semester_id, name: a.semester.toString() }])).values())
      : (branchId ? Array.from(new Map(assignments.filter(a => a.branch_id === branchId).map(a => [a.semester_id, { id: a.semester_id, name: a.semester.toString() }])).values()) : []));
  const semesters = preferredSemesters.slice();
  if (semesterId && !semesters.find(s => s.id === semesterId)) {
    const match = subjectAssignments.length ? subjectAssignments.find(a => a.semester_id === semesterId) : assignments.find(a => a.semester_id === semesterId && a.branch_id === branchId);
    if (match) semesters.unshift({ id: match.semester_id, name: match.semester.toString() });
  }

  // Sections: derive from subjectStudents when available for chosen branch+semester, else fall back to assignments
  const sectionsFromRegistrations = (subjectStudents.length && branchId && semesterId)
    ? Array.from(new Map(subjectStudents.filter(s => s.branch_id === branchId && s.semester_id === semesterId && s.section_id).map(s => {
      const assignLabel = assignments.find(a => a.section_id === s.section_id && a.branch_id === branchId && a.semester_id === semesterId)?.section;
      const label = s.section || assignLabel || `Section ${s.section_id}`;
      return [s.section_id, { id: s.section_id, name: label } as { id: number; name: string }];
    })).values())
    : [];
  let sectionsPreferred: { id: number; name: string }[] = [];
  if (subjectType === 'elective') {
    // For elective subjects prefer the sections present in student registrations
    sectionsPreferred = sectionsFromRegistrations.slice();
  } else {
    sectionsPreferred = sectionsFromRegistrations.length
      ? sectionsFromRegistrations
      : ((subjectId && branchId && semesterId && subjectType === 'elective')
        ? Array.from(new Map(assignments.filter(a => a.branch_id === branchId && a.semester_id === semesterId).map(a => [a.section_id, { id: a.section_id, name: a.section }])).values())
        : ((subjectId && branchId && semesterId)
          ? Array.from(new Map(assignments.filter(a => a.subject_id === subjectId && a.branch_id === branchId && a.semester_id === semesterId).map(a => [a.section_id, { id: a.section_id, name: a.section }])).values())
          : (branchId && semesterId ? Array.from(new Map(assignments.filter(a => a.branch_id === branchId && a.semester_id === semesterId).map(a => [a.section_id, { id: a.section_id, name: a.section }])).values()) : [])));
  }
  const sections = sectionsPreferred.slice();
  if (sectionId && !sections.find(s => s.id === sectionId)) {
    const match = assignments.find(a => a.section_id === sectionId && a.branch_id === branchId && a.semester_id === semesterId);
    if (match) sections.unshift({ id: match.section_id, name: match.section });
  }

  // Subjects for selection: show all assigned subjects (faculty's subjects)
  const subjects = assignedSubjects;

  const handleAttendance = (studentId: number, present: boolean) => {
    setAttendance(prev => ({ ...prev, [studentId]: present }));
  };

  const handleSubmit = async () => {
    // Validation:
    // - regular: require branch, semester, section
    // - elective: require branch, semester (section optional)
    // - open_elective: require subject only (branch/semester/section optional)
    if (!subjectId) return;
    if (subjectType === 'regular') {
      if (!branchId || !semesterId || !sectionId) return;
    } else if (subjectType === 'elective') {
      if (!branchId || !semesterId) return;
    }
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const attendanceArr = students.map(s => ({ student_id: s.id.toString(), status: !!attendance[s.id] }));
      const data: any = {
        subject_id: subjectId.toString(),
        method: "manual",
        attendance: attendanceArr,
      };
      // include optional identifiers only when present
      if (branchId) data.branch_id = branchId.toString();
      if (semesterId) data.semester_id = semesterId.toString();
      if (sectionId) data.section_id = sectionId.toString();
      const res = await takeAttendance(data);
      if (res.success) {
        setSuccessMsg("Attendance submitted successfully!");
      } else {
        setErrorMsg(res.message || "Failed to submit attendance");
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErrorMsg(e.message || "Failed to submit attendance");
      } else {
        setErrorMsg("Failed to submit attendance");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAiPhoto(file);
      setAiResults(null);
      setErrorMsg("");
    }
  };

  const handleAIProcess = async () => {
    if (!branchId || !semesterId || !sectionId || !subjectId || !aiPhoto) return;
    setProcessingAI(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await aiAttendance({
        branch_id: branchId.toString(),
        semester_id: semesterId.toString(),
        section_id: sectionId.toString(),
        subject_id: subjectId.toString(),
        photo: aiPhoto,
      });
      if (res.success) {
        setAiResults(res.data);
        setSuccessMsg("AI attendance processed successfully!");
      } else {
        setErrorMsg(res.message || "Failed to process AI attendance");
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErrorMsg(e.message || "Failed to process AI attendance");
      } else {
        setErrorMsg("Failed to process AI attendance");
      }
    } finally {
      setProcessingAI(false);
    }
  };

  return (
    <div className={`space-y-4 p-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
        <CardHeader>
          <CardTitle>Take Attendance</CardTitle>
          <CardDescription className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>Record student attendance for your classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Select value={subjectId?.toString()} onValueChange={v => setSubjectId(Number(v))}>
                <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={branchId?.toString()} onValueChange={v => setBranchId(Number(v))} disabled={!subjectId}>
                <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'} disabled={!subjectId}>
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  {branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={semesterId?.toString()} onValueChange={v => setSemesterId(Number(v))} disabled={!branchId || semesters.length === 0}>
                <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'} disabled={!branchId || semesters.length === 0}>
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  {semesters.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sectionId?.toString() || ""} onValueChange={v => setSectionId(v ? Number(v) : null)} disabled={!semesterId || sections.length === 0}>
                <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'} disabled={!semesterId || sections.length === 0}>
                  <SelectValue placeholder={subjectType === 'elective' ? "Select Section (Optional)" : "Select Section"} />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Tabs defaultValue="manual">
              <TabsList className={`inline-flex h-10 items-center justify-center rounded-md p-1 ${theme === 'dark' ? 'bg-muted text-muted-foreground' : 'bg-gray-100 text-gray-500'}`}>
                <TabsTrigger 
                  value="manual" 
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm ${theme === 'dark' 
                    ? 'data-[state=active]:bg-[#a259ff] data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground' 
                    : 'data-[state=active]:bg-[#a259ff] data-[state=active]:text-white data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-900'}`}
                >
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger 
                  value="ai" 
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm ${theme === 'dark' 
                    ? 'data-[state=active]:bg-[#a259ff] data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground' 
                    : 'data-[state=active]:bg-[#a259ff] data-[state=active]:text-white data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-900'}`}
                >
                  AI Processing
                </TabsTrigger>
              </TabsList>

              {/* Manual Entry Tab */}
              <TabsContent value="manual">
                {loadingStudents ? (
                  <div className={theme === 'dark' ? 'text-muted-foreground mt-6' : 'text-gray-500 mt-6'}>Loading students...</div>
                ) : students.length > 0 ? (
                  <div className={`border rounded-md mt-4 ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'}`}>
                    <div className={`p-4 font-semibold border-b ${theme === 'dark' ? 'border-border' : 'border-gray-300'}`}>Student Attendance</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className={theme === 'dark' ? 'bg-muted' : 'bg-gray-50'}>
                          <tr>
                            <th className={`text-left px-4 py-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>#</th>
                            <th className={`text-left px-4 py-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>USN</th>
                            <th className={`text-left px-4 py-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Name</th>
                            <th className={`text-left px-4 py-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((s, idx) => (
                            <tr 
                              key={s.id} 
                              className={`border-t ${theme === 'dark' ? 'border-border hover:bg-accent' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                              <td className="px-4 py-3">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium">{s.usn}</td>
                              <td className="px-4 py-3">{s.name}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleAttendance(s.id, true)}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                                      attendance[s.id] === true 
                                        ? (theme === 'dark' 
                                            ? "bg-green-500/20 text-green-400 border-2 border-green-500/50" 
                                            : "bg-green-100 text-green-600 border-2 border-green-200")
                                        : (theme === 'dark' 
                                            ? "bg-muted text-muted-foreground hover:bg-green-500/10 hover:text-green-400 border border-border" 
                                            : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600 border border-gray-200")
                                    }`}
                                    title="Mark Present"
                                  >
                                    <Check size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleAttendance(s.id, false)}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                                      attendance[s.id] === false 
                                        ? (theme === 'dark' 
                                            ? "bg-red-500/20 text-red-400 border-2 border-red-500/50" 
                                            : "bg-red-100 text-red-600 border-2 border-red-200")
                                        : (theme === 'dark' 
                                            ? "bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-400 border border-border" 
                                            : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 border border-gray-200")
                                    }`}
                                    title="Mark Absent"
                                  >
                                    <X size={18} />
                                  </button>
                                  {attendance[s.id] === true && (
                                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800'}`}>
                                      Present
                                    </span>
                                  )}
                                  {attendance[s.id] === false && (
                                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-800'}`}>
                                      Absent
                                    </span>
                                  )}
                                  {attendance[s.id] === undefined && (
                                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-muted text-muted-foreground' : 'bg-gray-100 text-gray-500'}`}>
                                      Not marked
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalPages && totalPages > 1 && (
                      <div className="p-3 flex items-center justify-between gap-4">
                        <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                          Showing page {page} of {totalPages} {totalStudentsCount !== null && `— ${totalStudentsCount} students`}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                          <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
                          <div className="flex items-center gap-2 ml-4">
                            <label className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Per page:</label>
                            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1">
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                              <option value={100}>100</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                        {Object.keys(attendance).filter(key => attendance[Number(key)] === true).length} Present, 
                        {Object.keys(attendance).filter(key => attendance[Number(key)] === false).length} Absent
                      </div>
                      <Button 
                        onClick={handleSubmit} 
                        disabled={submitting}
                        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md transition bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white shadow-md"
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Submitting...
                          </>
                        ) : (
                          "Submit Attendance"
                        )}
                      </Button>
                    </div>
                    {successMsg && <div className={`text-green-400 text-sm p-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{successMsg}</div>}
                    {errorMsg && <div className={`text-red-400 text-sm p-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{errorMsg}</div>}
                  </div>
                ) : (
                  <div className={theme === 'dark' ? 'text-muted-foreground mt-6' : 'text-gray-500 mt-6'}>Select class details to load students.</div>
                )}
              </TabsContent>
              
              {/* AI Tab */}
              <TabsContent value="ai">
                {loadingStudents ? (
                  <div className={theme === 'dark' ? 'text-muted-foreground mt-6' : 'text-gray-500 mt-6'}>Loading students...</div>
                ) : students.length > 0 ? (
                  <div className={`border rounded-md mt-4 ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'}`}>
                    <div className={`p-4 font-semibold border-b ${theme === 'dark' ? 'border-border' : 'border-gray-300'}`}>AI Attendance Processing</div>
                    <div className="p-6">
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                          <UploadCloud className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                        <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>AI Attendance Processing</h3>
                        <p className={`text-sm mb-6 text-center max-w-md ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                          Upload a class photo for automatic attendance marking using facial recognition technology.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                          />
                          <label
                            htmlFor="photo-upload"
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md border cursor-pointer text-center transition ${
                              theme === 'dark'
                                ? 'border-border text-foreground hover:bg-accent'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {aiPhoto ? aiPhoto.name : 'Upload Photo'}
                          </label>
                          <Button
                            onClick={handleAIProcess}
                            disabled={processingAI || !aiPhoto}
                            className="flex-1 flex items-center gap-2 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
                          >
                            {processingAI ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                              </>
                            ) : (
                              "Process Attendance"
                            )}
                          </Button>
                        </div>
                      </div>

                      {aiResults && (
                        <div className={`mt-8 p-4 rounded-lg ${theme === 'dark' ? 'bg-muted' : 'bg-gray-50'}`}>
                          <h4 className={`font-medium mb-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>AI Processing Results:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className={`p-3 rounded ${theme === 'dark' ? 'bg-background' : 'bg-white'}`}>
                              <div className="text-2xl font-bold text-green-600">{aiResults.present_count}</div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Present</div>
                            </div>
                            <div className={`p-3 rounded ${theme === 'dark' ? 'bg-background' : 'bg-white'}`}>
                              <div className="text-2xl font-bold text-red-600">{aiResults.absent_count}</div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Absent</div>
                            </div>
                            <div className={`p-3 rounded ${theme === 'dark' ? 'bg-background' : 'bg-white'}`}>
                              <div className="text-2xl font-bold text-blue-600">{aiResults.total_students}</div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Total Students</div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h5 className={`font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Present Students:</h5>
                              <div className={`max-h-32 overflow-y-auto p-2 rounded ${theme === 'dark' ? 'bg-background' : 'bg-white'}`}>
                                {aiResults.present_students.length > 0 ? (
                                  aiResults.present_students.map((student: any) => (
                                    <div key={student.id} className="text-sm">
                                      {student.name} ({student.usn})
                                    </div>
                                  ))
                                ) : (
                                  <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No students detected as present</div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h5 className={`font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Absent Students:</h5>
                              <div className={`max-h-32 overflow-y-auto p-2 rounded ${theme === 'dark' ? 'bg-background' : 'bg-white'}`}>
                                {aiResults.absent_students.length > 0 ? (
                                  aiResults.absent_students.map((student: any) => (
                                    <div key={student.id} className="text-sm">
                                      {student.name} ({student.usn})
                                    </div>
                                  ))
                                ) : (
                                  <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>All students detected as present</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className={`mt-8 p-4 rounded-lg ${theme === 'dark' ? 'bg-muted' : 'bg-gray-50'}`}>
                        <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>How it works:</h4>
                        <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                          <li>• Take a clear photo of your entire class</li>
                          <li>• Upload the image using the button above</li>
                          <li>• Our AI will recognize students and mark attendance automatically</li>
                          <li>• Review and confirm the results before submitting</li>
                        </ul>
                      </div>
                    </div>
                    {successMsg && <div className={`text-green-400 text-sm p-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{successMsg}</div>}
                    {errorMsg && <div className={`text-red-400 text-sm p-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{errorMsg}</div>}
                  </div>
                ) : (
                  <div className={`border rounded-md mt-4 p-8 text-center ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'}`}>
                    <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>No Students Found</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                      Please select class details above to load students for AI processing.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TakeAttendance;