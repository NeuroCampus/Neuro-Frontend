import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { manageCourses } from '../../utils/hms_api';
import { useToast } from '../../hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Home, 
  Search,
  Filter,
  CheckCircle2,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SkeletonPageHeader, SkeletonTable } from '../ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface Course {
  id: number;
  code: string;
  room_type: 'S' | 'D' | 'P' | 'B';
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    room_type: 'D' as 'S' | 'D' | 'P' | 'B'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const response = await manageCourses();
    if (response.success && response.results) {
      setCourses(response.results);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: response.message || "Failed to fetch courses",
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCourse ? 'PUT' : 'POST';
    const response = await manageCourses(formData, editingCourse?.id, method);

    if (response.success) {
      fetchCourses();
      setIsDialogOpen(false);
      setEditingCourse(null);
      setFormData({ code: '', room_type: 'D' });
      toast({
        title: "Success",
        description: `Course ${editingCourse ? 'updated' : 'created'} successfully`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: response.message || "Failed to save course",
      });
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      room_type: course.room_type
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this course?')) {
      const response = await manageCourses(undefined, id, 'DELETE');
      if (response.success) {
        fetchCourses();
        toast({
          title: "Success",
          description: "Course deleted successfully",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to delete course",
        });
      }
    }
  };

  const getRoomTypeLabel = (type: string) => {
    const labels = {
      'S': 'Single Occupancy',
      'D': 'Double Occupancy',
      'P': 'Research Scholars',
      'B': 'Mixed (S & D)'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getRoomTypeBadgeColor = (type: string) => {
    switch(type) {
      case 'S': return "bg-blue-500/10 text-blue-600 border-blue-200";
      case 'D': return "bg-green-500/10 text-green-600 border-green-200";
      case 'P': return "bg-purple-500/10 text-purple-600 border-purple-200";
      case 'B': return "bg-orange-500/10 text-orange-600 border-orange-200";
      default: return "bg-slate-500/10 text-slate-600 border-slate-200";
    }
  };

  const filteredCourses = courses.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && courses.length === 0) {
    return (
      <div className="space-y-6">
        <SkeletonPageHeader />
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground">Define courses and their room type eligibility for hostel allocation.</p>
        </div>
        <Button onClick={() => {
          setEditingCourse(null);
          setFormData({ code: '', room_type: 'D' });
          setIsDialogOpen(true);
        }} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Course
        </Button>
      </div>

      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Active Courses
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search courses..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-64 bg-background"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[150px] font-bold">Course Code</TableHead>
                <TableHead className="font-bold">Room Type Eligibility</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <LayoutGrid className="h-10 w-10 mb-2 opacity-20" />
                      <p>No courses found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course) => (
                  <TableRow key={course.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        {course.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-medium ${getRoomTypeBadgeColor(course.room_type)}`}>
                        <Home className="w-3 h-3 mr-1.5" />
                        {getRoomTypeLabel(course.room_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(course)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(course.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Course Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Update Course' : 'Create New Course'}</DialogTitle>
            <DialogDescription>
              {editingCourse ? 'Modify course eligibility criteria.' : 'Add a new course to the system.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Course Code</Label>
              <Input
                id="code"
                placeholder="e.g. B.Tech CSE"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room_type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Room Type Preference</Label>
              <Select value={formData.room_type} onValueChange={(value: 'S' | 'D' | 'P' | 'B') => setFormData({ ...formData, room_type: value })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">Single Occupancy</SelectItem>
                  <SelectItem value="D">Double Occupancy</SelectItem>
                  <SelectItem value="P">Reserved for Research Scholars</SelectItem>
                  <SelectItem value="B">Both Single and Double Occupancy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1">{editingCourse ? 'Update Course' : 'Add Course'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseManagement;