
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { CheckCircle, XCircle, UserCheck, UserX, Users, ArrowRight } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import {
  getSemesters,
  manageSections,
  manageProfile,
  promoteStudentsToNextSemester,
  promoteSelectedStudents,
  demoteStudent,
  bulkDemoteStudents,
  manageStudents,
} from "../../utils/hod_api";

interface Semester {
  id: string;
  number: number;
}

interface Section {
  id: string;
  name: string;
  semester_id: string;
}

interface Student {
  usn: string;
  name: string;
  semester: number;
  section: string | null;
  batch: string;
  proctor: string | null;
}

const PromotionManagement = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "promote" | "demote">("overview");

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <PromotionOverview onTabChange={setActiveTab} />;
      case "promote":
        return <PromotionPage />;
      case "demote":
        return <DemotionPage />;
      default:
        return <PromotionOverview onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Student Promotion & Demotion Management</h1>
        {activeTab !== "overview" && (
          <Button
            onClick={() => setActiveTab("overview")}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            Back to Overview
          </Button>
        )}
      </div>

      {renderContent()}
    </div>
  );
};

const PromotionOverview = ({ onTabChange }: { onTabChange: (tab: "overview" | "promote" | "demote") => void }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Promotion Card */}
      <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-700 hover:border-green-500 transition-colors cursor-pointer"
            onClick={() => onTabChange("promote")}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600 rounded-lg">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-100">Student Promotion</CardTitle>
              <p className="text-sm text-gray-400">Promote eligible students to next semester</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Bulk promote students</span>
              <ArrowRight className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Promote selected students</span>
              <ArrowRight className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">View promotion history</span>
              <ArrowRight className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white">
            Manage Promotions
          </Button>
        </CardContent>
      </Card>

      {/* Demotion Card */}
      <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-700 hover:border-red-500 transition-colors cursor-pointer"
            onClick={() => onTabChange("demote")}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 rounded-lg">
              <UserX className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-100">Student Demotion</CardTitle>
              <p className="text-sm text-gray-400">Demote students to previous semester</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Individual demotion</span>
              <ArrowRight className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Bulk demotion</span>
              <ArrowRight className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Track demotion reasons</span>
              <ArrowRight className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white">
            Manage Demotions
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-700 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quick Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-400">0</div>
              <div className="text-sm text-gray-400">Students Promoted This Month</div>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-red-400">0</div>
              <div className="text-sm text-gray-400">Students Demoted This Month</div>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">0</div>
              <div className="text-sm text-gray-400">Active Operations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PromotionPage = () => {
  const [state, setState] = useState({
    semesters: [] as Semester[],
    sections: [] as Section[],
    students: [] as Student[],
    selectedStudents: [] as string[],
    selectedSemester: "",
    selectedSection: "all-sections",
    branchId: "",
    isLoading: false,
    isPromoting: false,
    promotionResults: null as any,
    errors: [] as string[],
  });

  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      updateState({ isLoading: true });
      try {
        const profileRes = await manageProfile({}, "GET");
        if (profileRes.success && profileRes.data?.branch_id) {
          const branchId = profileRes.data.branch_id;
          updateState({ branchId });

          const semesterRes = await getSemesters(branchId);
          if (semesterRes.success && semesterRes.data?.length > 0) {
            updateState({
              semesters: semesterRes.data.map((s: any) => ({
                id: s.id.toString(),
                number: s.number,
              })),
            });
          }
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        updateState({ errors: ["Failed to load initial data"] });
      } finally {
        updateState({ isLoading: false });
      }
    };

    fetchInitialData();
  }, []);

  // Fetch sections when semester changes
  useEffect(() => {
    const fetchSections = async () => {
      if (!state.selectedSemester || !state.branchId) return;

      try {
        const semesterId = state.semesters.find(s => `${s.number}th Semester` === state.selectedSemester)?.id;
        if (semesterId) {
          const sectionRes = await manageSections({ branch_id: state.branchId, semester_id: semesterId }, "GET");
          if (sectionRes.success && sectionRes.data?.length > 0) {
            updateState({
              sections: sectionRes.data.map((s: any) => ({
                id: s.id,
                name: s.name,
                semester_id: s.semester_id.toString(),
              })),
              selectedSection: "all-sections",
            });
          } else {
            updateState({ sections: [], selectedSection: "all-sections" });
          }
        }
      } catch (err) {
        console.error("Error fetching sections:", err);
        updateState({ errors: ["Failed to load sections"] });
      }
    };

    fetchSections();
  }, [state.selectedSemester, state.branchId, state.semesters]);

  // Fetch students when semester and section change
  useEffect(() => {
    const fetchStudents = async () => {
      if (!state.selectedSemester || !state.branchId || !state.selectedSection || state.selectedSection === "all-sections") {
        updateState({ students: [], selectedStudents: [] });
        return;
      }

      try {
        updateState({ isLoading: true });
        const semesterId = state.semesters.find(s => `${s.number}th Semester` === state.selectedSemester)?.id;
        const sectionId = state.sections.find(s => s.name === state.selectedSection)?.id;

        if (semesterId && sectionId) {
          const studentRes = await manageStudents({
            branch_id: state.branchId,
            semester_id: semesterId,
            section_id: sectionId,
          }, "GET");

          if (studentRes.success && studentRes.data && Array.isArray(studentRes.data)) {
            console.log(`API returned ${studentRes.data.length} students for semester ${state.selectedSemester}`);
            
            // Filter students to ensure they belong to the selected semester
            const currentSemesterNumber = state.semesters.find(s => `${s.number}th Semester` === state.selectedSemester)?.number;
            const filteredStudents = studentRes.data.filter((student: Student) => {
              // Check if batch contains the correct semester number
              const batchSemesterMatch = student.batch.match(/Sem(\d+)/);
              if (batchSemesterMatch) {
                const studentSemester = parseInt(batchSemesterMatch[1]);
                return studentSemester === currentSemesterNumber;
              }
              return true; // If no semester in batch, include by default
            });
            
            console.log(`Filtered to ${filteredStudents.length} students for semester ${currentSemesterNumber}`);
            updateState({
              students: filteredStudents,
              selectedStudents: [],
            });
          } else {
            updateState({ errors: [studentRes.message || "Failed to load students"] });
          }
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        updateState({ errors: ["Failed to load students"] });
      } finally {
        updateState({ isLoading: false });
      }
    };

    fetchStudents();
  }, [state.selectedSemester, state.selectedSection, state.branchId, state.semesters, state.sections]);

  // Handle individual student selection
  const handleStudentSelect = (usn: string, checked: boolean) => {
    if (checked) {
      updateState({ selectedStudents: [...state.selectedStudents, usn] });
    } else {
      updateState({ selectedStudents: state.selectedStudents.filter(id => id !== usn) });
    }
  };

  // Handle select all students
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      updateState({ selectedStudents: state.students.map(student => student.usn) });
    } else {
      updateState({ selectedStudents: [] });
    }
  };

  // Promote selected students
  const handlePromoteSelectedStudents = async () => {
    if (!state.selectedSemester || !state.branchId) {
      updateState({ errors: ["Please select a semester"] });
      return;
    }

    updateState({ isPromoting: true, errors: [] });
    try {
      const currentSemesterId = state.semesters.find(s => `${s.number}th Semester` === state.selectedSemester)?.id;
      const nextSemester = state.semesters.find(s => s.number === (state.semesters.find(s => s.id === currentSemesterId)?.number || 0) + 1);

      if (!currentSemesterId || !nextSemester) {
        updateState({ errors: ["No next semester available"] });
        return;
      }

      let res;
      if (state.selectedStudents.length > 0 && state.selectedStudents.length < state.students.length) {
        // Promote selected students
        console.log("Promoting selected students:", state.selectedStudents);
        res = await promoteSelectedStudents({
          student_ids: state.selectedStudents,
          to_semester_id: nextSemester.id, // Pass as string
          branch_id: state.branchId, // Include branch_id
        });
      } else {
        // Bulk promotion
        const sectionId = state.selectedSection !== "all-sections"
          ? state.sections.find(s => s.name === state.selectedSection)?.id
          : undefined;

        res = await promoteStudentsToNextSemester({
          from_semester_id: currentSemesterId, // Pass as string
          to_semester_id: nextSemester.id, // Pass as string
          branch_id: state.branchId,
          ...(sectionId && { section_id: sectionId }),
        });
      }

      if (res.success) {
        updateState({
          promotionResults: {
            message: `${res.promoted?.length || res.data?.promoted?.length || 'All'} students promoted successfully`,
            promoted: res.promoted || res.data?.promoted,
          },
          selectedStudents: [],
        });
      } else {
        updateState({ errors: [res.message || "Failed to promote students"] });
      }
    } catch (err) {
      console.error("Error promoting students:", err);
      updateState({ errors: ["Failed to promote students"] });
    } finally {
      updateState({ isPromoting: false });
    }
  };

  // Promote all students in selected semester/section
  const promoteAllStudents = async () => {
    if (!state.selectedSemester || !state.branchId) {
      updateState({ errors: ["Please select a semester"] });
      return;
    }

    updateState({ isPromoting: true, errors: [] });
    try {
      const currentSemesterId = state.semesters.find(s => `${s.number}th Semester` === state.selectedSemester)?.id;
      const nextSemester = state.semesters.find(s => s.number === (state.semesters.find(s => s.id === currentSemesterId)?.number || 0) + 1);

      if (!currentSemesterId || !nextSemester) {
        updateState({ errors: ["No next semester available"] });
        return;
      }

      const sectionId = state.selectedSection !== "all-sections"
        ? state.sections.find(s => s.name === state.selectedSection)?.id
        : undefined;

      const res = await promoteStudentsToNextSemester({
        from_semester_id: currentSemesterId, // Pass as string
        to_semester_id: nextSemester.id, // Pass as string
        branch_id: state.branchId,
        ...(sectionId && { section_id: sectionId }),
      });

      if (res.success) {
        updateState({
          promotionResults: {
            message: `${res.data?.promoted?.length || 'All'} students promoted successfully`,
            promoted: res.data?.promoted,
          },
        });
      } else {
        updateState({ errors: [res.message || "Failed to promote students"] });
      }
    } catch (err) {
      console.error("Promotion error:", err);
      updateState({ errors: ["Failed to promote students"] });
    } finally {
      updateState({ isPromoting: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-400" />
            Student Promotion
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Error Messages */}
      {state.errors.length > 0 && (
        <Card className="bg-red-900/20 border-red-500">
          <CardContent className="pt-6">
            <ul className="text-sm text-red-400 list-disc list-inside">
              {state.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Success Messages */}
      {state.promotionResults && (
        <Card className="bg-green-900/20 border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span>{state.promotionResults.message}</span>
            </div>
            {state.promotionResults.promoted && (
              <div className="mt-2">
                <p className="text-sm text-green-300">Promoted students:</p>
                <ul className="text-xs text-green-400 list-disc list-inside ml-4">
                  {state.promotionResults.promoted.map((student: any, idx: number) => (
                    <li key={idx}>{student.name} ({student.usn}) - Semester {student.to_semester}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Promotion Controls */}
      <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Promote Students to Next Semester</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select
              value={state.selectedSemester}
              onValueChange={(value) => updateState({ selectedSemester: value, selectedSection: "all-sections" })}
              disabled={state.isLoading}
            >
              <SelectTrigger className="w-48 bg-[#232326] text-gray-200 border border-gray-700">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent className="bg-[#232326] text-gray-200 border border-gray-700">
                {state.semesters.map((semester) => (
                  <SelectItem key={semester.id} value={`${semester.number}th Semester`}>
                    Semester {semester.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={state.selectedSection}
              onValueChange={(value) => updateState({ selectedSection: value })}
              disabled={state.isLoading || !state.selectedSemester || state.sections.length === 0}
            >
              <SelectTrigger className="w-48 bg-[#232326] text-gray-200 border border-gray-700">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent className="bg-[#232326] text-gray-200 border border-gray-700">
                <SelectItem value="all-sections">All Sections</SelectItem>
                {state.sections.map((section) => (
                  <SelectItem key={section.id} value={section.name}>
                    Section {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={promoteAllStudents}
              disabled={state.isPromoting || !state.selectedSemester}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {state.isPromoting ? "Promoting..." : "Promote All Students"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {state.students.length > 0 && (
        <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Students in {state.selectedSemester} - {state.selectedSection}
              </span>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={state.selectedStudents.length === state.students.length && state.students.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="border-gray-600"
                />
                <span className="text-sm text-gray-400">Select All</span>
                <Button
                  onClick={handlePromoteSelectedStudents}
                  disabled={state.isPromoting || state.selectedStudents.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Promote Selected ({state.selectedStudents.length})
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Select</TableHead>
                    <TableHead className="text-gray-300">USN</TableHead>
                    <TableHead className="text-gray-300">Name</TableHead>
                    <TableHead className="text-gray-300">Batch</TableHead>
                    <TableHead className="text-gray-300">Section</TableHead>
                    <TableHead className="text-gray-300">Proctor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.students.map((student) => (
                    <TableRow key={student.usn} className="border-gray-700">
                      <TableCell>
                        <Checkbox
                          checked={state.selectedStudents.includes(student.usn)}
                          onCheckedChange={(checked) => handleStudentSelect(student.usn, checked as boolean)}
                          className="border-gray-600"
                        />
                      </TableCell>
                      <TableCell className="text-gray-300">{student.usn}</TableCell>
                      <TableCell className="text-gray-300">{student.name}</TableCell>
                      <TableCell className="text-gray-300">{student.batch}</TableCell>
                      <TableCell className="text-gray-300">{student.section || 'N/A'}</TableCell>
                      <TableCell className="text-gray-300">{student.proctor || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const DemotionPage = () => {
  const [state, setState] = useState({
    semesters: [] as Semester[],
    sections: [] as Section[],
    students: [] as Student[],
    selectedStudents: [] as string[],
    selectedSemester: "",
    selectedSection: "all-sections",
    branchId: "",
    isLoading: false,
    isDemoting: false,
    showBulkDemoteDialog: false,
    bulkDemoteReason: "",
    demotionResults: null as any,
    errors: [] as string[],
  });

  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      updateState({ isLoading: true });
      try {
        const profileRes = await manageProfile({}, "GET");
        if (profileRes.success && profileRes.data?.branch_id) {
          const branchId = profileRes.data.branch_id;
          updateState({ branchId });

          const semesterRes = await getSemesters(branchId);
          if (semesterRes.success && semesterRes.data?.length > 0) {
            updateState({
              semesters: semesterRes.data.map((s: any) => ({
                id: s.id.toString(),
                number: s.number,
              })),
            });
          }
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        updateState({ errors: ["Failed to load initial data"] });
      } finally {
        updateState({ isLoading: false });
      }
    };

    fetchInitialData();
  }, []);

  // Fetch sections when semester changes
  useEffect(() => {
    const fetchSections = async () => {
      if (!state.selectedSemester || !state.branchId) return;

      try {
        const semesterId = state.semesters.find(s => `${s.number}th Semester` === state.selectedSemester)?.id;
        if (semesterId) {
          const sectionRes = await manageSections({ branch_id: state.branchId, semester_id: semesterId }, "GET");
          if (sectionRes.success && sectionRes.data?.length > 0) {
            updateState({
              sections: sectionRes.data.map((s: any) => ({
                id: s.id,
                name: s.name,
                semester_id: s.semester_id.toString(),
              })),
              selectedSection: "all-sections",
            });
          } else {
            updateState({ sections: [], selectedSection: "all-sections" });
          }
        }
      } catch (err) {
        console.error("Error fetching sections:", err);
        updateState({ errors: ["Failed to load sections"] });
      }
    };

    fetchSections();
  }, [state.selectedSemester, state.branchId, state.semesters]);

  // Fetch students when semester and section change
  useEffect(() => {
    const fetchStudents = async () => {
      if (!state.selectedSemester || !state.branchId || !state.selectedSection || state.selectedSection === "all-sections") {
        updateState({ students: [], selectedStudents: [] });
        return;
      }

      try {
        updateState({ isLoading: true });
        const semesterId = state.semesters.find(s => `${s.number}th Semester` === state.selectedSemester)?.id;
        const sectionId = state.sections.find(s => s.name === state.selectedSection)?.id;

        if (semesterId && sectionId) {
          const studentRes = await manageStudents({
            branch_id: state.branchId,
            semester_id: semesterId,
            section_id: sectionId,
          }, "GET");

          if (studentRes.success && studentRes.data && Array.isArray(studentRes.data)) {
            console.log(`API returned ${studentRes.data.length} students for semester ${state.selectedSemester}`);
            
            // Filter students to ensure they belong to the selected semester
            const currentSemesterNumber = state.semesters.find(s => `${s.number}th Semester` === state.selectedSemester)?.number;
            const filteredStudents = studentRes.data.filter((student: Student) => {
              // Check if batch contains the correct semester number
              const batchSemesterMatch = student.batch.match(/Sem(\d+)/);
              if (batchSemesterMatch) {
                const studentSemester = parseInt(batchSemesterMatch[1]);
                return studentSemester === currentSemesterNumber;
              }
              return true; // If no semester in batch, include by default
            });
            
            console.log(`Filtered to ${filteredStudents.length} students for semester ${currentSemesterNumber}`);
            updateState({
              students: filteredStudents,
              selectedStudents: [],
            });
          } else {
            updateState({ errors: [studentRes.message || "Failed to load students"] });
          }
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        updateState({ errors: ["Failed to load students"] });
      } finally {
        updateState({ isLoading: false });
      }
    };

    fetchStudents();
  }, [state.selectedSemester, state.selectedSection, state.branchId, state.semesters, state.sections]);

  // Handle individual student selection
  const handleStudentSelect = (usn: string, checked: boolean) => {
    if (checked) {
      updateState({ selectedStudents: [...state.selectedStudents, usn] });
    } else {
      updateState({ selectedStudents: state.selectedStudents.filter(id => id !== usn) });
    }
  };

  // Handle select all students
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      updateState({ selectedStudents: state.students.map(student => student.usn) });
    } else {
      updateState({ selectedStudents: [] });
    }
  };

  // Bulk demote students
  const bulkDemoteAllStudents = async () => {
    if (!state.selectedSemester || !state.branchId || !state.bulkDemoteReason.trim()) {
      updateState({ errors: ["Please select a semester and provide a reason for demotion"] });
      return;
    }

    updateState({ isDemoting: true, errors: [] });
    try {
      const currentSemesterId = state.semesters.find(s => `${s.number}th Semester` === state.selectedSemester)?.id;
      const prevSemester = state.semesters.find(s => s.number === (state.semesters.find(s => s.id === currentSemesterId)?.number || 0) - 1);

      if (!currentSemesterId || !prevSemester) {
        updateState({ errors: ["No previous semester available"] });
        return;
      }

      const sectionId = state.selectedSection !== "all-sections"
        ? state.sections.find(s => s.name === state.selectedSection)?.id
        : undefined;

      const res = await bulkDemoteStudents({
        student_ids: state.selectedStudents.length > 0 ? state.selectedStudents : [],
        to_semester_id: prevSemester.id, // Pass as string
        branch_id: state.branchId,
        reason: state.bulkDemoteReason,
        ...(sectionId && { section_id: sectionId }),
      });

      if (res.success) {
        updateState({
          demotionResults: {
            message: `${res.data?.demoted_count || 'All'} students demoted successfully`,
            demoted: res.data?.demoted_students,
            failed: res.data?.failed_students,
          },
          showBulkDemoteDialog: false,
          bulkDemoteReason: "",
          selectedStudents: [],
        });
      } else {
        updateState({ errors: [res.message || "Failed to demote students"] });
      }
    } catch (err) {
      console.error("Bulk demotion error:", err);
      updateState({ errors: ["Failed to demote students"] });
    } finally {
      updateState({ isDemoting: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-400" />
            Student Demotion
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Error Messages */}
      {state.errors.length > 0 && (
        <Card className="bg-red-900/20 border-red-500">
          <CardContent className="pt-6">
            <ul className="text-sm text-red-400 list-disc list-inside">
              {state.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Success Messages */}
      {state.demotionResults && (
        <Card className="bg-red-900/20 border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400">
              <UserX className="h-5 w-5" />
              <span>{state.demotionResults.message}</span>
            </div>
            {state.demotionResults.demoted && (
              <div className="mt-2">
                <p className="text-sm text-red-300">Demoted students:</p>
                <ul className="text-xs text-red-400 list-disc list-inside ml-4">
                  {state.demotionResults.demoted.map((student: any, idx: number) => (
                    <li key={idx}>{student.name} ({student.usn}) - Semester {student.to_semester}</li>
                  ))}
                </ul>
              </div>
            )}
            {state.demotionResults.failed && state.demotionResults.failed.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-yellow-300">Failed to demote:</p>
                <ul className="text-xs text-yellow-400 list-disc list-inside ml-4">
                  {state.demotionResults.failed.map((student: any, idx: number) => (
                    <li key={idx}>{student.name} ({student.usn}) - {student.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Demotion Controls */}
      <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Demote Students to Previous Semester</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select
              value={state.selectedSemester}
              onValueChange={(value) => updateState({ selectedSemester: value, selectedSection: "all-sections" })}
              disabled={state.isLoading}
            >
              <SelectTrigger className="w-48 bg-[#232326] text-gray-200 border border-gray-700">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent className="bg-[#232326] text-gray-200 border border-gray-700">
                {state.semesters.map((semester) => (
                  <SelectItem key={semester.id} value={`${semester.number}th Semester`}>
                    Semester {semester.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={state.selectedSection}
              onValueChange={(value) => updateState({ selectedSection: value })}
              disabled={state.isLoading || !state.selectedSemester || state.sections.length === 0}
            >
              <SelectTrigger className="w-48 bg-[#232326] text-gray-200 border border-gray-700">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent className="bg-[#232326] text-gray-200 border border-gray-700">
                <SelectItem value="all-sections">All Sections</SelectItem>
                {state.sections.map((section) => (
                  <SelectItem key={section.id} value={section.name}>
                    Section {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => updateState({ showBulkDemoteDialog: true })}
              disabled={!state.selectedSemester}
              variant="destructive"
            >
              <Users className="h-4 w-4 mr-2" />
              Bulk Demote Students
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {state.students.length > 0 && (
        <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-400" />
                Students in {state.selectedSemester} - {state.selectedSection}
              </span>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={state.selectedStudents.length === state.students.length && state.students.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="border-gray-600"
                />
                <span className="text-sm text-gray-400">Select All</span>
                <Button
                  onClick={() => updateState({ showBulkDemoteDialog: true })}
                  disabled={state.selectedStudents.length === 0}
                  variant="destructive"
                  size="sm"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Demote Selected ({state.selectedStudents.length})
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Select</TableHead>
                    <TableHead className="text-gray-300">USN</TableHead>
                    <TableHead className="text-gray-300">Name</TableHead>
                    <TableHead className="text-gray-300">Batch</TableHead>
                    <TableHead className="text-gray-300">Section</TableHead>
                    <TableHead className="text-gray-300">Proctor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.students.map((student) => (
                    <TableRow key={student.usn} className="border-gray-700">
                      <TableCell>
                        <Checkbox
                          checked={state.selectedStudents.includes(student.usn)}
                          onCheckedChange={(checked) => handleStudentSelect(student.usn, checked as boolean)}
                          className="border-gray-600"
                        />
                      </TableCell>
                      <TableCell className="text-gray-300">{student.usn}</TableCell>
                      <TableCell className="text-gray-300">{student.name}</TableCell>
                      <TableCell className="text-gray-300">{student.batch}</TableCell>
                      <TableCell className="text-gray-300">{student.section || 'N/A'}</TableCell>
                      <TableCell className="text-gray-300">{student.proctor || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Demote Dialog */}
      <Dialog open={state.showBulkDemoteDialog} onOpenChange={(open) => updateState({ showBulkDemoteDialog: open, bulkDemoteReason: "" })}>
        <DialogContent className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-100">
              {state.selectedStudents.length > 0 ? `Demote Selected Students (${state.selectedStudents.length})` : 'Bulk Demote Students'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-300">
              <p><strong>Semester:</strong> {state.selectedSemester}</p>
              <p><strong>Section:</strong> {state.selectedSection === "all-sections" ? "All Sections" : state.selectedSection}</p>
              <p className="text-yellow-400 mt-2">
                ⚠️ This will demote {state.selectedStudents.length > 0 ? `the ${state.selectedStudents.length} selected students` : 'ALL students'} in the selected semester/section to the previous semester.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Demotion *
              </label>
              <Input
                value={state.bulkDemoteReason}
                onChange={(e) => updateState({ bulkDemoteReason: e.target.value })}
                placeholder="Enter reason for demotion"
                className="bg-[#232326] text-gray-200 border border-gray-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => updateState({ showBulkDemoteDialog: false, bulkDemoteReason: "" })}
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={bulkDemoteAllStudents}
              disabled={state.isDemoting || !state.bulkDemoteReason.trim()}
              variant="destructive"
            >
              {state.isDemoting ? "Demoting..." : (state.selectedStudents.length > 0 ? `Demote Selected (${state.selectedStudents.length})` : "Demote All Students")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionManagement;
