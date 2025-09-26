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
    user_id: "",
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    address: "",
    about: "",
    profile_picture: "",
    branch: "",
    department: "",
    semester: "",
    current_semester: "",
    year_of_study: "",
    section: "",
    usn: "",
    enrollment_year: "",
    expected_graduation: "",
    student_status: "",
    mode_of_admission: "",
    proctor: {
      id: "",
      username: "",
      first_name: "",
      last_name: "",
      email: ""
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getFullStudentProfile();
      if (data.success && data.profile) {
        setForm((prev) => {
          const newForm = { ...prev };
          Object.keys(data.profile).forEach(key => {
            if (typeof data.profile[key] === 'string' || data.profile[key] === null) {
              newForm[key] = data.profile[key] || "";
            } else {
              newForm[key] = data.profile[key];
            }
          });
          return newForm;
        });
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
                src={form.profile_picture || "/default-avatar.png"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
              <p className="font-medium">
                {form.first_name} {form.last_name ? form.last_name : ''}
              </p>
              <p className="text-sm text-gray-300">{form.username}</p>
            </div>
            <div className="w-full md:w-3/4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    name="first_name"
                    className="bg-[#232326] text-gray-200"
                    value={form.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    name="last_name"
                    className="bg-[#232326] text-gray-200"
                    value={form.last_name || ''}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>USN</Label>
                  <Input
                    name="usn"
                    className="bg-[#232326] text-gray-200"
                    value={form.usn}
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
                  <Label>Department/Branch</Label>
                  <Input
                    name="department"
                    className="bg-[#232326] text-gray-200"
                    value={form.branch}
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
                    name="date_of_birth"
                    className="bg-[#232326] text-gray-200"
                    value={form.date_of_birth}
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
              <Label>Current Semester</Label>
              <Input
                value={form.current_semester}
                className="bg-[#232326] text-gray-200"
                onChange={handleChange}
                name="current_semester"
              />
            </div>
            <div>
              <Label>Section</Label>
              <Input
                value={form.section}
                className="bg-[#232326] text-gray-200"
                onChange={handleChange}
                name="section"
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
                value={form.expected_graduation}
                className="bg-[#232326] text-gray-200"
                onChange={handleChange}
                name="expected_graduation"
              />
            </div>
            <div>
              <Label>Proctor</Label>
              <Input
                value={form.proctor?.first_name && form.proctor?.last_name ? 
                      `${form.proctor.first_name} ${form.proctor.last_name}` : 
                      form.proctor?.username || ''}
                className="bg-[#232326] text-gray-200"
                readOnly
              />
            </div>
            <div>
              <Label>Student Status</Label>
              <Input
                value={form.student_status}
                onChange={handleChange}
                name="student_status"
                className="bg-[#232326] text-green-600 font-semibold"
              />
            </div>
            <div>
              <Label>Mode of Admission</Label>
              <Input
                value={form.mode_of_admission}
                className="bg-[#232326] text-gray-200"
                onChange={handleChange}
                name="mode_of_admission"
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
