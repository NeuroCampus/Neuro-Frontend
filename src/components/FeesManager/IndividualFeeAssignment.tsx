import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  Search,
  AlertTriangle,
  IndianRupee,
  Filter,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

interface Assignment {
  id: number;
  student: {
    id: number;
    name: string;
    usn: string;
    department: string;
    semester: number;
    section: string;
    batch: string;
    admission_mode: string;
  };
  template: {
    id: number;
    name: string;
    total_amount: number;
    fee_type: string;
  };
  academic_year: string;
  assigned_at: string;
  is_active: boolean;
}

interface FilterData {
  batches: { id: number; name: string }[];
  branches: { id: number; name: string; code: string }[];
  admission_modes: string[];
}

const IndividualFeeAssignment: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data States
  const [filterData, setFilterData] = useState<FilterData>({ batches: [], branches: [], admission_modes: [] });
  const [semesters, setSemesters] = useState<{ id: number; number: number; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // Selection States
  const [selectedFilters, setSelectedFilters] = useState({
    batchId: '',
    branchId: '',
    semesterId: '',
    sectionId: '',
    admissionMode: '',
    search: ''
  });
  
  // UI States
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
      const filterRes = await fetch('http://127.0.0.1:8000/api/fees-manager/filters/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!filterRes.ok) throw new Error('Failed to fetch initial data');
      const filterJson = await filterRes.json();
      setFilterData(filterJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
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

  // Fetch assignments based on filters
  const fetchAssignments = useCallback(async (page: number = 1) => {
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

      const res = await fetch(`http://127.0.0.1:8000/api/fees-manager/assignments/?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch assignments');

      const json = await res.json();
      setAssignments(json.data.assignments || []);
      setPagination(prev => ({
        ...prev,
        page: json.data.meta.page,
        totalPages: json.data.meta.total_pages,
        totalCount: json.data.meta.count
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading assignments');
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

      if (allFiltersSelected || selectedFilters.search) {
        fetchAssignments(1);
      } else {
        setAssignments([]);
        setPagination(prev => ({ ...prev, totalCount: 0 }));
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedFilters, fetchAssignments]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fee assignment? This will also remove the associated unpaid invoice.')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/api/fees-manager/assignments/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete assignment');
      }

      // Update local state instead of re-fetching
      setAssignments(prev => prev.filter(a => a.id !== id));
      setPagination(prev => ({ 
        ...prev, 
        totalCount: Math.max(0, prev.totalCount - 1) 
      }));
      
      alert('Assignment deleted successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Deletion failed');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Individual Fee Management</h1>
          <p className="text-muted-foreground mt-1">Review and manage existing student fee assignments</p>
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
                batchId: '', branchId: '', semesterId: '', sectionId: '', admissionMode: '', search: ''
              })}
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>

        {/* Assignments List Area */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by student or USN..." 
                    className="pl-9 bg-muted/20 border-none focus-visible:ring-1"
                    value={selectedFilters.search}
                    onChange={(e) => setSelectedFilters(p => ({ ...p, search: e.target.value }))}
                  />
                </div>
                <Badge variant="secondary" className="px-3 py-1 font-medium">
                  {pagination.totalCount} Assignments Found
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : assignments.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground italic px-6 text-center">
                  <Users className="h-12 w-12 mb-4 opacity-20" />
                  {!(selectedFilters.batchId && selectedFilters.branchId && selectedFilters.semesterId && selectedFilters.sectionId && selectedFilters.admissionMode) 
                    ? "Please select all cascading filters to view assignments"
                    : "No assignments found for current selection"
                  }
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Student Details</TableHead>
                        <TableHead>Placement</TableHead>
                        <TableHead>Template Assigned</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Assigned On</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="font-medium text-foreground">{assignment.student.name}</div>
                            <div className="text-xs text-muted-foreground font-mono uppercase">{assignment.student.usn}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{assignment.student.department}</div>
                            <div className="text-xs text-muted-foreground">Sem {assignment.student.semester} • {assignment.student.section}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{assignment.template.name}</span>
                              <Badge variant="outline" className="w-fit text-[10px] mt-1 uppercase font-bold tracking-tighter">
                                {assignment.template.fee_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-green-600">
                              {formatCurrency(assignment.template.total_amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(assignment.assigned_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={pagination.page <= 1}
                  onClick={() => fetchAssignments(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchAssignments(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IndividualFeeAssignment;