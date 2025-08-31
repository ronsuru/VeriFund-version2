import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share2, 
  Trash2, 
  Users, 
  Calendar,
  User as UserIcon,
  Mail,
  BookOpen,
  PlusCircle,
  Search
} from "lucide-react";
import { format } from "date-fns";

interface Publication {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  featuredImageUrl?: string;
  category: string;
  tags: string[];
  viewCount: number;
  reactCount: number;
  commentCount: number;
  shareCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PublicationAuthor {
  authorId: string;
  firstName: string;
  lastName: string;
  email: string;
  publishedCount: number;
  totalCount: number;
  totalViews: number;
  totalReacts: number;
}

export default function PublicationsTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeSubTab, setActiveSubTab] = useState("create");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Create publication form state
  const [createForm, setCreateForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    tags: "",
    status: "draft" as const,
    featuredImageUrl: ""
  });

  // Fetch stories
  const { data: stories = [], isLoading: storiesLoading, error: storiesError } = useQuery({
    queryKey: ['/api/admin/stories', statusFilter, searchTerm, sortBy, sortOrder],
    retry: false,
  });

  // Fetch story authors/writers
  const { data: authors = [], isLoading: authorsLoading, error: authorsError } = useQuery({
    queryKey: ['/api/admin/stories/authors'],
    retry: false,
  });

  // Create publication mutation
  const createPublicationMutation = useMutation({
    mutationFn: async (storyData: any) => {
      return await apiRequest('/api/admin/stories', 'POST', storyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stories/authors'] });
      toast({
        title: "Publication Created",
        description: "The publication has been created successfully.",
      });
      // Reset form
      setCreateForm({
        title: "",
        content: "",
        excerpt: "",
        category: "",
        tags: "",
        status: "draft",
        featuredImageUrl: ""
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
import('@/lib/loginModal').then(m => m.openLoginModal());        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create publication. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update story status mutation
  const updateStoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await apiRequest(`/api/admin/stories/${id}`, 'PUT', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stories/authors'] });
      toast({
        title: "Publication Updated",
        description: "The publication has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
import('@/lib/loginModal').then(m => m.openLoginModal());        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update publication. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete story mutation
  const deleteStoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/stories/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stories/authors'] });
      toast({
        title: "Publication Deleted",
        description: "The publication has been deleted successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
import('@/lib/loginModal').then(m => m.openLoginModal());        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete publication. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.title.trim() || !createForm.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required fields.",
        variant: "destructive",
      });
      return;
    }

    const tagsArray = createForm.tags.trim() ? 
      createForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
      [];

    createPublicationMutation.mutate({
      ...createForm,
      authorId: user?.id || '',
      tags: tagsArray,
    });
  };

  const handleStatusChange = (publication: Publication, newStatus: string) => {
    updateStoryMutation.mutate({
      id: publication.id,
      updates: { status: newStatus }
    });
  };

  const handleDelete = (publication: Publication) => {
    if (window.confirm(`Are you sure you want to delete "${publication.title}"?`)) {
      deleteStoryMutation.mutate(publication.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      published: "default",
      archived: "outline"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredPublications = (stories as Publication[]).filter((pub: Publication) => {
    const matchesSearch = pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pub.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pub.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || pub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedPublications = [...filteredPublications].sort((a: Publication, b: Publication) => {
    const aValue = a[sortBy as keyof Publication] as string | number;
    const bValue = b[sortBy as keyof Publication] as string | number;
    
    if (sortOrder === "asc") {
      return (aValue || '') > (bValue || '') ? 1 : -1;
    } else {
      return (aValue || '') < (bValue || '') ? 1 : -1;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-green-600">Publications Management</h2>
          <p className="text-muted-foreground">Create, manage, and monitor platform stories</p>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create" data-testid="tab-create-publication">Create Publication</TabsTrigger>
          <TabsTrigger value="list" data-testid="tab-list-stories">List Publications</TabsTrigger>
          <TabsTrigger value="writers" data-testid="tab-list-writers">List Writers</TabsTrigger>
        </TabsList>

        {/* Create Publication Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-green-600" />
                <span>Create New Publication</span>
              </CardTitle>
              <CardDescription>
                Create news articles, announcements, and other content for the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={createForm.title}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter publication title"
                      data-testid="input-publication-title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={createForm.category} onValueChange={(value) => setCreateForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger data-testid="select-publication-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="news">News</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="update">Platform Update</SelectItem>
                        <SelectItem value="guide">Guide</SelectItem>
                        <SelectItem value="community">Community</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={createForm.excerpt}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief summary of the publication"
                    rows={2}
                    data-testid="textarea-publication-excerpt"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={createForm.content}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your publication content here"
                    rows={8}
                    data-testid="textarea-publication-content"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={createForm.tags}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="Enter tags separated by commas"
                      data-testid="input-publication-tags"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="featuredImage">Featured Image URL</Label>
                    <Input
                      id="featuredImage"
                      value={createForm.featuredImageUrl}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, featuredImageUrl: e.target.value }))}
                      placeholder="Enter image URL"
                      data-testid="input-publication-image"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={createForm.status} onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger data-testid="select-publication-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createPublicationMutation.isPending}
                  data-testid="button-create-publication"
                >
                  {createPublicationMutation.isPending ? "Creating..." : "Create Publication"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List Publications Tab */}
        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                <span>Publications List</span>
              </CardTitle>
              <CardDescription>
                Manage and monitor all platform stories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search stories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-stories"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order as "asc" | "desc");
                }}>
                  <SelectTrigger className="w-[150px]" data-testid="select-sort-by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="title-asc">Title A-Z</SelectItem>
                    <SelectItem value="title-desc">Title Z-A</SelectItem>
                    <SelectItem value="viewCount-desc">Most Views</SelectItem>
                    <SelectItem value="reactCount-desc">Most Reactions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {storiesError && (
                <Alert className="mb-4">
                  <AlertDescription>
                    Error loading stories. Please try again later.
                  </AlertDescription>
                </Alert>
              )}

              {storiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading stories...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedPublications.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No stories found</p>
                    </div>
                  ) : (
                    sortedPublications.map((publication: Publication) => (
                      <Card key={publication.id} data-testid={`publication-card-${publication.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-lg">{publication.title}</h3>
                                {getStatusBadge(publication.status)}
                              </div>
                              
                              {publication.excerpt && (
                                <p className="text-muted-foreground mb-3">{publication.excerpt}</p>
                              )}
                              
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{format(new Date(publication.createdAt), 'MMM dd, yyyy')}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Eye className="w-4 h-4" />
                                  <span>{publication.viewCount} views</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Heart className="w-4 h-4" />
                                  <span>{publication.reactCount} reactions</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <MessageSquare className="w-4 h-4" />
                                  <span>{publication.commentCount} comments</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Share2 className="w-4 h-4" />
                                  <span>{publication.shareCount} shares</span>
                                </span>
                              </div>
                              
                              {publication.category && (
                                <Badge variant="outline" className="mb-2">
                                  {publication.category}
                                </Badge>
                              )}
                              
                              {publication.tags && publication.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {publication.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col space-y-2 ml-4">
                              <Select 
                                value={publication.status} 
                                onValueChange={(value) => handleStatusChange(publication, value)}
                              >
                                <SelectTrigger className="w-[120px]" data-testid={`select-status-${publication.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="published">Published</SelectItem>
                                  <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(publication)}
                                disabled={deleteStoryMutation.isPending}
                                data-testid={`button-delete-${publication.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* List Writers Tab */}
        <TabsContent value="writers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <span>Writers & Authors</span>
              </CardTitle>
              <CardDescription>
                View statistics and performance of publication authors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authorsError && (
                <Alert className="mb-4">
                  <AlertDescription>
                    Error loading authors. Please try again later.
                  </AlertDescription>
                </Alert>
              )}

              {authorsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading authors...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(authors as PublicationAuthor[]).length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No authors found</p>
                    </div>
                  ) : (
                    (authors as PublicationAuthor[]).map((author: PublicationAuthor) => (
                      <Card key={author.authorId} data-testid={`author-card-${author.authorId}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {author.firstName} {author.lastName}
                                </h3>
                                <p className="text-muted-foreground text-sm flex items-center space-x-1">
                                  <Mail className="w-4 h-4" />
                                  <span>{author.email}</span>
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold text-green-600">{author.publishedCount}</div>
                                <div className="text-xs text-muted-foreground">Published</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-blue-600">{author.totalCount}</div>
                                <div className="text-xs text-muted-foreground">Total</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-purple-600">{author.totalViews}</div>
                                <div className="text-xs text-muted-foreground">Views</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-red-600">{author.totalReacts}</div>
                                <div className="text-xs text-muted-foreground">Reactions</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}