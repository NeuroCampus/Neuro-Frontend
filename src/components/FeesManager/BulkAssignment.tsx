import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Filter, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart3, 
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

interface FilterData {
  batches: { id: number; name: string }[];
  branches: { id: number; name: string; code: string }[];
  admission_modes: string[];
}

interface FeeTemplate {
  id: number;
  name: string;
  total_amount: number;
  fee_type: string;
}

const BulkAssignment: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingStats, setFetchingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ created: number; skipped: number } | null>(null);
  
  // Selection States
  const [selectedFilters, setSelectedFilters] = useState({
    batchId: '',
    branchId: '',
    semesterId: '',
    sectionId: '',
    admissionMode: ''
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [academicYear, setAcademicYear] = useState('2024-25');
  
  // Data States
  const [filterData, setFilterData] = useState<FilterData>({ batches: [], branches: [], admission_modes: [] });
  const [semesters, setSemesters] = useState<{ id: number; number: number; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
  const [templates, setTemplates] = useState<FeeTemplate[]>([]);
  const [studentCount, setStudentCount] = useState<number | null>(null);

  // Fetch initial filters and templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const [filterRes, templateRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/fees-manager/filters/', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://127.0.0.1:8000/api/fees-manager/fee-templates/?page=1&page_size=200', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (filterRes.ok) {
          const data = await filterRes.json();
          setFilterData(data.data);
        }
        if (templateRes.ok) {
          const data = await templateRes.json();
          setTemplates(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };
    fetchData();
  }, []);

  // Fetch semesters when branch changes
  useEffect(() => {
    if (!selectedFilters.branchId || selectedFilters.branchId === 'all_branches') {
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

  // Fetch student count when all filters are selected
  useEffect(() => {
    const allFiltersSelected = 
      selectedFilters.batchId && 
      selectedFilters.branchId && 
      selectedFilters.semesterId && 
      selectedFilters.sectionId && 
      selectedFilters.admissionMode;

    if (!allFiltersSelected) {
      setStudentCount(null);
      return;
    }

    const fetchCount = async () => {
      try {
        setFetchingStats(true);
        const token = localStorage.getItem('access_token');
        const params = new URLSearchParams({
          page: '1',
          page_size: '1',
          ...(selectedFilters.batchId && { batch_id: selectedFilters.batchId }),
          ...(selectedFilters.branchId && { branch_id: selectedFilters.branchId }),
          ...(selectedFilters.semesterId && { semester_id: selectedFilters.semesterId }),
          ...(selectedFilters.sectionId && { section_id: selectedFilters.sectionId }),
          ...(selectedFilters.admissionMode && { admission_mode: selectedFilters.admissionMode }),
        });

        const res = await fetch(`http://127.0.0.1:8000/api/fees-manager/students/?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const json = await res.json();
          setStudentCount(json.data.meta?.count || 0);
        }
      } catch (err) {
        console.error("Error fetching student count:", err);
      } finally {
        setFetchingStats(false);
      }
    };

    fetchCount();
  }, [selectedFilters]);

  const handleBulkAssign = async () => {
    if (!selectedTemplate) return;
    
    const templateName = templates.find(t => t.id.toString() === selectedTemplate)?.name;
    if (!confirm(`Are you sure you want to assign "${templateName}" to ${studentCount} students? This will generate invoices for all of them.`)) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/fees-manager/bulk-assignments/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            batch_id: selectedFilters.batchId,
            branch_id: selectedFilters.branchId,
            semester_id: selectedFilters.semesterId,
            section_id: selectedFilters.sectionId,
            admission_mode: selectedFilters.admissionMode
          },
          template_id: parseInt(selectedTemplate),
          academic_year: academicYear
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Bulk assignment failed');
      }

      const result = await response.json();
      setSuccess({
        created: result.data.created_count,
        skipped: result.data.skipped_count
      });
      
      // Refresh count (might have changed if unassigned students filter was a thing, but here we just show total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during assignment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const allFiltersSelected = 
    selectedFilters.batchId && 
    selectedFilters.branchId && 
    selectedFilters.semesterId && 
    selectedFilters.sectionId && 
    selectedFilters.admissionMode;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bulk Fee Assignment</h1>
          <p className="text-muted-foreground mt-1">Mass assign fee templates to specific student cohorts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Filters */}
        <Card className="lg:col-span-1 border-border/50 shadow-sm h-fit sticky top-6">
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
                  <SelectValue placeholder="Select Batch" />
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
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_branches">All Branches</SelectItem>
                  {filterData.branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <AnimatePresence>
              {selectedFilters.branchId && selectedFilters.branchId !== 'all_branches' && (
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
                  <SelectValue placeholder="Select Mode" />
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
                batchId: '', branchId: '', semesterId: '', sectionId: '', admissionMode: ''
              })}
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>

        {/* Right Content - Execution Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10">
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Assignment Scope
              </CardTitle>
              <CardDescription>
                Define the criteria and template for bulk fee generation
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {!allFiltersSelected ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic bg-muted/5 rounded-xl border-2 border-dashed border-border/50">
                  <Users className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg">Select all cascading filters to calculate target students</p>
                </div>
              ) : (
                <div className="space-y-8 max-w-2xl mx-auto">
                  {/* Student Count Display */}
                  <div className="flex flex-col items-center p-8 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                    {fetchingStats ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-10 w-24 bg-primary/20 rounded-lg mx-auto"></div>
                        <div className="h-4 w-48 bg-muted rounded"></div>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="space-y-2"
                      >
                        <div className="text-5xl font-extrabold text-primary">{studentCount}</div>
                        <div className="text-lg font-medium text-foreground">Students in current selection</div>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          Found in {filterData.branches.find(b => b.id.toString() === selectedFilters.branchId)?.name}, 
                          Sem {semesters.find(s => s.id.toString() === selectedFilters.semesterId)?.number}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Assignment Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-xl bg-card shadow-sm">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Select Fee Template</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Choose a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map(t => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              {t.name} ({formatCurrency(t.total_amount)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Academic Year</Label>
                      <Input 
                        value={academicYear} 
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="h-11"
                        placeholder="e.g., 2024-25"
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex flex-col gap-4 pt-4">
                    <Button 
                      className="w-full h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                      disabled={!selectedTemplate || loading || studentCount === 0}
                      onClick={handleBulkAssign}
                    >
                      {loading ? (
                        <>
                          <Zap className="h-5 w-5 mr-2 animate-bounce" />
                          Processing Bulk Assignments...
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2 fill-current" />
                          Assign {templates.find(t => t.id.toString() === selectedTemplate)?.name} to {studentCount} Students
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground italic">
                      <ShieldCheck className="h-4 w-4" />
                      Atomic transaction enabled: All or nothing assignment logic
                    </div>
                  </div>

                  {/* Status Alerts */}
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Alert variant="destructive" className="border-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Alert className="border-green-500 bg-green-500/5 text-green-700 dark:text-green-400 border-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <AlertDescription className="flex items-center justify-between w-full font-medium">
                            <span>Successfully created {success.created} fee assignments!</span>
                            <span className="text-xs opacity-70">({success.skipped} skipped duplicates)</span>
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info Card */}
          <Card className="bg-primary/5 border-none">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">How it works</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bulk assignment will iterate through all {studentCount || 'target'} students in the selected group and attach the 
                  chosen fee template. It automatically skips students who already have this specific fee assigned for the 
                  current academic year to prevent duplicates.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignment;