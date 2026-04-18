import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { manageRooms, manageHostels } from '../../utils/hms_api';
import { useToast } from '../../hooks/use-toast';

interface Hostel {
  id: number;
  name: string;
}

interface Room {
  id: number;
  no: string;
  name: string;
  room_type: 'S' | 'D' | 'P' | 'B';
  vacant: boolean;
  hostel: number;
  hostel_name?: string;
}

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    no: '',
    name: '',
    room_type: 'S' as 'S' | 'D' | 'P' | 'B',
    vacant: true,
    hostel: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
    fetchHostels();
  }, []);

  const fetchRooms = async () => {
    const response = await manageRooms();
    if (response.success && response.results) {
      setRooms(response.results);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: response.message || "Failed to fetch rooms",
      });
    }
  };

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
    const method = editingRoom ? 'PUT' : 'POST';
    const response = await manageRooms(formData, editingRoom?.id, method);

    if (response.success) {
      fetchRooms();
      setIsDialogOpen(false);
      setEditingRoom(null);
      setFormData({ no: '', name: '', room_type: 'S', vacant: true, hostel: 0 });
      toast({
        title: "Success",
        description: `Room ${editingRoom ? 'updated' : 'created'} successfully`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: response.message || "Failed to save room",
      });
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      no: room.no,
      name: room.name,
      room_type: room.room_type,
      vacant: room.vacant,
      hostel: room.hostel
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this room?')) {
      const response = await manageRooms(undefined, id, 'DELETE');
      if (response.success) {
        fetchRooms();
        toast({
          title: "Success",
          description: "Room deleted successfully",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to delete room",
        });
      }
    }
  };

  const getRoomTypeLabel = (type: string) => {
    const labels = {
      'S': 'Single Occupancy',
      'D': 'Double Occupancy',
      'P': 'Reserved for Research Scholars',
      'B': 'Both Single and Double Occupancy'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Room Management
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRoom(null);
                setFormData({ no: '', name: '', room_type: 'S', vacant: true, hostel: 0 });
              }}>
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="no">Room Number</Label>
                  <Input
                    id="no"
                    value={formData.no}
                    onChange={(e) => setFormData({ ...formData, no: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Room Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="room_type">Room Type</Label>
                  <Select value={formData.room_type} onValueChange={(value: 'S' | 'D' | 'P' | 'B') => setFormData({ ...formData, room_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">Single Occupancy</SelectItem>
                      <SelectItem value="D">Double Occupancy</SelectItem>
                      <SelectItem value="P">Reserved for Research Scholars</SelectItem>
                      <SelectItem value="B">Both Single and Double Occupancy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hostel">Hostel</Label>
                  <Select value={formData.hostel.toString()} onValueChange={(value) => setFormData({ ...formData, hostel: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hostels.map((hostel) => (
                        <SelectItem key={hostel.id} value={hostel.id.toString()}>
                          {hostel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="vacant"
                    checked={formData.vacant}
                    onChange={(e) => setFormData({ ...formData, vacant: e.target.checked })}
                  />
                  <Label htmlFor="vacant">Vacant</Label>
                </div>
                <Button type="submit">{editingRoom ? 'Update' : 'Create'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Hostel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell>{room.no}</TableCell>
                <TableCell>{room.name}</TableCell>
                <TableCell>{getRoomTypeLabel(room.room_type)}</TableCell>
                <TableCell>{room.hostel_name || room.hostel}</TableCell>
                <TableCell>{room.vacant ? 'Vacant' : 'Occupied'}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(room)} className="mr-2">
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(room.id)}>
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

export default RoomManagement;