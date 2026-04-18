import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { manageHostels } from '../../utils/hms_api';
import { useToast } from '../../hooks/use-toast';

interface Hostel {
  id: number;
  name: string;
  gender: 'M' | 'F';
  caretaker: string;
}

const HostelManagement: React.FC = () => {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'M' as 'M' | 'F',
    caretaker: ''
  });

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    const response = await manageHostels();
    if (response.success && response.results) {
      setHostels(response.results);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: response.message || "Failed to fetch hostels",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingHostel ? 'PUT' : 'POST';
    const response = await manageHostels(formData, editingHostel?.id, method);

    if (response.success) {
      fetchHostels();
      setIsDialogOpen(false);
      setEditingHostel(null);
      setFormData({ name: '', gender: 'M', caretaker: '' });
      toast({
        title: "Success",
        description: `Hostel ${editingHostel ? 'updated' : 'created'} successfully`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: response.message || "Failed to save hostel",
      });
    }
  };

  const handleEdit = (hostel: Hostel) => {
    setEditingHostel(hostel);
    setFormData({
      name: hostel.name,
      gender: hostel.gender,
      caretaker: hostel.caretaker
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this hostel?')) {
      const response = await manageHostels(undefined, id, 'DELETE');
      if (response.success) {
        fetchHostels();
        toast({
          title: "Success",
          description: "Hostel deleted successfully",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to delete hostel",
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Hostel Management
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingHostel(null);
                setFormData({ name: '', gender: 'M', caretaker: '' });
              }}>
                Add Hostel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingHostel ? 'Edit Hostel' : 'Add Hostel'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value: 'M' | 'F') => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="caretaker">Caretaker</Label>
                  <Input
                    id="caretaker"
                    value={formData.caretaker}
                    onChange={(e) => setFormData({ ...formData, caretaker: e.target.value })}
                  />
                </div>
                <Button type="submit">{editingHostel ? 'Update' : 'Create'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Caretaker</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hostels.map((hostel) => (
              <TableRow key={hostel.id}>
                <TableCell>{hostel.name}</TableCell>
                <TableCell>{hostel.gender === 'M' ? 'Male' : 'Female'}</TableCell>
                <TableCell>{hostel.caretaker}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(hostel)} className="mr-2">
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(hostel.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default HostelManagement;