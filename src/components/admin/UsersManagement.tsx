
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { manageUsers } from "../../utils/admin_api";
import { useToast } from "../../hooks/use-toast";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  username?: string; // Added to store original username
}

interface UsersManagementProps {
  setError: (error: string | null) => void;
  toast: (options: any) => void;
}

const getStatusBadge = (status: string) => {
  const baseClass = "px-3 py-1 rounded-full text-xs font-medium";
  if (status === "Active")
    return <span className={`${baseClass} bg-green-100 text-green-700`}>Active</span>;
  if (status === "Inactive")
    return <span className={`${baseClass} bg-red-500 text-white`}>Inactive</span>;
};

const getRoleBadge = (role: string) => {
  return (
    <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800 text-xs font-medium">
      {role}
    </span>
  );
};

const roles = ["All", "Student", "Head of Department", "Teacher", "Admin"];
const statuses = ["All", "Active", "Inactive"];

const roleMap = {
  "Student": "student",
  "Head of Department": "hod",
  "Teacher": "teacher",
  "Admin": "admin",
};

const UsersManagement = ({ setError, toast }: UsersManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const normalize = (str: string) => str.toLowerCase().trim();


  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await manageUsers();
        if (response.success && response.users) {
          const userData = Array.isArray(response.users)
            ? response.users.map((user: any) => ({
                id: user.id,
                name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "N/A",
                email: user.email || "N/A",
                role: user.role || "N/A",
                status: user.is_active ? "Active" : "Inactive",
                username: user.username || "", // Store original username
              }))
            : [];
          setUsers(userData);
        } else {
          setError(response.message || "Failed to fetch users");
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Failed to fetch users",
          });
        }
      } catch (err) {
        console.error("Fetch Users Error:", err);
        setError("Network error");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Network error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [setError, toast]);

