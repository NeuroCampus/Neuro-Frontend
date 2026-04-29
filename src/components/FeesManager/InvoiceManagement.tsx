import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Download,
  Eye,
  Search,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
  Mail,
  Filter,
  Users,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

interface Invoice {
  id: number;
  invoice_number: string;
  student: {
    id: number;
    name: string;
    usn: string;
    department: string;
    semester: number;
  };
  fee_assignment: {
    id: number;
    template: {
      name: string;
      fee_type: string;
    };
    academic_year: string;
  } | null;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  due_date: string;
  status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  created_at: string;
  academic_year?: string;
}

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string;
  status: string;
}

interface FilterData {
  batches: { id: number; name: string }[];
  branches: { id: number; name: string; code: string }[];
  admission_modes: string[];
}

const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesMeta, setInvoicesMeta] = useState<any | null>(null);
  const [statsData, setStatsData] = useState<any | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    mode: 'cash',
    transactionId: ''
  });

  // Cascading Filter states
  const [selectedFilters, setSelectedFilters] = useState({
    batchId: '',
    branchId: '',
    semesterId: '',
    sectionId: '',
    admissionMode: '',
    status: 'all',
    search: ''
  });

  const [filterData, setFilterData] = useState<FilterData>({ batches: [], branches: [], admission_modes: [] });
  const [semesters, setSemesters] = useState<{ id: number; number: number; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: number; name: string }[]>([]);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const filterRes = await fetch('http://127.0.0.1:8000/api/fees-manager/filters/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (filterRes.ok) {
          const data = await filterRes.json();
          setFilterData(data.data);
        }
      } catch (err) {
        console.error("Error fetching filters:", err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch semesters when branch changes
  useEffect(() => {
    if (!selectedFilters.branchId || selectedFilters.branchId === 'all_branches') {
      setSemesters([]);
      return;
    }
    const fetchSem = async () => {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/api/fees-manager/semesters/?branch_id=${selectedFilters.branchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSemesters(data.data || []);
      }
    };
    fetchSem();
  }, [selectedFilters.branchId]);

  // Fetch sections when semester changes
  useEffect(() => {
    if (!selectedFilters.semesterId || !selectedFilters.branchId) {
      setSections([]);
      return;
    }
    const fetchSec = async () => {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/api/fees-manager/sections/?branch_id=${selectedFilters.branchId}&semester_id=${selectedFilters.semesterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSections(data.data || []);
      }
    };
    fetchSec();
  }, [selectedFilters.semesterId, selectedFilters.branchId]);

  // Fetch invoices based on filters
  useEffect(() => {
    const allFiltersSelected = 
      selectedFilters.batchId && 
      selectedFilters.branchId && 
      selectedFilters.semesterId && 
      selectedFilters.sectionId && 
      selectedFilters.admissionMode;

    if (allFiltersSelected || selectedFilters.search.length > 2) {
      fetchInvoices(1);
    } else {
      setInvoices([]);
      setInvoicesMeta(null);
      setLoading(false);
    }
  }, [selectedFilters]);

  // Fetch stats when filters change
  useEffect(() => {
    const allFiltersSelected = 
      selectedFilters.batchId && 
      selectedFilters.branchId && 
      selectedFilters.semesterId && 
      selectedFilters.sectionId && 
      selectedFilters.admissionMode;

    const noFiltersSelected = 
      !selectedFilters.batchId && 
      !selectedFilters.branchId && 
      !selectedFilters.semesterId && 
      !selectedFilters.sectionId && 
      !selectedFilters.admissionMode;

    if (allFiltersSelected || noFiltersSelected) {
      fetchStats();
    }
  }, [selectedFilters]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        ...(selectedFilters.batchId && { batch_id: selectedFilters.batchId }),
        ...(selectedFilters.branchId && { branch_id: selectedFilters.branchId }),
        ...(selectedFilters.semesterId && { semester_id: selectedFilters.semesterId }),
        ...(selectedFilters.sectionId && { section_id: selectedFilters.sectionId }),
        ...(selectedFilters.admissionMode && { admission_mode: selectedFilters.admissionMode }),
      });

      const res = await fetch(`http://127.0.0.1:8000/api/fees-manager/stats/?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setStatsData(d.data);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const fetchInvoices = async (page: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '50',
        ...(selectedFilters.batchId && { batch_id: selectedFilters.batchId }),
        ...(selectedFilters.branchId && { branch_id: selectedFilters.branchId }),
        ...(selectedFilters.semesterId && { semester_id: selectedFilters.semesterId }),
        ...(selectedFilters.sectionId && { section_id: selectedFilters.sectionId }),
        ...(selectedFilters.admissionMode && { admission_mode: selectedFilters.admissionMode }),
        ...(selectedFilters.status !== 'all' && { status: selectedFilters.status }),
        ...(selectedFilters.search && { search: selectedFilters.search })
      });

      const response = await fetch(`http://127.0.0.1:8000/api/fees-manager/invoices/?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch invoices');

      const json = await response.json();
      const list = json.data || [];
      const meta = json.meta || null;

      // Normalization
      const normalized = list.map((inv: any) => ({
        ...inv,
        total_amount: (inv.total_amount_cents ?? 0) / 100,
        paid_amount: (inv.paid_amount_cents ?? 0) / 100,
        pending_amount: (inv.pending_amount_cents ?? 0) / 100,
      }));

      setInvoices(normalized);
      setInvoicesMeta(meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (invoiceId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/fees-manager/invoices/${invoiceId}/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch invoice details');

      const json = await response.json();
      const inv = json.data || {};
      
      const normalizedInvoice = {
        ...inv,
        total_amount: (inv.total_amount_cents ?? 0) / 100,
        paid_amount: (inv.paid_amount_cents ?? 0) / 100,
        pending_amount: (inv.pending_amount_cents ?? 0) / 100,
      };

      const normalizedPayments = (inv.payments || []).map((p: any) => ({
        ...p,
        amount: (p.amount_cents ?? 0) / 100,
      }));

      setSelectedInvoice(normalizedInvoice);
      setPayments(normalizedPayments);
      setIsDetailsDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoice details');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      setIsSubmittingPayment(true);
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/api/fees-manager/payments/record/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          amount: paymentForm.amount,
          mode: paymentForm.mode,
          transaction_id: paymentForm.transactionId
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to record payment');
      }

      setIsPaymentDialogOpen(false);
      setPaymentForm({ amount: '', mode: 'cash', transactionId: '' });
      fetchInvoices(invoicesMeta?.page || 1);
      fetchStats();
      alert('Payment recorded successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmittingPayment(false);
    }
  };
  const openPaymentDialog = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentForm({
      amount: (inv.pending_amount_cents / 100).toString(),
      mode: 'cash',
      transactionId: ''
    });
    setIsPaymentDialogOpen(true);
  };

  const downloadInvoice = async (invoiceId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/fees-manager/invoices/${invoiceId}/download/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to download invoice');
      
      const json = await response.json();
      if (json.data?.download_url) {
        window.open(`http://127.0.0.1:8000${json.data.download_url}`, '_blank');
      }
    } catch (err) {
      setError('Failed to initiate download');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Paid</Badge>;
      case 'partially_paid':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Partial</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Unpaid</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Invoice Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage student fee payments and collections</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Cascading Filters */}
        <Card className="lg:col-span-1 border-border/50 shadow-sm h-fit sticky top-6">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Cohort Filters
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
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 overflow-hidden">
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
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select value={selectedFilters.sectionId} onValueChange={(val) => setSelectedFilters(p => ({ ...p, sectionId: val }))}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select Section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
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
              variant="outline" 
              className="w-full text-xs" 
              onClick={() => setSelectedFilters({
                batchId: '', branchId: '', semesterId: '', sectionId: '', admissionMode: '', status: 'all', search: ''
              })}
            >
              Reset All
            </Button>
          </CardContent>
        </Card>

        {/* Right Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Invoices</p>
                  <p className="text-2xl font-bold">{statsData?.total_invoices || 0}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg"><FileText className="h-5 w-5 text-blue-600" /></div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collection</p>
                  <p className="text-2xl font-bold">{formatCurrency((statsData?.total_revenue_cents || 0) / 100)}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding</p>
                  <p className="text-2xl font-bold">{formatCurrency((statsData?.outstanding_amount_cents || 0) / 100)}</p>
                </div>
                <div className="bg-red-100 p-2 rounded-lg"><Clock className="h-5 w-5 text-red-600" /></div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Templates</p>
                  <p className="text-2xl font-bold">{statsData?.active_templates || 0}</p>
                </div>
                <div className="bg-amber-100 p-2 rounded-lg"><Users className="h-5 w-5 text-amber-600" /></div>
              </CardContent>
            </Card>
          </div>

          {/* Table Controls */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search USN, Name or Invoice #..." 
                    className="pl-9 h-11"
                    value={selectedFilters.search}
                    onChange={(e) => setSelectedFilters(p => ({ ...p, search: e.target.value }))}
                  />
                </div>
                <Select value={selectedFilters.status} onValueChange={(val) => setSelectedFilters(p => ({ ...p, status: val }))}>
                  <SelectTrigger className="w-full md:w-[180px] h-11">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partially_paid">Partial</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table Area */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[120px]">Invoice #</TableHead>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded"></div></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 py-8">
                        <Filter className="h-12 w-12 text-muted-foreground opacity-20" />
                        <div className="space-y-1">
                          <p className="text-lg font-semibold text-foreground">
                            {!(selectedFilters.batchId && selectedFilters.branchId && selectedFilters.semesterId && selectedFilters.sectionId && selectedFilters.admissionMode) && selectedFilters.search.length < 3
                              ? "Select Filters to View Invoices"
                              : "No Invoices Found"}
                          </p>
                          <p className="text-sm text-muted-foreground italic">
                            {!(selectedFilters.batchId && selectedFilters.branchId && selectedFilters.semesterId && selectedFilters.sectionId && selectedFilters.admissionMode) && selectedFilters.search.length < 3
                              ? "Please select all cascading filters or search by USN to load data"
                              : "Try adjusting your search or status filters"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-muted/5 transition-colors">
                      <TableCell className="font-mono font-bold text-primary">{inv.invoice_number}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{inv.student.name}</span>
                          <span className="text-xs text-muted-foreground">{inv.student.usn} • Sem {inv.student.semester}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{inv.fee_assignment?.template?.name || 'Manual'}</span>
                          <span className="text-[10px] uppercase text-muted-foreground">{inv.academic_year}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(inv.total_amount)}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{formatCurrency(inv.pending_amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase opacity-70">
                          {(inv as any).payment_mode || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-green-600 hover:bg-green-50" 
                            onClick={() => openPaymentDialog(inv)}
                            title="Record Payment"
                          >
                            <IndianRupee className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => fetchInvoiceDetails(inv.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => downloadInvoice(inv.id)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {invoicesMeta && invoicesMeta.total_pages > 1 && (
              <div className="p-4 border-t flex items-center justify-between bg-muted/10">
                <p className="text-xs text-muted-foreground">Showing {(invoicesMeta.page - 1) * 50 + 1} to {Math.min(invoicesMeta.page * 50, invoicesMeta.count)} of {invoicesMeta.count}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={!invoicesMeta.has_previous} onClick={() => fetchInvoices(invoicesMeta.page - 1)}>Prev</Button>
                  <Button variant="outline" size="sm" disabled={!invoicesMeta.has_next} onClick={() => fetchInvoices(invoicesMeta.page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Invoice Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl border-none shadow-2xl p-0 overflow-hidden bg-card">
          <div className="bg-primary p-6 text-primary-foreground">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase opacity-70 font-bold tracking-widest mb-1">Invoice Statement</p>
                <h2 className="text-3xl font-black">{selectedInvoice?.invoice_number}</h2>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-3 py-1 text-sm">{selectedInvoice?.status.toUpperCase()}</Badge>
                <p className="text-xs mt-2 opacity-70">Generated on {selectedInvoice && new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Bill To
                </h4>
                <div className="space-y-1">
                  <p className="text-xl font-bold">{selectedInvoice?.student.name}</p>
                  <p className="text-sm text-muted-foreground">USN: {selectedInvoice?.student.usn}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice?.student.department}</p>
                  <p className="text-sm text-muted-foreground">Semester {selectedInvoice?.student.semester}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Fee Details
                </h4>
                <div className="space-y-1">
                  <p className="text-xl font-bold">{selectedInvoice?.fee_assignment?.template?.name || 'Custom Assignment'}</p>
                  <p className="text-sm text-muted-foreground">Type: {selectedInvoice?.fee_assignment?.template?.fee_type || 'Annual'}</p>
                  <p className="text-sm text-muted-foreground">Academic Year: {selectedInvoice?.academic_year}</p>
                  <p className="text-sm font-bold text-red-500">Due Date: {selectedInvoice?.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-2xl p-6 grid grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold">Total Amount</p>
                <p className="text-2xl font-black">{formatCurrency(selectedInvoice?.total_amount || 0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold">Total Paid</p>
                <p className="text-2xl font-black text-green-600">{formatCurrency(selectedInvoice?.paid_amount || 0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold">Outstanding</p>
                <p className="text-2xl font-black text-red-600">{formatCurrency(selectedInvoice?.pending_amount || 0)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Transaction History
              </h4>
              {payments.length === 0 ? (
                <div className="bg-muted/10 rounded-xl p-8 text-center border border-dashed">
                  <p className="text-sm text-muted-foreground">No payments recorded for this invoice</p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs">{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs uppercase font-bold">{p.payment_method}</TableCell>
                          <TableCell className="text-xs font-mono">{p.transaction_id || '-'}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">{formatCurrency(p.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button className="flex-1 h-12 text-lg font-bold" onClick={() => downloadInvoice(selectedInvoice?.id || 0)}>
                <Download className="h-5 w-5 mr-2" /> Download Statement
              </Button>
              <Button variant="outline" className="h-12 px-8" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-green-600" />
              Record Manual Payment
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Input value={selectedInvoice?.student.name} disabled className="bg-muted/30" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={paymentForm.mode} onValueChange={(val) => setPaymentForm(p => ({ ...p, mode: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reference / Transaction ID (Optional)</Label>
              <Input 
                placeholder="e.g. Cheque # or Bank Ref"
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm(p => ({ ...p, transactionId: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isSubmittingPayment}>
                {isSubmittingPayment ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceManagement;