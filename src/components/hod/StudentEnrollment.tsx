import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { manageStudents, manageSubjects, getElectiveEnrollmentBootstrap } from "../../utils/hod_api";
import { useHODBootstrap } from "../../context/HODBootstrapContext";
import { useTheme } from "../../context/ThemeContext";
import { API_ENDPOINT } from "../../utils/config";
import { fetchWithTokenRefresh } from "../../utils/authService";

const StudentEnrollment = () => {
  const bootstrap = useHODBootstrap();
  const [branchId, setBranchId] = useState<string>("");
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sectionsBySemester, setSectionsBySemester] = useState<Record<string, any[]>>({});
  const [semesterId, setSemesterId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [subjectType, setSubjectType] = useState<string>("elective");
  const [electiveSubjects, setElectiveSubjects] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [showEnrolledOnly, setShowEnrolledOnly] = useState<boolean>(false);
  const [enrolledCount, setEnrolledCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultData, setResultData] = useState<{ added: number; removed: number; failed: any[] }>({ added: 0, removed: 0, failed: [] });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const studentsPerPage = 20; // Frontend pagination

  const loadEnrolledStudents = async () => {
    if (!branchId || !selectedSubjectId) return;
    setIsLoading(true);
    try {
      // Fetch all enrolled students for this subject (all pages)
      let enrolledStudents: any[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const params = new URLSearchParams({
          branch_id: branchId,
          subject_id: selectedSubjectId,
          page: page.toString(),
          page_size: '25'
        });

        const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/hod/students/?${params}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (!response.ok || !data.results) {
          throw new Error(data.message || "Failed to fetch enrolled students");
        }

        // Accumulate enrolled students from this page
        enrolledStudents = [...enrolledStudents, ...data.results];

        // Check if there's a next page
        hasNextPage = data.next !== null;
        page += 1;
      }

      const mapped = enrolledStudents.map((s: any) => ({
        id: s.usn || s.student_id || s.id,
        usn: s.usn || s.student_id || s.id,
        name: s.name,
        checked: true,
      }));
      setStudents(mapped);
      setEnrolledCount(mapped.length);

      // Reset pagination
      setCurrentPage(1);
      setTotalStudents(mapped.length);
      setTotalPages(Math.ceil(mapped.length / studentsPerPage));
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const loadBootstrap = async () => {
      try {
      const boot = await getElectiveEnrollmentBootstrap();
        if (boot.success && boot.data) {
          const bId = boot.data.profile?.branch_id;
          if (bId) setBranchId(String(bId));
          if (Array.isArray(boot.data.semesters)) setSemesters(boot.data.semesters.map((s: any) => ({ id: String(s.id), number: s.number })));
          if (Array.isArray(boot.data.sections)) {
            const map: Record<string, any[]> = {};
            boot.data.sections.forEach((sec: any) => {
              const semIdKey = String(sec.semester_id || "");
              if (!map[semIdKey]) map[semIdKey] = [];
              map[semIdKey].push({ ...sec, id: String(sec.id) });
            });
            setSectionsBySemester(map);
          }
          if (Array.isArray(boot.data.elective_subjects)) {
            setElectiveSubjects(boot.data.elective_subjects.map((s: any) => ({ ...s, id: String(s.id) })));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadBootstrap();
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!semesterId) return;
      try {
        // Filter elective subjects by semester and subject type
        const filteredSubjects = electiveSubjects.filter((s: any) => 
          s.semester_id === semesterId && s.subject_type === subjectType
        );
        setSubjects(filteredSubjects);
      } catch (e) {
        console.error(e);
      }
    };
    loadSubjects();
  }, [electiveSubjects, semesterId, subjectType]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm]);

  const loadStudents = async () => {
    if (!branchId || !semesterId || !sectionId || !selectedSubjectId) return;
    setIsLoading(true);
    try {
      // Fetch all students in the section (all pages)
      let allStudents: any[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const params = new URLSearchParams({
          branch_id: branchId,
          semester_id: semesterId,
          section_id: sectionId,
          page: page.toString(),
          page_size: '50'
        });

        const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/hod/students/?${params}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (!data.results) {
          throw new Error(data.message || "Failed to fetch students");
        }

        // If no results, stop pagination
        if (data.results.length === 0) {
          break;
        }

        // Accumulate students from this page
        allStudents = [...allStudents, ...data.results];

        // Check if there's a next page
        hasNextPage = data.next !== null;
        page += 1;
      }

      // Also fetch enrolled students for this subject (all pages)
      let enrolledStudents: any[] = [];
      page = 1;
      hasNextPage = true;

      while (hasNextPage) {
        const params = new URLSearchParams({
          branch_id: branchId,
          subject_id: selectedSubjectId,
          page: page.toString(),
          page_size: '50'
        });

        const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/hod/students/?${params}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (!data.results) {
          throw new Error(data.message || "Failed to fetch enrolled students");
        }

        // If no results, stop pagination
        if (data.results.length === 0) {
          break;
        }

        // Accumulate enrolled students from this page
        enrolledStudents = [...enrolledStudents, ...data.results];

        // Check if there's a next page
        hasNextPage = data.next !== null;
        page += 1;
      }

      const enrolledSet = new Set(enrolledStudents.map((s: any) => s.usn || s.student_id || s.id));

      const mapped = allStudents.map((s: any) => ({
        id: s.usn || s.student_id || s.id,
        usn: s.usn || s.student_id || s.id,
        name: s.name,
        checked: enrolledSet.has(s.usn || s.student_id || s.id),
      }));

      setStudents(mapped);
      setEnrolledCount(enrolledSet.size);

      // Reset pagination
      setCurrentPage(1);
      setTotalStudents(mapped.length);
      setTotalPages(Math.ceil(mapped.length / studentsPerPage));
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const toggleStudent = (id: string) => {
    setStudents((prev) => prev.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p)));
  };

  const enrolledList = students.filter((s) => s.checked);
  const notEnrolledList = students.filter((s) => !s.checked);

  const save = async () => {
    if (!selectedSubjectId) return;
    setSaving(true);
    try {
      // Fetch current registrations from backend (all pages)
      let currentArray: any[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const params = new URLSearchParams({
          branch_id: branchId,
          subject_id: selectedSubjectId,
          page: page.toString(),
          page_size: '50'
        });

        const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/hod/students/?${params}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (!data.results) {
          throw new Error(data.message || "Failed to fetch current registrations");
        }

        // If no results, stop pagination
        if (data.results.length === 0) {
          break;
        }

        // Accumulate current registrations from this page
        currentArray = [...currentArray, ...data.results];

        // Check if there's a next page
        hasNextPage = data.next !== null;
        page += 1;
      }

      const currentlyRegistered = new Set(currentArray.map((s: any) => s.usn || s.student_id || s.id));

      const nowChecked = new Set(students.filter((s) => s.checked).map((s) => s.usn));

      const toRegister = Array.from(nowChecked).filter((u) => !currentlyRegistered.has(u));
      const toUnregister = Array.from(currentlyRegistered).filter((u) => !nowChecked.has(u));

      let registeredCount = 0;
      let removedCount = 0;
      let failed: any[] = [];

      if (toRegister.length > 0) {
        const res = await manageStudents({ action: "bulk_register_subjects", branch_id: branchId, subject_id: selectedSubjectId, student_ids: toRegister }, "POST");
        if (res && res.success) {
          registeredCount = res.data?.registered_count ?? res.data?.registered?.length ?? toRegister.length;
          failed = failed.concat(res.data?.failed || []);
        } else {
          const msg = res?.message || 'Failed to register students';
          setResultData({ added: 0, removed: 0, failed: [msg] });
          setResultModalOpen(true);
          setSaving(false);
          return;
        }
      }

      if (toUnregister.length > 0) {
        const res2 = await manageStudents({ action: "bulk_unregister_subjects", branch_id: branchId, subject_id: selectedSubjectId, student_ids: toUnregister }, "POST");
        if (res2 && res2.success) {
          removedCount = res2.data?.removed_count ?? res2.data?.removed?.length ?? toUnregister.length;
          failed = failed.concat(res2.data?.failed || []);
        } else {
          const msg = res2?.message || 'Failed to unregister students';
          setResultData({ added: 0, removed: 0, failed: [msg] });
          setResultModalOpen(true);
          setSaving(false);
          return;
        }
      }

      setResultData({ added: registeredCount, removed: removedCount, failed });
      setResultModalOpen(true);
      // reload full class view to reflect changes
      await loadStudents();
    } catch (e) {
      console.error(e);
      setResultData({ added: 0, removed: 0, failed: [] });
      setResultModalOpen(true);
    }
    setSaving(false);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Student Enrollment (Elective / Open Elective)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Semester</label>
              <Select value={semesterId} onValueChange={(v: string) => { setSemesterId(v); setSectionId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem: any) => (
                    <SelectItem key={sem.id} value={sem.id}>{`${sem.number}th Semester`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const semObj = semesters.find((s: any) => String(s.id) === String(semesterId));
                    const semNumberKey = semObj ? String(semObj.number) : "";
                    const list = sectionsBySemester[String(semesterId)] || sectionsBySemester[semNumberKey] || [];
                    return list.map((sec: any) => (
                      <SelectItem key={String(sec.id)} value={String(sec.id)}>{sec.name}</SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject Type</label>
              <Select value={subjectType} onValueChange={setSubjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Subject type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elective">Elective</SelectItem>
                  <SelectItem value="open_elective">Open Elective</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mb-4 items-center">
            <div className="flex-1 max-w-xs">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by USN or name"
                className={`w-full px-3 py-1 text-sm rounded border placeholder-gray-400 ${
                  theme === 'dark'
                    ? 'bg-background border-border text-foreground placeholder:text-muted-foreground'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <Button onClick={loadStudents} disabled={!semesterId || !sectionId || !selectedSubjectId || isLoading}>Load Students</Button>
            <Button onClick={loadEnrolledStudents} disabled={!selectedSubjectId || isLoading}>Load Enrolled</Button>
            <Button variant="secondary" onClick={save} disabled={saving || students.length===0}>Save Enrollment</Button>
            <div className="ml-4 text-sm">Enrolled: {students.filter((s:any)=>s.checked).length}</div>
            <label className="flex items-center gap-2 ml-4 text-sm">
              <input type="checkbox" checked={showEnrolledOnly} onChange={(e)=>setShowEnrolledOnly(e.target.checked)} />
              <span>Show enrolled only</span>
            </label>
          </div>

          <div>
            {isLoading ? (
              <div>Loading students...</div>
            ) : (
              <>
                {students.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No students loaded</div>
                ) : (
                  (() => {
                    const q = searchTerm.trim().toLowerCase();
                    const filtered = q
                      ? students.filter((s: any) => (s.usn || "").toLowerCase().includes(q) || (s.name || "").toLowerCase().includes(q))
                      : students;

                    // Apply frontend pagination
                    const startIndex = (currentPage - 1) * studentsPerPage;
                    const endIndex = startIndex + studentsPerPage;
                    const paginatedFiltered = filtered.slice(startIndex, endIndex);

                    const enrolledListFiltered = paginatedFiltered.filter((s: any) => s.checked);
                    const notEnrolledListFiltered = paginatedFiltered.filter((s: any) => !s.checked);

                    return (
                      <>
                        <div className={showEnrolledOnly ? "" : "grid grid-cols-2 gap-4"}>
                          <div className="p-2 border rounded">
                            <div className="flex items-center justify-between mb-2">
                              <strong>Enrolled</strong>
                              <span className="text-sm">{enrolledListFiltered.length}</span>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {enrolledListFiltered.map((s: any) => (
                                <div key={s.id} className="flex items-center gap-3">
                                  <Checkbox checked={s.checked} onCheckedChange={() => toggleStudent(s.id)} />
                                  <div>{s.usn} — {s.name}</div>
                                </div>
                              ))}
                              {enrolledListFiltered.length === 0 && <div className="text-sm text-muted-foreground">No enrolled students</div>}
                            </div>
                          </div>

                          {!showEnrolledOnly && (
                            <div className="p-2 border rounded">
                              <div className="flex items-center justify-between mb-2">
                                <strong>Not Enrolled</strong>
                                <span className="text-sm">{notEnrolledListFiltered.length}</span>
                              </div>
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {notEnrolledListFiltered.map((s: any) => (
                                  <div key={s.id} className="flex items-center gap-3">
                                    <Checkbox checked={s.checked} onCheckedChange={() => toggleStudent(s.id)} />
                                    <div>{s.usn} — {s.name}</div>
                                  </div>
                                ))}
                                {notEnrolledListFiltered.length === 0 && <div className="text-sm text-muted-foreground">All students enrolled</div>}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-4">
                            <div className={`text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                              Showing {Math.min(startIndex + 1, filtered.length)} to{" "}
                              {Math.min(endIndex, filtered.length)} of {filtered.length} students
                              {q && ` (filtered from ${students.length} total)`}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                className={`text-sm font-medium px-4 py-2 rounded-md ${theme === 'dark' ? 'text-foreground bg-background border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-50'}`}
                              >
                                Previous
                              </Button>
                              <span className={`px-4 text-lg font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                                {currentPage} of {Math.ceil(filtered.length / studentsPerPage)}
                              </span>
                              <Button
                                variant="outline"
                                disabled={currentPage === Math.ceil(filtered.length / studentsPerPage)}
                                onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(filtered.length / studentsPerPage)))}
                                className={`text-sm font-medium px-4 py-2 rounded-md ${theme === 'dark' ? 'text-foreground bg-background border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-50'}`}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()
                )}
              </>
            )}
          </div>

          <Dialog open={resultModalOpen} onOpenChange={(open) => { setResultModalOpen(open); if (!open) loadStudents(); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Enrollment Results</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <div className="mb-2">Added: <strong>{resultData.added}</strong></div>
                <div className="mb-2">Removed: <strong>{resultData.removed}</strong></div>
                <div className="mb-2">Failed: <strong>{resultData.failed?.length || 0}</strong></div>
                {resultData.failed && resultData.failed.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2">
                    {resultData.failed.map((f: any, idx: number) => (
                      <div key={idx} className="text-sm">{f.usn || f.student_id || f}</div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <div className="w-full flex justify-end">
                  <Button onClick={() => { setResultModalOpen(false); loadStudents(); }}>Close</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentEnrollment;
