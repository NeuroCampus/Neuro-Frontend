import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { manageWardens, manageHostels } from '../../utils/hms_api';
import { useToast } from '../../hooks/use-toast';
import { Plus, Edit2, Trash2, Shield, Search } from 'lucide-react';
import { SkeletonTable } from '../ui/skeleton';

interface Hostel {
  id: number;
  name: string;
}

interface Warden {
  id: number;
  user: number;
  name: string;
  hostel: number;
  hostel_name?: string;
}

const WardenManagement: React.FC = () => {
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarden, setEditingWarden] = useState<Warden | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    user: 0,
    name: '',
    hostel: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchWardens(), fetchHostels()]);
    setLoading(false);
  };

  const fetchWardens = async () => {
    const response = await manageWardens();
    if (response.success && response.results) {
      setWardens(response.results);
    }
  };

  const fetchHostels = async () => {
    const response = await manageHostels();
    if (response.success && response.results) {
      setHostels(response.results);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingWarden ? 'PUT' : 'POST';
    const response = await manageWardens(formData, editingWarden?.id, method);

    if (response.success) {
      fetchWardens();
      setIsDialogOpen(false);
      setEditingWarden(null);
      setFormData({ user: 0, name: '', hostel: 0 });
      toast({
        title: "Success",
        description: `Warden ${editingWarden ? 'updated' : 'created'} successfully`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: response.message || "Failed to save warden",
      });
    }
  };

  const handleEdit = (warden: Warden) => {
    setEditingWarden(warden);
    setFormData({
      user: warden.user,
      name: warden.name,
      hostel: warden.hostel
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this warden?')) {
      const response = await manageWardens(undefined, id, 'DELETE');
      if (response.success) {
        fetchWardens();
        toast({
          title: "Success",
          description: "Warden deleted successfully",
        });
      }
    }
  };

  const filteredWardens = wardens.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.hostel_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
              Warden List
            </CardTitle>
            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search wardens..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingWarden(null);
                    setFormData({ user: 0, name: '', hostel: 0 });
                  }} className="bg-primary hover:bg-primary/90 w-full md:w-auto whitespace-nowrap">
                    <Plus className="w-4 h-4 mr-2" /> Add Warden
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingWarden ? 'Edit Warden' : 'Add Warden'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Enter warden name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hostel">Assign Hostel</Label>
                      <Select value={formData.hostel?.toString() || ""} onValueChange={(value) => setFormData({ ...formData, hostel: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a hostel" />
                        </SelectTrigger>
                        <SelectContent>
                          {hostels.map((hostel) => (
                            <SelectItem key={hostel.id} value={hostel.id?.toString() || ""}>
                              {hostel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">{editingWarden ? 'Update Warden' : 'Create Warden'}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonTable rows={5} columns={3} />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Warden Name</TableHead>
                    <TableHead className="font-bold">Assigned Hostel</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWardens.length > 0 ? (
                    filteredWardens.map((warden) => (
                      <TableRow key={warden.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{warden.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            {warden.hostel_name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(warden)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200">
                              <Edit2 size={14} />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDelete(warden.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                        {searchQuery ? 'No wardens match your search.' : 'No wardens found.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WardenManagement;
