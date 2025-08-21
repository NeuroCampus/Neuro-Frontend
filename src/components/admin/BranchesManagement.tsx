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
  const normalize = (str: string) => str.toLowerCase().trim();


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
    ? branches
        .filter((branch) =>
          normalize(branch?.name || "").includes(normalize(filter))
        )
        .sort((a, b) => {
          const aName = normalize(a.name || "");
          const bName = normalize(b.name || "");
          const s = normalize(filter);

          // 1. Exact match first
          if (aName === s && bName !== s) return -1;
          if (bName === s && aName !== s) return 1;

          // 2. StartsWith gets higher priority
          const aStarts = aName.startsWith(s);
          const bStarts = bName.startsWith(s);
          if (aStarts && !bStarts) return -1;
          if (bStarts && !aStarts) return 1;

          // 3. Earlier occurrence of search string is better
          const aIndex = aName.indexOf(s);
          const bIndex = bName.indexOf(s);
          if (aIndex !== bIndex) return aIndex - bIndex;

          // 4. Shorter name is better
          return aName.length - bName.length;
        })
    : [];

  const unassignedHods = users.filter(
    (user) => !branches.some((b) => b.hod === user.username)
  );

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
    <div className="p-4 sm:p-6 bg-[#1c1c1e] min-h-screen text-gray-200">
      <Card className="bg-[#1c1c1e] border border-gray-700 shadow-sm">
        <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title + paragraph always full width */}
          <div className="w-full">
            <CardTitle className="block text-lg md:text-xl text-gray-200">
              Branch Management
            </CardTitle>
            <p className="block text-sm md:text-base text-gray-400">
              Manage branches and assign department heads
            </p>
          </div>

          {/* Buttons: stacked on mobile & tablet, inline on lg+ */}
          <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto">
            <Button
              size="sm"
              className="flex items-center justify-center gap-1 text-gray-200 bg-gray-800 hover:bg-gray-600 border border-gray-600 shadow-sm w-full lg:w-auto"
              onClick={() => setIsAddDialogOpen(true)}
              disabled={loading}
            >
              <PlusIcon className="w-4 h-4" /> Add Branch
            </Button>

            <Button
              size="sm"
              className="flex items-center justify-center gap-1 text-gray-200 bg-gray-800 hover:bg-gray-600 border border-gray-600 shadow-sm w-full lg:w-auto"
              onClick={() => setIsAssignDialogOpen(true)}
              disabled={loading}
            >
              <UserPlus2Icon className="w-4 h-4" /> Assign HOD
            </Button>

            <Button
              size="sm"
              className="flex items-center justify-center gap-1 text-gray-200 bg-gray-800 hover:bg-gray-600 border border-gray-600 shadow-sm w-full lg:w-auto"
              onClick={exportToPDF}
              disabled={loading}
            >
              <FileDownIcon className="w-4 h-4" /> Export PDF
            </Button>
          </div>

        </CardHeader>
        <CardContent className="overflow-x-auto md:overflow-x-visible">
          <div className="pt-3 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Input
              placeholder="Search by branch name..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-64 bg-[#232326] text-gray-200"
            />
          </div>
            <table className="w-full text-sm md:text-base text-left text-gray-200">
              <thead className="border-b border-gray-200 bg-[#232326] text-gray-200">
                <tr>
                <th className="py-2">ID</th>
                <th className="py-2">Branch</th>
                <th className="py-2">Assigned HOD</th>
                <th className="py-2 text-right px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((branch) => (
                  <tr
                    key={branch.id}
                    className="border-b border-gray-100 transition-colors text-gray-200 duration-200 hover:bg-gray-800/60"
                  >
                    {/* ID column */}
                    <td className="py-3">{branch.id}</td>

                    {/* Branch Name column */}
                    <td className="py-3 pr-2 text-gray-200">
                      {editingId === branch.id ? (
                        <select
                          name="name"
                          value={editData?.name || ""}
                          onChange={handleEditChange}
                          className="bg-[#232326] text-gray-200 px-2 py-1 rounded"
                        >
                          {branches.map((b) => (
                            <option  className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500" key={b.id} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        branch.name
                      )}
                    </td>

                    {/* HOD column */}
                    <td className="py-3 text-gray-200">
                      {editingId === branch.id ? (
                        <select
                          name="hod"
                          value={editData?.hod || ""}
                          onChange={handleEditChange}
                          className="bg-[#232326] text-gray-200 border-gray-200 px-2 py-1 rounded"
                        >
                          <option value="">-- Select HOD --</option>
                          {users.map((u) => (
                            <option  className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500" key={u.id} value={u.username}>
                              {u.username}
                            </option>
                          ))}
                        </select>
                      ) : (
                        branch.hod || "--"
                      )}
                    </td>

                    {/* Actions column */}
                    <td className="py-3 text-right space-x-2">
                      {editingId === branch.id ? (
                        <>
                          <Button
                            size="sm"
                            className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                            onClick={saveEdit}
                            disabled={loading}
                          >
                            {loading ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(null);
                              setEditData(null);
                            }}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                        </>
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
        <DialogContent className="sm:max-w-md bg-[#1c1c1e] text-gray-200">
          <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
          <p>Are you sure you want to delete this branch? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500" onClick={() => setDeleteId(null)} disabled={loading}>Cancel</Button>
            <Button variant="destructive" onClick={deleteBranch} disabled={loading}>{loading ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#1c1c1e] text-gray-200">
          <DialogHeader><DialogTitle>Add New Branch</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input className="bg-[#232326] text-gray-200" placeholder="Branch Name" value={newBranch.name} onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} />
          </div>
          <DialogFooter>
            <Button className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={loading}>Cancel</Button>
            <Button className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500" onClick={handleAddBranch} disabled={loading}>{loading ? "Adding..." : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#1c1c1e] text-gray-200">
          <DialogHeader>
            <DialogTitle>Assign HOD to Branch</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Branch Dropdown */}
            <select
              value={selectedBranchId || ""}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-[#232326] text-gray-200"
            >
              <option className="bg-[#232326] text-gray-200" value="" disabled>
                Select a branch
              </option>
              {branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                  className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                >
                  {branch.name}
                </option>
              ))}
            </select>

            {/* HOD Dropdown */}
            <select
              value={newHodId}
              onChange={(e) => setNewHodId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-[#232326] text-gray-200"
            >
              <option className="bg-[#232326] text-gray-200" value="" disabled>
                Select HOD
              </option>
              {users.map((user) => (
                <option
                  key={user.id}
                  value={user.id}
                  className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                >
                  {user.username}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
              onClick={() => setIsAssignDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignHod}
              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
              disabled={loading || !selectedBranchId || !newHodId}
            >
              {loading ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchesManagement;