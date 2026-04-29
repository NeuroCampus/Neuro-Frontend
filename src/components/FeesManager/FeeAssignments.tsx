import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserCheck,
  Users,
  Search,
  Plus,
  AlertTriangle,
  Calendar,
  IndianRupee,
  Filter,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  id: number;
  name: string;
  usn: string;
  department: string;
  semester: number;
  section: string;
  batch: string;
  admission_mode: string;
}

interface FeeTemplate {
  id: number;
  name: string;
  total_amount_cents?: number;
  total_amount?: number;
  fee_type: string;
}

interface FilterData {
  batches: { id: number; name: string }[];
  branches: { id: number; name: string; code: string }[];
  admission_modes: string[];
}

const FeeAssignments: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data States
  const [filterData, setFilterData] = useState<FilterData>({ batches: [], branches: [], admission_modes: [] });
  const [semesters, setSemesters] = useState<{ id: number; number: number; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<FeeTemplate[]>([]);
  
  // Selection States
  const [selectedFilters, setSelectedFilters] = useState({
    batchId: '',
    branchId: '',
    semesterId: '',
    sectionId: '',
    admissionMode: '',
    search: ''
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState('2024-25');
  
  // UI States
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 20
  });

  // Fetch initial filters
  const fetchInitialFilters = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const [filterRes, templateRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/fees-manager/filters/', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://127.0.0.1:8000/api/fees-manager/fee-templates/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!filterRes.ok || !templateRes.ok) throw new Error('Failed to fetch initial data');

      const filterJson = await filterRes.json();
      const templateJson = await templateRes.json();

      setFilterData(filterJson.data);
      setTemplates(templateJson.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, []);

  // Fetch semesters when branch changes
  useEffect(() => {
    if (!selectedFilters.branchId) {
      setSemesters([]);
      setSelectedFilters(prev => ({ ...prev, semesterId: '', sectionId: '' }));
      return;
    }

    const fetchSemesters = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`http://127.0.0.1:8000/api/fees-manager/semesters/?branch_id=${selectedFilters.branchId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSemesters(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching semesters:", err);
      }
    };
    fetchSemesters();
  }, [selectedFilters.branchId]);

  // Fetch sections when semester changes
  useEffect(() => {
    if (!selectedFilters.semesterId || !selectedFilters.branchId) {
      setSections([]);
      setSelectedFilters(prev => ({ ...prev, sectionId: '' }));
      return;
    }

    const fetchSections = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`http://127.0.0.1:8000/api/fees-manager/sections/?branch_id=${selectedFilters.branchId}&semester_id=${selectedFilters.semesterId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSections(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching sections:", err);
      }
    };
    fetchSections();
  }, [selectedFilters.semesterId, selectedFilters.branchId]);

  // Fetch students based on filters
  const fetchStudents = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pagination.pageSize.toString(),
        ...(selectedFilters.batchId && { batch_id: selectedFilters.batchId }),
        ...(selectedFilters.branchId && { branch_id: selectedFilters.branchId }),
        ...(selectedFilters.semesterId && { semester_id: selectedFilters.semesterId }),
        ...(selectedFilters.sectionId && { section_id: selectedFilters.sectionId }),
        ...(selectedFilters.admissionMode && { admission_mode: selectedFilters.admissionMode }),
        ...(selectedFilters.search && { search: selectedFilters.search })
      });

      const res = await fetch(`http://127.0.0.1:8000/api/fees-manager/students/?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch students');

      const json = await res.json();
      setStudents(json.data.students || []);
      setPagination(prev => ({
        ...prev,
        page: json.data.meta.page,
        totalPages: json.data.meta.total_pages,
        totalCount: json.data.meta.count
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading students');
    } finally {
      setLoading(false);
    }
  }, [selectedFilters, pagination.pageSize]);

  useEffect(() => {
    fetchInitialFilters();
  }, [fetchInitialFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const allFiltersSelected = 
        selectedFilters.batchId && 
        selectedFilters.branchId && 
        selectedFilters.semesterId && 
        selectedFilters.sectionId && 
        selectedFilters.admissionMode;

      if (allFiltersSelected) {
        fetchStudents(1);
      } else {
        setStudents([]);
        setPagination(prev => ({ ...prev, totalCount: 0 }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedFilters, fetchStudents]);

  // Handlers
  const toggleStudentSelection = (id: number) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map(s => s.id)));
    }
  };

  const handleAssign = async () => {
    if (selectedStudentIds.size === 0 || !selectedTemplateId) return;
    
    setIsConfirming(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/fees-manager/bulk-assignments/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_ids: Array.from(selectedStudentIds),
          template_id: parseInt(selectedTemplateId),
          academic_year: academicYear
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Bulk assignment failed');
      }

      const result = await response.json();
      setIsAssignDialogOpen(false);
      
      // Optimistic Update: Add the template to the students' assigned_templates list locally
      const assignedTemplate = templates.find(t => t.id.toString() === selectedTemplateId);
      if (assignedTemplate) {
        setStudents(prev => prev.map(student => {
          if (selectedStudentIds.has(student.id)) {
            const currentTemplates = (student as any).assigned_templates || [];
            if (!currentTemplates.some((t: any) => t.id === assignedTemplate.id)) {
              return {
                ...student,
                assigned_templates: [...currentTemplates, { 
                  id: assignedTemplate.id, 
                  template_name: assignedTemplate.name 
                }]
              };
            }
          }
          return student;
        }));
      }

      setSelectedStudentIds(new Set());
      setSelectedTemplateId('');
      alert(result.message || 'Fee templates assigned successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setIsConfirming(false);
    }
  };

  const formatCurrency = (centsOrAmount: any) => {
    const amount = Number(centsOrAmount) / (Number.isInteger(centsOrAmount) ? 100 : 1);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Fee Assignments</h1>
          <p className="text-muted-foreground mt-1">Structured student selection and bulk fee template assignment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <Card className="lg:col-span-1 border-border/50 shadow-sm overflow-hidden h-fit sticky top-6">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Cascading Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={selectedFilters.batchId} onValueChange={(val) => setSelectedFilters(p => ({ ...p, batchId: val }))}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_batches">All Batches</SelectItem>
                  {filterData.batches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={selectedFilters.branchId} onValueChange={(val) => setSelectedFilters(p => ({ ...p, branchId: val }))}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_branches">All Branches</SelectItem>
                  {filterData.branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <AnimatePresence>
              {selectedFilters.branchId && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={selectedFilters.semesterId} onValueChange={(val) => setSelectedFilters(p => ({ ...p, semesterId: val }))}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedFilters.semesterId && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="space-y-2"
                    >
                      <Label>Section</Label>
                      <Select value={selectedFilters.sectionId} onValueChange={(val) => setSelectedFilters(p => ({ ...p, sectionId: val }))}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select Section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label>Admission Mode</Label>
              <Select value={selectedFilters.admissionMode} onValueChange={(val) => setSelectedFilters(p => ({ ...p, admissionMode: val }))}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_modes">All Modes</SelectItem>
                  {filterData.admission_modes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full text-xs" 
              onClick={() => setSelectedFilters({
                batchId: '', branchId: '', semesterId: '', sectionId: '', admissionMode: '', search: ''
              })}
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>

        {/* Student Selection Area */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name or USN..." 
                    className="pl-9 bg-muted/20 border-none focus-visible:ring-1"
                    value={selectedFilters.search}
                    onChange={(e) => setSelectedFilters(p => ({ ...p, search: e.target.value }))}
                  />
                </div>
                <Badge variant="secondary" className="px-3 py-1 font-medium">
                  {pagination.totalCount} Students Found
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  disabled={selectedStudentIds.size === 0}
                  onClick={() => setIsAssignDialogOpen(true)}
                  className="bg-primary text-white hover:bg-primary/90 shadow-md transition-all active:scale-95"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign ({selectedStudentIds.size})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : students.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground italic px-6 text-center">
                  <Users className="h-12 w-12 mb-4 opacity-20" />
                  {!(selectedFilters.batchId && selectedFilters.branchId && selectedFilters.semesterId && selectedFilters.sectionId && selectedFilters.admissionMode) 
                    ? "Please select all cascading filters (Batch, Branch, Semester, Section, Admission Mode) to load students"
                    : "No students found matching current filters"
                  }
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-[50px] text-center">
                          <Checkbox 
                            checked={selectedStudentIds.size === students.length && students.length > 0} 
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Student Details</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Current Placement</TableHead>
                        <TableHead>Assigned Fee</TableHead>
                        <TableHead>Adm. Mode</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow 
                          key={student.id} 
                          className={`cursor-pointer transition-colors ${selectedStudentIds.has(student.id) ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                          onClick={() => toggleStudentSelection(student.id)}
                        >
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={selectedStudentIds.has(student.id)} 
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">{student.name}</div>
                            <div className="text-xs text-muted-foreground">{student.batch}</div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{student.usn}</TableCell>
                          <TableCell>
                            <div className="text-sm">{student.department}</div>
                            <div className="text-xs text-muted-foreground">Sem {student.semester} • Sec {student.section}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(student as any).assigned_templates?.length > 0 ? (
                                (student as any).assigned_templates.map((at: any) => (
                                  <Badge key={at.id} variant="secondary" className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                    {at.template_name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2">
                              {student.admission_mode}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="py-4 bg-muted/10 flex items-center justify-between border-t">
              <div className="text-xs text-muted-foreground font-medium">
                Showing {students.length} students • Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={pagination.page <= 1}
                  onClick={() => fetchStudents(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchStudents(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Fee Template</DialogTitle>
            <DialogDescription>
              Assign a fee template to the {selectedStudentIds.size} selected students.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input 
                value={academicYear} 
                onChange={(e) => setAcademicYear(e.target.value)} 
                placeholder="e.g., 2024-25"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a fee template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name} ({formatCurrency(t.total_amount_cents || t.total_amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplateId && (
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mt-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Summary</div>
                    <div className="text-xs text-muted-foreground">
                      Template: {templates.find(t => t.id.toString() === selectedTemplateId)?.name}<br/>
                      Amount: {formatCurrency(templates.find(t => t.id.toString() === selectedTemplateId)?.total_amount_cents || templates.find(t => t.id.toString() === selectedTemplateId)?.total_amount)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
            <Button 
              disabled={!selectedTemplateId || isConfirming}
              onClick={handleAssign}
              className="bg-primary text-white"
            >
              {isConfirming ? "Processing..." : "Confirm & Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeAssignments;