import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { insertSupportTicketSchema } from "@shared/schema";
import { z } from "zod";
import { MessageCircle, Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = insertSupportTicketSchema.extend({
  attachments: z.string().optional(),
  relatedCampaignId: z.string().optional(),
  relatedTransactionId: z.string().optional(),
  relatedUserId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function SupportTicketForm() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [attachments, setAttachments] = useState<File[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      message: "",
      category: "general",
      priority: "medium",
      attachments: "",
      relatedCampaignId: "",
      relatedTransactionId: "",
      relatedUserId: "",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // For now, we'll handle file uploads as JSON array in attachments field
      const attachmentUrls = attachments.length > 0 
        ? JSON.stringify(attachments.map(file => `attachment:${file.name}`))
        : undefined;

      return await apiRequest("POST", "/api/support/tickets", {
        ...data,
        attachments: attachmentUrls,
      });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Support Ticket Created",
        description: `Your ticket ${response.ticketNumber || 'has'} has been submitted successfully. You'll receive an email confirmation shortly.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets/my"] });
      setLocation("/my-profile?tab=support-tickets");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create support ticket",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createTicketMutation.mutate(data);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (!isAuthenticated) {
    return (
<div className="min-h-screen bg-background flex items-center justify-center">        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You must be logged in to file a support ticket.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/login")} 
              className="w-full"
              data-testid="button-login"
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
<div className="min-h-screen bg-background py-8">      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            File Support Ticket
          </h1>
          <p className="mt-2 text-gray-600">
            Submit a support request and our team will get back to you within 24 hours.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Support Request Details</CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help us assist you effectively.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General Support</SelectItem>
                            <SelectItem value="technical">Technical Issue</SelectItem>
                            <SelectItem value="billing">Billing & Payments</SelectItem>
                            <SelectItem value="account">Account Management</SelectItem>
                            <SelectItem value="bug_report">Bug Report</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief description of your issue"
                          {...field}
                          data-testid="input-subject"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide detailed information about your issue, including steps to reproduce it if applicable..."
                          className="min-h-[150px] resize-none"
                          {...field}
                          data-testid="textarea-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Related IDs Section */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">Related References (Optional)</h3>
                    <span className="text-sm text-gray-500">
                      These IDs help support staff track your issue faster. Your user ID will be auto-attached.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="relatedCampaignId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Campaign ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="CAM-001234"
                              {...field}
                              data-testid="input-campaign-id"
                            />
                          </FormControl>
                          <div className="text-xs text-gray-500">
                            If reporting about a specific campaign
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="relatedTransactionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Transaction ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="TXN-001234"
                              {...field}
                              data-testid="input-transaction-id"
                            />
                          </FormControl>
                          <div className="text-xs text-gray-500">
                            If reporting about a payment/transaction
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">Supporting Evidence (Optional)</Label>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Upload screenshots, documents, or other files that support your request. 
                      While attachments are optional, they can significantly help our team verify 
                      and process your request more effectively.
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                      data-testid="input-file-upload"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="w-full bg-lime-400 hover:bg-lime-500 text-gray-900 font-medium py-3 rounded-lg"
                      data-testid="button-upload-file"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Evidence Files
                    </Button>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Files:</Label>
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              data-testid={`button-remove-attachment-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setLocation("/my-profile")}
                    className="px-6"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 px-6"
                    data-testid="button-submit-ticket"
                  >
                    {createTicketMutation.isPending ? "Submitting..." : "Submit Ticket"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Support Ticket Footer */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center md:text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Response Time</h3>
                <p className="text-sm text-gray-600">
                  We typically respond to support tickets within 24 hours during business days.
                </p>
              </div>
              
              <div className="text-center md:text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Emergency Support</h3>
                <p className="text-sm text-gray-600">
                  For urgent issues affecting your account security, please mark your ticket as "Urgent".
                </p>
              </div>
              
              <div className="text-center md:text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-sm text-gray-600">
                  Check our <span className="text-blue-600 cursor-pointer hover:underline">FAQ section</span> for common questions and quick solutions.
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                VeriFund Support Team • Available Monday to Friday, 9 AM - 6 PM PST
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}