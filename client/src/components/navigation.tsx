import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { Menu, X, Bell, ChevronDown, MessageCircle, Coins, Power } from "lucide-react";import { DepositModal } from "@/components/deposit-modal";
import { UserSwitcher } from "@/components/user-switcher";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/supabaseClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification } from "@shared/schema";


type NavigationProps = {
  variant?: 'floating' | 'sticky' | 'sticky-compact';
  hideAdminProfileLink?: boolean;
  // Allows pages to offset sticky nav from the very top (e.g., 'top-4')
  topOffsetClass?: string;
};

export default function Navigation({ variant = 'floating', hideAdminProfileLink = false, topOffsetClass = 'top-0' }: NavigationProps) {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated && !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("PATCH", `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.isRead)?.length || 0;


  const navItems: Array<{ href: string; label: string }> = [];

  const adminNavItems: Array<{ href: string; label: string }> = [];

  const containerPositionClass = variant === 'floating'
    ? 'fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-7xl px-4'
    : variant === 'sticky-compact'
      ? `sticky ${topOffsetClass} left-0 w-full max-w-7xl px-4`
      : `sticky ${topOffsetClass} left-0 w-full px-0`;

  return (
<nav className={`verifund-nav ${containerPositionClass} mx-auto z-50`}>
      <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl border border-border/50">        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <Link 
              href={isAuthenticated && ((user as any)?.isAdmin || (user as any)?.isSupport) ? "/admin?tab=profile" : "/"} 
              className="flex-shrink-0 flex items-center gap-2"
            >
              <img 
                src="/verifund-logo.png"
                alt="VeriFund Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-2xl font-bold text-gray-600">VeriFund</span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {isAuthenticated && !(user as any)?.isAdmin && !(user as any)?.isSupport && (
                  <>
                    {/* My Opportunities Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                            location === "/browse-campaigns" || location === "/volunteer"
                              ? "text-primary bg-primary/10"
                              : "text-gray-700 hover:text-primary"
                          }`}
                        >
                          My Opportunities
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <Link href="/browse-campaigns" className="w-full cursor-pointer">
                            Campaign Opportunities
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/volunteer" className="w-full cursor-pointer">
                            Volunteer Opportunities
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* My Campaigns Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                            location === "/campaigns" || location === "/volunteer-applications"
                              ? "text-primary bg-primary/10"
                              : "text-gray-700 hover:text-primary"
                          }`}
                        >
                          My Campaigns
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <Link href="/campaigns" className="w-full cursor-pointer">
                            Campaign Overview
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/volunteer-applications" className="w-full cursor-pointer">
                            Volunteer Applications
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Regular Navigation Items */}
                    {navItems.map((item) => (
                      <Link 
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          location === item.href
                            ? "text-primary bg-primary/10"
                            : "text-gray-700 hover:text-primary"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}

                    {/* My Profile Link */}
                    <Link 
                      href="/my-profile"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/my-profile"
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      My Profile
                    </Link>
                  </>
                )}
                
                {/* Admin/Support Only Navigation */}
                {isAuthenticated && ((user as any)?.isAdmin || (user as any)?.isSupport) && (
                  <>
                    {/* My Works Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                            location === "/admin" && (window.location.search.includes('tab=my-works') || window.location.search.includes('tab=volunteers') || window.location.search.includes('tab=financial') || window.location.search.includes('tab=stories') || window.location.search.includes('tab=access') || window.location.search.includes('tab=invites') || !window.location.search)
                              ? "text-primary bg-primary/10"
                              : "text-gray-700 hover:text-primary"
                          }`}
                        >
                          My Works
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <Link href="/admin?tab=my-works" className="w-full cursor-pointer">
                            Overview
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin?tab=volunteers" className="w-full cursor-pointer">
                            Volunteers
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin?tab=financial" className="w-full cursor-pointer">
                            Financial
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin?tab=stories" className="w-full cursor-pointer">
                            Stories
                          </Link>
                        </DropdownMenuItem>
                        {(user as any)?.isAdmin && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/admin?tab=access" className="w-full cursor-pointer">
                                Access
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/admin?tab=invites" className="w-full cursor-pointer">
                                Invites
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Link 
                      href="/admin?tab=kyc"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/admin" && window.location.search.includes('tab=kyc')
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      KYC
                    </Link>
                    <Link 
                      href="/admin?tab=campaigns"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/admin" && window.location.search.includes('tab=campaigns')
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      Campaigns
                    </Link>
                    <Link 
                      href="/admin?tab=reports"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/admin" && window.location.search.includes('tab=reports')
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      Reports
                    </Link>
                    <Link 
                      href="/admin?tab=tickets"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === "/admin" && window.location.search.includes('tab=tickets')
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary"
                      }`}
                    >
                      Tickets
                    </Link>

                    {/* Admin Navigation Items */}
                    {adminNavItems.map((item) => (
                      <Link 
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          location === item.href
                            ? "text-primary bg-primary/10"
                            : "text-gray-700 hover:text-primary"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated && user && (
              <div className="hidden md:flex items-center gap-2 sm:gap-3">
                {/* Notification Bell */}
                <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="relative p-2"
                      data-testid="button-notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
<Link href={(user as any)?.isAdmin || (user as any)?.isSupport ? "/admin?tab=notifications" : "/notifications"}>                          <Button variant="ghost" size="sm" className="text-xs" data-testid="button-view-all-notifications">
                            View all
                          </Button>
                        </Link>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {!Array.isArray(notifications) || notifications.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          (notifications || []).slice(0, 5).map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                                !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
                              }`}
                              onClick={() => {
                                if (!notification.isRead) {
                                  markAsReadMutation.mutate(notification.id);
                                }
                                // Navigate to action URL if available
                                if (notification.actionUrl) {
                                  window.location.href = notification.actionUrl;
                                } else {
// Fallback to notifications page - route to admin panel for admin users
                                  if ((user as any)?.isAdmin || (user as any)?.isSupport) {
                                    window.location.href = '/admin?tab=notifications';
                                  } else {
                                    window.location.href = '/notifications';
                                  }                                }
                                setIsNotificationOpen(false);
                              }}
                              data-testid={`notification-${notification.id}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-sm">{notification.title}</h4>
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Unknown time'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        {Array.isArray(notifications) && notifications.length > 5 && (
                          <div className="text-center py-2 border-t">
<Link href={(user as any)?.isAdmin || (user as any)?.isSupport ? "/admin?tab=notifications" : "/notifications"}>                              <Button variant="ghost" size="sm" className="text-xs">
                                View {Math.max(0, (notifications?.length || 0) - 5)} more notifications
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                
                {/* Show peso balance and deposit only for regular users, not admin/support */}
                {!(user as any)?.isAdmin && !(user as any)?.isSupport && (
                  <>
<div className="flex items-center gap-2 bg-gray-100 px-2 sm:px-3 py-2 rounded-lg">                      <span className="text-sm font-medium">
                        ₱{parseFloat((user as any).phpBalance || "0").toLocaleString()}
                      </span>
                      <Badge variant="secondary" className="text-xs">PHP</Badge>
                    </div>
                    <DepositModal />
                  </>
                )}
              </div>
            )}

            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  className="bg-primary text-white hover:bg-primary/90 rounded-lg px-6"
onClick={() => {
                    import('@/lib/loginModal').then(m => m.openLoginModal());
                  }}                  data-testid="button-sign-in"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"                  onClick={async () => {
                    try {
                      // Sign out from Supabase (clears OAuth tokens)
                      await supabase.auth.signOut();
                    } catch {}

                    try {
                      // Clear server-side session
                      await apiRequest("POST", "/api/auth/signout", {});
                    } catch {}

                    // Clear client caches and redirect to landing page
                    queryClient.clear();
                    window.location.href = "/";
                  }}
                  data-testid="button-logout"
                >
                  <Power className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Mobile notification bell and menu button - show only when authenticated */}
            {isAuthenticated && (
              <div className="md:hidden flex items-center gap-2">
                {/* Notification bell for all users */}
                <button
                  className="p-2 relative"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  data-testid="button-notification-mobile"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  className="p-2"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  data-testid="button-mobile-menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && isAuthenticated && (
          <div className="md:hidden border-t border-gray-200/50 backdrop-blur-xl bg-white/95 shadow-2xl rounded-b-3xl overflow-hidden max-h-[87vh] overflow-y-auto">
            <div className="p-2.5 space-y-2.5">
              {/* User Profile Section */}
              <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-2.5 border border-green-100">
                {/* Shield Badge for Verified Users */}
                {(() => {
                  const kycStatus = (user as any)?.kycStatus?.toLowerCase();
                  if (kycStatus === 'verified' || kycStatus === 'approved') {
                    return (
                      <div className="absolute top-2 right-3 bg-green-500 rounded-full p-2.5 border-2 border-white shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield w-5 h-5 text-white fill-current">
                          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                        </svg>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-200">
                    {(user as any)?.profileImageUrl ? (
                      <img 
                        src={(user as any).profileImageUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                <span class="text-white font-semibold text-sm">
                                  ${(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                                </span>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900">
                        {(user as any)?.firstName} {(user as any)?.lastName}
                      </p>
                      {(() => {
                        const kycStatus = (user as any)?.kycStatus?.toLowerCase();
                        if (kycStatus === 'verified' || kycStatus === 'approved') {
                          return (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                              ✓ Verified
                            </Badge>
                          );
                        } else if (kycStatus === 'pending' || kycStatus === 'on_progress') {
                          return (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                              ⏳ Pending
                            </Badge>
                          );
                        } else if (kycStatus === 'rejected') {
                          return (
                            <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                              ✗ Rejected
                            </Badge>
                          );
                        } else {
                          return (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
                              ⭕ Unverified
                            </Badge>
                          );
                        }
                      })()}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {(user as any)?.email}
                    </p>
                  </div>
                </div>
                <Link
                  href="/my-profile"
                  className={`mt-2 block w-full px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location === "/my-profile"
                      ? "bg-green-600 text-white shadow-lg"
                      : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  👤 View My Profile
                </Link>
              </div>

              {/* Regular User Mobile Menu */}
              {!(user as any)?.isAdmin && !(user as any)?.isSupport && (
                <>
                  {/* My Opportunities Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-2.5 border border-green-100">
                    <div className="flex items-center space-x-2 mb-2.5">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs">🎯</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">My Opportunities</h3>
                  </div>
                    <div className="space-y-1.5">
                <Link 
                  href="/browse-campaigns"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location === "/browse-campaigns"
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                        <span className="text-lg">📋</span>
                        <span>Campaign Opportunities</span>
                </Link>
                <Link 
                  href="/volunteer"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location === "/volunteer"
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                        <span className="text-lg">🤝</span>
                        <span>Volunteer Opportunities</span>
                </Link>
                    </div>
              </div>

                  {/* My Campaigns Section */}
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-2.5 border border-purple-100">
                    <div className="flex items-center space-x-2 mb-2.5">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs">🚀</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">My Campaigns</h3>
              </div>
                    <div className="space-y-1.5">
                <Link 
                  href="/campaigns"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location === "/campaigns"
                            ? "bg-purple-600 text-white shadow-lg"
                            : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                        <span className="text-lg">📊</span>
                        <span>Campaign Overview</span>
                </Link>
                <Link 
                  href="/volunteer-applications"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location === "/volunteer-applications"
                            ? "bg-purple-600 text-white shadow-lg"
                            : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                        <span className="text-lg">📝</span>
                        <span>Volunteer Applications</span>
                </Link>
              </div>
                  </div>


                </>
              )}

              {/* Admin/Support Mobile Menu */}
              {((user as any)?.isAdmin || (user as any)?.isSupport) && (
                <>
                  {/* Admin Dashboard Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-2.5 border border-green-100">
                    <div className="flex items-center space-x-2 mb-2.5">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs">⚙️</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">Admin Dashboard</h3>
                    </div>
                    <div className="space-y-1.5">
                      <Link 
                        href="/admin?tab=insights"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          location === "/admin" && window.location.search.includes('tab=insights')
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg">📊</span>
                        <span>Insights</span>
                      </Link>
                      <Link 
                        href="/admin?tab=kyc"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          location === "/admin" && window.location.search.includes('tab=kyc')
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg">🆔</span>
                        <span>KYC Management</span>
                      </Link>
                      <Link 
                        href="/admin?tab=campaigns"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          location === "/admin" && window.location.search.includes('tab=campaigns')
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg">🎯</span>
                        <span>Campaigns</span>
                      </Link>
                      <Link 
                        href="/admin?tab=reports"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          location === "/admin" && window.location.search.includes('tab=reports')
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg">📈</span>
                        <span>Reports</span>
                      </Link>
                    </div>
                  </div>

                  {/* My Works Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-2.5 border border-green-100">
                    <div className="flex items-center space-x-2 mb-2.5">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs">💼</span>
                  </div>
                      <h3 className="font-semibold text-gray-900">My Works</h3>
                    </div>
                    <div className="space-y-1.5">
                      <Link 
                        href="/admin?tab=my-works"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          location === "/admin" && (window.location.search.includes('tab=my-works') || !window.location.search)
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg">📋</span>
                        <span>Overview</span>
                      </Link>
                      <Link 
                        href="/admin?tab=volunteers"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          location === "/admin" && window.location.search.includes('tab=volunteers')
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg">👥</span>
                        <span>Volunteers</span>
                      </Link>
                      <Link 
                        href="/admin?tab=financial"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          location === "/admin" && window.location.search.includes('tab=financial')
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg">💰</span>
                        <span>Financial</span>
                      </Link>
                      <Link 
                        href="/admin?tab=stories"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          location === "/admin" && window.location.search.includes('tab=stories')
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg">📖</span>
                        <span>Stories</span>
                      </Link>
                      {(user as any)?.isAdmin && (
                        <>
                          <Link 
                            href="/admin?tab=access"
                            className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                              location === "/admin" && window.location.search.includes('tab=access')
                                ? "bg-green-600 text-white shadow-lg"
                                : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <span className="text-lg">🔐</span>
                            <span>Access</span>
                          </Link>
                          <Link 
                            href="/admin?tab=invites"
                            className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                              location === "/admin" && window.location.search.includes('tab=invites')
                                ? "bg-green-600 text-white shadow-lg"
                                : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md"
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <span className="text-lg">📧</span>
                            <span>Invites</span>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Wallet Balance Section for regular users only, not admin/support */}
              {user && !(user as any)?.isAdmin && !(user as any)?.isSupport && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-2.5 border border-green-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Coins className="text-white w-3 h-3" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Wallet Balance</h3>
                    </div>
                    <DepositModal 
                      showText={true} 
                      className="bg-white border-green-200 hover:border-green-300 hover:bg-green-50 h-8 px-3 text-sm"
                    />
                  </div>
                  <div className="bg-white/70 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">
                      ₱{parseFloat((user as any).phpBalance || "0").toLocaleString()}
                    </span>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">PHP</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Available
                    </div>
                  </div>
                </div>
              )}

              {/* Logout Button - Always at the bottom */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-2.5 border border-gray-100 -mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all duration-200"
                  onClick={async () => {
                    try {
                      // Sign out from Supabase (clears OAuth tokens)
                      await supabase.auth.signOut();
                    } catch {}

                    try {
                      // Clear server-side session
                      await apiRequest("POST", "/api/auth/signout", {});
                    } catch {}

                    // Clear client caches and redirect to landing page
                    queryClient.clear();
                    window.location.href = "/";
                  }}
                  data-testid="button-logout-mobile"
                >
                  <Power className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
