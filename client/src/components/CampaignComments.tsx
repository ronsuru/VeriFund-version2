import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Send, MoreHorizontal, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface CommentReply {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  upvotes: number;
  downvotes: number;
  user: User;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  upvotes: number;
  downvotes: number;
  user: User;
  replies: CommentReply[];
}

interface CampaignCommentsProps {
  campaignId: string;
}

export default function CampaignComments({ campaignId }: CampaignCommentsProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['/api/campaigns', campaignId, 'comments'],
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', `/api/campaigns/${campaignId}/comments`, { content });
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'comments'] });
      toast({
        title: 'Comment posted',
        description: 'Your comment has been posted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      return apiRequest('PUT', `/api/comments/${commentId}`, { content });
    },
    onSuccess: () => {
      setEditingCommentId(null);
      setEditContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'comments'] });
      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest('DELETE', `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'comments'] });
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      return apiRequest('POST', `/api/comments/${commentId}/replies`, { content });
    },
    onSuccess: () => {
      setReplyingToId(null);
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'comments'] });
      toast({
        title: 'Reply posted',
        description: 'Your reply has been posted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update reply mutation
  const updateReplyMutation = useMutation({
    mutationFn: async ({ replyId, content }: { replyId: string; content: string }) => {
      return apiRequest('PUT', `/api/replies/${replyId}`, { content });
    },
    onSuccess: () => {
      setEditingReplyId(null);
      setEditContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'comments'] });
      toast({
        title: 'Reply updated',
        description: 'Your reply has been updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: async (replyId: string) => {
      return apiRequest('DELETE', `/api/replies/${replyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'comments'] });
      toast({
        title: 'Reply deleted',
        description: 'Your reply has been deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Vote on comment mutation
  const voteOnCommentMutation = useMutation({
    mutationFn: async ({ commentId, voteType }: { commentId: string; voteType: 'upvote' | 'downvote' }) => {
      return apiRequest('POST', `/api/comments/${commentId}/vote`, { voteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'comments'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Vote on reply mutation
  const voteOnReplyMutation = useMutation({
    mutationFn: async ({ replyId, voteType }: { replyId: string; voteType: 'upvote' | 'downvote' }) => {
      return apiRequest('POST', `/api/replies/${replyId}/vote`, { voteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'comments'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to comment',
        variant: 'destructive',
      });
      return;
    }
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment.trim());
    }
  };

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditContent(currentContent);
  };

  const handleUpdateComment = () => {
    if (editingCommentId && editContent.trim()) {
      updateCommentMutation.mutate({ commentId: editingCommentId, content: editContent.trim() });
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingToId(commentId);
    setReplyContent('');
  };

  const handleSubmitReply = (commentId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to reply',
        variant: 'destructive',
      });
      return;
    }
    if (replyContent.trim()) {
      createReplyMutation.mutate({ commentId, content: replyContent.trim() });
    }
  };

  const handleEditReply = (replyId: string, currentContent: string) => {
    setEditingReplyId(replyId);
    setEditContent(currentContent);
  };

  const handleUpdateReply = () => {
    if (editingReplyId && editContent.trim()) {
      updateReplyMutation.mutate({ replyId: editingReplyId, content: editContent.trim() });
    }
  };

  const handleDeleteReply = (replyId: string) => {
    if (confirm('Are you sure you want to delete this reply?')) {
      deleteReplyMutation.mutate(replyId);
    }
  };

  const getUserInitials = (user: User) => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getUserName = (user: User) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous User';
  };

  return (
    <div className="space-y-6" data-testid="campaign-comments">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {/* New Comment Form */}
      {isAuthenticated ? (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={1000}
                data-testid="input-new-comment"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {newComment.length}/1000 characters
                </span>
                <Button 
                  type="submit" 
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  data-testid="button-submit-comment"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <p className="text-gray-500 text-center">
              Please log in to post comments
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} data-testid={`comment-${comment.id}`}>
              <CardContent className="pt-4">
                <div className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.profileImageUrl} />
                    <AvatarFallback>{getUserInitials(comment.user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{getUserName(comment.user)}</span>
                        <span className="text-gray-500 text-xs ml-2">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          {comment.isEdited && <span className="ml-1">(edited)</span>}
                        </span>
                      </div>
                      {user && 'id' in user && user.id === comment.user.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.content)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Comment Content or Edit Form */}
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          maxLength={1000}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdateComment} disabled={updateCommentMutation.isPending}>
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingCommentId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                    )}

                    {/* Voting and Reply Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Voting buttons for authenticated users */}
                      {isAuthenticated && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => voteOnCommentMutation.mutate({ commentId: comment.id, voteType: 'upvote' })}
                            disabled={voteOnCommentMutation.isPending}
                            className="h-7 px-1"
                            data-testid={`button-upvote-comment-${comment.id}`}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[2ch]">
                            {(comment.upvotes || 0) - (comment.downvotes || 0)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => voteOnCommentMutation.mutate({ commentId: comment.id, voteType: 'downvote' })}
                            disabled={voteOnCommentMutation.isPending}
                            className="h-7 px-1"
                            data-testid={`button-downvote-comment-${comment.id}`}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Net score display for non-authenticated users */}
                      {!isAuthenticated && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <ArrowUp className="h-4 w-4" />
                          <span className="text-sm">{(comment.upvotes || 0) - (comment.downvotes || 0)}</span>
                        </div>
                      )}

                      {/* Reply Button */}
                      {isAuthenticated && editingCommentId !== comment.id && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleReply(comment.id)}
                          data-testid={`button-reply-${comment.id}`}
                        >
                          Reply
                        </Button>
                      )}
                    </div>

                    {/* Reply Form */}
                    {replyingToId === comment.id && (
                      <div className="ml-4 space-y-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          maxLength={500}
                          data-testid={`input-reply-${comment.id}`}
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={!replyContent.trim() || createReplyMutation.isPending}
                            data-testid={`button-submit-reply-${comment.id}`}
                          >
                            Reply
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setReplyingToId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="ml-4 border-l-2 border-gray-200 pl-4 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex space-x-3" data-testid={`reply-${reply.id}`}>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={reply.user.profileImageUrl} />
                              <AvatarFallback className="text-xs">{getUserInitials(reply.user)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-sm">{getUserName(reply.user)}</span>
                                  <span className="text-gray-500 text-xs ml-2">
                                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                    {reply.isEdited && <span className="ml-1">(edited)</span>}
                                  </span>
                                </div>
                                {user && 'id' in user && user.id === reply.user.id && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditReply(reply.id, reply.content)}>
                                        <Edit className="h-3 w-3 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteReply(reply.id)}>
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                              
                              {editingReplyId === reply.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    maxLength={500}
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={handleUpdateReply} disabled={updateReplyMutation.isPending}>
                                      Save
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setEditingReplyId(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-gray-600 dark:text-gray-400 text-sm">{reply.content}</p>
                                  
                                  {/* Reply Voting Buttons */}
                                  <div className="flex items-center gap-2 pt-1">
                                    {/* Voting buttons for authenticated users */}
                                    {isAuthenticated && (
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => voteOnReplyMutation.mutate({ replyId: reply.id, voteType: 'upvote' })}
                                          disabled={voteOnReplyMutation.isPending}
                                          className="h-6 px-1"
                                          data-testid={`button-upvote-reply-${reply.id}`}
                                        >
                                          <ArrowUp className="h-3 w-3" />
                                        </Button>
                                        <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[2ch]">
                                          {(reply.upvotes || 0) - (reply.downvotes || 0)}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => voteOnReplyMutation.mutate({ replyId: reply.id, voteType: 'downvote' })}
                                          disabled={voteOnReplyMutation.isPending}
                                          className="h-6 px-1"
                                          data-testid={`button-downvote-reply-${reply.id}`}
                                        >
                                          <ArrowDown className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                    
                                    {/* Net score display for non-authenticated users */}
                                    {!isAuthenticated && (
                                      <div className="flex items-center gap-1 text-gray-500">
                                        <ArrowUp className="h-3 w-3" />
                                        <span className="text-xs">{(reply.upvotes || 0) - (reply.downvotes || 0)}</span>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
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