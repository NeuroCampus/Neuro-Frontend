import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFacultyAssignments, FacultyAssignment } from '../utils/faculty_api';

interface FacultyAssignmentsContextType {
  assignments: FacultyAssignment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isLoaded: boolean;
}

const FacultyAssignmentsContext = createContext<FacultyAssignmentsContextType | undefined>(undefined);

interface FacultyAssignmentsProviderProps {
  children: ReactNode;
}

export const FacultyAssignmentsProvider: React.FC<FacultyAssignmentsProviderProps> = ({ children }) => {
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchAssignments = async () => {
    if (isLoaded) return; // Don't fetch if already loaded

    setLoading(true);
    setError(null);

    try {
      const response = await getFacultyAssignments();
      if (response.success && response.data) {
        setAssignments(response.data);
        setIsLoaded(true);
      } else {
        setError(response.message || 'Failed to fetch faculty assignments');
      }
    } catch (err) {
      setError('Network error while fetching faculty assignments');
      console.error('Faculty assignments fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    setIsLoaded(false); // Reset loaded state to force refetch
    await fetchAssignments();
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const value: FacultyAssignmentsContextType = {
    assignments,
    loading,
    error,
    refetch,
    isLoaded,
  };

  return (
    <FacultyAssignmentsContext.Provider value={value}>
      {children}
    </FacultyAssignmentsContext.Provider>
  );
};

export const useFacultyAssignments = (): FacultyAssignmentsContextType => {
  const context = useContext(FacultyAssignmentsContext);
  if (context === undefined) {
    throw new Error('useFacultyAssignments must be used within a FacultyAssignmentsProvider');
  }
  return context;
};