import { useEffect, useState } from "react";
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
import { getStudentsForClass, takeAttendance, FacultyAssignment, ClassStudent } from "@/utils/faculty_api";
import { useFacultyAssignmentsQuery } from "@/hooks/useApiQueries";

const TakeAttendance = () => {
  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError } = useFacultyAssignmentsQuery();
  const [branchId, setBranchId] = useState<number | null>(null);
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [attendance, setAttendance] = useState<{ [studentId: number]: boolean }>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Assignments are now loaded via context

  // Reset selections if branch/semester/section/subject changes
  useEffect(() => {
    setStudents([]);
    setAttendance({});
    setSuccessMsg("");
    setErrorMsg("");
    if (branchId && semesterId && sectionId && subjectId) {
      setLoadingStudents(true);
      getStudentsForClass(branchId, semesterId, sectionId, subjectId)
        .then(stu => setStudents(stu))
        .catch(e => setErrorMsg(e.message))
        .finally(() => setLoadingStudents(false));
    }
  }, [branchId, semesterId, sectionId, subjectId]);

  // Dropdown options (deduplicated by id)
  const branches = Array.from(new Map(assignments.map(a => [a.branch_id, { id: a.branch_id, name: a.branch }])).values());
  const semesters = branchId ? Array.from(new Map(assignments.filter(a => a.branch_id === branchId).map(a => [a.semester_id, { id: a.semester_id, name: a.semester.toString() }])).values()) : [];
  const sections = branchId && semesterId ? Array.from(new Map(assignments.filter(a => a.branch_id === branchId && a.semester_id === semesterId).map(a => [a.section_id, { id: a.section_id, name: a.section }])).values()) : [];
  const subjects = branchId && semesterId && sectionId ? Array.from(new Map(assignments.filter(a => a.branch_id === branchId && a.semester_id === semesterId && a.section_id === sectionId).map(a => [a.subject_id, { id: a.subject_id, name: a.subject_name }])).values()) : [];

  const handleAttendance = (studentId: number, present: boolean) => {
    setAttendance(prev => ({ ...prev, [studentId]: present }));
  };

  const handleSubmit = async () => {
    if (!branchId || !semesterId || !sectionId || !subjectId) return;
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const attendanceArr = students.map(s => ({ student_id: s.id.toString(), status: !!attendance[s.id] }));
      const res = await takeAttendance({
        branch_id: branchId.toString(),
        semester_id: semesterId.toString(),
        section_id: sectionId.toString(),
        subject_id: subjectId.toString(),
        method: "manual",
        attendance: attendanceArr,
      });
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

  return (
    <div className="space-y-4 p-6 bg-[#1c1c1e] text-gray-200 min-h-screen">
      <Card className="bg-[#1c1c1e] text-gray-200">
        <CardHeader>
          <CardTitle>Take Attendance</CardTitle>
          <CardDescription className="text-gray-200">Record student attendance for your classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Select value={branchId?.toString()} onValueChange={v => setBranchId(Number(v))}>
                <SelectTrigger className="bg-[#232326] text-gray-200">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent className="bg-[#232326] text-gray-200">
                  {branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={semesterId?.toString()} onValueChange={v => setSemesterId(Number(v))} disabled={!branchId}>
                <SelectTrigger className="bg-[#232326] text-gray-200">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent className="bg-[#232326] text-gray-200">
                  {semesters.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sectionId?.toString()} onValueChange={v => setSectionId(Number(v))} disabled={!semesterId}>
                <SelectTrigger className="bg-[#232326] text-gray-200">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent className="bg-[#232326] text-gray-200">
                  {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={subjectId?.toString()} onValueChange={v => setSubjectId(Number(v))} disabled={!sectionId}>
                <SelectTrigger className="bg-[#232326] text-gray-200">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className="bg-[#232326] text-gray-200">
                  {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Tabs defaultValue="manual">
              <TabsList className="bg-[#232326] text-gray-200 rounded-md">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="ai" disabled>AI Processing</TabsTrigger>
              </TabsList>

              {/* Manual Entry Tab */}
              <TabsContent value="manual">
                {loadingStudents ? (
                  <div className="text-gray-400 mt-6">Loading students...</div>
                ) : students.length > 0 ? (
                  <div className="border border-[#2e2e30] rounded-md mt-4 bg-[#232326]">
                    <div className="p-4 font-semibold border-b border-[#2e2e30]">Student Attendance</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-[#2c2c2e]">
                          <tr>
                            <th className="text-left px-4 py-2">#</th>
                            <th className="text-left px-4 py-2">USN</th>
                            <th className="text-left px-4 py-2">Name</th>
                            <th className="text-left px-4 py-2">Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((s, idx) => (
                            <tr key={s.id} className="border-t border-[#2e2e30]">
                              <td className="px-4 py-2">{idx + 1}</td>
                              <td className="px-4 py-2">{s.usn}</td>
                              <td className="px-4 py-2">{s.name}</td>
                              <td className="px-4 py-2 flex items-center gap-4">
                                <button
                                  onClick={() => handleAttendance(s.id, true)}
                                  className={`p-1 rounded ${
                                    attendance[s.id] === true ? "bg-green-900/40" : "hover:bg-[#2c2c2e]"
                                  }`}
                                >
                                  <Check className="text-green-400" size={16} />
                                </button>
                                <button
                                  onClick={() => handleAttendance(s.id, false)}
                                  className={`p-1 rounded ${
                                    attendance[s.id] === false ? "bg-red-900/40" : "hover:bg-[#2c2c2e]"
                                  }`}
                                >
                                  <X className="text-red-400" size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 justify-end flex">
                      <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Attendance"}
                      </Button>
                    </div>
                    {successMsg && <div className="text-green-400 text-sm p-2">{successMsg}</div>}
                    {errorMsg && <div className="text-red-400 text-sm p-2">{errorMsg}</div>}
                  </div>
                ) : (
                  <div className="text-gray-400 mt-6">Select class details to load students.</div>
                )}
              </TabsContent>
              
              {/* AI Tab */}
              <TabsContent value="ai">
                <div className="bg-[#232326] border border-[#2e2e30] rounded-lg p-6 max-w-2xl mx-auto space-y-6 opacity-50 pointer-events-none">
                  <div>
                    <h2 className="text-lg font-semibold">AI Attendance (Coming Soon)</h2>
                    <p className="text-sm text-gray-400">
                      This feature will allow attendance via face recognition.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TakeAttendance;
