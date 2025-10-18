
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Index />
          </TooltipProvider>
        } />
        <Route path="/payment/success" element={
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PaymentSuccess />
          </TooltipProvider>
        } />
        <Route path="/payment/cancel" element={
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PaymentCancel />
          </TooltipProvider>
        } />
        <Route path="*" element={
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <NotFound />
          </TooltipProvider>
        } />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App; // Ensure this line is present