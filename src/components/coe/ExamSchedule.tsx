import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash2, Search } from "lucide-react";
import { fetchWithTokenRefresh } from "../../utils/authService";
import { API_ENDPOINT } from "../../utils/config";
import { useTheme } from "../../context/ThemeContext";

interface ExamSchedule {
  id: number;
  subject_name: string;
  subject_code: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  faculty_name: string;
  total_students: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

const ExamSchedule = () => {
  const { theme } = useTheme();
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [formData, setFormData] = useState({
    subject_id: "",
    exam_date: "",
    start_time: "",
    end_time: "",
    venue: "",
    faculty_id: "",
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    filterSchedules();
  }, [schedules, searchTerm, statusFilter]);

  const fetchSchedules = async () => {
    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/exam-schedule/`, {
        method: 'GET',
      });
      const result = await response.json();
      if (result.success) {
        setSchedules(result.data);
      }
    } catch (error) {
      console.error('Error fetching exam schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSchedules = () => {
    let filtered = schedules;

    if (searchTerm) {
      filtered = filtered.filter(schedule =>
        schedule.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.faculty_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.venue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }

    setFilteredSchedules(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingSchedule
        ? `${API_ENDPOINT}/coe/exam-schedule/${editingSchedule.id}/`
        : `${API_ENDPOINT}/coe/exam-schedule/`;

      const method = editingSchedule ? 'PUT' : 'POST';

      const response = await fetchWithTokenRefresh(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        setShowDialog(false);
        setEditingSchedule(null);
        resetForm();
        await fetchSchedules();
      }
    } catch (error) {
      console.error('Error saving exam schedule:', error);
    }
  };

  const handleDelete = async (scheduleId: number) => {
    if (!confirm('Are you sure you want to delete this exam schedule?')) return;

    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/exam-schedule/${scheduleId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSchedules();
      }
    } catch (error) {
      console.error('Error deleting exam schedule:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      subject_id: "",
      exam_date: "",
      start_time: "",
      end_time: "",
      venue: "",
      faculty_id: "",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'ongoing':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Ongoing</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Cancelled</Badge>;
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
        <h1 className="text-3xl font-bold">Exam Schedule</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSchedule(null);
              resetForm();
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Edit Exam Schedule' : 'Add New Exam Schedule'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject_id">Subject</Label>
                  <Select value={formData.subject_id} onValueChange={(value) => setFormData({...formData, subject_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* This would be populated from API */}
                      <SelectItem value="1">Mathematics - MATH101</SelectItem>
                      <SelectItem value="2">Physics - PHYS101</SelectItem>
                      <SelectItem value="3">Chemistry - CHEM101</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="faculty_id">Faculty</Label>
                  <Select value={formData.faculty_id} onValueChange={(value) => setFormData({...formData, faculty_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* This would be populated from API */}
                      <SelectItem value="1">Dr. John Smith</SelectItem>
                      <SelectItem value="2">Prof. Jane Doe</SelectItem>
                      <SelectItem value="3">Dr. Bob Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="exam_date">Exam Date</Label>
                <Input
                  id="exam_date"
                  type="date"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  placeholder="Enter exam venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSchedule ? 'Update' : 'Create'} Schedule
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by subject, faculty, or venue..."
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
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Table */}
      <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardHeader>
          <CardTitle>Exam Schedules ({filteredSchedules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{schedule.subject_name}</div>
                      <div className="text-sm text-muted-foreground">{schedule.subject_code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {new Date(schedule.exam_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {schedule.start_time} - {schedule.end_time}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      {schedule.venue}
                    </div>
                  </TableCell>
                  <TableCell>{schedule.faculty_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      {schedule.total_students}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSchedule(schedule);
                          setFormData({
                            subject_id: schedule.id.toString(), // This would need proper mapping
                            exam_date: schedule.exam_date,
                            start_time: schedule.start_time,
                            end_time: schedule.end_time,
                            venue: schedule.venue,
                            faculty_id: schedule.id.toString(), // This would need proper mapping
                          });
                          setShowDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredSchedules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No exam schedules found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamSchedule;