import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Search, Eye, Check, X, FileText, Calendar, User } from "lucide-react";
import { fetchWithTokenRefresh } from "../../utils/authService";
import { API_ENDPOINT } from "../../utils/config";
import { useTheme } from "../../context/ThemeContext";

interface ExamApplication {
  id: number;
  student_name: string;
  student_roll_no: string;
  subject_name: string;
  subject_code: string;
  faculty_name: string;
  exam_date: string;
  status: 'pending' | 'approved' | 'rejected';
  application_date: string;
  reason?: string;
  remarks?: string;
}

const ExamApplications = () => {
  const { theme } = useTheme();
  const [applications, setApplications] = useState<ExamApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ExamApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<ExamApplication | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter]);

  const fetchApplications = async () => {
    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/exam-applications/`, {
        method: 'GET',
      });
      const result = await response.json();
      if (result.success) {
        setApplications(result.data);
      }
    } catch (error) {
      console.error('Error fetching exam applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.student_roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const handleAction = async (applicationId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/exam-applications/${applicationId}/action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          remarks: remarks.trim() || undefined
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchApplications(); // Refresh the list
        setActionDialog(false);
        setRemarks("");
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Exam Applications</h1>
        <Badge variant="outline" className="text-sm">
          COE Review Panel
        </Badge>
      </div>

      {/* Filters */}
      <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, roll number, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Exam Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{app.student_name}</div>
                      <div className="text-sm text-muted-foreground">{app.student_roll_no}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{app.subject_name}</div>
                      <div className="text-sm text-muted-foreground">{app.subject_code}</div>
                    </div>
                  </TableCell>
                  <TableCell>{app.faculty_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {new Date(app.exam_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApplication(app);
                          setShowDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {app.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => {
                              setSelectedApplication(app);
                              setActionType('approve');
                              setActionDialog(true);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedApplication(app);
                              setActionType('reject');
                              setActionDialog(true);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredApplications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No applications found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Student Name</label>
                  <p className="text-sm text-muted-foreground">{selectedApplication.student_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Roll Number</label>
                  <p className="text-sm text-muted-foreground">{selectedApplication.student_roll_no}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <p className="text-sm text-muted-foreground">{selectedApplication.subject_name} ({selectedApplication.subject_code})</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Faculty</label>
                  <p className="text-sm text-muted-foreground">{selectedApplication.faculty_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Exam Date</label>
                  <p className="text-sm text-muted-foreground">{new Date(selectedApplication.exam_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
              </div>
              {selectedApplication.reason && (
                <div>
                  <label className="text-sm font-medium">Reason</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedApplication.reason}</p>
                </div>
              )}
              {selectedApplication.remarks && (
                <div>
                  <label className="text-sm font-medium">Remarks</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedApplication.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedApplication.student_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedApplication.subject_name} - {selectedApplication.subject_code}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Remarks (Optional)</label>
                <Textarea
                  placeholder="Add any remarks or notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setActionDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAction(selectedApplication.id, actionType!)}
                  className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamApplications;