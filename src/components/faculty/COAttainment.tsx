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
import { getUploadMarksBootstrap, GetUploadMarksBootstrapResponse, getQuestionPapers } from "../../utils/faculty_api";
import { useTheme } from "@/context/ThemeContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Component shows aggregated CO results only — per-question and per-student types removed

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
    question_paper_id: undefined as number | undefined,
  });
  // per-student marks removed: UI shows aggregated CO data from server
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
    const subjects = Array.from(
      new Map(assignments.map(a => [a.subject_id, { id: a.subject_id, name: a.subject_name }])).values()
    );
    setDropdownData(prev => ({ ...prev, subject: subjects }));
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
    // Only subject selection is required for CO attainment
    const { subject_id } = { ...updated };
    if (subject_id) {
      // Fetch aggregated CO attainment from server (no per-student marks by default)
      try {
        const url = `/api/co-attainment/?subject_id=${subject_id}&target_pct=${targetThreshold}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Failed to fetch CO attainment');
        const data = await resp.json();

        const attainmentData: Record<string, any> = {};
        const finalAttainmentData: Record<string, any> = {};
        const initialIndirect: Record<string, number> = {};

        data.results.forEach((result: any) => {
          attainmentData[result.co] = {
            co: result.co,
            maxMarks: result.max_marks,
            targetMarks: result.max_marks * (targetThreshold / 100),
            avgMarks: result.avg_marks,
            // Method 1: average-based percentage
            percentage: result.avg_pct,
            // Method 2: students-above-target percentage
            method2Percentage: result.pct_students_above_target,
            studentsAboveTarget: result.students_above_target,
            totalStudents: result.total_students,
            // Levels: use the explicit backend-provided fields
            attainmentLevel: result.direct_attainment_level_by_avg ?? result.direct_attainment_level,
            method2Level: result.direct_attainment_level_by_students ?? result.direct_attainment_level,
          };

          finalAttainmentData[result.co] = {
            direct: result.direct_attainment_level_by_avg ?? result.direct_attainment_level,
            indirect: result.indirect_attainment_level,
            final: result.final_attainment_level,
            level: result.final_attainment_level,
          };

          initialIndirect[result.co] = 0;
        });

        setCoAttainment(attainmentData);
        setFinalAttainment(finalAttainmentData);
        setIndirectAttainment(initialIndirect);
        setOverallAttainment(data.course_attainment_level);
      } catch (err: unknown) {
        setErrorMessage((err as { message?: string })?.message || "Failed to fetch CO attainment");
      }
    }
  };

  // CO calculation is performed server-side via `/api/co-attainment/`.

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

  const handleCalculateFinalAttainment = async () => {
    if (!selected.subject_id) return;

    try {
      // Call backend API with indirect attainment
      const indirectJson = JSON.stringify(indirectAttainment);
      let url = `/api/co-attainment/?indirect_attainment=${encodeURIComponent(indirectJson)}&target_pct=${targetThreshold}`;
      if (selected.question_paper_id) {
        url += `&question_paper=${selected.question_paper_id}`;
      } else if (selected.subject_id) {
        url += `&subject_id=${selected.subject_id}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch CO attainment');
      const data = await response.json();

      // Update state with backend results
      const attainmentData: Record<string, any> = {};
      data.results.forEach((result: any) => {
        attainmentData[result.co] = {
          co: result.co,
          maxMarks: result.max_marks,
          targetMarks: result.max_marks * (targetThreshold / 100),
          avgMarks: result.avg_marks,
          percentage: result.avg_pct,
          studentsAboveTarget: result.students_above_target,
          totalStudents: result.total_students,
          attainmentLevel: result.direct_attainment_level_by_avg ?? result.direct_attainment_level,
          method2Percentage: result.pct_students_above_target,
          method2Level: result.direct_attainment_level_by_students ?? result.direct_attainment_level,
        };
      });
      setCoAttainment(attainmentData);

      // Update final attainment from backend
      const finalAttainmentData: Record<string, any> = {};
      data.results.forEach((result: any) => {
        finalAttainmentData[result.co] = {
          direct: result.direct_attainment_level_by_avg ?? result.direct_attainment_level,
          indirect: result.indirect_attainment_level,
          final: result.final_attainment_level,
          level: result.final_attainment_level,
        };
      });
      setFinalAttainment(finalAttainmentData);

      // Update overall attainment
      setOverallAttainment(data.course_attainment_level);
    } catch (error) {
      console.error('Error calculating final attainment:', error);
      setErrorMessage('Failed to calculate final attainment');
    }
  };

  const handleTargetThresholdChange = (value: string) => {
    const numValue = parseFloat(value) || 60;
    // Validate target threshold (should be 0-100)
    if (numValue >= 0 && numValue <= 100) {
      setTargetThreshold(numValue);
    }
  };

  // CSV Export Function
  const handleExportCSV = () => {
    const csvData = [
      ['CO', 'Max Marks', 'Target Marks', 'Avg Marks', 'Students ≥ Target', 'Method 1 %', 'Method 1 Level', 'Method 2 %', 'Method 2 Level', 'Indirect', 'Final', 'Level'],
      ...Object.values(coAttainment).map(co => [
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
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `CO_Attainment_Report_${selected.subject}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // PDF Export Function
  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4') as jsPDF & { lastAutoTable?: { finalY: number } };
    
    // Add title
    doc.setFontSize(18);
    doc.text("CO Attainment Report", 14, 20);
    
    // Add selected filters information (subject only)
    doc.setFontSize(12);
    doc.text(`Subject: ${selected.subject}`, 14, 30);
    doc.text(`Target Threshold: ${targetThreshold}%`, 14, 37);
    
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
    
    // Save the PDF (student-level marks omitted — aggregated CO results only)
    doc.save(`CO_Attainment_Report_${selected.branch}_${selected.subject}_${selected.testType}.pdf`);
  };

  // Check if all dropdowns are selected
  const areAllDropdownsSelected = () => {
    return selected.subject_id !== undefined;
  };

  return (
    <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">CO Attainment Calculation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
        
        {errorMessage && (
          <div className={`p-3 rounded-md text-sm ${theme === 'dark' ? 'bg-destructive/20 text-destructive' : 'bg-red-100 text-red-700'}`}>
            {errorMessage}
          </div>
        )}
        
        {areAllDropdownsSelected() && (
          <div className="space-y-6">
            {/* PDF Export Button - Added above Configuration div */}
            <div className="flex justify-end gap-2">
              <Button 
                onClick={handleExportCSV} 
                variant="outline"
                className="border-[#a259ff] text-[#a259ff] hover:bg-[#a259ff] hover:text-white"
              >
                Download CSV Report
              </Button>
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
                              Level {finalAttainment[co.co]?.level ?? "N/A"}
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
            
            {/* Student-level marks removed from CO Attainment page by default. Use dedicated paginated viewer if needed. */}
          </div>
        )}
        
        {!areAllDropdownsSelected() && (
          <div className={`p-6 text-center rounded-lg ${theme === 'dark' ? 'bg-card border border-border' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
              Please select a subject to calculate CO attainment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default COAttainment;