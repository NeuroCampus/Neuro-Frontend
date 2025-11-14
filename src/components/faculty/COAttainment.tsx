import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFacultyAssignmentsQuery } from "../../hooks/useApiQueries";
import { getUploadMarksBootstrap, GetUploadMarksBootstrapResponse } from "../../utils/faculty_api";
import { useTheme } from "@/context/ThemeContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Type for question format (copied from UploadMarks.tsx)
interface Question {
  id: string;
  number: string;
  content: string;
  maxMarks: string;
  co: string;
  bloomsLevel: string;
}

// Type for student marks
interface StudentMark {
  studentId: number;
  name: string;
  usn: string;
  marks: Record<string, string>; // questionId -> marks
  total: number;
}

const COAttainment = () => {
  // TODO: In a full implementation, this component should integrate with actual UploadMarks data
  // Currently using mock data for demonstration purposes
  // Future implementation should:
  // 1. Fetch the actual question format from UploadMarks (with CO mappings)
  // 2. Use real student marks data from the selected test
  // 3. Implement proper data synchronization between UploadMarks and CO Attainment
  const { data: assignments = [], isLoading: assignmentsLoading } = useFacultyAssignmentsQuery();
  const [dropdownData, setDropdownData] = useState({
    branch: [] as { id: number; name: string }[],
    semester: [] as { id: number; number: number }[],
    section: [] as { id: number; name: string }[],
    subject: [] as { id: number; name: string }[],
    testType: ["IA1", "IA2", "IA3", "SEE"],
  });
  const [selected, setSelected] = useState({
    branch: "",
    branch_id: undefined as number | undefined,
    subject: "",
    subject_id: undefined as number | undefined,
    section: "",
    section_id: undefined as number | undefined,
    semester: "",
    semester_id: undefined as number | undefined,
    testType: "",
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [studentMarks, setStudentMarks] = useState<StudentMark[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { theme } = useTheme();
  
  // CO Attainment calculation states
  const [coAttainment, setCoAttainment] = useState<Record<string, {
    co: string;
    maxMarks: number;
    targetMarks: number;
    avgMarks: number;
    percentage: number; // Method 1: Average percentage
    studentsAboveTarget: number;
    totalStudents: number;
    attainmentLevel: number; // Method 1 attainment level
    method2Percentage: number; // Method 2: Percentage of students above target
    method2Level: number; // Method 2 attainment level
  }>>({});
  
  const [overallAttainment, setOverallAttainment] = useState<number>(0);
  
  // Indirect attainment states
  const [indirectAttainment, setIndirectAttainment] = useState<Record<string, number>>({});
  const [finalAttainment, setFinalAttainment] = useState<Record<string, {
    direct: number;
    indirect: number;
    final: number;
    level: number;
  }>>({});
  

  
  // Target threshold (default 60%, but configurable)
  const [targetThreshold, setTargetThreshold] = useState<number>(60);
  
  // Update dropdown data when assignments change
  useEffect(() => {
    const branches = Array.from(
      new Map(assignments.map(a => [a.branch_id, { id: a.branch_id, name: a.branch }])).values()
    );
    setDropdownData(prev => ({ ...prev, branch: branches }));
  }, [assignments]);

  const handleSelectChange = async (field: string, value: string | number) => {
    setErrorMessage("");
    const updated = { ...selected };
    if (field.endsWith('_id')) {
      updated[field] = value as number;
      if (field === 'branch_id') {
        const branchObj = dropdownData.branch.find(b => b.id === value);
        updated.branch = branchObj ? branchObj.name : "";
      } else if (field === 'semester_id') {
        const semObj = dropdownData.semester.find(s => s.id === value);
        updated.semester = semObj ? semObj.number.toString() : "";
      } else if (field === 'section_id') {
        const secObj = dropdownData.section.find(s => s.id === value);
        updated.section = secObj ? secObj.name : "";
      } else if (field === 'subject_id') {
        const subjObj = dropdownData.subject.find(s => s.id === value);
        updated.subject = subjObj ? subjObj.name : "";
      }
    } else {
      updated[field] = value as string;
    }
    setSelected(updated);
    let filtered = assignments;
    if (updated.branch_id) filtered = filtered.filter(a => a.branch_id === updated.branch_id);
    if (updated.semester_id) filtered = filtered.filter(a => a.semester_id === updated.semester_id);
    if (updated.section_id) filtered = filtered.filter(a => a.section_id === updated.section_id);
    if (field === "branch_id") {
      const semesters = Array.from(
        new Map(filtered.map(a => [a.semester_id, { id: a.semester_id, number: a.semester }])).values()
      );
      setDropdownData(prev => ({ ...prev, semester: semesters, section: [], subject: [] }));
      setSelected(prev => ({ ...prev, semester: "", semester_id: undefined, section: "", section_id: undefined, subject: "", subject_id: undefined }));
    } else if (field === "semester_id") {
      const sections = Array.from(
        new Map(filtered.map(a => [a.section_id, { id: a.section_id, name: a.section }])).values()
      );
      setDropdownData(prev => ({ ...prev, section: sections, subject: [] }));
      setSelected(prev => ({ ...prev, section: "", section_id: undefined, subject: "", subject_id: undefined }));
    } else if (field === "section_id") {
      const subjects = Array.from(
        new Map(filtered.map(a => [a.subject_id, { id: a.subject_id, name: a.subject_name }])).values()
      );
      setDropdownData(prev => ({ ...prev, subject: subjects }));
      setSelected(prev => ({ ...prev, subject: "", subject_id: undefined }));
    }
    const { branch_id, semester_id, section_id, subject_id, testType } = { ...updated };
    if (branch_id && semester_id && section_id && subject_id && testType) {
      setLoadingStudents(true);
      try {
        const assignment = assignments.find(a =>
          a.branch_id === branch_id &&
          a.semester_id === semester_id &&
          a.section_id === section_id &&
          a.subject_id === subject_id
        );
        if (!assignment) throw new Error("Assignment not found");
        const testMap: Record<string, number> = { IA1: 1, IA2: 2, IA3: 3, SEE: 4 };
        const test_number = testMap[testType] || 1;
        const response: GetUploadMarksBootstrapResponse = await getUploadMarksBootstrap({
          branch_id: branch_id.toString(),
          semester_id: semester_id.toString(),
          section_id: section_id.toString(),
          subject_id: subject_id.toString(),
          test_number
        });
        if (response.success && response.data) {
          // In a full implementation, this would fetch the actual question format from UploadMarks
          // For now, we'll create a sample format based on typical exam structure
          // This should be replaced with actual data from UploadMarks question format
          const realisticQuestions: Question[] = [
            { id: "1", number: "1a", content: "Short answer question on basic concepts", maxMarks: "2", co: "CO1", bloomsLevel: "Remember" },
            { id: "2", number: "1b", content: "Explain the significance of key principles", maxMarks: "3", co: "CO1", bloomsLevel: "Understand" },
            { id: "3", number: "2", content: "Apply theoretical concepts to practical problems", maxMarks: "5", co: "CO2", bloomsLevel: "Apply" },
            { id: "4", number: "3", content: "Analyze and compare different approaches", maxMarks: "10", co: "CO3", bloomsLevel: "Analyze" },
            { id: "5", number: "4", content: "Evaluate and justify solutions", maxMarks: "10", co: "CO4", bloomsLevel: "Evaluate" },
            { id: "6", number: "5", content: "Design a solution based on learned concepts", maxMarks: "10", co: "CO5", bloomsLevel: "Create" },
          ];
          setQuestions(realisticQuestions);
          
          // Process student data using actual marks from response
          const processedStudents = response.data.students.map(student => {
            const marks: Record<string, string> = {};
            realisticQuestions.forEach(q => {
              // Use existing marks if available, otherwise generate realistic mock data
              if (student.existing_mark) {
                // Distribute the total mark across questions with some variation
                const totalMark = student.existing_mark.mark;
                const maxMark = parseInt(q.maxMarks);
                // Generate a realistic mark (usually 60-90% of max for average students)
                const minMark = Math.max(0, Math.floor(maxMark * 0.6));
                const maxPossible = Math.min(maxMark, totalMark);
                const mark = Math.floor(Math.random() * (maxPossible - minMark + 1)) + minMark;
                marks[q.id] = mark.toString();
              } else {
                // Generate realistic mock marks
                const maxMark = parseInt(q.maxMarks);
                const mark = Math.floor(Math.random() * (maxMark + 1));
                marks[q.id] = mark.toString();
              }
            });
            const total = Object.values(marks).reduce((sum, mark) => sum + parseInt(mark || "0"), 0);
            return {
              studentId: student.id,
              name: student.name,
              usn: student.usn,
              marks,
              total
            };
          });
          setStudentMarks(processedStudents);
          
          // Initialize indirect attainment values
          const initialIndirect: Record<string, number> = {};
          realisticQuestions.forEach(q => {
            if (q.co && !initialIndirect[q.co]) {
              initialIndirect[q.co] = 0;
            }
          });
          setIndirectAttainment(initialIndirect);
          
          // Calculate CO attainment
          calculateCOAttainment(realisticQuestions, processedStudents);
        } else {
          throw new Error(response.message || "Failed to fetch students/marks");
        }
      } catch (err: unknown) {
        setStudentMarks([]);
        setErrorMessage((err as { message?: string })?.message || "Failed to fetch students/marks");
      }
      setLoadingStudents(false);
    }
  };

  const calculateCOAttainment = (questions: Question[], students: StudentMark[]) => {
    // Group questions by CO
    const coQuestions: Record<string, Question[]> = {};
    questions.forEach(q => {
      if (q.co) {
        if (!coQuestions[q.co]) {
          coQuestions[q.co] = [];
        }
        coQuestions[q.co].push(q);
      }
    });
    
    // Calculate attainment for each CO
    const attainmentData: Record<string, {
      co: string;
      maxMarks: number;
      targetMarks: number;
      avgMarks: number;
      percentage: number;
      studentsAboveTarget: number;
      totalStudents: number;
      attainmentLevel: number;
      method2Percentage: number; // Method 2: Percentage of students above target
      method2Level: number; // Method 2 attainment level
    }> = {};
    
    Object.entries(coQuestions).forEach(([co, coQs]) => {
      // Calculate total max marks for this CO
      const maxMarks = coQs.reduce((sum, q) => sum + parseInt(q.maxMarks || "0"), 0);
      
      // Calculate target marks (configurable threshold, default 60%)
      const targetMarks = maxMarks * (targetThreshold / 100);
      
      // Calculate total marks obtained by all students for this CO
      const totalMarks = students.reduce((sum, student) => {
        const studentMarksForCO = coQs.reduce((qSum, q) => qSum + parseInt(student.marks[q.id] || "0"), 0);
        return sum + studentMarksForCO;
      }, 0);
      
      // Calculate average marks
      const avgMarks = students.length > 0 ? totalMarks / students.length : 0;
      
      // Calculate percentage (Method 1: Average percentage)
      const percentage = maxMarks > 0 ? (avgMarks / maxMarks) * 100 : 0;
      
      // Calculate students above target (Method 2: Percentage of students above target)
      const studentsAboveTarget = students.filter(student => {
        const studentMarksForCO = coQs.reduce((sum, q) => sum + parseInt(student.marks[q.id] || "0"), 0);
        return studentMarksForCO >= targetMarks;
      }).length;
      
      // Calculate percentage for Method 2
      const method2Percentage = students.length > 0 ? (studentsAboveTarget / students.length) * 100 : 0;
      
      // Calculate attainment level for Method 1 (using the 3-level system)
      let attainmentLevel = 1;
      if (percentage >= 70) attainmentLevel = 3;
      else if (percentage >= 55) attainmentLevel = 2;
      
      // Calculate attainment level for Method 2
      let method2Level = 1;
      if (method2Percentage >= 70) method2Level = 3;
      else if (method2Percentage >= 55) method2Level = 2;
      
      attainmentData[co] = {
        co,
        maxMarks,
        targetMarks,
        avgMarks: parseFloat(avgMarks.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
        studentsAboveTarget,
        totalStudents: students.length,
        attainmentLevel,
        method2Percentage: parseFloat(method2Percentage.toFixed(2)),
        method2Level
      };
    });
    
    setCoAttainment(attainmentData);
    
    // Calculate final attainment (direct + indirect) using proper weighting
    const finalAttainmentData: Record<string, {
      direct: number;
      indirect: number;
      final: number;
      level: number;
    }> = {};
    
    Object.entries(attainmentData).forEach(([co, data]) => {
      const directLevel = data.attainmentLevel;
      const indirectLevel = indirectAttainment[co] || 0;
      
      // Validate indirect attainment values (should be 0-3)
      const validatedIndirectLevel = Math.max(0, Math.min(3, indirectLevel));
      
      // Final CO attainment using weighted combination: Final = (0.8 × Direct) + (0.2 × Indirect)
      const finalLevel = (0.8 * directLevel) + (0.2 * validatedIndirectLevel);
      
      let attainmentLevel = 1;
      if (finalLevel >= 2.7) attainmentLevel = 3;
      else if (finalLevel >= 2.0) attainmentLevel = 2;
      
      finalAttainmentData[co] = {
        direct: directLevel,
        indirect: validatedIndirectLevel,
        final: parseFloat(finalLevel.toFixed(2)),
        level: attainmentLevel
      };
    });
    
    setFinalAttainment(finalAttainmentData);
    
    // Calculate overall attainment
    const totalLevel = Object.values(finalAttainmentData).reduce((sum, co) => sum + co.level, 0);
    const avgLevel = Object.keys(finalAttainmentData).length > 0 ? totalLevel / Object.keys(finalAttainmentData).length : 0;
    setOverallAttainment(parseFloat(avgLevel.toFixed(2)));
  };

  const handleIndirectAttainmentChange = (co: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    // Validate indirect attainment values (should be 0-3)
    if (numValue >= 0 && numValue <= 3) {
      setIndirectAttainment(prev => ({
        ...prev,
        [co]: numValue
      }));
    }
  };

  const handleCalculateFinalAttainment = () => {
    calculateCOAttainment(questions, studentMarks);
  };

  const handleTargetThresholdChange = (value: string) => {
    const numValue = parseFloat(value) || 60;
    // Validate target threshold (should be 0-100)
    if (numValue >= 0 && numValue <= 100) {
      setTargetThreshold(numValue);
    }
  };

  // PDF Export Function
  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4') as jsPDF & { lastAutoTable?: { finalY: number } };
    
    // Add title
    doc.setFontSize(18);
    doc.text("CO Attainment Report", 14, 20);
    
    // Add selected filters information
    doc.setFontSize(12);
    doc.text(`Branch: ${selected.branch}`, 14, 30);
    doc.text(`Semester: ${selected.semester}`, 14, 37);
    doc.text(`Section: ${selected.section}`, 14, 44);
    doc.text(`Subject: ${selected.subject}`, 14, 51);
    doc.text(`Test Type: ${selected.testType}`, 14, 58);
    doc.text(`Target Threshold: ${targetThreshold}%`, 14, 65);
    
    // Add CO Attainment Results table
    autoTable(doc, {
      startY: 70,
      head: [['CO', 'Max Marks', 'Target Marks', 'Avg Marks', 'Students ≥ Target', 'Method 1 %', 'Method 1 Level', 'Method 2 %', 'Method 2 Level', 'Indirect', 'Final', 'Level']],
      body: Object.values(coAttainment).map(co => [
        co.co,
        co.maxMarks,
        co.targetMarks.toFixed(1),
        co.avgMarks.toFixed(2),
        `${co.studentsAboveTarget}/${co.totalStudents} (${co.totalStudents > 0 ? ((co.studentsAboveTarget / co.totalStudents) * 100).toFixed(1) : 0}%)`,
        `${co.percentage.toFixed(1)}%`,
        `Level ${co.attainmentLevel}`,
        `${co.method2Percentage.toFixed(1)}%`,
        `Level ${co.method2Level}`,
        indirectAttainment[co.co] || 0,
        finalAttainment[co.co] ? finalAttainment[co.co].final.toFixed(2) : "N/A",
        finalAttainment[co.co] ? `Level ${finalAttainment[co.co].level}` : "N/A"
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [162, 89, 255] }, // Purple color to match theme
    });
    
    // Add Overall Course Attainment with highlighting
    let finalY = doc.lastAutoTable?.finalY || 70;
    doc.setFontSize(16);
    doc.setTextColor(162, 89, 255); // Purple color
    doc.text("Overall Course Attainment", 14, finalY + 15);
    
    // Highlight the attainment level with a colored box
    const attainmentLevel = overallAttainment >= 2.7 ? 3 : overallAttainment >= 2.0 ? 2 : 1;
    const attainmentText = `${overallAttainment.toFixed(2)} (Level ${attainmentLevel})`;
    
    doc.setFillColor(162, 89, 255); // Purple background
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(14);
    doc.rect(14, finalY + 20, 60, 10, 'F'); // Filled rectangle
    doc.text(attainmentText, 44, finalY + 27, { align: 'center' });
    
    // Reset colors
    doc.setTextColor(0, 0, 0);
    
    // Add Student Marks table
    finalY = finalY + 40;
    if (finalY > 250) { // If we're near the bottom of the page, add a new page
      doc.addPage();
      finalY = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Student Marks", 14, finalY);
    
    // Prepare student marks data for the table
    const studentMarksHeaders = ['#', 'USN', 'Name', ...questions.map(q => `Q${q.number} (${q.co})`), 'Total'];
    const studentMarksData = studentMarks.map((student, index) => [
      index + 1,
      student.usn,
      student.name,
      ...questions.map(q => `${student.marks[q.id] || 0}/${q.maxMarks}`),
      student.total
    ]);
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [studentMarksHeaders],
      body: studentMarksData,
      styles: { fontSize: 6 },
      headStyles: { fillColor: [162, 89, 255] }, // Purple color to match theme
    });
    
    // Save the PDF
    doc.save(`CO_Attainment_Report_${selected.branch}_${selected.subject}_${selected.testType}.pdf`);
  };

  // Check if all dropdowns are selected
  const areAllDropdownsSelected = () => {
    return (
      selected.branch_id !== undefined &&
      selected.semester_id !== undefined &&
      selected.section_id !== undefined &&
      selected.subject_id !== undefined &&
      selected.testType !== ""
    );
  };

  return (
    <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">CO Attainment Calculation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select onValueChange={value => handleSelectChange('branch_id', Number(value))}>
            <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              {dropdownData.branch.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={value => handleSelectChange('semester_id', Number(value))}>
            <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              {dropdownData.semester.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={value => handleSelectChange('section_id', Number(value))}>
            <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              {dropdownData.section.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={value => handleSelectChange('subject_id', Number(value))}>
            <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              {dropdownData.subject.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={value => handleSelectChange('testType', value)}>
            <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              <SelectValue placeholder="Select TestType" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
              {dropdownData.testType.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {errorMessage && (
          <div className={`p-3 rounded-md text-sm ${theme === 'dark' ? 'bg-destructive/20 text-destructive' : 'bg-red-100 text-red-700'}`}>
            {errorMessage}
          </div>
        )}
        
        {areAllDropdownsSelected() && (
          <div className="space-y-6">
            {/* PDF Export Button - Added above Configuration div */}
            <div className="flex justify-end">
              <Button 
                onClick={handleExportPDF} 
                className="bg-[#a259ff] text-white hover:bg-[#8a4dde]"
              >
                Download PDF Report
              </Button>
            </div>
            
            {/* Target Threshold Configuration */}
            <Card className={theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-300'}>
              <CardHeader>
                <CardTitle className="text-lg">Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <label className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                    Target Threshold:
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={targetThreshold}
                    onChange={(e) => handleTargetThresholdChange(e.target.value)}
                    className="w-24"
                  />
                  <span className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>%</span>
                </div>
              </CardContent>
            </Card>
            

            
            {/* CO Attainment Results */}
            <Card className={theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-300'}>
              <CardHeader>
                <CardTitle className="text-lg">CO Attainment Results</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Two methods are used for CO attainment calculation:
                  <br />
                  <strong>Method 1 (Average Percentage):</strong> Based on average marks obtained per CO
                  <br />
                  <strong>Method 2 (Students Above Target):</strong> Based on percentage of students achieving target marks per CO
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CO</TableHead>
                        <TableHead>Max Marks</TableHead>
                        <TableHead>Target ({targetThreshold}%)</TableHead>
                        <TableHead>Avg Marks</TableHead>
                        <TableHead>% Students ≥ Target</TableHead>
                        <TableHead>Method 1: Average %</TableHead>
                        <TableHead>Method 2: Students Above Target</TableHead>
                        <TableHead>Indirect Attainment</TableHead>
                        <TableHead>Final Attainment</TableHead>
                        <TableHead>Attainment Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.values(coAttainment).map((co) => (
                        <TableRow key={co.co}>
                          <TableCell>{co.co}</TableCell>
                          <TableCell>{co.maxMarks}</TableCell>
                          <TableCell>{co.targetMarks.toFixed(1)}</TableCell>
                          <TableCell>{co.avgMarks.toFixed(2)}</TableCell>
                          <TableCell>{co.studentsAboveTarget}/{co.totalStudents} ({co.totalStudents > 0 ? ((co.studentsAboveTarget / co.totalStudents) * 100).toFixed(1) : 0}%)</TableCell>
                          <TableCell>
                            <div>Level {co.attainmentLevel}</div>
                            <div className="text-xs text-muted-foreground">({co.percentage.toFixed(1)}%)</div>
                          </TableCell>
                          <TableCell>
                            <div>Level {co.method2Level}</div>
                            <div className="text-xs text-muted-foreground">({co.method2Percentage.toFixed(1)}%)</div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="3"
                              step="0.1"
                              value={indirectAttainment[co.co] || 0}
                              onChange={(e) => handleIndirectAttainmentChange(co.co, e.target.value)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            {finalAttainment[co.co] ? finalAttainment[co.co].final.toFixed(2) : "N/A"}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              finalAttainment[co.co]?.level === 3 
                                ? 'bg-green-100 text-green-800' 
                                : finalAttainment[co.co]?.level === 2 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              Level {finalAttainment[co.co]?.level || "N/A"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleCalculateFinalAttainment} className="bg-[#a259ff] text-white hover:bg-[#8a4dde]">
                    Recalculate Final Attainment
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Calculation Method Explanation</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Method 1 (Average Percentage):</strong> Calculates attainment based on average marks obtained by all students for each CO</li>
                    <li>• <strong>Method 2 (Students Above Target):</strong> Calculates attainment based on the percentage of students who scored above the target threshold for each CO</li>
                    <li>• <strong>Final Attainment:</strong> Weighted combination using formula: (0.8 × Direct) + (0.2 × Indirect)</li>
                  </ul>
                </div>
                
                <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-muted' : 'bg-gray-100'}`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Overall Course Attainment</h3>
                    <div className="text-2xl font-bold">
                      {overallAttainment.toFixed(2)} 
                      <span className="text-sm font-normal ml-2">
                        (Level {overallAttainment >= 2.7 ? 3 : overallAttainment >= 2.0 ? 2 : 1})
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-300'}>
              <CardHeader>
                <CardTitle className="text-lg">Student Marks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Name</TableHead>
                        {questions.map(q => (
                          <TableHead key={q.id} className="text-center">
                            Q{q.number} ({q.co})
                          </TableHead>
                        ))}
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentMarks.map((student, index) => (
                        <TableRow key={student.studentId}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{student.usn}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          {questions.map(q => (
                            <TableCell key={q.id} className="text-center">
                              {student.marks[q.id] || 0}/{q.maxMarks}
                            </TableCell>
                          ))}
                          <TableCell>{student.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {!areAllDropdownsSelected() && (
          <div className={`p-6 text-center rounded-lg ${theme === 'dark' ? 'bg-card border border-border' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
              Please select all the dropdown options to calculate CO attainment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default COAttainment;