
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { enrollUser } from "../../utils/admin_api";
import { useToast } from "../../hooks/use-toast";

interface EnrollUserProps {
  setError: (error: string | null) => void;
  toast: (options: any) => void;
}

const EnrollUser = ({ setError, toast }: EnrollUserProps) => {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async () => {
    if (
      !formData.email ||
      !formData.first_name ||
      !formData.last_name ||
      !formData.role
    ) {
      setError("All fields are required");
      toast({
        variant: "destructive",
        title: "Error",
        description: "All fields are required",
      });
      return;
    }

    setLoading(true);
    setError(null);

    // Prepare payload with username derived from first_name and include first_name, last_name
    const payload = {
      email: formData.email,
      username: formData.first_name,
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
    };

    try {
      const response = await enrollUser(payload);
      if (response.success) {
        toast({ title: "Success", description: "User enrolled successfully" });
        setFormData({
          email: "",
          first_name: "",
          last_name: "",
          role: "",
        });
      } else {
        setError(response.message || "Failed to enroll user");
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to enroll user",
        });
      }
    } catch (err) {
      setError("Network error while enrolling user");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while enrolling user",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black-50 px-4 py-10">
      <div className="max-w-2xl mx-auto ">
        <Card className="w-full bg-text-gray-800 border border-gray-700 shadow-lg rounded-lg p-6">
          <CardHeader className="pb-4 ">
            <CardTitle className="text-lg text-gray-100">User Enrollment Form</CardTitle>
            <CardDescription className="text-sm text-gray-400">
              Add a new user to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-gray-400">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  className="mt-1 bg-[#232326] text-gray-200"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label htmlFor="first_name" className="text-sm font-medium text-gray-400">
                    First Name
                  </label>
                  <Input
                    id="first_name"
                    name="first_name"
                    placeholder="HOD/Faculty name"
                    className="mt-1 bg-[#232326] text-gray-200"
                    value={formData.first_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="w-1/2">
                  <label htmlFor="last_name" className="text-sm font-medium text-gray-400">
                    Last Name
                  </label>
                  <Input
                    id="last_name"
                    name="last_name"
                    placeholder="initials"
                    className="mt-1 bg-[#232326] text-gray-200"
                    value={formData.last_name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="role" className="text-sm font-medium text-gray-400">
                  Role
                </label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="w-full mt-1 bg-[#232326] text-gray-200 border-gray-300">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#232326] text-gray-200">
                    <SelectItem value="hod">HOD</SelectItem>
                    <SelectItem value="teacher">Faculty/Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Enrolling..." : "Enroll User"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnrollUser;
