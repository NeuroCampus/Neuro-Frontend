
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import HODDashboard from "./components/dashboards/HODDashboard";
import FacultyDashboard from "./components/dashboards/FacultyDashboard";
import FeesManagerDashboard from "./pages/FeesManager/FeesManagerDashboard";
import { ThemeProvider } from "./context/ThemeContext";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");
  const user = localStorage.getItem("user");

  if (!token || !role || !user || !allowedRoles.includes(role)) {
    return <Index />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <>
              <Toaster />
              <Sonner />
              <Index />
            </>
          } />

          {/* Payment routes */}
          <Route path="/payment/success" element={
            <ThemeProvider>
              <PaymentSuccess />
            </ThemeProvider>
          } />
          <Route path="/payment/cancel" element={
            <ThemeProvider>
              <PaymentCancel />
            </ThemeProvider>
          } />

          {/* Student routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/timetable" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/marks" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/leave-request" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/leave-status" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/fees" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/announcements" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/face-recognition" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/student-study-material" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/student-assignment" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ThemeProvider>
                <AdminDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />

          {/* HOD routes */}
          <Route path="/hod/*" element={
            <ProtectedRoute allowedRoles={["hod"]}>
              <ThemeProvider>
                <HODDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />

          {/* Faculty routes */}
          <Route path="/faculty/*" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <ThemeProvider>
                <FacultyDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />

          {/* Fees Manager routes */}
          <Route path="/fees-manager/*" element={
            <ProtectedRoute allowedRoles={["fees_manager"]}>
              <ThemeProvider>
                <FeesManagerDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
              </ThemeProvider>
            </ProtectedRoute>
          } />

          {/* 404 route */}
          <Route path="*" element={
            <ThemeProvider>
              <NotFound />
            </ThemeProvider>
          } />
        </Routes>
        <Toaster />
        <Sonner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;