import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { manageSubjects, getSemesters, manageProfile, getHODSubjectBootstrap } from "../../utils/hod_api";
import { useTheme } from "../../context/ThemeContext";

interface Subject {
  id: string;
  name: string;
  subject_code: string;
  semester_id: string;
  subject_type: string;
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
  subject_type?: string;
}

// Define error type for catch blocks
interface ErrorWithMessage {
  message: string;
}

// Type guard to check if an object has a message property
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Define the state type to include all properties
interface SubjectManagementState {
  subjects: Subject[];
  semesters: Semester[];
  deleteConfirmation: string | null;
  showModal: "add" | "edit" | null;
  currentSubject: Subject | null;
  newSubject: { code: string; name: string; semester_id: string; subject_type: string };
  error: string | null;
  success: string | null;
  loading: boolean;
  branchId: string;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  modalError: string | null;
}

const SubjectManagement = () => {
  const { theme } = useTheme();
  const [state, setState] = useState<SubjectManagementState>({
    subjects: [],
    semesters: [],
    deleteConfirmation: null,
    showModal: null,
    currentSubject: null,
    newSubject: { code: "", name: "", semester_id: "", subject_type: "regular" },
    error: null,
    success: null,
    loading: false,
    branchId: "",
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    modalError: null,
  });

  const totalPages = state.totalPages;

  // Helper to update state
  const updateState = (newState: Partial<SubjectManagementState>) => {
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

  // Fetch branch ID and semesters (one-time bootstrap)
  const fetchBootstrap = async () => {
    try {
      const boot = await getHODSubjectBootstrap();
      if (!boot.success || !boot.data?.profile?.branch_id) {
        throw new Error(boot.message || "Failed to bootstrap subject management");
      }
      const branchId = boot.data.profile.branch_id;
      updateState({ branchId });

      // Semesters
      const semestersRes = boot.data.semesters ? { success: true, data: boot.data.semesters } : await getSemesters(branchId);

      if (semestersRes.success) {
        console.log("Semesters fetched:", semestersRes.data);
        updateState({ semesters: semestersRes.data || [] });
        if (!semestersRes.data?.length) {
          updateState({ error: "No semesters found for this branch" });
        }
      } else {
        updateState({ error: semestersRes.message || "Failed to fetch semesters" });
      }

      return branchId;
    } catch (err) {
      if (isErrorWithMessage(err)) {
        updateState({ error: err.message || "Failed to fetch bootstrap data" });
      } else {
        updateState({ error: "Failed to fetch bootstrap data" });
      }
      return null;
    }
  };

  // Fetch subjects with pagination
  const fetchSubjects = async (branchId: string, page: number = 1, pageSize: number = 10) => {
    updateState({ loading: true });
    try {
      const subjectsRes = await manageSubjects({
        branch_id: branchId,
        page,
        page_size: pageSize
      }, "GET");

      if (subjectsRes.success) {
        console.log("Subjects fetched:", subjectsRes.data);
        updateState({
          subjects: subjectsRes.data || [],
          totalCount: subjectsRes.count || 0,
          totalPages: subjectsRes.total_pages || 0,
          currentPage: subjectsRes.current_page || 1
        });
      } else {
        updateState({ error: subjectsRes.message || "Failed to fetch subjects" });
      }
    } catch (err) {
      if (isErrorWithMessage(err)) {
        updateState({ error: err.message || "Failed to fetch subjects" });
      } else {
        updateState({ error: "Failed to fetch subjects" });
      }
    } finally {
      updateState({ loading: false });
    }
  };

  // Initial bootstrap on mount
  useEffect(() => {
    const initialize = async () => {
      updateState({ loading: true });
      const branchId = await fetchBootstrap();
      if (branchId) {
        await fetchSubjects(branchId, state.currentPage, state.pageSize);
      }
      updateState({ loading: false });
    };
    initialize();
  }, []); // Only run once on mount

  // Fetch subjects when pagination changes (but not on initial mount)
  useEffect(() => {
    if (state.branchId) {
      fetchSubjects(state.branchId, state.currentPage, state.pageSize);
    }
  }, [state.currentPage, state.pageSize]);

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
      subject_type: state.newSubject.subject_type,
      ...(state.showModal === "edit" && state.currentSubject ? { subject_id: state.currentSubject.id } : {}),
    };

    updateState({ loading: true });
    try {
      const response = await manageSubjects(data, "POST");
      if (response.success) {
        updateState({
          success: state.showModal === "add" ? "Course added successfully" : "Course updated successfully",
          showModal: null,
          newSubject: { code: "", name: "", semester_id: "", subject_type: "regular" },
          currentSubject: null,
        });
        fetchSubjects(state.branchId, state.currentPage, state.pageSize); // Refresh subjects with current pagination
      } else {
        updateState({ error: response.message });
      }
    } catch (err) {
      if (isErrorWithMessage(err)) {
        updateState({ error: err.message || "Failed to save subject" });
      } else {
        updateState({ error: "Failed to save subject" });
      }
    } finally {
      updateState({ loading: false });
    }
  };

  const handleEdit = (subject: Subject) => {
    updateState({
      currentSubject: subject,
      newSubject: {
        code: subject.subject_code,
        name: subject.name,
        semester_id: subject.semester_id,
        subject_type: subject.subject_type,
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
          updateState({ success: "Course deleted successfully" });
          // If we're on a page that becomes empty after deletion, go to previous page
          const newTotalCount = state.totalCount - 1;
          const newTotalPages = Math.ceil(newTotalCount / state.pageSize);
          const newPage = state.currentPage > newTotalPages ? Math.max(1, newTotalPages) : state.currentPage;
          fetchSubjects(state.branchId, newPage, state.pageSize);
        } else {
          updateState({ error: response.message });
        }
      } catch (err) {
        if (isErrorWithMessage(err)) {
          updateState({ error: err.message || "Failed to delete subject" });
        } else {
          updateState({ error: "Failed to delete subject" });
        }
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
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Manage Courses</h2>
        <Button
          onClick={() => {
            updateState({
              showModal: "add",
              newSubject: { code: "", name: "", semester_id: "", subject_type: "regular" },
              currentSubject: null,
            });
          }}
          className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
          disabled={state.loading || !state.branchId}
        >
          + Add Course
        </Button>
      </div>

      {state.error && <div className={`mb-4 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{state.error}</div>}
      {state.success && <div className={`mb-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{state.success}</div>}
      {state.loading && <div className={`mb-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Loading...</div>}

      <Card className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Manage Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-gray-100 text-gray-900'}>
                <tr>
                  <th className="px-4 py-3 text-left">COURSE CODE</th>
                  <th className="px-4 py-3 text-left">COURSE NAME</th>
                  <th className="px-4 py-3 text-left">SEMESTER</th>
                  <th className="px-4 py-3 text-left">COURSE TYPE</th>
                  <th className="px-4 py-3 text-left">ACTIONS</th>
                </tr>
              </thead>
              <tbody className={theme === 'dark' ? 'bg-background' : 'bg-white'}>
                {state.subjects.map((subject, index) => (
                  <tr
                    key={subject.id}
                    className={
                      index % 2 === 0 ? (theme === 'dark' ? 'bg-card' : 'bg-gray-50') : (theme === 'dark' ? 'bg-background' : 'bg-white')
                    }
                  >
                    <td className="px-4 py-3">{subject.subject_code}</td>
                    <td className="px-4 py-3">{subject.name}</td>
                    <td className="px-4 py-3">
                      {getSemesterNumber(subject.semester_id)}
                    </td>
                    <td className="px-4 py-3">
                      {subject.subject_type === 'regular' ? 'Regular' : subject.subject_type === 'elective' ? 'Elective Subjects' : 'Open Elective Subjects'}
                    </td>
                    <td className="px-4 py-3 flex gap-5">
                      <Pencil
                        className={`w-4 h-4 cursor-pointer ${theme === 'dark' ? 'text-primary hover:text-primary/80' : 'text-blue-600 hover:text-blue-800'}`}
                        onClick={() => handleEdit(subject)}
                      />
                      <Trash2
                        className={`w-4 h-4 cursor-pointer ${theme === 'dark' ? 'text-destructive hover:text-destructive/80' : 'text-red-600 hover:text-red-800'}`}
                        onClick={() => handleDelete(subject.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Info + Pagination */}
          <div className="flex justify-between items-center mt-4">
            {/* Showing count */}
            <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
              Showing {state.subjects.length} out of {state.totalCount} Courses
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-4">
              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <span className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                  Per page:
                </span>
                <select
                  value={state.pageSize}
                  onChange={(e) => {
                    updateState({ pageSize: Number(e.target.value), currentPage: 1 });
                  }}
                  className={`text-sm px-2 py-1 rounded-md border ${theme === 'dark'
                    ? 'bg-card text-foreground border-border'
                    : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  disabled={state.loading}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const newPage = Math.max(state.currentPage - 1, 1);
                    updateState({ currentPage: newPage });
                  }}
                  disabled={state.currentPage === 1 || state.loading}
                  className="w-24 flex items-center justify-center gap-1 text-sm font-medium py-1.5 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
                >
                  Previous
                </Button>
                <div className={`px-4 text-center text-sm font-medium py-1.5 rounded-md ${theme === 'dark' ? 'text-foreground bg-card border border-border' : 'text-gray-900 bg-white border border-gray-300'}`}>
                  Page {state.currentPage} of {totalPages || 1}
                </div>
                <Button
                  onClick={() => {
                    const newPage = Math.min(state.currentPage + 1, totalPages);
                    updateState({ currentPage: newPage });
                  }}
                  disabled={state.currentPage === totalPages || state.loading || totalPages === 0}
                  className="w-24 flex items-center justify-center gap-1 text-sm font-medium py-1.5 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {state.deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className={`p-6 rounded shadow-lg ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}`}>
            <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
              Are you sure you want to delete this course?
            </h3>
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => confirmDelete(false)}
                className={`text-foreground ${theme === 'dark' ? 'bg-card border-border hover:bg-accent' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
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
          <div className={`p-6 rounded-lg shadow-lg w-96 ${theme === 'dark' ? 'bg-card text-foreground border border-border' : 'bg-white text-gray-900 border border-gray-300'}`}>
            <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
              {state.showModal === "add" ? "Add New Subject" : "Edit Subject"}
            </h3>

            {/* Display modal-level error below title */}
            {state.modalError && (
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{state.modalError}</p>
            )}

            {/* Course Code */}
            <div className="mb-4">
              <label className={`block mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Course Code</label>
              <Input
                type="text"
                value={state.newSubject.code}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase(); // auto-uppercase
                  updateState({
                    newSubject: { ...state.newSubject, code },
                    modalError: null,
                  });
                }}
                placeholder="e.g., PH1L001, BCS601"
                disabled={state.loading}
                className={`${theme === 'dark' ? 'bg-card border-border text-foreground placeholder:text-muted-foreground' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'} px-3 py-2 rounded`}
              />
            </div>

            {/* Course Name */}
            <div className="mb-4">
              <label className={`block mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Course Name</label>
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
                className={`${theme === 'dark' ? 'bg-card border-border text-foreground placeholder:text-muted-foreground' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'} px-3 py-2 rounded`}
              />
            </div>

            {/* Semester */}
            <div className="mb-4">
              <label className={`block mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Semester</label>
              <select
                className={`${theme === 'dark' ? 'bg-card border border-border text-foreground' : 'bg-white border border-gray-300 text-gray-900'} w-full px-4 py-2 rounded`}
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

            {/* Course Type */}
            <div className="mb-4">
              <label className={`block mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Course Type</label>
              <select
                className={`${theme === 'dark' ? 'bg-card border border-border text-foreground' : 'bg-white border border-gray-300 text-gray-900'} w-full px-4 py-2 rounded`}
                value={state.newSubject.subject_type}
                onChange={(e) =>
                  updateState({
                    newSubject: { ...state.newSubject, subject_type: e.target.value },
                    modalError: null,
                  })
                }
                disabled={state.loading}
              >
                <option value="regular">Regular</option>
                <option value="elective">Elective Subjects</option>
                <option value="open_elective">Open Elective Subjects</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => {
                  updateState({
                    showModal: null,
                    newSubject: { code: "", name: "", semester_id: "", subject_type: "regular" },
                    currentSubject: null,
                    modalError: null,
                  });
                }}
                className={`${theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}`}
                disabled={state.loading}
              >
                Cancel
              </Button>

              <Button
                onClick={async () => {
                  if (!state.newSubject.code || !state.newSubject.name || !state.newSubject.semester_id) {
                    updateState({ modalError: "All fields are required" });
                    return;
                  }

                  const data: ManageSubjectsRequest = {
                    action: state.showModal === "add" ? "create" : "update",
                    branch_id: state.branchId,
                    name: state.newSubject.name,
                    subject_code: state.newSubject.code,
                    semester_id: state.newSubject.semester_id,
                    subject_type: state.newSubject.subject_type,
                    ...(state.showModal === "edit" && state.currentSubject ? { subject_id: state.currentSubject.id } : {}),
                  };

                  updateState({ loading: true, modalError: null, success: null });
                  try {
                    const response = await manageSubjects(data, "POST");
                    if (response.success) {
                      updateState({
                        success: state.showModal === "add" ? "Subject added successfully" : "Subject updated successfully",
                        showModal: null,
                        newSubject: { code: "", name: "", semester_id: "", subject_type: "regular" },
                        currentSubject: null,
                        modalError: null,
                      });
                      fetchSubjects(state.branchId, state.currentPage, state.pageSize);
                    } else {
                      updateState({ modalError: response.message });
                    }
                  } catch (err) {
                    updateState({ modalError: "Failed to save subject" });
                  } finally {
                    updateState({ loading: false });
                  }
                }}
                className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
                disabled={state.loading}
              >
                {state.showModal === "add" ? "Add Course" : "Update Course"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;