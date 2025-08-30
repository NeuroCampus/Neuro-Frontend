import React, { useEffect, useState } from "react";
import { manageBatches } from "../../utils/admin_api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "../../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Edit, Trash2 } from "lucide-react";

interface Batch {
  id: number;
  name: string;
  start_year: number;
  end_year: number;
  student_count: number;
  created_at: string;
}

interface BatchManagementProps {
  setError?: (error: string | null) => void;
  toast?: any;
}

const BatchManagement: React.FC<BatchManagementProps> = ({ setError, toast }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBatch, setNewBatch] = useState({ name: "", start_year: "", end_year: "" });
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [editForm, setEditForm] = useState({ start_year: "", end_year: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    if (setError) setError(null);
    try {
      const res = await manageBatches();
      if (res.success && res.batches) {
        setBatches(res.batches);
      } else {
        if (setError) setError(res.message || "Failed to fetch batches");
      }
    } catch (err) {
      if (setError) setError("Network error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBatch({ ...newBatch, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleAddBatch = async () => {
    setLoading(true);
    if (setError) setError(null);
    try {
      const res = await manageBatches(
        {
          start_year: Number(newBatch.start_year),
          end_year: Number(newBatch.end_year),
        },
        undefined,
        "POST"
      );
      if (res.success) {
        fetchBatches();
        setNewBatch({ name: "", start_year: "", end_year: "" });
        if (toast) {
          toast({
            title: "Success",
            description: "Batch added successfully",
          });
        }
      } else {
        if (setError) setError(res.message || "Failed to add batch");
      }
    } catch (err) {
      if (setError) setError("Network error");
    }
    setLoading(false);
  };

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setEditForm({
      start_year: batch.start_year.toString(),
      end_year: batch.end_year.toString(),
    });
  };

  const handleUpdateBatch = async () => {
    if (!editingBatch) return;

    setLoading(true);
    if (setError) setError(null);
    try {
      const res = await manageBatches(
        {
          start_year: Number(editForm.start_year),
          end_year: Number(editForm.end_year),
        },
        editingBatch.id,
        "PUT"
      );
      if (res.success) {
        fetchBatches();
        setEditingBatch(null);
        setEditForm({ start_year: "", end_year: "" });
        if (toast) {
          toast({
            title: "Success",
            description: "Batch updated successfully",
          });
        }
      } else {
        if (setError) setError(res.message || "Failed to update batch");
      }
    } catch (err) {
      if (setError) setError("Network error");
    }
    setLoading(false);
  };

  const handleDeleteBatch = (batch: Batch) => {
    setBatchToDelete(batch);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!batchToDelete) return;

    setLoading(true);
    if (setError) setError(null);
    try {
      const res = await manageBatches(undefined, batchToDelete.id, "DELETE");
      if (res.success) {
        fetchBatches();
        setDeleteDialogOpen(false);
        setBatchToDelete(null);
        if (toast) {
          toast({
            title: "Success",
            description: "Batch deleted successfully",
          });
        }
      } else {
        if (setError) setError(res.message || "Failed to delete batch");
      }
    } catch (err) {
      if (setError) setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Batch Management</h2>
      <Card className="mb-6">
        <h3 className="font-semibold mb-2">Add New Batch</h3>
        <div className="flex gap-2 mb-2">
          <Input
            name="start_year"
            type="number"
            placeholder="Start Year"
            value={newBatch.start_year}
            onChange={handleInputChange}
            className="w-1/3"
          />
          <Input
            name="end_year"
            type="number"
            placeholder="End Year"
            value={newBatch.end_year}
            onChange={handleInputChange}
            className="w-1/3"
          />
          <Button onClick={handleAddBatch} disabled={loading}>
            Add Batch
          </Button>
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold mb-2">Existing Batches</h3>
        {loading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <table className="w-full text-left border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Name</th>
                <th className="p-2">Start Year</th>
                <th className="p-2">End Year</th>
                <th className="p-2">Student Count</th>
                <th className="p-2">Created At</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} className="border-t">
                  <td className="p-2">{batch.name}</td>
                  <td className="p-2">{batch.start_year}</td>
                  <td className="p-2">{batch.end_year}</td>
                  <td className="p-2">{batch.student_count}</td>
                  <td className="p-2">{new Date(batch.created_at).toLocaleDateString()}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditBatch(batch)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteBatch(batch)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Edit Batch Dialog */}
      <Dialog open={!!editingBatch} onOpenChange={() => setEditingBatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Year</label>
              <Input
                name="start_year"
                type="number"
                value={editForm.start_year}
                onChange={handleEditInputChange}
                placeholder="Start Year"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Year</label>
              <Input
                name="end_year"
                type="number"
                value={editForm.end_year}
                onChange={handleEditInputChange}
                placeholder="End Year"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBatch(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBatch} disabled={loading}>
              {loading ? "Updating..." : "Update Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete the batch "{batchToDelete?.name}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchManagement;
