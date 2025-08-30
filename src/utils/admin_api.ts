import { API_BASE_URL } from "./config";
import { fetchWithTokenRefresh } from "./authService";

// Type definitions for request and response data
interface BranchDistribution {
  name: string;
  students: number;
  faculty: number;
}

interface RoleDistribution {
  students: number;
  faculty: number;
  hods: number;
  admins: number;
}

interface AdminStatsResponse {
  success: boolean;
  message?: string;
  data?: {
    total_students: number;
    total_faculty: number;
    total_hods: number;
    total_branches: number;
    branch_distribution: BranchDistribution[];
    role_distribution: RoleDistribution;
  };
}

interface EnrollUserRequest {
  username: string;
  email: string;
  role: "hod" | "teacher";
  first_name: string;
  last_name?: string;
}

interface EnrollUserResponse {
  success: boolean;
  message?: string;
  user_id?: string;
}

interface BulkUploadFacultyResponse {
  success: boolean;
  message?: string;
  uploaded_count?: number;
  errors?: string[];
}

interface Branch {
  id: number;
  name: string;
  hod?: { id: string; first_name: string; last_name: string };
  semesters: number[];
  sections: { name: string; semester: number }[];
}

interface ManageBranchesResponse {
  success: boolean;
  message?: string;
  branches?: Branch[];
  branch?: Branch;
}

interface Batch {
  id: number;
  name: string;
  start_year: number;
  end_year: number;
  student_count: number;
  created_at: string;
}

interface ManageBatchesResponse {
  success: boolean;
  message?: string;
  batches?: Batch[];
  batch?: Batch;
}

interface ManageBatchesRequest {
  start_year?: number;
  end_year?: number;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  target_role: string;
  created_at: string;
  scheduled_at?: string;
}

interface ManageNotificationsResponse {
  success: boolean;
  message?: string;
  notifications?: Notification[];
}

interface HODLeave {
  id: number;
  faculty: { id: string; first_name: string; last_name: string };
  branch: { id: number; name: string };
  start_date: string;
  end_date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface ManageHODLeavesResponse {
  success: boolean;
  message?: string;
  leaves?: HODLeave[];
  calendar?: { date: string; leaves: { id: number; hod: string; status: string }[] }[];
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  extra: {
    usn?: string;
    branch?: string;
    branches?: string[];
  };
}

interface ManageUsersResponse {
  success: boolean;
  message?: string;
  users?: User[];
}

interface ManageAdminProfileRequest {
  user_id: string;
  action?: string;
  updates?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile_number?: string;
    address?: string;
    bio?: string;
  };
}

interface ManageAdminProfileResponse {
  success: boolean;
  message?: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
    mobile_number: string;
    address: string;
    bio: string;
  };
}

export const getAdminStats = async (): Promise<AdminStatsResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/admin/stats-overview/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("Get Admin Stats Failed:", { status: response.status, result });
      return { success: false, message: result.message || `HTTP ${response.status}` };
    }
    return result;
  } catch (error) {
    console.error("Get Admin Stats Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const enrollUser = async (data: EnrollUserRequest): Promise<EnrollUserResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/admin/enroll-user/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("Enroll User Failed:", { status: response.status, result });
      return { success: false, message: result.message || `HTTP ${response.status}` };
    }
    return result;
  } catch (error) {
    console.error("Enroll User Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const bulkUploadFaculty = async (file: File): Promise<BulkUploadFacultyResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/admin/bulk-upload-faculty/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("Bulk Upload Faculty Failed:", { status: response.status, result });
      return { success: false, message: result.message || `HTTP ${response.status}` };
    }
    return result;
  } catch (error) {
    console.error("Bulk Upload Faculty Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const manageBranches = async (
  data?: any,
  branch_id?: number,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<ManageBranchesResponse> => {
  try {
    const url = branch_id
      ? `${API_BASE_URL}/admin/branches/${branch_id}/`
      : `${API_BASE_URL}/admin/branches/`;
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("Manage Branches Failed:", { status: response.status, result });
      return { success: false, message: result.message || `HTTP ${response.status}` };
    }
    return result;
  } catch (error) {
    console.error("Manage Branches Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const manageBatches = async (
  data?: ManageBatchesRequest,
  batch_id?: number,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<ManageBatchesResponse> => {
  try {
    const url = batch_id
      ? `${API_BASE_URL}/admin/batches/${batch_id}/`
      : `${API_BASE_URL}/admin/batches/`;
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("Manage Batches Failed:", { status: response.status, result });
      return { success: false, message: result.message || `HTTP ${response.status}` };
    }
    return result;
  } catch (error) {
    console.error("Manage Batches Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const manageNotifications = async (
  data?: any,
  method: "GET" | "POST" = "GET"
): Promise<ManageNotificationsResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/admin/notifications/`, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("Manage Notifications Failed:", { status: response.status, result });
      return { success: false, message: result.message || `HTTP ${response.status}` };
    }
    return result;
  } catch (error) {
    console.error("Manage Notifications Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const manageHODLeaves = async (
  data?: any,
  method: "GET" | "POST" = "GET"
): Promise<ManageHODLeavesResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/admin/hod-leaves/`, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("Manage HOD Leaves Failed:", { status: response.status, result });
      return { success: false, message: result.message || `HTTP ${response.status}` };
    }
    return result;
  } catch (error) {
    console.error("Manage HOD Leaves Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const manageUsers = async (
  data?: any,
  method: "GET" | "POST" = "GET"
): Promise<ManageUsersResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/admin/users/`, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("Manage Users Failed:", { status: response.status, result });
      return { success: false, message: result.message || `HTTP ${response.status}` };
    }
    return result;
  } catch (error) {
    console.error("Manage Users Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const manageAdminProfile = async (
  data: ManageAdminProfileRequest,
  method: "GET" | "POST" = "POST"
): Promise<ManageAdminProfileResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/admin/profile/${data.user_id}/`, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(data) : undefined,
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("Manage Admin Profile Failed:", { status: response.status, result });
      return { success: false, message: result.message || `HTTP ${response.status}` };
    }
    return result;
  } catch (error) {
    console.error("Manage Admin Profile Error:", error);
    return { success: false, message: "Network error" };
  }
};