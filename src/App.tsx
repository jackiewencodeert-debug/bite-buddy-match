import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/AppLayout";
import { CookieBanner } from "@/components/CookieBanner";
import Index from "./pages/Index";
import Scan from "./pages/Scan";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import AdminMenuImport from "./pages/AdminMenuImport";
import BusinessDashboard from "./pages/BusinessDashboard";
import MenuView from "./pages/MenuView";
import MenuEditor from "./pages/MenuEditor";
import BusinessStatistics from "./pages/BusinessStatistics";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import CCPANotice from "./pages/CCPANotice";
import Disclaimer from "./pages/Disclaimer";
import Accessibility from "./pages/Accessibility";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CookieBanner />
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/import" element={<AdminMenuImport />} />
              <Route path="/business" element={<BusinessDashboard />} />
              <Route path="/business/statistics" element={<BusinessStatistics />} />
              <Route path="/menu/:qrCode" element={<MenuView />} />
              <Route path="/menu/:menuId/edit" element={<MenuEditor />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/ccpa" element={<CCPANotice />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/accessibility" element={<Accessibility />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
