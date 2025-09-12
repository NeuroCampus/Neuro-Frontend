import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { getFullStudentProfile } from "@/utils/student_api";

const StudentProfile = () => {
  const [form, setForm] = useState({
    first_name: "John",
    last_name: "Smith",
    email: "john.smith@example.edu",
    phone: "+1 (555) 123-4567",
    department: "Computer Science",
    dob: "1998-12-05",
    year_of_study: "2nd Year",
    address: "123 Campus Street, College Town, CT 56789",
    about:
      "Computer Science student with interests in AI and machine learning. Active member of the coding club and robotics team.",
    cgpa: "8.75",
    semester: "4th Semester",
    enrollment_year: "2023",
    graduation_year: "2027",
    advisor: "Dr. Robert Williams",
    status: "Active",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getFullStudentProfile();
      if (data.success && data.profile) {
        setForm((prev) => ({ ...prev, ...data.profile }));
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  return (
    <div className="p-6 space-y-6 bg-[#1c1c1e] text-gray-200">
      <h2 className="text-lg font-semibold">Profile</h2>

      <Tabs defaultValue="profile" className="space-y-6">
        {/* Personal Info Card */}
        <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-300">
          <div className="p-6 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/4 flex flex-col items-center text-center">
              <img
                src="/default-avatar.png"
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
              <p className="font-medium">{form.first_name} {form.last_name}</p>
              <p className="text-sm text-gray-300">21CS234</p>
            </div>
            <div className="w-full md:w-3/4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    name="first_name"
                    className="bg-[#232326] text-gray-200"
                    value={form.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    name="email"
                    className="bg-[#232326] text-gray-200"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    name="phone"
                    className="bg-[#232326] text-gray-200"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input
                    name="department"
                    className="bg-[#232326] text-gray-200"
                    value={form.department}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Year of Study</Label>
                  <Input
                    name="year_of_study"
                    className="bg-[#232326] text-gray-200"
                    value={form.year_of_study}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    name="dob"
                    className="bg-[#232326] text-gray-200"
                    value={form.dob}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <Input
                  name="address"
                  className="bg-[#232326] text-gray-200"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>About</Label>
                <Textarea
                  name="about"
                  className="bg-[#232326] text-gray-200"
                  value={form.about}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Academic Info Card */}
        <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-300">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Current CGPA</Label>
              <Input
                value={form.cgpa}
                className="bg-[#232326] text-gray-200"
                onChange={handleChange}
                name="cgpa"
              />
            </div>
            <div>
              <Label>Current Semester</Label>
              <Input
                value={form.semester}
                className="bg-[#232326] text-gray-200"
                onChange={handleChange}
                name="semester"
              />
            </div>
            <div>
              <Label>Enrollment Year</Label>
              <Input
                value={form.enrollment_year}
                className="bg-[#232326] text-gray-200"
                onChange={handleChange}
                name="enrollment_year"
              />
            </div>
            <div>
              <Label>Expected Graduation</Label>
              <Input
                value={form.graduation_year}
                className="bg-[#232326] text-gray-200"
                onChange={handleChange}
                name="graduation_year"
              />
            </div>
            <div>
              <Label>Faculty Advisor</Label>
              <Input
                value={form.advisor}
                className="bg-[#232326] text-gray-200"
                onChange={handleChange}
                name="advisor"
              />
            </div>
            <div>
              <Label>Student Status</Label>
              <Input
                value={form.status}
                onChange={handleChange}
                name="status"
                className="bg-[#232326] text-green-600 font-semibold"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button className="mt-4 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500">Save Changes</Button>
        </div>
      </Tabs>
    </div>
  );
};

export default StudentProfile;
