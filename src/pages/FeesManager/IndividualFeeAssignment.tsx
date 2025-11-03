import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Search,
  Plus,
  Edit,
  AlertTriangle,
  IndianRupee,
  DollarSign,
  Users,
  ArrowLeft,
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
  usn: string;
  department: string;
  semester: number;
  admission_mode: string;
}

interface FeeComponent {
  id: number;
  name: string;
  amount: number;
  description?: string;
  is_active: boolean;
}

interface IndividualFeeAssignment {
  id: number;
  student: Student;
  custom_fee_structure: Record<string, number>;
  total_amount: number;
  assigned_at: string;
  is_active: boolean;
}

const IndividualFeeAssignment: React.FC = () => {
  const [assignments, setAssignments] = useState<IndividualFeeAssignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableComponents, setAvailableComponents] = useState<FeeComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Assignment form states
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [customFees, setCustomFees] = useState<Record<number, number>>({});

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      // Fetch students and components in parallel
      const [studentsRes, componentsRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/fees-manager/students/', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://127.0.0.1:8000/api/fees-manager/components/', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!studentsRes.ok || !componentsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [studentsData, componentsData] = await Promise.all([
        studentsRes.json(),
        componentsRes.json(),
      ]);

      setStudents(studentsData.data || []);
      setAvailableComponents(componentsData.data || []);

      // Fetch individual assignments for all students
      await fetchIndividualAssignments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchIndividualAssignments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const assignmentsData: IndividualFeeAssignment[] = [];

      // Fetch individual assignments for each student
      for (const student of students) {
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/fees-manager/students/${student.id}/fee-profile/`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data?.custom_fee_structure) {
              assignmentsData.push({
                id: student.id,
                student: student,
                custom_fee_structure: data.data.custom_fee_structure,
                total_amount: data.data.total_amount || 0,
                assigned_at: data.data.assigned_at || new Date().toISOString(),
                is_active: true,
              });
            }
          }
        } catch (err) {
          // Skip if no individual assignment for this student
          continue;
        }
      }

      setAssignments(assignmentsData);
    } catch (err) {
      console.error('Error fetching individual assignments:', err);
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setCustomFees({});
  };

  const handleAssignIndividualFees = async () => {
    if (!selectedStudent || Object.keys(customFees).length === 0) return;

    try {
      const token = localStorage.getItem('access_token');

      // Convert component IDs to component names for the API
      const components: Record<string, number> = {};
      Object.entries(customFees).forEach(([componentId, amount]) => {
        const component = availableComponents.find(c => c.id === parseInt(componentId));
        if (component && amount > 0) {
          components[component.name] = amount;
        }
      });

      const response = await fetch(`http://127.0.0.1:8000/api/fees-manager/students/${selectedStudent.id}/assign-individual-fees/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ components }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign individual fees');
      }

      await fetchData();
      setIsAssignDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign individual fees');
    }
  };

  const handleRemoveIndividualFees = async (studentId: number) => {
    if (!confirm('Are you sure you want to remove individual fee assignment for this student?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/fees-manager/students/${studentId}/remove-individual-fees/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to remove individual fees');
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove individual fees');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.usn.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStudentCustomFees = (studentId: number) => {
    return assignments.find(assignment => assignment.student.id === studentId);
  };

  // Calculate pagination values
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading individual fee assignments...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Individual Fee Assignment</h1>
          <p className="text-muted-foreground mt-2">Assign custom fee structures to individual students</p>
        </div>

        {/* Assign Dialog for All Students */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold">Assign Custom Fees to Student</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {!selectedStudent ? (
                // Student Selection View
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Select Student</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto border rounded-lg p-4 custom-scrollbar bg-gray-50 dark:bg-card">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedStudent?.id === student.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm dark:border-border dark:hover:border-blue-500'
                        }`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div className="font-medium text-foreground">{student.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">{student.usn}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {student.department} • Sem {student.semester}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Selected Student View with Custom Fee Components
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Selected Student Header with Back Button */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-card rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <div className="font-medium text-foreground text-lg">{selectedStudent.name}</div>
                        <div className="text-sm text-muted-foreground">{selectedStudent.usn}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedStudent.department} • Sem {selectedStudent.semester}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedStudent(null)}
                      className="flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Students
                    </Button>
                  </div>

                  {/* Custom Fee Components */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Custom Fee Amounts</h3>
                      <div className="text-sm text-muted-foreground">
                        Setting fees for: {selectedStudent.name}
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-card">
                      {availableComponents.map((component) => (
                        <div 
                          key={component.id} 
                          className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-background rounded-lg border border-gray-200 dark:border-border shadow-sm"
                        >
                          <div className="flex-1 mb-3 md:mb-0">
                            <div className="font-medium text-foreground">{component.name}</div>
                            {component.description && (
                              <div className="text-sm text-muted-foreground mt-1">{component.description}</div>
                            )}
                            <div className="text-sm text-muted-foreground mt-1">Default: {formatCurrency(component.amount)}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-32"
                              value={customFees[component.id] !== undefined ? customFees[component.id] : ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  // Remove the key if value is empty
                                  const newFees = { ...customFees };
                                  delete newFees[component.id];
                                  setCustomFees(newFees);
                                } else {
                                  setCustomFees({
                                    ...customFees,
                                    [component.id]: parseFloat(value),
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <Card className="border border-gray-200 dark:border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground">Total Custom Amount:</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(
                              Object.values(customFees).reduce((sum, amount) => sum + (amount || 0), 0)
                            )}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Alert variant="default" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Set custom amounts for each fee component. Components with amount 0 or empty will not be included.
                        This will override any template-based fees for this student.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-border">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAssignDialogOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                {selectedStudent && (
                  <Button
                    onClick={() => {
                      handleAssignIndividualFees();
                      resetForm();
                    }}
                    disabled={!selectedStudent || Object.keys(customFees).length === 0}
                    className="bg-[#a259ff] hover:bg-[#8a4dde] text-white px-4 py-2"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Assign Custom Fees
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog for Students with Custom Fees */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold">Edit Custom Fees for Student</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {selectedStudent && (
                <div className="space-y-4">
                  {/* Student Info */}
                  <div className="p-4 bg-gray-50 dark:bg-card rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <div className="font-medium text-foreground text-lg">{selectedStudent.name}</div>
                        <div className="text-sm text-muted-foreground">{selectedStudent.usn}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedStudent.department} • Sem {selectedStudent.semester}
                      </div>
                    </div>
                  </div>

                  {/* Custom Fee Components */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Custom Fee Amounts</h3>
                    <div className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-card">
                      {availableComponents.map((component) => {
                        // Get existing custom fee amount for this component if it exists
                        const existingAssignment = getStudentCustomFees(selectedStudent.id);
                        const existingAmount = existingAssignment?.custom_fee_structure[component.name] || 0;
                        const currentAmount = customFees[component.id] !== undefined ? customFees[component.id] : existingAmount;

                        return (
                          <div 
                            key={component.id} 
                            className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-background rounded-lg border border-gray-200 dark:border-border shadow-sm"
                          >
                            <div className="flex-1 mb-3 md:mb-0">
                              <div className="font-medium text-foreground">{component.name}</div>
                              {component.description && (
                                <div className="text-sm text-muted-foreground mt-1">{component.description}</div>
                              )}
                              <div className="text-sm text-muted-foreground mt-1">Default: {formatCurrency(component.amount)}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <IndianRupee className="h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-32"
                                value={currentAmount !== 0 ? currentAmount : ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    // Remove the key if value is empty
                                    const newFees = { ...customFees };
                                    delete newFees[component.id];
                                    setCustomFees(newFees);
                                  } else {
                                    setCustomFees({
                                      ...customFees,
                                      [component.id]: parseFloat(value),
                                    });
                                  }
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary */}
                    <Card className="border border-gray-200 dark:border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground">Total Custom Amount:</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(
                              Object.values(customFees).reduce((sum, amount) => sum + (amount || 0), 0)
                            )}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Alert variant="default" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Edit custom amounts for each fee component. Components with amount 0 or empty will not be included.
                        This will update the existing custom fee structure for this student.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-border">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleAssignIndividualFees();
                    resetForm();
                  }}
                  disabled={!selectedStudent}
                  className="bg-[#a259ff] hover:bg-[#8a4dde] text-white px-4 py-2"
                >
                  <User className="h-4 w-4 mr-2" />
                  Update Custom Fees
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students by name or USN..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students with Individual Fees */}
      <Tabs defaultValue="with-custom" className="space-y-6">
        <TabsList>
          <TabsTrigger 
            value="with-custom" 
            className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white"
          >
            Students with Custom Fees ({assignments.length})
          </TabsTrigger>
          <TabsTrigger 
            value="all-students" 
            className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white"
          >
            All Students ({filteredStudents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="with-custom">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students with Custom Fee Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Custom Fee Assignments</h3>
                  <p className="text-gray-600 mb-4">
                    No students have custom fee structures assigned yet.
                  </p>
                  <Button 
                    onClick={() => setIsAssignDialogOpen(true)}
                    className="bg-[#a259ff] hover:bg-[#8a4dde] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Custom Fees
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Custom Fee Structure</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Assigned Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {assignment.student.name}
                          </TableCell>
                          <TableCell>{assignment.student.usn}</TableCell>
                          <TableCell>{assignment.student.department}</TableCell>
                          <TableCell>{assignment.student.semester}</TableCell>
                          <TableCell>
                            <div className="text-sm max-w-xs">
                              {Object.entries(assignment.custom_fee_structure).map(([name, amount]) => (
                                <div key={name} className="flex justify-between">
                                  <span>{name}:</span>
                                  <span>{formatCurrency(amount)}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(assignment.total_amount)}
                          </TableCell>
                          <TableCell>
                            {new Date(assignment.assigned_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveIndividualFees(assignment.student.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove Custom Fees
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-students">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>USN</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Fee Status</TableHead>
                      <TableHead>Current Fees</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentStudents.map((student) => {
                      const customAssignment = getStudentCustomFees(student.id);
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell>{student.usn}</TableCell>
                          <TableCell>{student.department}</TableCell>
                          <TableCell>{student.semester}</TableCell>
                          <TableCell>
                            {customAssignment ? (
                              <Badge variant="default">Custom Fees</Badge>
                            ) : (
                              <Badge variant="secondary">Template Based</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {customAssignment ? (
                              <span className="font-semibold text-green-600">
                                {formatCurrency(customAssignment.total_amount)}
                              </span>
                            ) : (
                              <span className="text-gray-500">Template assigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student);
                                // Pre-populate custom fees with existing values
                                const existingAssignment = getStudentCustomFees(student.id);
                                if (existingAssignment) {
                                  const fees: Record<number, number> = {};
                                  availableComponents.forEach(component => {
                                    const amount = existingAssignment.custom_fee_structure[component.name];
                                    if (amount) {
                                      fees[component.id] = amount;
                                    }
                                  });
                                  setCustomFees(fees);
                                }
                                setIsEditDialogOpen(true);
                              }}
                              className="bg-[#a259ff] hover:bg-[#8a4dde] text-white border-[#a259ff]"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {customAssignment ? 'Edit Custom Fees' : 'Assign Custom Fees'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {filteredStudents.length > studentsPerPage && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                      Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length} students
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
                      >
                        Previous
                      </Button>
                      <span className="px-3 py-1 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IndividualFeeAssignment;