import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import LoginModal from "./components/LoginModal";
import CreateCampaignModalMount from "./lib/createCampaignModal";
import Landing from "./pages/landing";
import Login from "./pages/login";
import Home from "./pages/home";
import Campaigns from "./pages/campaigns";
import BrowseCampaigns from "./pages/browse-campaigns";
import CampaignDetail from "./pages/campaign-detail";
import CreateCampaign from "./pages/create-campaign";
import ProfileVerification from "./pages/profile-verification";
import Admin from "./pages/admin";
import Support from "./pages/support";
import Volunteer from "./pages/volunteer";
import MyProfile from "./pages/my-profile";
import UserProfile from "./pages/user-profile";
import VolunteerApplications from "./pages/volunteer-applications";
import AcceptSupportInvite from "./pages/accept-support-invite";
import PaymentSuccess from "./pages/payment-success";
import PaymentCancel from "./pages/payment-cancel";
import SupportTicketForm from "./pages/support-ticket-form";
import NotificationsPage from "./pages/notifications";
import NotFound from "./pages/not-found";
import { AdminRoute } from "./components/AdminRoute";
import PaymentEventsListener from "./components/PaymentEventsListener";function Router() {
  // Check authentication with better error handling
  const { data: user, isLoading, error, status } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    throwOnError: false
  });
  
  // Consider unauthenticated if we have an error or null user
  const isAuthenticated = status === 'success' && !!user;
  
  // Show landing page for unauthenticated users (no loading state)
  if (status === 'error' || (status === 'success' && !user)) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/auth/callback" component={Home} />
        <Route path="/support/tickets/new" component={SupportTicketForm} />
        <Route path="/accept-support-invite/:token" component={AcceptSupportInvite} />
        <Route path="/payment/success" component={PaymentSuccess} />
        <Route path="/payment/cancel" component={PaymentCancel} />
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Only show loading for initial load
  if (isLoading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Authenticated routes
  return (
    <Switch>
      {/* Public routes always available */}
      <Route path="/login" component={Login} />
      <Route path="/auth/callback" component={Home} />
      <Route path="/support/tickets/new" component={SupportTicketForm} />
      <Route path="/accept-support-invite/:token" component={AcceptSupportInvite} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      
      {/* Authenticated routes */}
      <Route path="/" component={Home} />
      <Route path="/browse-campaigns" component={BrowseCampaigns} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      <Route path="/create-campaign" component={CreateCampaign} />
      <Route path="/volunteer" component={Volunteer} />
      <Route path="/my-profile" component={MyProfile} />
      <Route path="/profile" component={MyProfile} />
      <Route path="/profile/:userId" component={UserProfile} />
      <Route path="/profile-verification" component={ProfileVerification} />
      <Route path="/volunteer-applications" component={VolunteerApplications} />
      <Route path="/myopportunities" component={VolunteerApplications} />
      <Route path="/campaignopportunities" component={BrowseCampaigns} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/admin" component={() => <AdminRoute><Admin /></AdminRoute>} />
      <Route path="/admin/users/:userId" component={() => <AdminRoute><UserProfile /></AdminRoute>} />
      <Route path="/admin/documents/:id" component={() => <AdminRoute><Admin /></AdminRoute>} />
      <Route path="/support" component={() => <AdminRoute><Support /></AdminRoute>} />
      
      {/* Catch all route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <LoginModal />
        <CreateCampaignModalMount />
        <PaymentEventsListener />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
