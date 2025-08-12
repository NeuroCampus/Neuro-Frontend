import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { useToast } from "../ui/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "../ui/dialog";
import { getSemesters, manageSemesters, manageSections, manageProfile } from "../../utils/hod_api";

interface Semester {
  id: string;
  number: number;
}

interface Section {
  id: string;
  name: string;
  semester_id: string;
}

interface FormState {
  number: string;
}

interface SectionFormState {
  name: string;
}

const SemesterManagement = () => {
  const { toast } = useToast();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isDeleteSectionModalOpen, setIsDeleteSectionModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [deletingSemester, setDeletingSemester] = useState<Semester | null>(null);
  const [managingSemester, setManagingSemester] = useState<Semester | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);
  const [form, setForm] = useState<FormState>({ number: "" });
  const [sectionForm, setSectionForm] = useState<SectionFormState>({ name: "" });
  const [branchId, setBranchId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Derive NAME and YEAR from semester number
  const getSemesterName = (number: number) => {
    const suffixes = ["st", "nd", "rd", "th", "th", "th", "th", "th"];
    return `${number}${suffixes[number - 1]} Semester`;
  };

  const getYear = (number: number) => {
    if (number <= 2) return "Year 1";
    if (number <= 4) return "Year 2";
    if (number <= 6) return "Year 3";
    return "Year 4";
  };

  // Fetch branch_id, semesters, and sections
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch HOD profile to get branch_id
        const profileResponse = await manageProfile({}, "GET");
        if (!profileResponse.success || !profileResponse.data?.branch_id) {
          throw new Error(profileResponse.message || "Failed to fetch HOD profile or missing branch ID");
        }
        const branchId = profileResponse.data.branch_id;
        setBranchId(branchId);

        // Fetch semesters
        const semestersResponse = await getSemesters(branchId);
        if (semestersResponse.success && semestersResponse.data) {
          setSemesters(semestersResponse.data.map((s: any) => ({
            id: s.id.toString(),
            number: s.number,
          })));
        } else {
          throw new Error(semestersResponse.message || "Failed to fetch semesters");
        }

        // Fetch sections
        const sectionsResponse = await manageSections({ branch_id: branchId }, "GET");
        if (sectionsResponse.success && sectionsResponse.data) {
          setSections(sectionsResponse.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            semester_id: s.semester_id.toString(),
          })));
        } else {
          throw new Error(sectionsResponse.message || "Failed to fetch sections");
        }
      } catch (err: any) {
        const errorMessage = err.message || "Network error";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const openModal = (sem: Semester | null = null) => {
    if (sem) {
      setEditingSemester(sem);
      setForm({ number: sem.number.toString() });
    } else {
      setEditingSemester(null);
      setForm({ number: "" });
    }
    setIsModalOpen(true);
  };

  const openDeleteModal = (sem: Semester) => {
    setDeletingSemester(sem);
    setIsDeleteModalOpen(true);
  };

  const openSectionModal = (sem: Semester) => {
    setManagingSemester(sem);
    setSectionForm({ name: "" });
    setIsSectionModalOpen(true);
  };

  const openDeleteSectionModal = (section: Section) => {
    setDeletingSection(section);
    setIsDeleteSectionModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSemester(null);
    setForm({ number: "" });
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingSemester(null);
  };

  const closeSectionModal = () => {
    setIsSectionModalOpen(false);
    setManagingSemester(null);
    setSectionForm({ name: "" });
  };

  const closeDeleteSectionModal = () => {
    setIsDeleteSectionModalOpen(false);
    setDeletingSection(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSectionChange = (value: string) => {
    setSectionForm((prev) => ({ ...prev, name: value }));
  };

  const handleSave = async () => {
    if (!branchId) {
      toast({ variant: "destructive", title: "Error", description: "Branch ID is missing" });
      return;
    }
    if (!form.number || isNaN(Number(form.number)) || Number(form.number) < 1 || Number(form.number) > 8) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a valid semester number (1-8)" });
      return;
    }

    setLoading(true);
    try {
      const data: ManageSemestersRequest = {
        action: editingSemester ? "update" : "create",
        number: Number(form.number),
        branch_id: branchId,
      };
      if (editingSemester) {
        data.semester_id = editingSemester.id;
      }
      const response = await manageSemesters(data);
      if (response.success) {
        // Refresh semesters
        const semestersResponse = await getSemesters(branchId);
        if (semestersResponse.success && semestersResponse.data) {
          setSemesters(semestersResponse.data.map((s: any) => ({
            id: s.id.toString(),
            number: s.number,
          })));
        }
        toast({
          title: editingSemester ? "Updated" : "Created",
          description: `Semester ${editingSemester ? "updated" : "created"} successfully!`,
        });
        closeModal();
      } else {
        throw new Error(response.message || "Failed to save semester");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Network error";
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSemester || !branchId) return;
    setLoading(true);
    try {
      const data: ManageSemestersRequest = {
        action: "delete",
        semester_id: deletingSemester.id,
        branch_id: branchId,
      };
      const response = await manageSemesters(data);
      if (response.success) {
        // Refresh semesters and sections
        const semestersResponse = await getSemesters(branchId);
        if (semestersResponse.success && semestersResponse.data) {
          setSemesters(semestersResponse.data.map((s: any) => ({
            id: s.id.toString(),
            number: s.number,
          })));
        }
        const sectionsResponse = await manageSections({ branch_id: branchId }, "GET");
        if (sectionsResponse.success && sectionsResponse.data) {
          setSections(sectionsResponse.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            semester_id: s.semester_id.toString(),
          })));
        }
        toast({ title: "Deleted", description: "Semester deleted successfully!" });
        closeDeleteModal();
      } else {
        throw new Error(response.message || "Semester deletion is not supported by the server");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Network error";
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async () => {
    if (!managingSemester || !branchId) {
      toast({ variant: "destructive", title: "Error", description: "Semester or Branch ID is missing" });
      return;
    }
    if (!sectionForm.name || !["A", "B", "C", "D", "E", "F", "G"].includes(sectionForm.name)) {
      toast({ variant: "destructive", title: "Error", description: "Please select a valid section (A-G)" });
      return;
    }
    if (sections.some(s => s.semester_id === managingSemester.id && s.name === sectionForm.name)) {
      toast({ variant: "destructive", title: "Error", description: `Section ${sectionForm.name} already exists for Semester ${managingSemester.number}` });
      return;
    }

    setLoading(true);
    try {
      const data: ManageSectionsRequest = {
        action: "create",
        name: sectionForm.name,
        semester_id: managingSemester.id,
        branch_id: branchId,
      };
      const response = await manageSections(data, "POST");
      if (response.success && response.data) {
        // Refresh sections
        const sectionsResponse = await manageSections({ branch_id: branchId }, "GET");
        if (sectionsResponse.success && sectionsResponse.data) {
          setSections(sectionsResponse.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            semester_id: s.semester_id.toString(),
          })));
        }
        toast({
          title: "Added",
          description: `Section ${sectionForm.name} added successfully!`,
        });
        closeSectionModal();
      } else {
        throw new Error(response.message || "Failed to add section");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Network error";
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!deletingSection || !branchId) return;
    setLoading(true);
    try {
      const data: ManageSectionsRequest = {
        action: "delete",
        section_id: deletingSection.id,
        branch_id: branchId,
      };
      const response = await manageSections(data, "POST");
      if (response.success) {
        // Refresh sections
        const sectionsResponse = await manageSections({ branch_id: branchId }, "GET");
        if (sectionsResponse.success && sectionsResponse.data) {
          setSections(sectionsResponse.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            semester_id: s.semester_id.toString(),
          })));
        }
        toast({ title: "Deleted", description: `Section ${deletingSection.name} deleted successfully!` });
        closeDeleteSectionModal();
      } else {
        throw new Error(response.message || "Section deletion is not supported by the server");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Network error";
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const filteredSemesters = semesters.filter((sem) =>
    `Semester ${sem.number}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 ">
      <h1 className="text-xl font-semibold text-gray-200">Manage Semesters</h1>

      <Card className="bg-[#1c1c1e] text-gray-200">
        <CardHeader>
          <CardTitle>Semester List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 ">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search by semester number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm bg-[#232326] text-gray-200 border border-gray-700 placeholder-gray-400 focus:border-gray-500 focus:ring-0"
            />
            <Button
              onClick={() => openModal()}
              disabled={loading || !branchId}
              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
            >
              + Add Semester
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : filteredSemesters.length === 0 ? (
            <div className="text-center py-4">No semesters found.</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">SEMESTER ID</th>
                    <th className="text-left p-2">NAME</th>
                    <th className="text-left p-2">YEAR</th>
                    <th className="text-left p-2">SECTIONS</th>
                    <th className="text-left p-2">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSemesters.map((sem) => {
                    const semesterSections = sections.filter((s) => s.semester_id === sem.id);
                    return (
                      <tr key={sem.id} className="border-b">
                        <td className="p-2">{sem.id}</td>
                        <td className="p-2">{getSemesterName(sem.number)}</td>
                        <td className="p-2">{getYear(sem.number)}</td>
                        <td className="p-2">
                          {semesterSections.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {semesterSections.map((section) => (
                                <div key={section.id} className="flex items-center gap-1">
                                  <span>{section.name}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => openDeleteSectionModal(section)}
                                    disabled={loading}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            "None"
                          )}
                        </td>
                        <td className="p-2 flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openModal(sem)}
                            disabled={loading}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openSectionModal(sem)}
                            disabled={loading}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDeleteModal(sem)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Semester Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#1c1c1e] text-gray-200">
          <DialogHeader>
        <h2 className="text-lg font-semibold">
          {editingSemester ? "Edit Semester" : "Add Semester"}
        </h2>
          </DialogHeader>
          <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Semester Number</label>
          <Input
            type="number"
            name="number"
            value={form.number}
            onChange={handleChange}
            placeholder="Enter semester number (1-8)"
            min="1"
            max="8"
            disabled={loading}
            className="bg-[#232326] text-gray-200 border-gray-700"
          />
        </div>
          </div>
          <DialogFooter className="mt-4">
        <Button
          variant="outline"
          onClick={closeModal}
          disabled={loading}
          className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 bg-transparent"
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading} className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500">
          {editingSemester ? "Save Changes" : "Add Semester"}
        </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Section Modal */}
      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent className="bg-[#1c1c1e] dark:bg-[#1c1c1e] text-gray-200">
          <DialogHeader>
        <h2 className="text-lg font-semibold">
          Add Section for Semester {managingSemester?.number}
        </h2>
          </DialogHeader>
          <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Section Name</label>
          <Select
            value={sectionForm.name}
            onValueChange={handleSectionChange}
            disabled={loading}
          >
            <SelectTrigger className="bg-[#232326] dark:bg-[#232326] text-gray-200 border-gray-700">
          <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent className="bg-[#232326] dark:bg-[#232326] text-gray-200">
          {["A", "B", "C", "D", "E", "F", "G"].map((section) => (
            <SelectItem key={section} value={section}>
              Section {section}
            </SelectItem>
          ))}
            </SelectContent>
          </Select>
        </div>
          </div>
          <DialogFooter className="mt-4">
        <Button variant="outline" onClick={closeSectionModal} disabled={loading} className="text-gray-200 bg-transparent">
          Cancel
        </Button>
        <Button onClick={handleSaveSection} disabled={loading}>
          Add Section
        </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Semester Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-[#1c1c1e] text-gray-200">
          <DialogHeader>
        <h2 className="text-lg font-semibold">Delete Semester?</h2>
        <p className="text-sm text-gray-500">
          Are you sure you want to delete {getSemesterName(deletingSemester?.number || 0)}?
        </p>
          </DialogHeader>
          <DialogFooter className="mt-4">
        <Button variant="outline" onClick={closeDeleteModal} disabled={loading} className="text-gray-200 bg-transparent">
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
          Delete
        </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Confirmation Modal */}
      <Dialog open={isDeleteSectionModalOpen} onOpenChange={setIsDeleteSectionModalOpen}>
        <DialogContent className="bg-[#1c1c1e] text-gray-200">
          <DialogHeader>
        <h2 className="text-lg font-semibold">Delete Section?</h2>
        <p className="text-sm text-gray-500">
          Are you sure you want to delete Section {deletingSection?.name} from Semester {semesters.find(s => s.id === deletingSection?.semester_id)?.number}?
        </p>
          </DialogHeader>
          <DialogFooter className="mt-4">
        <Button variant="outline" onClick={closeDeleteSectionModal} disabled={loading} className="text-gray-200 bg-transparent">
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleDeleteSection} disabled={loading}>
          Delete
        </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SemesterManagement;
