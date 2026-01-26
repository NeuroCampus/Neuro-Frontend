import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { getFilterOptions } from '../../utils/coe_api';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/context/ThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createResultUploadBatch, getStudentsForUpload, saveMarksForUpload, publishUploadBatch, unpublishUploadBatch } from '../../utils/coe_api';

export default function PublishResults() {
  const { theme } = useTheme();
  const [filters, setFilters] = useState<any>({ batches: [], branches: [], semesters: [] });
  // Do not pre-select exam_period so students aren't auto-loaded before user choice
  const [selected, setSelected] = useState<any>({ batch: '', branch: '', semester: '', exam_period: '' });
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
  // marks for current page (kept for compatibility)
  const [marks, setMarks] = useState<Record<string, Record<string, { cie?: number | string | null; see?: number | string | null }>>>({});
  // persisted marks across pages keyed by student_id -> { usn, subs: { subjectId: {cie,see} }}
  const [allMarks, setAllMarks] = useState<Record<string, { usn: string; subs: Record<string, { cie?: number | string | null; see?: number | string | null }> }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const opts = await getFilterOptions();
      // Deduplicate semesters by number to avoid duplicate 1..8 entries across branches
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
    if (!selected.batch || !selected.branch || !selected.semester || !selected.exam_period) {
      toast({ variant: 'destructive', title: 'Missing filters', description: 'Select all filters before creating upload' });
      return;
    }
    const res = await createResultUploadBatch({ batch: String(selected.batch), branch: String(selected.branch), semester: String(selected.semester), exam_period: selected.exam_period });
    if (res.success) {
      setUpload(res.upload_batch);
      // fetch students (includes existing marks if present)
      await fetchStudentsPage(res.upload_batch.id, studentsPage, studentsPageSize);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.message || 'Failed to create upload' });
    }
  };

  // Auto-create or fetch existing upload when all filters are selected
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selected.batch || !selected.branch || !selected.semester || !selected.exam_period) return;
      try {
        const res = await createResultUploadBatch({ batch: String(selected.batch), branch: String(selected.branch), semester: String(selected.semester), exam_period: selected.exam_period });
        if (!mounted) return;
        if (res.success) {
          setUpload(res.upload_batch);
          await fetchStudentsPage(res.upload_batch.id, studentsPage, studentsPageSize);
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [selected.batch, selected.branch, selected.semester, selected.exam_period]);

  // Helper to fetch a specific students page and merge marks
  const fetchStudentsPage = async (uploadId: number, page?: number, pageSize?: number, overwriteExisting: boolean = false) => {
    const stu = await getStudentsForUpload(uploadId, page, pageSize);
    if (stu.success) {
      const studentList = stu.data?.students || [];
      setStudents(studentList);
      setStudentsPagination(stu.data?.pagination || null);
      setStudentsPage(page || 1);
      // mark this page as clean when freshly loaded
      setDirtyPages(prev => ({ ...(prev || {}), [page || 1]: false }));
      // merge marks into allMarks
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
    // sanitize input: allow empty string to clear, otherwise integer-like values only
    const sanitize = (v: string) => {
      if (v === null || v === undefined) return '';
      const trimmed = String(v).trim();
      if (trimmed === '') return '';
      // allow leading zeros etc by parsing number
      // but reject non-numeric input
      if (!/^-?\d+$/.test(trimmed)) return null;
      const n = Number(trimmed);
      if (Number.isNaN(n)) return null;
      return Math.floor(n);
    };
    const candidate = sanitize(value);
    // if input is non-numeric, ignore
    if (candidate === null) return;
    // enforce bounds as-you-type: reject changes that go outside 0..50
    if (typeof candidate === 'number' && (candidate > 50 || candidate < 0)) {
      return; // do not update state, preventing typing >50 or <0
    }
    const val = candidate;
    setAllMarks(prev => {
      const next = { ...prev } as any;
      if (!next[sid]) next[sid] = { usn: usn, subs: {} };
      if (!next[sid].subs) next[sid].subs = {};
      next[sid].subs[subKey] = { ...(next[sid].subs[subKey] || {}), [field]: val };
      return next;
    });
    // keep compatibility marks for current page rendering
    setMarks(prev => {
      const p = { ...prev } as any;
      const sKey = sid;
      const subKey2 = subKey;
      if (!p[sKey]) p[sKey] = {};
      if (!p[sKey][subKey2]) p[sKey][subKey2] = {};
      p[sKey][subKey2][field] = val;
      return p;
    });
    // mark current page dirty when user edits
    setDirtyPages(prev => ({ ...(prev || {}), [studentsPage]: true }));
  };

  const handleSave = async () => {
    if (!upload) {
      toast({ variant: 'destructive', title: 'No upload', description: 'Create upload batch first' });
      return false;
    }
    // Build payload from all persisted marks across pages so multi-page edits are preserved
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
      // clear dirty flags after a successful save
      setDirtyPages({});
      // Merge the saved payload into local cache so UI reflects confirmed values
      setAllMarks(prev => {
        const next = { ...(prev || {}) } as any;
        payload.forEach((rec: any) => {
          const sid = Object.keys(next).find(k => next[k].usn === rec.usn) || String(rec.usn);
          // if we can't find by usn in existing cache, try to find student by matching current students list
          let sidKey = sid;
          if (!next[sidKey]) {
            // fallback: if payload contains usn but no existing entry, attempt to find student_id from `students` on current page
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
      // also update marks for current page rendering
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
      // open in-UI modal and store pending navigation
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
      if (!ok) return; // abort if save failed
    }
    if (!saveFirst) {
      // Discard local unsaved changes for the current page so server values are shown
      setAllMarks(prev => {
        const next = { ...prev };
        (students || []).forEach((s: any) => {
          delete next[String(s.student_id)];
        });
        return next;
      });
      // mark current page clean
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
      // refresh upload info
      setUpload({ ...upload, is_published: true });
    } else {
      toast({ variant: 'destructive', title: 'Publish failed', description: res.message || 'Publish failed' });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Publish Exam Results (COE)</h2>
      <div className="flex gap-4 mb-4">
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
                // Use semester number as the value so backend can resolve by number+branch
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
              {/* page size selector */}
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
                      <div className="text-sm text-muted-foreground">Subjects: {(s.subjects || []).length} • Incomplete: {incompleteCount}</div>
                    </div>
                  </div>

                  <table className="table-auto w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">Subject</th>
                        <th className="border px-2 py-1">Code</th>
                        <th className="border px-2 py-1">CIE (0-50)</th>
                        <th className="border px-2 py-1">SEE (0-50)</th>
                        <th className="border px-2 py-1">Total</th>
                        <th className="border px-2 py-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(s.subjects || []).map((sub: any) => {
                        const entry = studentMarks[String(sub.id)];
                        const cie = entry?.cie ?? '';
                        const see = entry?.see ?? '';
                        const total = (typeof cie === 'number' && typeof see === 'number') ? (cie + see) : '';
                        const status = (typeof cie === 'number' && typeof see === 'number' && cie >= 18 && see >= 18) ? 'Pass' : (total === '' ? 'Incomplete' : 'Fail');
                        return (
                          <tr key={sub.id}>
                            <td className="border px-2 py-1">{sub.name}</td>
                            <td className="border px-2 py-1">{sub.code}</td>
                            <td className={`border px-2 py-1`}><Input disabled={upload?.is_published} className="w-20" type="number" min={0} max={50} value={cie} onChange={(e: any) => handleInput(s.student_id, s.usn, sub.id, 'cie', e.target.value)} onWheel={(e:any) => e.currentTarget.blur()} /></td>
                            <td className={`border px-2 py-1`}><Input disabled={upload?.is_published} className="w-20" type="number" min={0} max={50} value={see} onChange={(e: any) => handleInput(s.student_id, s.usn, sub.id, 'see', e.target.value)} onWheel={(e:any) => e.currentTarget.blur()} /></td>
                            <td className="border px-2 py-1">{total}</td>
                            <td className={`border px-2 py-1 ${status === 'Pass' ? 'text-green-600' : status === 'Fail' ? 'text-red-600' : 'text-yellow-600'}`}>{status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
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

              {/* page numbers (windowed) */}
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
            {upload?.is_published && (
              <Button onClick={() => setUnpublishModalOpen(true)} variant="destructive">Unpublish</Button>
            )}
          </div>
          {/* Navigation confirmation modal */}
          <Dialog open={navModalOpen} onOpenChange={setNavModalOpen}>
            <DialogContent className={`max-w-xl ${theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-6 w-6 ${theme === 'dark' ? 'text-amber-300' : 'text-amber-500'} animate-pulse`} />
                    <DialogTitle className={theme === 'dark' ? 'text-foreground text-lg' : 'text-gray-900 text-lg'}>Unsaved changes</DialogTitle>
                  </div>
                  <DialogDescription className={`mt-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>
                    You have unsaved changes on this page. Save before navigating to avoid losing edits.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6 flex justify-end">
                  <Button variant="ghost" onClick={() => { setNavModalOpen(false); setPendingNav(null); }}>Cancel</Button>
                  <button className={`ml-3 px-4 py-2 rounded border ${theme === 'dark' ? 'border-amber-400 text-amber-200 bg-amber-900/10 hover:bg-amber-900/20' : 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'}`} onClick={() => confirmNavSave(false)}>Continue without saving</button>
                  <Button className="ml-3" onClick={() => confirmNavSave(true)}>Save and continue</Button>
                </div>
              </DialogContent>
          </Dialog>
      {/* Publish confirmation modal when incomplete marks present */}
      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent className={`max-w-md ${theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-6 w-6 ${theme === 'dark' ? 'text-amber-300' : 'text-amber-500'} animate-pulse`} />
                <DialogTitle className={theme === 'dark' ? 'text-foreground text-lg' : 'text-gray-900 text-lg'}>Confirm Publish</DialogTitle>
              </div>
              <DialogDescription className={`mt-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>
                <div className="mb-2">Once published, results cannot be edited. This action is irreversible.</div>
                <div>Some students may have incomplete marks. You can continue to publish and those will be treated as incomplete/fail per rules.</div>
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setPublishModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" className="ml-3" onClick={async () => { setPublishModalOpen(false); await handlePublish(); }}>Confirm Publish</Button>
            </div>
        </DialogContent>
      </Dialog>
      {/* Unpublish confirmation modal (UI-only) */}
      <Dialog open={unpublishModalOpen} onOpenChange={setUnpublishModalOpen}>
        <DialogContent className={`max-w-md ${theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-6 w-6 ${theme === 'dark' ? 'text-rose-300' : 'text-rose-500'} animate-pulse`} />
              <DialogTitle className={theme === 'dark' ? 'text-foreground text-lg' : 'text-gray-900 text-lg'}>Confirm Unpublish</DialogTitle>
            </div>
            <DialogDescription className={`mt-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>
              This will mark the upload as not published in the UI only. No backend changes will be made. The public link will still work until the backend `is_published` flag is changed.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={() => setUnpublishModalOpen(false)}>Cancel</Button>
            <Button className="ml-3" onClick={async () => {
              setUnpublishModalOpen(false);
              if (!upload) return;
              const res = await unpublishUploadBatch(upload.id);
              if (res.success) {
                setUpload({ ...upload, is_published: false });
                toast({ title: 'Unpublished', description: 'Public link is now inactive.' });
              } else {
                toast({ variant: 'destructive', title: 'Unpublish failed', description: res.message || 'Failed to unpublish' });
              }
            }}>Confirm Unpublish</Button>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      )}
    </div>
  );
}
