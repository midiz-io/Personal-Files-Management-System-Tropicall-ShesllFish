import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminEmployeeDetail from "./pages/AdminEmployeeDetail.tsx";
import EmployeePortal from "./pages/EmployeePortal.tsx";
import IdCard from "./pages/IdCard.tsx";
import Verify from "./pages/Verify.tsx";
import ServiceLetters from "./pages/ServiceLetters.tsx";
import IdCardDesigner from "./pages/IdCardDesigner.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import RequireRole from "./components/RequireRole";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/verify/:id" element={<Verify />} />
            <Route path="/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
            <Route path="/admin/id-card-designer" element={<RequireRole role="admin"><IdCardDesigner /></RequireRole>} />
            <Route path="/admin/employee/:id" element={<RequireRole role="admin"><AdminEmployeeDetail /></RequireRole>} />
            <Route path="/admin/letters/:id" element={<RequireRole role="admin"><ServiceLetters /></RequireRole>} />
            <Route path="/portal" element={<RequireRole role="employee"><EmployeePortal /></RequireRole>} />
            <Route path="/fill-form/:id" element={<EmployeePortal />} />
            <Route path="/id-card/:id" element={<IdCard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
