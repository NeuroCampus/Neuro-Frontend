import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { PencilIcon, TrashIcon, PlusIcon, UserPlus2Icon } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDownIcon } from "lucide-react";
import { manageBranches, manageUsers } from "../../utils/admin_api";
import { useToast } from "../../hooks/use-toast";

interface Branch {
  id: number;
  name: string;
  hod: string | null;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

const BranchesManagement = ({ setError, toast }: { setError: (error: string | null) => void; toast: (options: any) => void }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Branch | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "" });
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [newHodId, setNewHodId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [branchResponse, userResponse] = await Promise.all([manageBranches(), manageUsers()]);
        console.log("Branch Response:", branchResponse);
        console.log("User Response:", userResponse);
        if (branchResponse.success) {
          const branchData = Array.isArray(branchResponse.branches)
            ? branchResponse.branches.map((b: any) => ({
                id: b.id,
                name: b.name || "",
                hod: b.hod ? b.hod.username : null,
              }))
            : [];
          setBranches(branchData);
        } else {
          setError(branchResponse.message || "Failed to fetch branches");
          toast({ variant: "destructive", title: "Error", description: branchResponse.message || "Failed to fetch branches" });
        }
        if (userResponse.success) {
          setUsers(Array.isArray(userResponse.users) ? userResponse.users.filter((u) => u.role === "hod") : []);
        } else {
          setError(userResponse.message || "Failed to fetch users");
          toast({ variant: "destructive", title: "Error", description: userResponse.message || "Failed to fetch users" });
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Network error or invalid response");
        toast({ variant: "destructive", title: "Error", description: "Network error or invalid response" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setError, toast]);

  const filteredBranches = Array.isArray(branches)
    ? branches.filter((branch) => branch?.name?.toLowerCase().includes(filter.toLowerCase()))
    : [];
  const unassignedHods = users.filter((user) => !branches.some((b) => b.hod === user.username));
  const unassignedBranches = branches.filter((b) => !b.hod);

  const handleEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setEditData(branch);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editData) setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    if (editData) {
      setLoading(true);
      try {
        const response = await manageBranches(
          { name: editData.name, hod_id: editData.hod ? users.find((u) => u.username === editData.hod)?.id : null },
          editData.id,
          "PUT"
        );
        if (response.success) {
          setBranches(branches.map((b) => (b.id === editData.id ? editData : b)));
          setEditingId(null);
          setEditData(null);
          toast({ title: "Success", description: "Branch updated successfully" });
        } else {
          setError(response.message || "Failed to update branch");
          toast({ variant: "destructive", title: "Error", description: response.message || "Failed to update branch" });
        }
      } catch (err) {
        setError("Network error");
        toast({ variant: "destructive", title: "Error", description: "Network error" });
      } finally {
        setLoading(false);
      }
    }
  };

  const confirmDelete = (id: number) => setDeleteId(id);
  const deleteBranch = async () => {
    setLoading(true);
    try {
      const response = await manageBranches(undefined, deleteId, "DELETE");
      if (response.success) {
        setBranches(branches.filter((b) => b.id !== deleteId));
        setDeleteId(null);
        toast({ title: "Success", description: "Branch deleted successfully" });
      } else {
        setError(response.message || "Failed to delete branch");
        toast({ variant: "destructive", title: "Error", description: response.message || "Failed to delete branch" });
      }
    } catch (err) {
      setError("Network error");
      toast({ variant: "destructive", title: "Error", description: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async () => {
    if (!newBranch.name) {
      toast({ variant: "destructive", title: "Error", description: "Branch name is required" });
      return;
    }
    setLoading(true);
    try {
      const response = await manageBranches(
        { name: newBranch.name },
        undefined,
        "POST"
      );
      console.log("Add Branch Response:", response);
      if (response.success) {
        const updatedBranchResponse = await manageBranches();
        if (updatedBranchResponse.success) {
          const branchData = Array.isArray(updatedBranchResponse.branches)
            ? updatedBranchResponse.branches.map((b: any) => ({
                id: b.id,
                name: b.name || "",
                hod: b.hod ? b.hod.username : null,
              }))
            : [];
          setBranches(branchData);
        }
        setIsAddDialogOpen(false);
        setNewBranch({ name: "" });
        toast({ title: "Success", description: "Branch added successfully" });
      } else {
        setError(response.message || "Failed to add branch");
        toast({ variant: "destructive", title: "Error", description: response.message || "Failed to add branch" });
      }
    } catch (err) {
      console.error("Add Branch Error:", err);
      setError("Network error");
      toast({ variant: "destructive", title: "Error", description: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignHod = async () => {
    if (!selectedBranchId) {
      toast({ variant: "destructive", title: "Error", description: "Branch selection is required" });
      return;
    }
    if (!newHodId) {
      toast({ variant: "destructive", title: "Error", description: "HOD selection is required" });
      return;
    }
    console.log("Assigning hod_id:", newHodId);
    setLoading(true);
    try {
      const response = await manageBranches(
        { hod_id: newHodId },
        selectedBranchId,
        "PUT"
      );
      if (response.success) {
        setBranches(branches.map((b) => (b.id === selectedBranchId ? { ...b, hod: users.find((u) => u.id === Number(newHodId))?.username } : b)));
        setIsAssignDialogOpen(false);
        setNewHodId("");
        setSelectedBranchId(null);
        toast({ title: "Success", description: "HOD assigned successfully" });
      } else {
        setError(response.message || "Failed to assign HOD");
        toast({ variant: "destructive", title: "Error", description: response.message || "Failed to assign HOD" });
      }
    } catch (err) {
      console.error("Assign HOD Error:", err);
      setError("Network error");
      toast({ variant: "destructive", title: "Error", description: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Branch Management", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["ID", "Branch", "Assigned HOD"]],
      body: filteredBranches.map((branch) => [
        branch.id || "",
        branch.name || "--",
        branch.hod || "--",
      ]),
    });
    doc.save("Branch_list.pdf");
  };

  if (loading && branches.length === 0) return <div className="text-center py-6">Loading...</div>;

  return (
    <div className="p-6 bg-black-50 min-h-screen text-gray-700">
      <Card className="bg-text-gray-800 border border-gray-700 shadow-sm">
        <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-gray-200">Branch Management</CardTitle>
            <p className="text-sm text-gray-400">Manage branches and assign department heads</p>
          </div>
          <div className="flex gap-2 ">
            <Button size="sm" className="flex items-center gap-1 bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 shadow-sm" onClick={() => setIsAddDialogOpen(true)} disabled={loading}>
              <PlusIcon className="w-4 h-4" /> Add Branch
            </Button>
            <Button size="sm" className="flex items-center gap-1 bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 shadow-sm" onClick={() => setIsAssignDialogOpen(true)} disabled={loading}>
              <UserPlus2Icon className="w-4 h-4" /> Assign HOD
            </Button>
            <Button size="sm" className="flex items-center gap-1 bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 shadow-sm" onClick={exportToPDF} disabled={loading}>
              <FileDownIcon className="w-4 h-4" /> Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto ">
          <div className="pt-3 pb-2 ">
            <Input placeholder="Search by branch name..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-64" />
          </div>
            <table className="w-full text-sm text-left text-gray-200">
              <thead className="border-b border-gray-200 text-gray-400">
                <tr>
                <th className="py-2">ID</th>
                <th className="py-2">Branch</th>
                <th className="py-2">Assigned HOD</th>
                <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((branch) => (
                  <tr
                    key={branch.id}
                    className="border-b border-gray-100 transition-colors text-gray-200 duration-200 hover:bg-gray-800/60"
                  >
                    <td className="py-3">{branch.id}</td>
                    <td className="py-3 pr-2 text-gray-200">
                      {editingId === branch.id ? (
                        <Input
                          name="name"
                          value={editData?.name || ""}
                          onChange={handleEditChange}
                          className="bg-gray-800 text-white border border-gray-600"
                        />
                      ) : (
                        branch.name
                      )}
                    </td>
                    <td className="py-3 text-gray-200">
                      {editingId === branch.id ? (
                        <Input
                          name="hod"
                          value={editData?.hod || ""}
                          onChange={handleEditChange}
                          className="bg-gray-800 text-white border border-gray-600"
                        />
                      ) : (
                        branch.hod || "--"
                      )}
                    </td>
                    <td className="py-3 text-right space-x-2">
                      {editingId === branch.id ? (
                        <Button size="sm" onClick={saveEdit} disabled={loading}>
                          {loading ? "Saving..." : "Save"}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(branch)}
                          disabled={loading}
                        >
                          <PencilIcon className="w-4 h-4 text-blue-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(branch.id)}
                        disabled={loading}
                      >
                        <TrashIcon className="w-4 h-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </CardContent>
      </Card>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
          <p>Are you sure you want to delete this branch? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={loading}>Cancel</Button>
            <Button variant="destructive" onClick={deleteBranch} disabled={loading}>{loading ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add New Branch</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Branch Name" value={newBranch.name} onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleAddBranch} disabled={loading}>{loading ? "Adding..." : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Assign HOD to Branch</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <select value={selectedBranchId || ""} onChange={(e) => setSelectedBranchId(Number(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="" disabled>Select a branch</option>
              {unassignedBranches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            <select value={newHodId} onChange={(e) => setNewHodId(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="" disabled>Select HOD</option>
              {unassignedHods.map((user) => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleAssignHod} disabled={loading || !selectedBranchId || !newHodId}>{loading ? "Assigning..." : "Assign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchesManagement;