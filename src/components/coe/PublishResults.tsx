import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { getFilterOptions } from '../../utils/coe_api';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/context/ThemeContext';
import { createResultUploadBatch, getStudentsForUpload, saveMarksForUpload, publishUploadBatch } from '../../utils/coe_api';

export default function PublishResults() {
  const [filters, setFilters] = useState<any>({ batches: [], branches: [], semesters: [] });
  const [selected, setSelected] = useState<any>({ batch: '', branch: '', semester: '', exam_period: 'june_july' });
  const [upload, setUpload] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, Record<string, { cie?: number | string | null; see?: number | string | null }>>>({});
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
    if (!selected.batch || !selected.branch || !selected.semester || !selected.exam_period) return alert('Select all filters');
    const res = await createResultUploadBatch({ batch: String(selected.batch), branch: String(selected.branch), semester: String(selected.semester), exam_period: selected.exam_period });
    if (res.success) {
      setUpload(res.upload_batch);
      // fetch students (includes existing marks if present)
      const stu = await getStudentsForUpload(res.upload_batch.id);
      if (stu.success) {
        setStudents(stu.students || []);
        // populate marks state from existing data
        const marksState: any = {};
        (stu.students || []).forEach((s: any) => {
          const sKey = String(s.student_id);
          marksState[sKey] = {};
          (s.subjects || []).forEach((sub: any) => {
            marksState[sKey][String(sub.id)] = { cie: sub.cie_marks ?? '', see: sub.see_marks ?? '' };
          });
        });
        setMarks(marksState);
      }
    } else {
      alert(res.message || 'Failed');
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
          const stu = await getStudentsForUpload(res.upload_batch.id);
          if (stu.success) {
            setStudents(stu.students || []);
            const marksState: any = {};
            (stu.students || []).forEach((s: any) => {
              const sKey = String(s.student_id);
              marksState[sKey] = {};
              (s.subjects || []).forEach((sub: any) => {
                marksState[sKey][String(sub.id)] = { cie: sub.cie_marks ?? '', see: sub.see_marks ?? '' };
              });
            });
            setMarks(marksState);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [selected.batch, selected.branch, selected.semester, selected.exam_period]);

  const handleInput = (studentId: number, subjectId: number, field: 'cie' | 'see', value: string) => {
    setMarks(prev => {
      const p = { ...prev };
      const sKey = String(studentId);
      const subKey = String(subjectId);
      if (!p[sKey]) p[sKey] = {};
      if (!p[sKey][subKey]) p[sKey][subKey] = {};
      const num = parseInt(value, 10);
      p[sKey][subKey][field] = isNaN(num) ? undefined : num;
      return p;
    });
  };

  const handleSave = async () => {
    if (!upload) return alert('Create upload batch first');
    const payload: any[] = [];
    for (const s of students) {
      for (const subj of s.subjects) {
        const entry = marks[String(s.student_id)]?.[String(subj.id)];
        const rawCie = entry?.cie;
        const rawSee = entry?.see;
        const cieVal = (rawCie === null || rawCie === undefined || (typeof rawCie === 'string' && rawCie.trim() === '')) ? null : Number(rawCie);
        const seeVal = (rawSee === null || rawSee === undefined || (typeof rawSee === 'string' && rawSee.trim() === '')) ? null : Number(rawSee);
        payload.push({ usn: s.usn, subject_id: subj.id, cie_marks: Number.isNaN(cieVal) ? null : cieVal, see_marks: Number.isNaN(seeVal) ? null : seeVal });
      }
    }
    setSaving(true);
    const res = await saveMarksForUpload(upload.id, payload);
    setSaving(false);
    if (res.success) {
      alert(`Saved ${res.saved_count} records`);
    } else {
      alert(res.message || 'Failed saving');
    }
  };

  const handlePublish = async () => {
    if (!upload) return alert('Create upload batch first');
    const res = await publishUploadBatch(upload.id);
    if (res.success) {
      alert('Published successfully');
      // refresh upload info
      setUpload({ ...upload, is_published: true });
    } else {
      alert(res.message || 'Publish failed');
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
              {filters.semesters.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.number}</SelectItem>)}
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
          <div>Published: {upload.is_published ? 'Yes' : 'No'}</div>
        </div>
      )}

      {students.length > 0 && (
        <div className="overflow-auto">
          <div className="space-y-4">
            {students.map((s) => {
              const studentMarks = marks[String(s.student_id)] || {};
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
                            <td className={`border px-2 py-1`}><Input className="w-20" type="number" min={0} max={50} value={cie} onChange={(e: any) => handleInput(s.student_id, sub.id, 'cie', e.target.value)} /></td>
                            <td className={`border px-2 py-1`}><Input className="w-20" type="number" min={0} max={50} value={see} onChange={(e: any) => handleInput(s.student_id, sub.id, 'see', e.target.value)} /></td>
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
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Marks'}</Button>
            <Button onClick={async () => {
              // warn about incomplete marks before publish
              const anyIncomplete = students.some((s) => (s.subjects || []).some((sub: any) => {
                const e = marks[String(s.student_id)]?.[String(sub.id)];
                const cie = e?.cie;
                const see = e?.see;
                return (cie === null || cie === undefined || see === null || see === undefined || cie === '' || see === '');
              }));
              if (anyIncomplete) {
                if (!confirm('Some students have incomplete marks. Are you sure you want to publish?')) return;
              }
              await handlePublish();
            }}>Publish Results</Button>
          </div>
        </div>
      )}
    </div>
  );
}
