import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon } from "@radix-ui/react-icons";
import { Building } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { fetchWithTokenRefresh } from "../../utils/authService";
import { API_ENDPOINT } from "../../utils/config";
import { useToast } from "../../hooks/use-toast";

interface Teacher {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  primary_branch: {
    id: number;
    name: string;
  } | null;
}

interface Branch {
  id: number;
  name: string;
}

interface TeacherBranchAssignmentProps {
  setError: (error: string | null) => void;
  toast: (options: any) => void;
}

const TeacherBranchAssignment = ({ setError, toast }: TeacherBranchAssignmentProps) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const { theme } = useToast();

  useEffect(() => {
    fetchTeacherAssignments();
  }, []);

  const fetchTeacherAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/admin/teacher-assignments/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.success) {
        setTeachers(result.teachers);
        setBranches(result.branches);
      } else {
        setError(result.message || "Failed to fetch teacher assignments");
      }
    } catch (error) {
      console.error("Error fetching teacher assignments:", error);
      setError("Failed to fetch teacher assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPrimaryBranch = async () => {
    if (!selectedTeacher || !selectedBranch) return;

    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/admin/assign-teacher-branch/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacher_id: selectedTeacher.id,
          branch_id: selectedBranch
        })
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        setShowBranchDialog(false);
        setSelectedBranch("");
        fetchTeacherAssignments();
      } else {
        setError(result.message || "Failed to assign branch");
      }
    } catch (error) {
      console.error("Error assigning branch:", error);
      setError("Failed to assign branch");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Teacher-Branch Assignments</h2>
        <Button
          onClick={() => setShowBranchDialog(true)}
          className="flex items-center gap-2"
        >
          <Building className="h-4 w-4" />
          Assign Primary Branch
        </Button>
      </div>

      <div className="grid gap-4">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  {teacher.first_name} {teacher.last_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{teacher.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">@{teacher.username}</p>
                <p className="text-sm font-medium mt-1">
                  Branch: {teacher.primary_branch ? teacher.primary_branch.name : "Not Assigned"}
                </p>
              </div>
              <Badge variant={teacher.primary_branch ? "default" : "secondary"}>
                {teacher.primary_branch ? teacher.primary_branch.name : "No Primary Branch"}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Primary Branch Assignment Dialog */}
      <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Primary Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Teacher</label>
              <Select.Root value={selectedTeacher?.id.toString() || ""} onValueChange={(value) => {
                const teacher = teachers.find(t => t.id.toString() === value);
                setSelectedTeacher(teacher || null);
              }}>
                <Select.Trigger className="w-full mt-1 flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <Select.Value placeholder="Choose a teacher" />
                  <Select.Icon>
                    <ChevronDownIcon />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                    <Select.Viewport className="p-1">
                      {teachers.map((teacher) => (
                        <Select.Item key={teacher.id} value={teacher.id.toString()} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-sm">
                          <Select.ItemText>
                            {teacher.first_name} {teacher.last_name} ({teacher.username})
                          </Select.ItemText>
                          <Select.ItemIndicator>
                            <CheckIcon />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div>
              <label className="text-sm font-medium">Select Branch</label>
              <Select.Root value={selectedBranch} onValueChange={setSelectedBranch}>
                <Select.Trigger className="w-full mt-1 flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <Select.Value placeholder="Choose a branch" />
                  <Select.Icon>
                    <ChevronDownIcon />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                    <Select.Viewport className="p-1">
                      {branches.map((branch) => (
                        <Select.Item key={branch.id} value={branch.id.toString()} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-sm">
                          <Select.ItemText>{branch.name}</Select.ItemText>
                          <Select.ItemIndicator>
                            <CheckIcon />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBranchDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignPrimaryBranch} disabled={!selectedTeacher || !selectedBranch}>
              Assign Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherBranchAssignment;