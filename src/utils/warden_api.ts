import { API_ENDPOINT } from "./config";
import { fetchWithTokenRefresh } from "./authService";

export interface WardenStats {
  total_managed_hostels: number;
  total_rooms: number;
  total_students: number;
  total_issues: number;
  pending_issues: number;
  occupancy_rate: number;
}

export interface WardenDashboardData {
  success: boolean;
  warden_name: string;
  statistics: WardenStats;
  data: {
    hostels: any[];
  };
}

export const getWardenDashboard = async (): Promise<WardenDashboardData> => {
  const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/warden/dashboard/`);
  if (!response.ok) {
    throw new Error("Failed to fetch warden dashboard data");
  }
  return response.json();
};

export const getWardenStudents = async () => {
  const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/warden/students/`);
  if (!response.ok) {
    throw new Error("Failed to fetch warden students");
  }
  return response.json();
};

export const getWardenRooms = async () => {
  const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/warden/rooms/`);
  if (!response.ok) {
    throw new Error("Failed to fetch warden rooms");
  }
  return response.json();
};

export const getWardenIssues = async () => {
  const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/warden/issues/`);
  if (!response.ok) {
    throw new Error("Failed to fetch warden issues");
  }
  return response.json();
};

export const updateWardenIssue = async (issueId: number, data: { status: string; remarks?: string }) => {
  const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/warden/issues/${issueId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update issue");
  }
  return response.json();
};
