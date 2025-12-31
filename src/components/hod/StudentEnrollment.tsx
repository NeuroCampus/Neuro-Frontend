import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { manageStudents, manageSubjects, getHODTimetableBootstrap } from "../../utils/hod_api";
import { useHODBootstrap } from "../../context/HODBootstrapContext";

const StudentEnrollment = () => {
  const bootstrap = useHODBootstrap();
  const [branchId, setBranchId] = useState<string>("");
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sectionsBySemester, setSectionsBySemester] = useState<Record<string, any[]>>({});
  const [semesterId, setSemesterId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [subjectType, setSubjectType] = useState<string>("elective");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [showEnrolledOnly, setShowEnrolledOnly] = useState<boolean>(false);
  const [enrolledCount, setEnrolledCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultData, setResultData] = useState<{ added: number; removed: number; failed: any[] }>({ added: 0, removed: 0, failed: [] });

  const loadEnrolledStudents = async () => {
    if (!branchId || !selectedSubjectId) return;
    setIsLoading(true);
    try {
      const res = await manageStudents({ branch_id: branchId, subject_id: selectedSubjectId }, "GET");
      let resultsArray: any[] = [];
      if (res && Array.isArray((res as any).results)) {
        resultsArray = (res as any).results;
      } else if (res && (res as any).data && Array.isArray((res as any).data)) {
        resultsArray = (res as any).data;
      } else if (Array.isArray(res)) {
        resultsArray = res as any[];
      } else {
        console.warn("Unexpected enrolled students response shape:", res);
        resultsArray = [];
      }

      const mapped = resultsArray.map((s: any) => ({
        id: s.usn || s.student_id || s.id,
        usn: s.usn || s.student_id || s.id,
        name: s.name,
        checked: true,
      }));
      setStudents(mapped);
      setEnrolledCount(mapped.length);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const loadBootstrap = async () => {
      try {
      const boot = await getHODTimetableBootstrap();
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
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadBootstrap();
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!branchId || !semesterId) return;
      try {
        const res = await manageSubjects({ branch_id: branchId, semester_id: semesterId }, "GET");
        if (res.success && Array.isArray(res.subjects)) {
          setSubjects(res.subjects.filter((s: any) => s.subject_type === subjectType));
        } else if (res.success && Array.isArray(res.data)) {
          setSubjects(res.data.filter((s: any) => s.subject_type === subjectType));
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadSubjects();
  }, [branchId, semesterId, subjectType]);

  const loadStudents = async () => {
    if (!branchId || !semesterId || !sectionId || !selectedSubjectId) return;
    setIsLoading(true);
    try {
      const res = await manageStudents({ branch_id: branchId, semester_id: semesterId, section_id: sectionId }, "GET");
      // Support multiple response shapes: paginated ({ results }), { success: true, results }, plain array, or data array
      let resultsArray: any[] = [];
      if (res && Array.isArray((res as any).results)) {
        resultsArray = (res as any).results;
      } else if (res && (res as any).data && Array.isArray((res as any).data)) {
        resultsArray = (res as any).data;
      } else if (Array.isArray(res)) {
        resultsArray = res as any[];
      } else {
        console.warn("Unexpected students response shape:", res);
        resultsArray = [];
      }

      // Also fetch enrolled students for this subject to mark them
      const enrolledRes = await manageStudents({ branch_id: branchId, subject_id: selectedSubjectId }, "GET");
      let enrolledArray: any[] = [];
      if (enrolledRes && Array.isArray((enrolledRes as any).results)) enrolledArray = (enrolledRes as any).results;
      else if (enrolledRes && (enrolledRes as any).data && Array.isArray((enrolledRes as any).data)) enrolledArray = (enrolledRes as any).data;
      else if (Array.isArray(enrolledRes)) enrolledArray = enrolledRes as any[];
      const enrolledSet = new Set(enrolledArray.map((s: any) => s.usn || s.student_id || s.id));

      const mapped = resultsArray.map((s: any) => ({
        id: s.usn || s.student_id || s.id,
        usn: s.usn || s.student_id || s.id,
        name: s.name,
        checked: enrolledSet.has(s.usn || s.student_id || s.id),
      }));
      setStudents(mapped);
      setEnrolledCount(enrolledSet.size);
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
      // Fetch current registrations from backend to compute diffs
      const current = await manageStudents({ branch_id: branchId, subject_id: selectedSubjectId }, "GET");
      let currentArray: any[] = [];
      if (current && Array.isArray((current as any).results)) currentArray = (current as any).results;
      else if (current && (current as any).data && Array.isArray((current as any).data)) currentArray = (current as any).data;
      else if (Array.isArray(current)) currentArray = current as any[];

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
                  <div className={showEnrolledOnly ? "" : "grid grid-cols-2 gap-4"}>
                    <div className="p-2 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <strong>Enrolled</strong>
                        <span className="text-sm">{enrolledList.length}</span>
                      </div>
                      <div className="space-y-2">
                        {enrolledList.map((s: any) => (
                          <div key={s.id} className="flex items-center gap-3">
                            <Checkbox checked={s.checked} onCheckedChange={() => toggleStudent(s.id)} />
                            <div>{s.usn} — {s.name}</div>
                          </div>
                        ))}
                        {enrolledList.length === 0 && <div className="text-sm text-muted-foreground">No enrolled students</div>}
                      </div>
                    </div>

                    {!showEnrolledOnly && (
                      <div className="p-2 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <strong>Not Enrolled</strong>
                          <span className="text-sm">{notEnrolledList.length}</span>
                        </div>
                        <div className="space-y-2">
                          {notEnrolledList.map((s: any) => (
                            <div key={s.id} className="flex items-center gap-3">
                              <Checkbox checked={s.checked} onCheckedChange={() => toggleStudent(s.id)} />
                              <div>{s.usn} — {s.name}</div>
                            </div>
                          ))}
                          {notEnrolledList.length === 0 && <div className="text-sm text-muted-foreground">All students enrolled</div>}
                        </div>
                      </div>
                    )}
                  </div>
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
