import { API_ENDPOINT } from "./config";
import { fetchWithTokenRefresh } from "./authService";

// Types for Student Fee Reports
export interface StudentFeeReport {
  student: {
    id: number;
    name: string;
    usn: string;
    branch: string;
    semester: number;
    section: string | null;
    email: string | null;
    phone: string | null;
  };
  fee_summary: {
    total_fee: number;
    total_paid: number;
    total_pending: number;
    custom_fee_amount: number;
  };
  semester_wise_breakdown?: Array<{
    semester_name: string;
    total_fee: number;
    total_paid: number;
    total_pending: number;
    invoices: Array<{
      id: number;
      invoice_number: string;
      total_amount: number;
      paid_amount: number;
      balance_amount: number;
      status: string;
      due_date: string | null;
      created_at: string;
      template_name: string | null;
      components: Array<{
        name: string;
        amount: number;
        description: string;
      }>;
    }>;
    payments: Array<{
      id: number;
      amount: number;
      status: string;
      payment_date: string;
      invoice_number: string;
      payment_method: string;
      transaction_id: string | null;
    }>;
  }>;
  invoices: Array<{
    id: number;
    invoice_number: string;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    status: string;
    due_date: string | null;
    created_at: string;
    template_name: string | null;
    components: Array<{
      name: string;
      amount: number;
      description: string;
    }>;
  }>;
  payment_history: Array<{
    id: number;
    amount: number;
    status: string;
    payment_date: string;
    invoice_number: string;
    payment_method: string;
    transaction_id: string | null;
  }>;
  custom_fee_structure: any;
}

export interface StudentFeeSummary {
  student: {
    id: number;
    name: string;
    usn: string;
    branch: string;
    semester: number;
    section: string | null;
  };
  fee_summary: {
    total_fee: number;
    total_paid: number;
    total_pending: number;
    invoice_count: number;
    payment_count: number;
  };
}

export interface Branch {
  id: number;
  name: string;
  code: string;
}

export interface Semester {
  id: number;
  number: number;
  name: string;
}

export interface Section {
  id: number;
  name: string;
}

// API Functions
export const getStudentFeeReport = async (searchTerm: string) => {
  try {
    const params = new URLSearchParams({ search_term: searchTerm });
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/fees-manager/student-fee-report/?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Student Fee Report Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getStudentsFeeReports = async (
  batchId?: string,
  branchId?: string,
  semesterId?: string,
  sectionId?: string,
  admissionMode?: string,
  page: number = 1
) => {
  try {
    const params = new URLSearchParams();
    if (batchId) params.append('batch_id', batchId);
    if (branchId) params.append('branch_id', branchId);
    if (semesterId) params.append('semester_id', semesterId);
    if (sectionId) params.append('section_id', sectionId);
    if (admissionMode) params.append('admission_mode', admissionMode);
    params.append('page', page.toString());
    params.append('page_size', '10');

    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/fees-manager/students-fee-reports/?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Students Fee Reports Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getFeesManagerFilters = async () => {
  try {
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/fees-manager/filters/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Filters Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getFeesManagerBranches = async () => {
  try {
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/fees-manager/branches/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Branches Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getFeesManagerSemesters = async (branchId: string) => {
  try {
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/fees-manager/semesters/?branch_id=${branchId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Semesters Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getFeesManagerSections = async (branchId: string, semesterId: string) => {
  try {
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/fees-manager/sections/?branch_id=${branchId}&semester_id=${semesterId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Sections Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const sendFeeReminder = async (studentId: number) => {
  try {
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/fees-manager/students/${studentId}/send-reminder/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Send Fee Reminder Error:", error);
    return { success: false, message: "Network error" };
  }
};
export const getStaffAttendanceAudit = async (role: string = 'all', startDate?: string, endDate?: string, page: number = 1, format?: string) => {
  try {
    const params = new URLSearchParams({
      role,
      page: page.toString(),
    });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (format) params.append('format', format);

    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/fees-manager/staff-attendance-audit/?${params}`, {
      method: "GET",
    });
    
    if (format) return response; // Return raw response for downloads
    return await response.json();
  } catch (error) {
    console.error("Error fetching staff attendance audit:", error);
    return { success: false, message: "Network error" };
  }
};

export const getStaffDetailedAttendance = async (staffId: number, startDate?: string, endDate?: string) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/fees-manager/staff-detailed-attendance/${staffId}/?${params}`, {
      method: "GET",
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching detailed staff attendance:", error);
    return { success: false, message: "Network error" };
  }
};

export const STAFF_ROLES = [
  { value: 'principal', label: 'Principal' },
  { value: 'hod', label: 'HOD' },
  { value: 'dean', label: 'Dean' },
  { value: 'teacher', label: 'Faculty' },
  { value: 'coe', label: 'COE' },
  { value: 'fees_manager', label: 'Fees Manager' },
  { value: 'warden', label: 'Warden' },
  { value: 'caretaker', label: 'Caretaker' },
];
