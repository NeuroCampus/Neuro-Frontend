import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { manageSubjects, getSemesters, manageProfile, getHODSubjectBootstrap } from "../../utils/hod_api";

interface Subject {
  id: string;
  name: string;
  subject_code: string;
  semester_id: string;
}

interface Semester {
  id: string;
  number: number;
}

interface ManageSubjectsRequest {
  action: "create" | "update" | "delete";
  branch_id: string;
  name?: string;
  subject_code?: string;
  semester_id?: string;
  subject_id?: string;
}

const SubjectManagement = () => {
  const [state, setState] = useState({
    subjects: [] as Subject[],
    semesters: [] as Semester[],
    deleteConfirmation: null as string | null,
    showModal: null as "add" | "edit" | null,
    currentSubject: null as Subject | null,
    newSubject: { code: "", name: "", semester_id: "" },
    error: null as string | null,
    success: null as string | null,
    loading: false,
    branchId: "",
    subjects: [],
    currentPage: 1,
    pageSize: 10,
  });

  const totalPages = Math.ceil(state.subjects.length / state.pageSize);


  // Helper to update state
  const updateState = (newState: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (state.error || state.success) {
      const timer = setTimeout(() => {
        updateState({ error: null, success: null });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error, state.success]);

  // Fetch branch ID, semesters, and subjects
  const fetchData = async () => {
    updateState({ loading: true });
    try {
      // Bootstrap in one call
      const boot = await getHODSubjectBootstrap();
      if (!boot.success || !boot.data?.profile?.branch_id) {
        throw new Error(boot.message || "Failed to bootstrap subject management");
      }
      const branchId = boot.data.profile.branch_id;
      updateState({ branchId });

      // Semesters
      const semestersRes = boot.data.semesters ? { success: true, data: boot.data.semesters } : await getSemesters(branchId);

      if (semestersRes.success) {
        console.log("Semesters fetched:", semestersRes.data); // Debug semesters
        updateState({ semesters: semestersRes.data || [] });
        if (!semestersRes.data?.length) {
          updateState({ error: "No semesters found for this branch" });
        }
      } else {
        updateState({ error: semestersRes.message || "Failed to fetch semesters" });
      }

      // Subjects
      if (boot.data.subjects) {
        console.log("Subjects fetched:", boot.data.subjects);
        updateState({ subjects: boot.data.subjects || [] });
      } else {
        const subjectsRes = await manageSubjects({ branch_id: branchId }, "GET");
        if (subjectsRes.success) updateState({ subjects: subjectsRes.data || [] }); else updateState({ error: subjectsRes.message || "Failed to fetch subjects" });
      }
    } catch (err: any) {
      updateState({ error: err.message || "Failed to fetch data" });
    } finally {
      updateState({ loading: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle adding or updating a subject
  const handleSubmit = async () => {
    if (!state.newSubject.code || !state.newSubject.name || !state.newSubject.semester_id) {
      updateState({ error: "All fields are required" });
      return;
    }

    const data: ManageSubjectsRequest = {
      action: state.showModal === "add" ? "create" : "update",
      branch_id: state.branchId,
      name: state.newSubject.name,
      subject_code: state.newSubject.code,
      semester_id: state.newSubject.semester_id,
      ...(state.showModal === "edit" && state.currentSubject ? { subject_id: state.currentSubject.id } : {}),
    };

    updateState({ loading: true });
    try {
      const response = await manageSubjects(data, "POST");
      if (response.success) {
        updateState({
          success: state.showModal === "add" ? "Subject added successfully" : "Subject updated successfully",
          showModal: null,
          newSubject: { code: "", name: "", semester_id: "" },
          currentSubject: null,
        });
        fetchData(); // Refresh subjects
      } else {
        updateState({ error: response.message });
      }
    } catch (err) {
      updateState({ error: "Failed to save subject" });
    } finally {
      updateState({ loading: false });
    }
  };

  // Handle editing a subject
  const handleEdit = (subject: Subject) => {
    updateState({
      currentSubject: subject,
      newSubject: {
        code: subject.subject_code,
        name: subject.name,
        semester_id: subject.semester_id,
      },
      showModal: "edit",
    });
  };

  // Handle deleting a subject
  const handleDelete = (subjectId: string) => {
    updateState({ deleteConfirmation: subjectId });
  };

  const confirmDelete = async (confirmed: boolean) => {
    if (confirmed && state.deleteConfirmation) {
      const data: ManageSubjectsRequest = {
        action: "delete",
        branch_id: state.branchId,
        subject_id: state.deleteConfirmation,
      };

      updateState({ loading: true });
      try {
        const response = await manageSubjects(data, "POST");
        if (response.success) {
          updateState({ success: "Subject deleted successfully" });
          fetchData(); // Refresh subjects
        } else {
          updateState({ error: response.message });
        }
      } catch (err) {
        updateState({ error: "Failed to delete subject" });
      } finally {
        updateState({ loading: false });
      }
    }
    updateState({ deleteConfirmation: null });
  };

  // Helper to get semester number by ID
  const getSemesterNumber = (semesterId: string): string => {
    const semester = state.semesters.find((s) => s.id === semesterId);
    return semester ? `Semester ${semester.number}` : `Semester ID: ${semesterId} (Not Found)`;
  };

  return (
    <div className="p-6 bg-[#1c1c1e] min-h-screen">
      <div className="flex justify-between items-center mb-4 text-gray-200">
        <h2 className="text-lg font-semibold ">Manage Subjects</h2>
        <Button
          onClick={() => {
            updateState({
              showModal: "add",
              newSubject: { code: "", name: "", semester_id: "" },
              currentSubject: null,
            });
          }}
          className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
          disabled={state.loading || !state.branchId}
        >
          + Add Subject
        </Button>
      </div>

      {state.error && <div className="text-red-500 mb-4">{state.error}</div>}
      {state.success && <div className="text-green-500 mb-4">{state.success}</div>}
      {state.loading && <div className="text-blue-500 mb-4">Loading...</div>}

      <Card className="bg-[#1c1c1e] shadow-lg text-gray-200">
        <CardHeader>
          <CardTitle className="text-md font-semibold">Manage Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead className="bg-[#1c1c1e] text-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">SUBJECT CODE</th>
                  <th className="px-4 py-3 text-left">SUBJECT NAME</th>
                  <th className="px-4 py-3 text-left">SEMESTER</th>
                  <th className="px-4 py-3 text-left">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-[#1c1c1e]">
                {state.subjects
                  .slice(
                    (state.currentPage - 1) * state.pageSize,
                    state.currentPage * state.pageSize
                  )
                  .map((subject, index) => (
                    <tr
                      key={subject.id}
                      className={
                        index % 2 === 0 ? "bg-[#1c1c1e]" : "bg-[#1c1c1e]"
                      }
                    >
                      <td className="px-4 py-3">{subject.subject_code}</td>
                      <td className="px-4 py-3">{subject.name}</td>
                      <td className="px-4 py-3">
                        {getSemesterNumber(subject.semester_id)}
                      </td>
                      <td className="px-4 py-3 flex gap-5">
                        <Pencil
                          className="w-4 h-4 text-blue-500 hover:text-blue-700 cursor-pointer"
                          onClick={() => handleEdit(subject)}
                        />
                        <Trash2
                          className="w-4 h-4 text-red-500 hover:text-red-700 cursor-pointer"
                          onClick={() => handleDelete(subject.id)}
                        />
                      </td>
                    </tr>
                  ))}

                {/* Keep layout consistent by filling empty rows */}
                {Array.from({
                  length:
                    state.pageSize -
                    Math.min(
                      state.pageSize,
                      state.subjects.length -
                        (state.currentPage - 1) * state.pageSize
                    ),
                }).map((_, i) => (
                  <tr key={`empty-${i}`} className="bg-[#1c1c1e] h-[48px]">
                    <td colSpan={4}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Info + Pagination */}
          <div className="flex justify-between items-center mt-4">
            {/* Showing count */}
            <div className="text-sm text-gray-400">
              Showing{" "}
              {Math.min(
                state.pageSize,
                state.subjects.length - (state.currentPage - 1) * state.pageSize
              )}{" "}
              out of {state.subjects.length} Subjects
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center">
              <Button
                onClick={() =>
                  updateState({ currentPage: Math.max(state.currentPage - 1, 1) })
                }
                disabled={state.currentPage === 1}
                className="w-24 flex items-center justify-center gap-1 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed py-1.5 rounded-md transition"
              >
                Previous
              </Button>
              <div className="w-16 text-center text-sm font-medium text-gray-200 bg-gray-800 border border-gray-500 py-1.5 mx-2 rounded-md">
                {state.currentPage}
              </div>
              <Button
                onClick={() =>
                  updateState({
                    currentPage: Math.min(state.currentPage + 1, totalPages),
                  })
                }
                disabled={state.currentPage === totalPages}
                className="w-24 flex items-center justify-center gap-1 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed py-1.5 rounded-md transition"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {state.deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-[#1c1c1e] p-6 rounded shadow-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-200">
              Are you sure you want to delete this subject?
            </h3>
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => confirmDelete(false)}
                className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                disabled={state.loading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => confirmDelete(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={state.loading}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      {state.showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-[#1c1c1e] p-6 rounded-lg shadow-lg w-96 text-gray-200">
            <h3 className="text-xl font-semibold mb-2">
              {state.showModal === "add" ? "Add New Subject" : "Edit Subject"}
            </h3>

            {/* Display modal-level error below title */}
            {state.modalError && (
              <p className="text-red-500 text-sm mb-4">{state.modalError}</p>
            )}

            {/* Subject Code */}
            <div className="mb-4">
              <label className="block mb-2 text-gray-300">Subject Code</label>
              <Input
                type="text"
                value={state.newSubject.code}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase(); // auto-uppercase
                  const pattern = /^(\d{2})?[A-Z]{2,4}\d{1,3}[A-Z]?[a-z]?(\([A-Z]\))?$/;
                  updateState({
                    newSubject: { ...state.newSubject, code },
                    modalError: code && !pattern.test(code)
                      ? "Invalid Subject Code. Examples: PH1L001, BCS601, 19ACE54A"
                      : null,
                  });
                }}
                placeholder="e.g., PH1L001, BCS601"
                disabled={state.loading}
                className={`bg-[#2c2c2e] border rounded text-gray-200 placeholder-gray-500 px-3 py-2
                  ${state.modalError ? "border-red-500" : "border-gray-600"}`}
              />
            </div>

            {/* Subject Name */}
            <div className="mb-4">
              <label className="block mb-2 text-gray-300">Subject Name</label>
              <Input
                type="text"
                value={state.newSubject.name}
                onChange={(e) =>
                  updateState({
                    newSubject: { ...state.newSubject, name: e.target.value },
                    modalError: null,
                  })
                }
                placeholder="e.g., Mathematics"
                disabled={state.loading}
                className="bg-[#2c2c2e] border border-gray-600 text-gray-200 placeholder-gray-500 px-3 py-2 rounded"
              />
            </div>

            {/* Semester */}
            <div className="mb-4">
              <label className="block mb-2 text-gray-300">Semester</label>
              <select
                className="w-full px-4 py-2 bg-[#2c2c2e] border border-gray-600 rounded text-gray-200"
                value={state.newSubject.semester_id}
                onChange={(e) =>
                  updateState({
                    newSubject: { ...state.newSubject, semester_id: e.target.value },
                    modalError: null,
                  })
                }
                disabled={state.loading}
              >
                <option value="">Select Semester</option>
                {state.semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    Semester {semester.number}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => {
                  updateState({
                    showModal: null,
                    newSubject: { code: "", name: "", semester_id: "" },
                    currentSubject: null,
                    modalError: null,
                  });
                }}
                className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                disabled={state.loading}
              >
                Cancel
              </Button>

              <Button
                onClick={async () => {
                  const pattern = /^(\d{2})?[A-Z]{2,4}\d{1,3}[A-Z]?[a-z]?(\([A-Z]\))?$/;

                  if (!state.newSubject.code || !state.newSubject.name || !state.newSubject.semester_id) {
                    updateState({ modalError: "All fields are required" });
                    return;
                  }

                  if (!pattern.test(state.newSubject.code)) {
                    updateState({ modalError: "Invalid Subject Code. Examples: PH1L001, CSEB107(P), 19ACE54a" });
                    return;
                  }

                  const data: ManageSubjectsRequest = {
                    action: state.showModal === "add" ? "create" : "update",
                    branch_id: state.branchId,
                    name: state.newSubject.name,
                    subject_code: state.newSubject.code,
                    semester_id: state.newSubject.semester_id,
                    ...(state.showModal === "edit" && state.currentSubject ? { subject_id: state.currentSubject.id } : {}),
                  };

                  updateState({ loading: true, modalError: null, success: null });
                  try {
                    const response = await manageSubjects(data, "POST");
                    if (response.success) {
                      updateState({
                        success: state.showModal === "add" ? "Subject added successfully" : "Subject updated successfully",
                        showModal: null,
                        newSubject: { code: "", name: "", semester_id: "" },
                        currentSubject: null,
                        modalError: null,
                      });
                      fetchData();
                    } else {
                      updateState({ modalError: response.message });
                    }
                  } catch (err) {
                    updateState({ modalError: "Failed to save subject" });
                  } finally {
                    updateState({ loading: false });
                  }
                }}
                className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white border border-gray-600"
                disabled={state.loading}
              >
                {state.showModal === "add" ? "Add Subject" : "Update Subject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;