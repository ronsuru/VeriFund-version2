import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical,
  Heart,
  MessageCircle,
  Award,
  Shield,
  Megaphone,
  Users,
  DollarSign,
Target,
  ArrowLeft,
  Home} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";// Notification type icons mapping
const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, JSX.Element> = {
    campaign_interest_match: <Target className="w-5 h-5 text-blue-500" />,
    campaign_update: <Megaphone className="w-5 h-5 text-green-500" />,
    volunteer_task: <Users className="w-5 h-5 text-purple-500" />,
    contribution_received: <DollarSign className="w-5 h-5 text-green-600" />,
    tip_received: <Heart className="w-5 h-5 text-pink-500" />,
    comment_mention: <MessageCircle className="w-5 h-5 text-blue-400" />,
    admin_announcement: <Megaphone className="w-5 h-5 text-orange-500" />,
    reward_distribution: <Award className="w-5 h-5 text-yellow-500" />,
    security_update: <Shield className="w-5 h-5 text-red-500" />,
  };
  return iconMap[type] || <Bell className="w-5 h-5 text-gray-500" />;
};

// Priority colors
const getPriorityColor = (priority: string) => {
  const colorMap: Record<string, string> = {
    urgent: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200", 
    normal: "bg-blue-100 text-blue-800 border-blue-200",
    low: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colorMap[priority] || colorMap.normal;
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
const { user } = useAuth();  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
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
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to the action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    // Tab filter
    if (activeTab === "unread" && notification.isRead) return false;
    if (activeTab === "read" && !notification.isRead) return false;

    // Type filter
    if (filterType !== "all" && notification.type !== filterType) return false;

    // Search filter
    if (searchQuery && 
        !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups: Record<string, Notification[]>, notification) => {
    const date = new Date(notification.createdAt || new Date()).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {});

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalCount = notifications.length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
{/* Navigation Header */}
      <div className="bg-white border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/my-profile">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Profile</span>
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Logged in as:</span>
            <span className="text-sm font-medium text-gray-700">{user?.email || 'User'}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-gray-500">My Profile</span>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-700 font-medium">Notifications</span>
          </div>          <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-notifications">
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your notifications and stay updated with important activities
          </p>
<div className="mt-2 flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-blue-600 font-medium">Personal Notifications - {user?.email || 'User'}</span>
          </div>        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1">
            {unreadCount} unread of {totalCount}
          </Badge>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              variant="outline"
              size="sm"
              data-testid="button-mark-all-read"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-notifications"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48" data-testid="select-filter-type">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="campaign_interest_match">Campaign Matches</SelectItem>
                  <SelectItem value="campaign_update">Campaign Updates</SelectItem>
                  <SelectItem value="volunteer_task">Volunteer Tasks</SelectItem>
                  <SelectItem value="contribution_received">Contributions</SelectItem>
                  <SelectItem value="tip_received">Tips</SelectItem>
                  <SelectItem value="comment_mention">Comments</SelectItem>
                  <SelectItem value="admin_announcement">Announcements</SelectItem>
                  <SelectItem value="reward_distribution">Rewards</SelectItem>
                  <SelectItem value="security_update">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Notification Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="unread" data-testid="tab-unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read" data-testid="tab-read">
            Read ({totalCount - unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          ) : Object.keys(groupedNotifications).length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-muted-foreground">
                {activeTab === "unread" 
                  ? "You're all caught up! No unread notifications."
                  : activeTab === "read"
                  ? "No read notifications yet."
                  : "You haven't received any notifications yet."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([date, dayNotifications]) => (
                <div key={date} className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                    {date === new Date().toDateString() ? "Today" : 
                     date === new Date(Date.now() - 86400000).toDateString() ? "Yesterday" : 
                     date}
                  </h3>
                  <div className="space-y-2">
                    {dayNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          !notification.isRead 
                            ? "bg-blue-50 border-blue-200 hover:bg-blue-100" 
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                        data-testid={`notification-card-${notification.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900 truncate">
                                      {notification.title}
                                    </h4>
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                    )}
                                    {notification.priority && notification.priority !== "normal" && (
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${getPriorityColor(notification.priority)}`}
                                      >
                                        {notification.priority}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                      {new Date(notification.createdAt || new Date()).toLocaleString()}
                                    </span>
                                    {notification.actionUrl && (
                                      <Badge variant="outline" className="text-xs">
                                        Click to view
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {!notification.isRead && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markAsReadMutation.mutate(notification.id);
                                        }}
                                      >
                                        Mark as read
                                      </DropdownMenuItem>
                                    )}
                                    {notification.actionUrl && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(notification.actionUrl, '_blank');
                                        }}
                                      >
                                        Open in new tab
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}