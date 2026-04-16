import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { getFilterOptions } from '../../utils/coe_api';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/context/ThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createResultUploadBatch, getStudentsForRevalMakeupUpload, saveMarksForUpload, publishUploadBatch, unpublishUploadBatch, toggleWithholdResult } from '../../utils/coe_api';

export default function PublishResultsRevalMakeup() {
  const { theme } = useTheme();
  const [filters, setFilters] = useState<any>({ batches: [], branches: [], semesters: [] });
  const [selected, setSelected] = useState<any>({ batch: '', branch: '', semester: '', exam_period: '', request_type: 'all' });
  const [upload, setUpload] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsPageSize, setStudentsPageSize] = useState(25);
  const [studentsPagination, setStudentsPagination] = useState<any>(null);
  const [dirtyPages, setDirtyPages] = useState<Record<number, boolean>>({});
  const [navModalOpen, setNavModalOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<{ page: number; pageSize?: number } | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [unpublishModalOpen, setUnpublishModalOpen] = useState(false);
  const { toast } = useToast();
  const [marks, setMarks] = useState<Record<string, Record<string, { cie?: number | string | null; see?: number | string | null }>>>({});
  const [allMarks, setAllMarks] = useState<Record<string, { usn: string; subs: Record<string, { cie?: number | string | null; see?: number | string | null }> }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const opts = await getFilterOptions();
      const semestersRaw = (opts && opts.semesters) || [];
      const semMap = new Map<number, any>();
      semestersRaw.forEach((s: any) => {
        if (!semMap.has(s.number)) semMap.set(s.number, s);
      });
      const semesters = Array.from(semMap.values()).sort((a: any, b: any) => a.number - b.number);
      setFilters({ ...opts, semesters });
    })();
  }, []);

  const handleCreate = async () => {
    if (!selected.batch || !selected.branch || !selected.semester || !selected.exam_period || !selected.request_type || selected.request_type === 'all') {
      toast({ variant: 'destructive', title: 'Missing filters', description: 'Select all filters including Request Type before creating upload' });
      return;
    }
    const res = await createResultUploadBatch({ batch: String(selected.batch), branch: String(selected.branch), semester: String(selected.semester), exam_period: selected.exam_period });
    if (res.success) {
      setUpload(res.upload_batch);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.message || 'Failed to create upload' });
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selected.batch || !selected.branch || !selected.semester || !selected.exam_period || !selected.request_type || selected.request_type === 'all') return;
      try {
        const res = await createResultUploadBatch({ batch: String(selected.batch), branch: String(selected.branch), semester: String(selected.semester), exam_period: selected.exam_period });
        if (!mounted) return;
        if (res.success) {
          setUpload(res.upload_batch);
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [selected.batch, selected.branch, selected.semester, selected.exam_period, selected.request_type]);

  useEffect(() => {
    if (upload) {
      fetchStudentsPage(upload.id, 1);
    }
  }, [upload]);

  const fetchStudentsPage = async (uploadId: number, page?: number, pageSize?: number, overwriteExisting: boolean = false) => {
    const stu = await getStudentsForRevalMakeupUpload(uploadId, page, pageSize, selected.request_type === 'all' ? undefined : selected.request_type);
    if (stu.success) {
      const studentList = stu.data?.students || [];
      setStudents(studentList);
      setStudentsPagination(stu.data?.pagination || null);
      setStudentsPage(page || 1);
      setDirtyPages(prev => ({ ...(prev || {}), [page || 1]: false }));
      setAllMarks(prev => {
        const next = { ...prev };
        (studentList || []).forEach((s: any) => {
          const sid = String(s.student_id);
          if (!next[sid]) next[sid] = { usn: s.usn, subs: {} };
          (s.subjects || []).forEach((sub: any) => {
            if (overwriteExisting) {
              next[sid].subs[String(sub.id)] = { cie: sub.cie_marks ?? '', see: sub.see_marks ?? '' };
            } else {
              if (!next[sid].subs[String(sub.id)]) {
                next[sid].subs[String(sub.id)] = { cie: sub.cie_marks ?? '', see: sub.see_marks ?? '' };
              }
            }
          });
        });
        return next;
      });
    }
  };

  const handleInput = (studentId: number, usn: string, subjectId: number, field: 'cie' | 'see', value: string) => {
    const sid = String(studentId);
    const subKey = String(subjectId);
    const sanitize = (v: string) => {
      if (v === null || v === undefined) return '';
      const trimmed = String(v).trim();
      if (trimmed === '') return '';
      if (!/^-?\d+$/.test(trimmed)) return null;
      const n = Number(trimmed);
      if (Number.isNaN(n)) return null;
      return Math.floor(n);
    };
    const candidate = sanitize(value);
    if (candidate === null) return;
    if (typeof candidate === 'number' && (candidate > 50 || candidate < 0)) {
      return;
    }
    const val = candidate;
    setAllMarks(prev => {
      const next = { ...prev } as any;
      if (!next[sid]) next[sid] = { usn: usn, subs: {} };
      if (!next[sid].subs) next[sid].subs = {};
      next[sid].subs[subKey] = { ...(next[sid].subs[subKey] || {}), [field]: val };
      return next;
    });
    setMarks(prev => {
      const p = { ...prev } as any;
      const sKey = sid;
      const subKey2 = subKey;
      if (!p[sKey]) p[sKey] = {};
      if (!p[sKey][subKey2]) p[sKey][subKey2] = {};
      p[sKey][subKey2][field] = val;
      return p;
    });
    setDirtyPages(prev => ({ ...(prev || {}), [studentsPage]: true }));
  };

  const handleSave = async () => {
    if (!upload) {
      toast({ variant: 'destructive', title: 'No upload', description: 'Create upload batch first' });
      return false;
    }
    const payload: any[] = [];
    Object.entries(allMarks).forEach(([sid, data]) => {
      const usn = data.usn;
      const subs = data.subs || {};
      Object.entries(subs).forEach(([subId, marksObj]) => {
        const rawCie = (marksObj as any).cie;
        const rawSee = (marksObj as any).see;
        const cieVal = (rawCie === null || rawCie === undefined || (typeof rawCie === 'string' && String(rawCie).trim() === '')) ? null : Number(rawCie);
        const seeVal = (rawSee === null || rawSee === undefined || (typeof rawSee === 'string' && String(rawSee).trim() === '')) ? null : Number(rawSee);
        payload.push({ usn: usn, subject_id: Number(subId), cie_marks: Number.isNaN(cieVal) ? null : cieVal, see_marks: Number.isNaN(seeVal) ? null : seeVal });
      });
    });
    setSaving(true);
    const res = await saveMarksForUpload(upload.id, payload);
    setSaving(false);
    if (res.success) {
      toast({ title: 'Saved', description: `Saved ${res.saved_count} records` });
      setDirtyPages({});
      setAllMarks(prev => {
        const next = { ...(prev || {}) } as any;
        payload.forEach((rec: any) => {
          const sid = Object.keys(next).find(k => next[k].usn === rec.usn) || String(rec.usn);
          let sidKey = sid;
          if (!next[sidKey]) {
            const found = (students || []).find(s => s.usn === rec.usn);
            if (found) sidKey = String(found.student_id);
          }
          if (!next[sidKey]) next[sidKey] = { usn: rec.usn, subs: {} };
          if (!next[sidKey].subs) next[sidKey].subs = {};
          const subId = String(rec.subject_id);
          next[sidKey].subs[subId] = { cie: rec.cie_marks === null ? '' : Number(rec.cie_marks), see: rec.see_marks === null ? '' : Number(rec.see_marks) };
        });
        return next;
      });
      setMarks(prev => {
        const next = { ...(prev || {}) } as any;
        payload.forEach((rec: any) => {
          const sid = String(rec.student_id || Object.keys(next).find(k => k === String(rec.student_id)) || (students.find(s => s.usn === rec.usn) ? String((students.find(s => s.usn === rec.usn) as any).student_id) : String(rec.student_id || rec.usn)));
          const subId = String(rec.subject_id);
          if (!next[sid]) next[sid] = {};
          if (!next[sid][subId]) next[sid][subId] = {};
          next[sid][subId].cie = rec.cie_marks === null ? '' : Number(rec.cie_marks);
          next[sid][subId].see = rec.see_marks === null ? '' : Number(rec.see_marks);
        });
        return next;
      });
      return true;
    } else {
      toast({ variant: 'destructive', title: 'Save failed', description: res.message || 'Failed saving' });
      return false;
    }
  };

  const navigateToPage = async (targetPage: number, pageSize?: number) => {
    if (!upload) return;
    if (targetPage === studentsPage) return;
    const currentDirty = dirtyPages[studentsPage];
    if (currentDirty) {
      setPendingNav({ page: targetPage, pageSize });
      setNavModalOpen(true);
      return;
    }
    await fetchStudentsPage(upload.id, targetPage, pageSize ?? studentsPageSize);
  };

  const confirmNavSave = async (saveFirst: boolean) => {
    if (!upload || !pendingNav) return setNavModalOpen(false);
    setNavModalOpen(false);
    if (saveFirst) {
      const ok = await handleSave();
      if (!ok) return;
    }
    if (!saveFirst) {
      setAllMarks(prev => {
        const next = { ...prev };
        (students || []).forEach((s: any) => {
          delete next[String(s.student_id)];
        });
        return next;
      });
      setDirtyPages(prev => ({ ...(prev || {}), [studentsPage]: false }));
    }
    await fetchStudentsPage(upload.id, pendingNav.page, pendingNav.pageSize ?? studentsPageSize);
    setPendingNav(null);
  };

  const handlePublish = async () => {
    if (!upload) {
      toast({ variant: 'destructive', title: 'No upload', description: 'Create upload batch first' });
      return;
    }
    const res = await publishUploadBatch(upload.id);
    if (res.success) {
      toast({ title: 'Published', description: 'Published successfully' });
      setUpload({ ...upload, is_published: true });
      await fetchStudentsPage(upload.id, studentsPage, studentsPageSize);
    } else {
      toast({ variant: 'destructive', title: 'Publish failed', description: res.message || 'Publish failed' });
    }
  };

  const handleToggleWithhold = async (studentId: number, studentName: string, publishedResultId: number | null, currentWithheld: boolean) => {
    if (!publishedResultId) {
      toast({ variant: 'destructive', title: 'Cannot withhold', description: 'No published result found for this student' });
      return;
    }
    
    try {
      const res = await toggleWithholdResult(publishedResultId);
      if (res.success) {
        const actionText = res.withheld ? 'withheld' : 'released';
        toast({ title: 'Success', description: `Result ${actionText} for ${studentName}` });
        if (upload) {
          await fetchStudentsPage(upload.id, studentsPage, studentsPageSize, true);
        }
      } else {
        toast({ variant: 'destructive', title: 'Failed to toggle withhold', description: res.message || 'Toggle failed' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e?.message || 'Failed to toggle withhold status' });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Publish Results (Reval/Makeup)</h2>
      <div className="flex gap-4 mb-4 flex-wrap">
        <div>
          <label className="block text-sm">Batch</label>
          <Select value={selected.batch} onValueChange={(v) => setSelected(s => ({ ...s, batch: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              {filters.batches.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm">Branch</label>
          <Select value={selected.branch} onValueChange={(v) => setSelected(s => ({ ...s, branch: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {filters.branches.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm">Semester</label>
          <Select value={selected.semester} onValueChange={(v) => setSelected(s => ({ ...s, semester: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {filters.semesters.map((s: any) => (
                <SelectItem key={`${s.id}_${s.number}`} value={String(s.number)}>{s.number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm">Exam Period</label>
          <Select value={selected.exam_period} onValueChange={(v) => setSelected(s => ({ ...s, exam_period: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Exam period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="june_july">June/July</SelectItem>
              <SelectItem value="nov_dec">Nov/Dec</SelectItem>
              <SelectItem value="jan_feb">Jan/Feb</SelectItem>
              <SelectItem value="apr_may">Apr/May</SelectItem>
              <SelectItem value="supplementary">Supplementary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm">Request Type</label>
          <Select value={selected.request_type} onValueChange={(v) => setSelected(s => ({ ...s, request_type: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Request type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revaluation">Revaluation</SelectItem>
              <SelectItem value="makeup">Makeup</SelectItem>
              <SelectItem value="supplementary">Supplementary</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={handleCreate}>Create Upload Batch</Button>
        </div>
      </div>

      {upload && (
        <div className="mb-4">
          <div>Upload ID: {upload.id} | Token: {upload.token}</div>
          <div className="mt-2 flex items-center gap-4">
            <div>Published: <span className={`font-medium ${upload.is_published ? 'text-green-600' : 'text-red-600'}`}>{upload.is_published ? 'Yes' : 'No'}</span></div>
            {upload.is_published ? (
              <Button onClick={() => setUnpublishModalOpen(true)} variant="secondary">Unpublish</Button>
            ) : (
              <Button className="btn-primary" onClick={() => setPublishModalOpen(true)}>Publish Results</Button>
            )}
          </div>
        </div>
      )}

      {students.length > 0 && (
        <div className="overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-muted-foreground">Showing {students.length} students</div>
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-2">
                <label className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : ''}`}>Page size</label>
                <select value={studentsPageSize} onChange={(e) => {
                  const v = Number(e.target.value);
                  setStudentsPageSize(v);
                  if (upload) navigateToPage(1, v);
                }} className={`border rounded px-2 py-1 ${theme === 'dark' ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-foreground'}`}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {students.map((s) => {
              const studentMarks = (allMarks[String(s.student_id)]?.subs) || marks[String(s.student_id)] || {};
              const meetsPassCriteria = (c: any, se: any, t: any) => {
                return (typeof c === 'number' && typeof se === 'number' && typeof t === 'number') && (c >= 20 && se >= 18 && t >= 40);
              };
              const incompleteCount = (s.subjects || []).reduce((acc: number, sub: any) => {
                const e = studentMarks[String(sub.id)];
                const cie = e?.cie;
                const see = e?.see;
                if (cie === null || cie === undefined || see === null || see === undefined || cie === '' || see === '') return acc + 1;
                return acc;
              }, 0);

              return (
                <div key={s.student_id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{s.name} <span className="text-sm text-muted-foreground">({s.usn})</span></div>
                      <div className="text-sm text-muted-foreground">Subjects: {(s.subjects || []).length} • Incomplete Entries: {incompleteCount}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.is_withheld && (
                        <div className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-300">
                          Withheld
                        </div>
                      )}
                      {upload?.is_published && (
                        <Button
                          size="sm"
                          variant={s.is_withheld ? "outline" : "destructive"}
                          onClick={async () => {
                            if (!s.published_result_id) {
                              toast({ variant: 'destructive', title: 'Not Ready', description: 'Published result ID not found yet. Please refresh student list.' });
                              return;
                            }
                            await handleToggleWithhold(s.student_id, s.name, s.published_result_id, s.is_withheld);
                          }}
                          className="text-xs"
                        >
                          {s.is_withheld ? "Release Result" : "Withhold Result"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <table className="table-auto w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">Subject Code</th>
                        <th className="border px-2 py-1">Subject Title</th>
                        <th className="border px-2 py-1">Request Types</th>
                        <th className="border px-2 py-1">Request Status</th>
                        <th className="border px-2 py-1">CIE</th>
                        <th className="border px-2 py-1">SEE</th>
                        <th className="border px-2 py-1">Total Marks</th>
                        <th className="border px-2 py-1">Result</th>
                        <th className="border px-2 py-1">Grade</th>
                        <th className="border px-2 py-1">Grade Point</th>
                        <th className="border px-2 py-1">Credits Assigned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(s.subjects || []).map((sub: any) => {
                        const entry = studentMarks[String(sub.id)];
                        const cie = entry?.cie ?? '';
                        const see = entry?.see ?? '';
                        const total = (typeof cie === 'number' && typeof see === 'number') ? (cie + see) : '';
                        const displayTotal = total;
                        const result = displayTotal === '' ? 'Incomplete' : (meetsPassCriteria(cie, see, total) ? 'Pass' : 'Fail');
                        
                        let grade = '';
                        let gradePoints = '';
                        if (typeof total === 'number') {
                          if (total >= 90) { grade = 'S'; gradePoints = '10'; }
                          else if (total >= 80) { grade = 'A'; gradePoints = '9'; }
                          else if (total >= 70) { grade = 'B'; gradePoints = '8'; }
                          else if (total >= 60) { grade = 'C'; gradePoints = '7'; }
                          else if (total >= 50) { grade = 'D'; gradePoints = '6'; }
                          else if (total >= 40) { grade = 'E'; gradePoints = '5'; }
                          else { grade = 'F'; gradePoints = '0'; }
                        }
                        
                        return (
                          <tr key={sub.id}>
                            <td className="border px-2 py-1">{sub.code}</td>
                            <td className="border px-2 py-1">{sub.name}</td>
                            <td className="border px-2 py-1">{sub.request_details?.types?.join(', ') || 'N/A'}</td>
                            <td className="border px-2 py-1">{sub.request_details?.status || 'N/A'}</td>
                            <td className={`border px-2 py-1`}><Input disabled={upload?.is_published} className="w-20" type="number" min={0} max={50} value={cie} onChange={(e: any) => handleInput(s.student_id, s.usn, sub.id, 'cie', e.target.value)} onWheel={(e:any) => e.currentTarget.blur()} /></td>
                            <td className={`border px-2 py-1`}><Input disabled={upload?.is_published} className="w-20" type="number" min={0} max={50} value={see} onChange={(e: any) => handleInput(s.student_id, s.usn, sub.id, 'see', e.target.value)} onWheel={(e:any) => e.currentTarget.blur()} /></td>
                            <td className="border px-2 py-1">{displayTotal}</td>
                            <td className={`border px-2 py-1 ${result === 'Pass' ? 'text-green-600' : result === 'Fail' ? 'text-red-600' : 'text-yellow-600'}`}>{result}</td>
                            <td className="border px-2 py-1">{grade}</td>
                            <td className="border px-2 py-1">{gradePoints}</td>
                            <td className="border px-2 py-1">{result === 'Pass' ? (sub.credits ?? 0) : (result === 'Fail' ? 0 : 'N/A')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={10} className="border px-2 py-1 font-semibold text-right">Total Credits Earned:</td>
                        <td className="border px-2 py-1 font-semibold">
                          {(s.subjects || []).reduce((acc: number, sub: any) => {
                            const entry = studentMarks[String(sub.id)];
                            const cie = entry?.cie;
                            const see = entry?.see;
                            const total = (typeof cie === 'number' && typeof see === 'number') ? (cie + see) : null;
                            const passed = meetsPassCriteria(cie, see, total);
                            const creditsToAdd = passed ? (sub.credits || 0) : 0;
                            return acc + creditsToAdd;
                          }, 0)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={10} className="border px-2 py-1 font-semibold text-right">Total Marks Obtained:</td>
                        <td className="border px-2 py-1 font-semibold">
                          {(s.subjects || []).reduce((acc: number, sub: any) => {
                            const entry = studentMarks[String(sub.id)];
                            const cie = entry?.cie;
                            const see = entry?.see;
                            const total = (typeof cie === 'number' && typeof see === 'number') ? (cie + see) : 0;
                            return acc + (typeof total === 'number' ? total : 0);
                          }, 0)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={10} className="border px-2 py-1 font-semibold text-right">SGPA:</td>
                        <td className="border px-2 py-1 font-semibold">
                          {(() => {
                            const subjects = s.subjects || [];
                            let totalGradePoints = 0;
                            let totalCredits = 0;
                            
                            subjects.forEach((sub: any) => {
                              const entry = studentMarks[String(sub.id)];
                              const cie = entry?.cie;
                              const see = entry?.see;
                              const total = (typeof cie === 'number' && typeof see === 'number') ? (cie + see) : null;
                              const credits = sub.credits || 0;
                              const passed = meetsPassCriteria(cie, see, total);

                              if (typeof total === 'number' && credits > 0 && passed) {
                                let gradePoints = 0;
                                if (total >= 90) gradePoints = 10;
                                else if (total >= 80) gradePoints = 9;
                                else if (total >= 70) gradePoints = 8;
                                else if (total >= 60) gradePoints = 7;
                                else if (total >= 50) gradePoints = 6;
                                else if (total >= 40) gradePoints = 5;
                                else gradePoints = 0;

                                totalGradePoints += gradePoints * credits;
                                totalCredits += credits;
                              }
                            });
                            
                            return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';
                          })()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <div className="flex items-center gap-3 mr-auto">
              <button className="btn btn-sm" disabled={studentsPage <= 1} onClick={() => {
                if (!upload) return;
                navigateToPage(Math.max(1, studentsPage - 1));
              }}>Previous</button>

              {(() => {
                const totalPages = studentsPagination?.count ? Math.max(1, Math.ceil(studentsPagination.count / studentsPageSize)) : 1;
                const maxButtons = 20;
                let start = 1, end = totalPages;
                if (totalPages > maxButtons) {
                  const half = Math.floor(maxButtons / 2);
                  start = Math.max(1, studentsPage - half);
                  end = Math.min(totalPages, start + maxButtons - 1);
                  if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);
                }
                const pages = [];
                for (let p = start; p <= end; p++) pages.push(p);
                return (
                  <div className="flex gap-1">
                      {pages.map(p => (
                        <button
                          key={p}
                          className={`btn btn-xs ${p === studentsPage ? (theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-primary text-white') : (theme === 'dark' ? 'bg-slate-800 text-muted-foreground' : '')}`}
                          onClick={() => upload && navigateToPage(p)}
                        >{p}</button>
                    ))}
                  </div>
                );
              })()}

              <button className="btn btn-sm" disabled={!studentsPagination?.next} onClick={() => {
                if (!upload) return;
                navigateToPage(studentsPage + 1);
              }}>Next</button>
            </div>

            <Button onClick={handleSave} disabled={saving || upload?.is_published}>{saving ? 'Saving...' : 'Save Marks'}</Button>
          </div>
        </div>
      )}

      <Dialog open={navModalOpen} onOpenChange={setNavModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes on this page. Do you want to save them before navigating?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => confirmNavSave(false)}>Discard</Button>
            <Button onClick={() => confirmNavSave(true)}>Save & Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Results</DialogTitle>
            <DialogDescription>
              <AlertTriangle className="inline mr-2" />
              Once published, results cannot be edited. This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishModalOpen(false)}>Cancel</Button>
            <Button onClick={() => { setPublishModalOpen(false); handlePublish(); }}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={unpublishModalOpen} onOpenChange={setUnpublishModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unpublish Results</DialogTitle>
            <DialogDescription>
              <AlertTriangle className="inline mr-2" />
              This will make the results inaccessible to students. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnpublishModalOpen(false)}>Cancel</Button>
            <Button onClick={() => { setUnpublishModalOpen(false); setUpload({ ...upload, is_published: false }); }}>Unpublish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}