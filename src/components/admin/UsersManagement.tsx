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
import { manageUsers, manageUserAction } from "../../utils/admin_api";
import { useToast } from "../../hooks/use-toast";
import { useTheme } from "../../context/ThemeContext";

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

const getStatusBadge = (status: string, theme: string) => {
  const baseClass = "px-3 py-1 rounded-full text-xs font-medium";
  if (status === "Active")
    return <span className={`${baseClass} ${theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>Active</span>;
  if (status === "Inactive")
    return <span className={`${baseClass} ${theme === 'dark' ? 'bg-red-900 text-red-300' : 'bg-red-500 text-white'}`}>Inactive</span>;
};

const getRoleBadge = (role: string, theme: string) => {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(10); // Fixed page size for consistency
  const normalize = (str: string) => str.toLowerCase().trim();
  const { theme } = useTheme();

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, statusFilter, searchQuery]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        // Prepare filter parameters
        const filterParams: any = {
          page: currentPage,
          page_size: pageSize,
        };
        
        // Add role filter if not "All"
        if (roleFilter !== "All") {
          filterParams.role = roleMap[roleFilter];
        }
        
        // Add status filter if not "All"
        if (statusFilter !== "All") {
          filterParams.is_active = statusFilter === "Active";
        }

        // Add search filter if not empty
        if (searchQuery.trim()) {
          filterParams.search = searchQuery.trim();
        }

        const response = await manageUsers(filterParams);
        
        // Handle invalid page due to filter changes
        if (!response.success && response.message && response.message.includes("Invalid page")) {
          setCurrentPage(1);
          return;
        }
        
        // Check if the response has the expected structure
        const hasResults = response && typeof response === 'object' && 'results' in response;
        const dataSource = hasResults ? (response as any).results : (response as any);
        
        if (dataSource && dataSource.success) {
          // Handle paginated response format where data is nested under results
          const usersData = dataSource.users || [];
          const paginationData = hasResults ? (response as any) : dataSource;
          
          // Transform backend user data to frontend format
          const transformedUsers = Array.isArray(usersData) ? usersData.map((user: any) => ({
            id: user.id,
            name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "N/A",
            email: user.email || "N/A",
            role: user.role || "N/A",
            status: user.is_active ? "Active" : "Inactive",
            username: user.username || "",
          })) : [];
          
          setUsers(transformedUsers);
          setTotalUsers(paginationData.count || 0);
          const calculatedTotalPages = Math.ceil((paginationData.count || 0) / pageSize);
          setTotalPages(calculatedTotalPages);
          
          // Reset to page 1 if current page exceeds total pages
          if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
            setCurrentPage(1);
          }
        } else {
          setError(dataSource?.message || "Failed to fetch users");
          toast({
            variant: "destructive",
            title: "Error",
            description: dataSource?.message || "Failed to fetch users",
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
  }, [setError, toast, currentPage, roleFilter, statusFilter, searchQuery, pageSize]);

const filteredUsers = Array.isArray(users) ? users : [];

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
        const response = await manageUserAction({
          user_id: editData.id.toString(),
          action: "edit",
          updates
        });
        if (response.success) {
          // Refresh the current page data
          const refreshResponse = await manageUsers({
            page: currentPage,
            page_size: pageSize,
            role: roleFilter !== "All" ? roleMap[roleFilter] : undefined,
            is_active: statusFilter !== "All" ? statusFilter === "Active" : undefined,
            search: searchQuery.trim() || undefined,
          });
          const hasRefreshResults = refreshResponse && typeof refreshResponse === 'object' && 'results' in refreshResponse;
          const refreshDataSource = hasRefreshResults ? (refreshResponse as any).results : (refreshResponse as any);
          
          if (refreshDataSource && refreshDataSource.success) {
            // Handle paginated response format
            const usersArray = refreshDataSource.users || [];
            const paginationInfo = hasRefreshResults ? (refreshResponse as any) : refreshDataSource;
            
            const refreshedUserData = Array.isArray(usersArray)
              ? usersArray.map((user: any) => ({
                  id: user.id,
                  name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "N/A",
                  email: user.email || "N/A",
                  role: user.role || "N/A",
                  status: user.is_active ? "Active" : "Inactive",
                  username: user.username || "",
                }))
              : [];
            setUsers(refreshedUserData);
            setTotalUsers(paginationInfo.count || refreshedUserData.length);
            setTotalPages(Math.ceil((paginationInfo.count || refreshedUserData.length) / pageSize));
          }
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
        const response = await manageUserAction({
          user_id: deleteId.toString(),
          action: "delete"
        });
        if (response.success) {
          // Refresh the current page data
          const refreshResponse = await manageUsers({
            page: currentPage,
            page_size: pageSize,
            role: roleFilter !== "All" ? roleMap[roleFilter] : undefined,
            is_active: statusFilter !== "All" ? statusFilter === "Active" : undefined,
            search: searchQuery.trim() || undefined,
          });
          const hasRefreshResults = refreshResponse && typeof refreshResponse === 'object' && 'results' in refreshResponse;
          const refreshDataSource = hasRefreshResults ? (refreshResponse as any).results : (refreshResponse as any);
          
          if (refreshDataSource && refreshDataSource.success) {
            // Handle paginated response format
            const usersArray = refreshDataSource.users || [];
            const paginationInfo = hasRefreshResults ? (refreshResponse as any) : refreshDataSource;
            
            const refreshedUserData = Array.isArray(usersArray)
              ? usersArray.map((user: any) => ({
                  id: user.id,
                  name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "N/A",
                  email: user.email || "N/A",
                  role: user.role || "N/A",
                  status: user.is_active ? "Active" : "Inactive",
                  username: user.username || "",
                }))
              : [];
            setUsers(refreshedUserData);
            setTotalUsers(paginationInfo.count || refreshedUserData.length);
            setTotalPages(Math.ceil((paginationInfo.count || refreshedUserData.length) / pageSize));
            
            // If we deleted the last item on the page and it's not the first page, go to previous page
            if (refreshedUserData.length === 0 && currentPage > 1) {
              setCurrentPage(currentPage - 1);
            }
          }
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
      <label className={`text-sm mb-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>{label}</label>
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger className={`inline-flex items-center justify-between px-3 py-2 rounded w-48 text-sm shadow-sm outline-none focus:ring-2 ${
          theme === 'dark' 
            ? 'bg-card border border-border text-foreground focus:ring-primary' 
            : 'bg-white border border-gray-300 text-gray-900 focus:ring-blue-500'
        }`}>
          <Select.Value />
          <Select.Icon>
            <ChevronDownIcon className={theme === 'dark' ? 'text-foreground' : 'text-gray-500'} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className={`rounded shadow-lg z-50 ${
            theme === 'dark' 
              ? 'bg-card border border-border text-foreground' 
              : 'bg-white border border-gray-300 text-gray-900'
          }`}>
            <Select.Viewport>
              {options.map((opt) => (
                <Select.Item
                  key={opt}
                  value={opt}
                  className={`px-3 py-2 cursor-pointer text-sm flex items-center ${
                    theme === 'dark' 
                      ? 'hover:bg-accent text-foreground' 
                      : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <Select.ItemText>{opt}</Select.ItemText>
                  <Select.ItemIndicator className="ml-2">
                    <CheckIcon className={theme === 'dark' ? 'text-primary' : 'text-blue-500'} />
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
    return <div className={`text-center py-6 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Loading...</div>;
  }

  return (
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}>
      <Card className={theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}>
        <CardHeader>
          <CardTitle className={`text-lg ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>User Management</CardTitle>
          <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Manage all users in the system</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-col lg:flex-row md:items-start lg:items-end md:justify-start lg:justify-between gap-4 mb-6">
            {/* Filters */}
            <div className="flex flex-col md:w-full lg:flex-row lg:gap-4">
              <div className="w-full md:w-full lg:w-auto">
                <span className={`block text-sm mb-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Filter by Role</span>
                <SelectMenu
                  label=""
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={roles}
                />
              </div>
              <div className="w-full md:w-full lg:w-auto">
                <span className={`block text-sm mb-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Filter by Status</span>
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
              <label className={`text-sm mb-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Search</label>
              <Input
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={theme === 'dark' 
                  ? 'w-full md:w-full lg:w-64 rounded bg-card border border-border text-foreground' 
                  : 'w-full md:w-full lg:w-64 rounded bg-white border border-gray-300 text-gray-900'}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`border-b ${theme === 'dark' ? 'border-border text-foreground' : 'border-gray-200 text-gray-900'}`}>
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
                      className={`border-b transition-colors duration-200 ${
                        theme === 'dark' 
                          ? 'border-border hover:bg-accent' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-2 w-[150px]">
                        {editingId === user.id ? (
                          <Input
                            name="name"
                            value={editData?.name || ""}
                            onChange={handleEditChange}
                            className={theme === 'dark' 
                              ? 'bg-card text-foreground w-full' 
                              : 'bg-white text-gray-900 w-full'}
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
                            className={theme === 'dark' 
                              ? 'bg-card text-foreground w-full' 
                              : 'bg-white text-gray-900 w-full'}
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="py-3 w-[120px]">{getRoleBadge(user.role, theme)}</td>
                      <td className="py-3 w-[120px]">{getStatusBadge(user.status, theme)}</td>
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap sm:flex-nowrap justify-end gap-2">
                          {editingId === user.id ? (
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              disabled={loading}
                              className={theme === 'dark' 
                                ? 'text-foreground bg-card border border-border w-full sm:w-auto hover:bg-accent' 
                                : 'text-gray-700 bg-white border border-gray-300 w-full sm:w-auto hover:bg-gray-50'}
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
                                className={theme === 'dark' 
                                  ? 'p-2 rounded hover:bg-accent' 
                                  : 'p-2 rounded hover:bg-gray-100'}
                              >
                                <Pencil1Icon className={theme === 'dark' ? 'w-5 h-5 text-primary' : 'w-5 h-5 text-blue-500'} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete(user.id)}
                                disabled={loading}
                                className={theme === 'dark' 
                                  ? 'p-2 rounded hover:bg-accent' 
                                  : 'p-2 rounded hover:bg-gray-100'}
                              >
                                <TrashIcon className={theme === 'dark' ? 'w-5 h-5 text-destructive' : 'w-5 h-5 text-red-500'} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className={`py-4 text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className={theme === 'dark' 
                    ? 'text-foreground bg-card border border-border hover:bg-accent' 
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}
                >
                  Previous
                </Button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={currentPage === pageNum 
                        ? (theme === 'dark' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-blue-600 text-white')
                        : (theme === 'dark' 
                            ? 'text-foreground bg-card border border-border hover:bg-accent' 
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50')
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className={theme === 'dark' 
                    ? 'text-foreground bg-card border border-border hover:bg-accent' 
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className={theme === 'dark' ? 'bg-card border border-border text-foreground' : 'bg-white border border-gray-200 text-gray-900'}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>
            Are you sure you want to delete this user? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={loading}
              className={theme === 'dark' 
                ? 'text-foreground bg-card border border-border hover:bg-accent' 
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteUser}
              disabled={loading}
              className={theme === 'dark' 
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                : 'bg-red-600 hover:bg-red-700 text-white'}
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