import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Clock, User, Search, RefreshCw, AlertCircle, CheckCircle2, Users, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EmailTicket {
  id: string;
  ticketNumber: string;
  senderEmail: string;
  subject: string;
  emailBody: string;
  emailBodyPreview: string;
  emailReceivedAt: string;
  status: 'pending' | 'claimed' | 'assigned' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  claimedBy?: string;
  claimedByEmail?: string;
  dateClaimed?: string;
  assignedTo?: string;
  assignedByAdmin?: string;
  dateAssigned?: string;
  dateResolved?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTicketsTab() {
  const [selectedTicket, setSelectedTicket] = useState<EmailTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [assignToEmail, setAssignToEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email tickets
  const { data: emailTickets = [], isLoading } = useQuery({
    queryKey: ['/api/admin/email-tickets'],
    retry: false,
  });

  // Claim ticket mutation
  const claimMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      await apiRequest(`/api/admin/email-tickets/${ticketId}/claim`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-tickets'] });
      toast({
        title: "Ticket Claimed",
        description: "Email ticket has been successfully claimed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to claim ticket",
        variant: "destructive",
      });
    },
  });

  // Assign ticket mutation
  const assignMutation = useMutation({
    mutationFn: async ({ ticketId, assignedTo }: { ticketId: string; assignedTo: string }) => {
      await apiRequest(`/api/admin/email-tickets/${ticketId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assignedTo }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-tickets'] });
      setAssignToEmail("");
      toast({
        title: "Ticket Assigned",
        description: "Email ticket has been successfully assigned.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign ticket",
        variant: "destructive",
      });
    },
  });

  // Resolve ticket mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ ticketId, notes }: { ticketId: string; notes: string }) => {
      await apiRequest(`/api/admin/email-tickets/${ticketId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolutionNotes: notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-tickets'] });
      setResolutionNotes("");
      setSelectedTicket(null);
      toast({
        title: "Ticket Resolved",
        description: "Email ticket has been successfully resolved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve ticket",
        variant: "destructive",
      });
    },
  });

  // Fetch emails mutation
  const fetchEmailsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/admin/email-tickets/fetch', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-tickets'] });
      toast({
        title: "Emails Fetched",
        description: "New email tickets have been fetched from trexiaamable@gmail.com",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch emails",
        variant: "destructive",
      });
    },
  });

  // Filter and search tickets
  const filteredTickets = emailTickets.filter((ticket: EmailTicket) => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.senderEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      claimed: "bg-blue-100 text-blue-800",
      assigned: "bg-purple-100 text-purple-800", 
      resolved: "bg-green-100 text-green-800"
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-orange-100 text-orange-800",
      high: "bg-red-100 text-red-800"
    };

    return (
      <Badge className={colors[priority as keyof typeof colors]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'claimed':
        return <User className="h-4 w-4" />;
      case 'assigned':
        return <Users className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Email Support Tickets</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Support Tickets</h2>
          <p className="text-gray-600">Manage emails from trexiaamable@gmail.com</p>
        </div>
        <Button 
          onClick={() => fetchEmailsMutation.mutate()}
          disabled={fetchEmailsMutation.isPending}
          data-testid="button-fetch-emails"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${fetchEmailsMutation.isPending ? 'animate-spin' : ''}`} />
          Fetch New Emails
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <Input
            placeholder="Search by subject, sender, or ticket number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-80"
            data-testid="input-search-tickets"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-1" data-testid="count-pending">
              {emailTickets.filter((t: EmailTicket) => t.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Claimed</span>
            </div>
            <p className="text-2xl font-bold mt-1" data-testid="count-claimed">
              {emailTickets.filter((t: EmailTicket) => t.status === 'claimed').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Assigned</span>
            </div>
            <p className="text-2xl font-bold mt-1" data-testid="count-assigned">
              {emailTickets.filter((t: EmailTicket) => t.status === 'assigned').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Resolved</span>
            </div>
            <p className="text-2xl font-bold mt-1" data-testid="count-resolved">
              {emailTickets.filter((t: EmailTicket) => t.status === 'resolved').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-600">
                {emailTickets.length === 0 
                  ? "No email tickets available. Click 'Fetch New Emails' to load tickets from trexiaamable@gmail.com"
                  : "No tickets match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket: EmailTicket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500" data-testid={`ticket-number-${ticket.id}`}>
                        {ticket.ticketNumber}
                      </span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-1" data-testid={`ticket-subject-${ticket.id}`}>
                      {ticket.subject}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {ticket.senderEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(ticket.emailReceivedAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-4" data-testid={`ticket-preview-${ticket.id}`}>
                      {ticket.emailBodyPreview}
                    </p>

                    {/* Staff Information */}
                    {(ticket.claimedByEmail || ticket.assignedTo) && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {ticket.claimedByEmail && (
                            <div>
                              <span className="font-medium">Claimed by:</span>{" "}
                              <span data-testid={`ticket-claimed-by-${ticket.id}`}>{ticket.claimedByEmail}</span>
                              {ticket.dateClaimed && (
                                <div className="text-gray-500">
                                  {formatDistanceToNow(new Date(ticket.dateClaimed), { addSuffix: true })}
                                </div>
                              )}
                            </div>
                          )}
                          {ticket.assignedTo && (
                            <div>
                              <span className="font-medium">Assigned to:</span>{" "}
                              <span data-testid={`ticket-assigned-to-${ticket.id}`}>{ticket.assignedTo}</span>
                              {ticket.dateAssigned && (
                                <div className="text-gray-500">
                                  {formatDistanceToNow(new Date(ticket.dateAssigned), { addSuffix: true })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Resolution Notes */}
                    {ticket.status === 'resolved' && ticket.resolutionNotes && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800">Resolution Notes</span>
                        </div>
                        <p className="text-green-700 text-sm" data-testid={`ticket-resolution-${ticket.id}`}>
                          {ticket.resolutionNotes}
                        </p>
                        {ticket.dateResolved && (
                          <p className="text-green-600 text-xs mt-1">
                            Resolved {formatDistanceToNow(new Date(ticket.dateResolved), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {/* View Details */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                          data-testid={`button-view-details-${ticket.id}`}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Email Ticket Details</DialogTitle>
                          <DialogDescription>
                            Ticket #{ticket.ticketNumber} • {ticket.senderEmail}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Subject</label>
                            <p className="mt-1">{ticket.subject}</p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium">Full Email Content</label>
                            <div className="mt-1 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm">
                              {ticket.emailBody}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <label className="font-medium">Status:</label> {ticket.status}
                            </div>
                            <div>
                              <label className="font-medium">Priority:</label> {ticket.priority}
                            </div>
                            <div>
                              <label className="font-medium">Received:</label>{" "}
                              {new Date(ticket.emailReceivedAt).toLocaleString()}
                            </div>
                            <div>
                              <label className="font-medium">Last Updated:</label>{" "}
                              {new Date(ticket.updatedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Action Buttons */}
                    {ticket.status === 'pending' && (
                      <Button 
                        size="sm"
                        onClick={() => claimMutation.mutate(ticket.id)}
                        disabled={claimMutation.isPending}
                        data-testid={`button-claim-${ticket.id}`}
                      >
                        {getStatusIcon('claimed')}
                        <span className="ml-1">Claim</span>
                      </Button>
                    )}

                    {(ticket.status === 'claimed' || ticket.status === 'assigned') && (
                      <div className="space-y-2">
                        {/* Assign Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`button-assign-${ticket.id}`}
                            >
                              {getStatusIcon('assigned')}
                              <span className="ml-1">Assign</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Ticket</DialogTitle>
                              <DialogDescription>
                                Assign this ticket to a staff member
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Staff Email</label>
                                <Input
                                  value={assignToEmail}
                                  onChange={(e) => setAssignToEmail(e.target.value)}
                                  placeholder="staff@example.com"
                                  data-testid="input-assign-email"
                                />
                              </div>
                              <Button
                                onClick={() => assignMutation.mutate({ 
                                  ticketId: ticket.id, 
                                  assignedTo: assignToEmail 
                                })}
                                disabled={!assignToEmail || assignMutation.isPending}
                                data-testid="button-confirm-assign"
                              >
                                Assign Ticket
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Resolve Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              data-testid={`button-resolve-${ticket.id}`}
                            >
                              {getStatusIcon('resolved')}
                              <span className="ml-1">Resolve</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Resolve Ticket</DialogTitle>
                              <DialogDescription>
                                Mark this ticket as resolved with optional notes
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Resolution Notes</label>
                                <Textarea
                                  value={resolutionNotes}
                                  onChange={(e) => setResolutionNotes(e.target.value)}
                                  placeholder="Describe how this issue was resolved..."
                                  rows={4}
                                  data-testid="textarea-resolution-notes"
                                />
                              </div>
                              <Button
                                onClick={() => resolveMutation.mutate({ 
                                  ticketId: ticket.id, 
                                  notes: resolutionNotes 
                                })}
                                disabled={resolveMutation.isPending}
                                data-testid="button-confirm-resolve"
                              >
                                Resolve Ticket
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}