const filteredUsers = Array.isArray(users)
  ? users
      .filter((user) => {
        const filterRole =
          roleFilter === "All" ? user.role : roleMap[roleFilter];
        const roleMatch =
          roleFilter === "All" ||
          user.role.toLowerCase() === filterRole.toLowerCase();
        const statusMatch =
          statusFilter === "All" || user.status === statusFilter;
        const searchMatch =
          (user.name &&
            normalize(user.name).includes(normalize(searchQuery))) ||
          (user.email &&
            normalize(user.email).includes(normalize(searchQuery)));

        return roleMatch && statusMatch && searchMatch;
      })
      .sort((a, b) => {
        const s = normalize(searchQuery);
        const aName = normalize(a.name || "");
        const bName = normalize(b.name || "");

        // 1. Exact match
        if (aName === s && bName !== s) return -1;
        if (bName === s && aName !== s) return 1;

        // 2. StartsWith
        const aStarts = aName.startsWith(s);
        const bStarts = bName.startsWith(s);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;

        // 3. Earlier index of match
        const aIndex = aName.indexOf(s);
        const bIndex = bName.indexOf(s);
        if (aIndex !== bIndex) return aIndex - bIndex;

        // 4. Shorter name is better
        return aName.length - bName.length;
      })
  : [];

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditData({ ...user }); // Include original username in editData
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editData) {
      setEditData({ ...editData, [e.target.name]: e.target.value });
    }
  };

  const saveEdit = async () => {
    if (editData) {
      setLoading(true);
      setError(null);
      try {
        const [firstName, ...lastNameParts] = editData.name.split(" ");
        const lastName = lastNameParts.join(" ");
        const originalUser = users.find((u) => u.id === editData.id);
        const username = originalUser?.username || editData.email.split("@")[0]; // Preserve original username
        const updates = {
          username,
          email: editData.email,
          first_name: firstName || "",
          last_name: lastName || "",
        };
        const response = await manageUsers({ user_id: editData.id, action: "edit", updates }, "POST");
        if (response.success) {
          setUsers(
            users.map((u) =>
              u.id === editData.id ? { ...u, ...updates, name: editData.name } : u
            )
          );
          setEditingId(null);
          setEditData(null);
          toast({ title: "Success", description: "User updated successfully" });
        } else {
          setError(response.message || "Failed to update user");
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Failed to update user",
          });
        }
      } catch (err) {
        console.error("Save Edit Error:", err);
        setError("Network error");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Network error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
  };

  const deleteUser = async () => {
    if (deleteId !== null) {
      setLoading(true);
      setError(null);
      try {
        const response = await manageUsers({ user_id: deleteId, action: "delete" }, "POST");
        if (response.success) {
          setUsers(users.filter((user) => user.id !== deleteId));
          setDeleteId(null);
          toast({ title: "Success", description: "User deleted successfully" });
        } else {
          setError(response.message || "Failed to delete user");
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Failed to delete user",
          });
        }
      } catch (err) {
        console.error("Delete User Error:", err);
        setError("Network error");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Network error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const SelectMenu = ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
  }) => (
    <div className="flex flex-col">
      <label className="text-sm text-gray-300 mb-1">{label}</label>
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger className="inline-flex items-center justify-between px-3 py-2 rounded w-48 text-sm shadow-sm rounded bg-[#232326] border text-gray-200 outline-none focus:ring-2 focus:ring-white">
          <Select.Value />
          <Select.Icon>
            <ChevronDownIcon className="text-gray-400" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="bg-[#232326] text-gray-200 rounded shadow-lg z-50 border border-gray-700">
            <Select.Viewport>
              {options.map((opt) => (
                <Select.Item
                  key={opt}
                  value={opt}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-800 text-sm text-gray-200 flex items-center"
                >
                  <Select.ItemText>{opt}</Select.ItemText>
                  <Select.ItemIndicator className="ml-2">
                    <CheckIcon className="text-blue-400" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );

  if (loading && users.length === 0) {
    return <div className="text-center py-6">Loading...</div>;
  }

  return (
    <div className="p-6 bg-black-50 min-h-screen">
      <Card className="bg-black-50 border border-gray-500 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-200">User Management</CardTitle>
          <p className="text-sm text-gray-400">Manage all users in the system</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-col lg:flex-row md:items-start lg:items-end md:justify-start lg:justify-between gap-4 mb-6">
            {/* Filters */}
            <div className="flex flex-col md:w-full lg:flex-row lg:gap-4">
              <div className="w-full md:w-full lg:w-auto">
                <span className="block text-sm text-gray-200 mb-1">Filter by Role</span>
                <SelectMenu
                  label=""
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={roles}
                />
              </div>
              <div className="w-full md:w-full lg:w-auto">
                <span className="block text-sm text-gray-200 mb-1">Filter by Status</span>
                <SelectMenu
                  label=""
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statuses}
                />
              </div>
            </div>

            {/* Search */}
            <div className="w-full md:w-full lg:w-auto flex flex-col">
              <label className="text-sm text-gray-200 mb-1">Search</label>
              <Input
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-full lg:w-64 rounded bg-[#232326] border text-gray-200 outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="border-b border-gray-500 text-gray-200">
                <tr>
                  <th className="py-2">Full Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-500 transition-colors duration-200 hover:bg-gray-800"
                    >
                      <td className="py-3 px-2 w-[150px]">
                        {editingId === user.id ? (
                          <Input
                            name="name"
                            value={editData?.name || ""}
                            onChange={handleEditChange}
                            className="bg-[#232326] text-gray-200 w-full"
                          />
                        ) : (
                          user.name
                        )}
                      </td>
                      <td className="py-3 px-2 w-[200px]">
                        {editingId === user.id ? (
                          <Input
                            name="email"
                            value={editData?.email || ""}
                            onChange={handleEditChange}
                            className="bg-[#232326] text-gray-200 w-full"
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="py-3 w-[120px]">{getRoleBadge(user.role)}</td>
                      <td className="py-3 w-[120px]">{getStatusBadge(user.status)}</td>
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap sm:flex-nowrap justify-end gap-2">
                          {editingId === user.id ? (
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              disabled={loading}
                              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 w-full sm:w-auto"
                            >
                              {loading ? "Saving..." : "Save"}
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(user)}
                                disabled={loading}
                                className="p-2 rounded hover:bg-gray-700"
                              >
                                <Pencil1Icon className="w-5 h-5 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete(user.id)}
                                disabled={loading}
                                className="p-2 rounded hover:bg-gray-700"
                              >
                                <TrashIcon className="w-5 h-5 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md bg-[#18181b] border border-gray-700 text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300">
            Are you sure you want to delete this user? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={loading}
              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteUser}
              disabled={loading}
              className="bg-red-700 hover:bg-red-800 text-white"
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;