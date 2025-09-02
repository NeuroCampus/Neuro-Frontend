import React, { useEffect, useState } from "react";
import { manageBatches } from "../../utils/admin_api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
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
    <div className="p-4 max-w-full min-h-screen mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-200">Batch Management</h2>

      {/* Add New Batch Card */}
      <Card className="bg-[#1c1c1e] border border-gray-700 shadow-sm mb-6">
        <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="w-full">
            <CardTitle className="block text-lg md:text-xl text-gray-200">
              Add New Batch
            </CardTitle>
            <p className="block text-sm md:text-base text-gray-300">
              Create a batch with start and end years
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <Input
              name="start_year"
              type="number"
              placeholder="Start Year"
              value={newBatch.start_year}
              onChange={handleInputChange}
              className="w-full sm:w-1/3 bg-[#232326] text-gray-200"
            />
            <Input
              name="end_year"
              type="number"
              placeholder="End Year"
              value={newBatch.end_year}
              onChange={handleInputChange}
              className="w-full sm:w-1/3 bg-[#232326] text-gray-200"
            />
            <Button
              onClick={handleAddBatch}
              disabled={loading}
              className=" text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 shadow-sm"
            >
              Add Batch
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Batches */}
      <Card className="bg-[#1c1c1e] border border-gray-700 shadow-sm min-h-[450px]">
        <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="w-full">
            <CardTitle className="block text-lg md:text-xl text-gray-200">
              Existing Batches
            </CardTitle>
            <p className="block text-sm md:text-base text-gray-300">
              Manage, edit, or delete created batches
            </p>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto md:overflow-x-visible pb-0">
          {loading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <div className="max-h-[22rem] overflow-y-auto thin-scrollbar">
              <table className="w-full text-sm md:text-base text-left text-gray-200 border-collapse">
                <thead className="sticky top-0 z-10 bg-[#232326] border-b border-gray-200">
                  <tr>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Start Year</th>
                    <th className="py-2 px-3">End Year</th>
                    <th className="py-2 px-3">Student Count</th>
                    <th className="py-2 px-3">Created At</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr
                      key={batch.id}
                      className="border-b border-gray-100 transition-colors text-gray-200 duration-200 hover:bg-gray-800/60"
                    >
                      <td className="py-3 px-3">{batch.name}</td>
                      <td className="py-3 px-3">{batch.start_year}</td>
                      <td className="py-3 px-3">{batch.end_year}</td>
                      <td className="py-3 px-3">{batch.student_count}</td>
                      <td className="py-3 px-3">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditBatch(batch)}
                          disabled={loading}
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteBatch(batch)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          )}
        </CardContent>
      </Card>

      {/* Edit Batch Dialog */}
      <Dialog open={!!editingBatch} onOpenChange={() => setEditingBatch(null)}>
        <DialogContent className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">
                Start Year
              </label>
              <Input
                name="start_year"
                type="number"
                value={editForm.start_year}
                onChange={handleEditInputChange}
                placeholder="Start Year"
                className="bg-[#232326] text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">
                End Year
              </label>
              <Input
                name="end_year"
                type="number"
                value={editForm.end_year}
                onChange={handleEditInputChange}
                placeholder="End Year"
                className="bg-[#232326] text-gray-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingBatch(null)}
              className=" text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateBatch}
              disabled={loading}
              className="text-gray-200 bg-gray-800 hover:bg-gray-600 border border-gray-600"
            >
              {loading ? "Updating..." : "Update Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300">
            Are you sure you want to delete the batch{" "}
            <span className="font-semibold">"{batchToDelete?.name}"</span>? This
            action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-gray-700 text-gray-900 hover:bg-gray-500"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchManagement;
