import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import jsPDF from 'jspdf';
import { useFacultyAssignmentsQuery } from "../../hooks/useApiQueries";
import { createQuestionPaper, updateQuestionPaper, getQuestionPapers, submitQPForApproval } from "../../utils/faculty_api";
import { useTheme } from "@/context/ThemeContext";

interface QuestionRow {
  id: string;
  number: string;
  content: string;
  maxMarks: string;
  co: string;
  bloomsLevel: string;
}

const UploadQP = () => {
  const { data: assignments = [] } = useFacultyAssignmentsQuery();
  const [dropdownData, setDropdownData] = useState({
    branch: [] as { id: number; name: string }[],
    semester: [] as { id: number; number: number }[],
    section: [] as { id: number; name: string }[],
    subject: [] as { id: number; name: string }[],
    testType: ["IA1", "IA2", "IA3", "SEE"],
  });

  const [selected, setSelected] = useState({
    branch_id: undefined as number | undefined,
    semester_id: undefined as number | undefined,
    section_id: undefined as number | undefined,
    subject_id: undefined as number | undefined,
    testType: "IA1",
  });

  // start empty; populate only after Branch+Subject+TestType selection
  const [questions, setQuestions] = useState<QuestionRow[]>([]);

  const [tabValue, setTabValue] = useState('questionFormat');
  const [questionFormatSaved, setQuestionFormatSaved] = useState(false);
  const [qpId, setQpId] = useState<number | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const branches = Array.from(new Map(assignments.map(a => [a.branch_id, { id: a.branch_id, name: a.branch }])).values());
    const subjects = Array.from(new Map(assignments.map(a => [a.subject_id, { id: a.subject_id, name: a.subject_name }])).values());
    setDropdownData(prev => ({ ...prev, branch: branches, subject: subjects }));
  }, [assignments]);

  // Load existing QP when Branch + Subject + Test Type are selected
  useEffect(() => {
    const loadIfReady = async () => {
      if (!selected.branch_id || !selected.subject_id || !selected.testType) return;
      // default template to show when no saved QP exists
      const defaultTemplate: QuestionRow[] = [
        { id: '1a', number: '1a', content: 'Question 1a', maxMarks: '7', co: 'CO2', bloomsLevel: 'Apply' },
        { id: '1b', number: '1b', content: 'Question 1b', maxMarks: '7', co: 'CO2', bloomsLevel: 'Apply' },
        { id: '1c', number: '1c', content: 'Question 1c', maxMarks: '6', co: 'CO1', bloomsLevel: 'Remember' }
      ];
      try {
        const res = await getQuestionPapers({ branch_id: selected.branch_id?.toString(), semester_id: selected.semester_id?.toString(), section_id: selected.section_id?.toString(), subject_id: selected.subject_id?.toString(), test_type: selected.testType, detail: true });
        if (res && res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
          // prefer exact match on subject+test_type; do NOT fallback to first result
          const qp = res.data.find((q: any) => q.subject === selected.subject_id && q.test_type === selected.testType);
          if (qp) {
            // build flat question rows from nested questions/subparts
            const rows: QuestionRow[] = [];
            // support both serializer shapes: 'questions' with 'subparts', and 'questions_data' with 'subparts_data'
            const questionsArray = qp.questions || qp.questions_data || [];
            questionsArray.forEach((q: any) => {
              const subpartsArray = q.subparts || q.subparts_data || [];
              subpartsArray.forEach((s: any) => {
                const qnum = q.question_number || q.question_number || q.question_number; // fallback
                rows.push({ id: `${qnum}${s.subpart_label}`, number: `${qnum}${s.subpart_label}`, content: s.content || '', maxMarks: String(s.max_marks || s.maxMarks || ''), co: q.co || '', bloomsLevel: q.blooms_level || q.bloomsLevel || '' });
              });
            });
            if (rows.length) {
              setQuestions(rows);
              setQpId(qp.id);
              setQuestionFormatSaved(true);
            } else {
              // treat as no saved QP for this selection
              setQuestions(defaultTemplate);
              setQpId(null);
              setQuestionFormatSaved(false);
            }
          } else {
            // server returned QPs but none matched the requested test_type — treat as no saved QP
            setQuestions(defaultTemplate);
            setQpId(null);
            setQuestionFormatSaved(false);
          }
        } else {
          // no saved QP — use default template for this selection
          setQuestions(defaultTemplate);
          setQpId(null);
          setQuestionFormatSaved(false);
        }
      } catch (err) {
        console.error('Error loading QP:', err);
      }
    };
    loadIfReady();
  }, [selected.branch_id, selected.subject_id, selected.testType]);

  useEffect(() => {
    // update total marks when questions change
  }, [questions]);

  const addQuestion = () => {
    const nextId = `${Date.now()}`;
    setQuestions(prev => [...prev, { id: nextId, number: `q${prev.length+1}`, content: `Question ${prev.length+1}`, maxMarks: '7', co: 'CO2', bloomsLevel: 'Apply' }]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof QuestionRow, value: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? ({ ...q, [field]: value }) : q));
  };

  const totalMarks = questions.reduce((s, q) => s + (parseInt(q.maxMarks || '0') || 0), 0);

  const saveFormat = async () => {
    // minimal validation: require branch, subject and test type to be explicitly selected
    if (!selected.branch_id || !selected.subject_id || !selected.testType) return alert('Select branch, subject and test type');
    // prepare payload similar to existing API expectations
    const grouped: any = {};
    questions.forEach(q => {
      const main = q.number.charAt(0);
      if (!grouped[main]) grouped[main] = { co: q.co, blooms_level: q.bloomsLevel, subparts: [] };
      grouped[main].subparts.push({ subpart_label: q.number.slice(1), content: q.content, max_marks: parseInt(q.maxMarks || '0') });
    });
    const payload: any = { subject: selected.subject_id, test_type: selected.testType, questions_data: Object.keys(grouped).map(k => ({ question_number: k, co: grouped[k].co, blooms_level: grouped[k].blooms_level, subparts_data: grouped[k].subparts })) };

    // Derive branch/semester/section when missing from assignments (like UploadMarks.tsx)
    const assignForSubject = assignments.find(a => a.subject_id === selected.subject_id);
    const derivedBranchId = selected.branch_id || (assignForSubject ? assignForSubject.branch_id : undefined);
    const derivedSemesterId = selected.semester_id || (assignForSubject ? assignForSubject.semester_id : undefined);
    const derivedSectionId = selected.section_id || (assignForSubject ? assignForSubject.section_id : undefined);

    // attach branch/semester/section ensuring required fields are present
    payload.branch = derivedBranchId;
    payload.semester = derivedSemesterId;
    payload.section = derivedSectionId;

    if (!payload.branch || !payload.semester || !payload.section) {
      alert('Please select or ensure assignment provides Branch, Semester and Section before saving the QP format.');
      return;
    }

    try {
      // check existing
      const existingRes = await getQuestionPapers({ branch_id: selected.branch_id?.toString(), semester_id: selected.semester_id?.toString(), section_id: selected.section_id?.toString(), subject_id: selected.subject_id?.toString(), test_type: selected.testType, detail: false });
      let existing = null;
      if (existingRes && existingRes.success && existingRes.data) {
        existing = existingRes.data.find((q: any) => q.subject === selected.subject_id && q.test_type === selected.testType);
      }
      let res;
      if (existing) {
        res = await updateQuestionPaper(existing.id, payload);
        setQpId(existing.id);
      } else {
        res = await createQuestionPaper(payload);
        if (res && res.success && res.data) setQpId(res.data.id);
      }
      if (res && res.success) {
        setQuestionFormatSaved(true);
        setTabValue('questionPaper');
        alert('Saved');
      } else {
        alert('Failed to save');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving');
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(14);
    doc.text('Question Paper', 14, y);
    y += 8;
    questions.forEach(q => {
      doc.setFontSize(12);
      doc.text(`${q.number}. ${q.content}`, 14, y);
      y += 6;
      doc.setFontSize(10);
      doc.text(`(${q.maxMarks} marks)`, 14, y);
      y += 6;
      doc.text(`CO: ${q.co}`, 14, y);
      y += 6;
      doc.text(`Blooms: ${q.bloomsLevel}`, 14, y);
      y += 8;
      if (y > 270) { doc.addPage(); y = 10; }
    });
    doc.setFontSize(12);
    doc.text(`Total Marks: ${totalMarks}`, 14, y);
    doc.save('question-paper.pdf');
  };

  const handleSubmitForApproval = async () => {
    if (!qpId) return;
    
    try {
      const result = await submitQPForApproval(qpId);
      if (result.success) {
        alert("QP submitted for approval successfully!");
      } else {
        alert(result.message || "Failed to submit QP for approval");
      }
    } catch (error) {
      console.error("Error submitting QP:", error);
      alert("Network error while submitting QP");
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Upload QP Pattern</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm">Branch</label>
              <Select onValueChange={(v) => setSelected(s => ({ ...s, branch_id: Number(v) }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownData.branch.map(b => (<SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Subject</label>
              <Select onValueChange={(v) => setSelected(s => ({ ...s, subject_id: Number(v) }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownData.subject.map(s => (<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Test Type</label>
              <Select onValueChange={(v) => setSelected(s => ({ ...s, testType: String(v) }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Test Type" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownData.testType.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={tabValue} onValueChange={(v) => setTabValue(v)}>
            <TabsList>
              <TabsTrigger value="questionFormat">Question Format</TabsTrigger>
              <TabsTrigger value="questionPaper">Question Paper</TabsTrigger>
            </TabsList>
            <TabsContent value="questionFormat">
              <div className="space-y-2">
                {(!selected.branch_id || !selected.subject_id || !selected.testType) ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">Select Branch, Subject and Test Type to load or create a question paper.</div>
                ) : (
                  <>
                    {questions.map(q => (
                      <div key={q.id} className="flex gap-2 items-center">
                        <Input value={q.number} onChange={e => updateQuestion(q.id, 'number', e.target.value)} className="w-20" />
                        <Input value={q.content} onChange={e => updateQuestion(q.id, 'content', e.target.value)} />
                        <Input value={q.maxMarks} onChange={e => updateQuestion(q.id, 'maxMarks', e.target.value)} className="w-20" />
                        <Input value={q.co} onChange={e => updateQuestion(q.id, 'co', e.target.value)} className="w-24" />
                        <Input value={q.bloomsLevel} onChange={e => updateQuestion(q.id, 'bloomsLevel', e.target.value)} className="w-24" />
                        <Button variant="ghost" onClick={() => removeQuestion(q.id)}><Trash2 size={16} /></Button>
                      </div>
                    ))}
                    <div className="mt-2">
                      <Button onClick={addQuestion} className="mr-2" disabled={!selected.branch_id || !selected.subject_id || !selected.testType}><Plus size={14} /> Add Question</Button>
                      <Button onClick={saveFormat} disabled={!selected.branch_id || !selected.subject_id || !selected.testType}>Save Format</Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            <TabsContent value="questionPaper">
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Question Paper Preview</h3>
                  <div>
                    <Button onClick={downloadPDF} className="mr-2">Download PDF</Button>
                    {qpId && (
                      <Button onClick={handleSubmitForApproval} variant="outline" className="bg-green-600 text-white hover:bg-green-700">
                        Submit for Approval
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  {questions.map(q => (
                    <div key={q.id} className="mb-4">
                      <div className="font-medium">{q.number}.</div>
                      <div className="mt-1">{q.content}</div>
                      <div className="mt-1">({q.maxMarks} marks)</div>
                      <div className="text-sm mt-1">CO: {q.co}</div>
                      <div className="text-sm">Blooms: {q.bloomsLevel}</div>
                    </div>
                  ))}
                  <div className="font-semibold">Total Marks: {totalMarks}</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadQP;
