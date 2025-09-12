import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProctorStudents,
  getFacultyAssignments,
  ProctorStudent,
  FacultyAssignment,
  takeAttendance,
  TakeAttendanceRequest,
  uploadInternalMarks,
  UploadMarksRequest,
  createAnnouncement,
  CreateAnnouncementRequest,
  applyLeave,
  ApplyLeaveRequest,
  manageProfile,
  ManageProfileRequest,
  scheduleMentoring,
  ScheduleMentoringRequest,
  manageStudentLeave,
  getFacultyNotifications,
  getFacultySentNotifications,
  getAttendanceRecordsList,
  getAttendanceRecordDetails,
  getInternalMarksForClass,
  getStudentsForClass,
  ClassStudent,
  InternalMarkStudent
} from '../utils/faculty_api';

// Custom hooks for data fetching
export const useProctorStudentsQuery = () => {
  return useQuery({
    queryKey: ['proctorStudents'],
    queryFn: async (): Promise<ProctorStudent[]> => {
      const response = await getProctorStudents();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch proctor students');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useFacultyAssignmentsQuery = () => {
  return useQuery({
    queryKey: ['facultyAssignments'],
    queryFn: async (): Promise<FacultyAssignment[]> => {
      const response = await getFacultyAssignments();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch faculty assignments');
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Custom hooks for mutations (if needed in the future)
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateProctorStudents: () => queryClient.invalidateQueries({ queryKey: ['proctorStudents'] }),
    invalidateFacultyAssignments: () => queryClient.invalidateQueries({ queryKey: ['facultyAssignments'] }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
};

// Mutation hooks with cache invalidation
export const useTakeAttendanceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TakeAttendanceRequest) => takeAttendance(data),
    onSuccess: () => {
      // Invalidate attendance-related queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
    },
  });
};

export const useUploadMarksMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadMarksRequest) => uploadInternalMarks(data),
    onSuccess: () => {
      // Invalidate marks-related queries
      queryClient.invalidateQueries({ queryKey: ['internalMarks'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useCreateAnnouncementMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAnnouncementRequest) => createAnnouncement(data),
    onSuccess: () => {
      // Invalidate notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useApplyLeaveMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApplyLeaveRequest) => applyLeave(data),
    onSuccess: () => {
      // Invalidate leave-related queries
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
    },
  });
};

export const useManageProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ManageProfileRequest) => manageProfile(data),
    onSuccess: () => {
      // Invalidate profile-related queries
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useScheduleMentoringMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduleMentoringRequest) => scheduleMentoring(data),
    onSuccess: () => {
      // Invalidate mentoring-related queries
      queryClient.invalidateQueries({ queryKey: ['mentoring'] });
    },
  });
};

export const useManageStudentLeaveMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leave_id, action }: { leave_id: string; action: 'APPROVE' | 'REJECT' }) =>
      manageStudentLeave({ leave_id, action }),
    onSuccess: () => {
      // Invalidate leave-related queries
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['studentLeaves'] });
    },
  });
};