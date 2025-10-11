'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Eye,
  Clock,
  Sparkles,
  Send,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { FeedbackPostWithDetails, FeedbackCommentWithAuthor } from '@/lib/feedback-service';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
});

type CommentFormData = z.infer<typeof commentSchema>;

export default function FeedbackPostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<FeedbackPostWithDetails | null>(null);
  const [comments, setComments] = useState<FeedbackCommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/pilot/feedback/posts/${postId}`);
      const result = await response.json();

      if (result.success) {
        setPost(result.data);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/pilot/feedback/posts/${postId}/comments`);
      const result = await response.json();

      if (result.success) {
        setComments(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const onSubmitComment = async (data: CommentFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/pilot/feedback/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data.content,
          parent_comment_id: replyingTo,
        }),
      });

      const result = await response.json();

      if (result.success) {
        reset();
        setReplyingTo(null);
        fetchComments();
        fetchPost(); // Refresh to update comment count
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/pilot/feedback/comments/${commentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchComments();
        fetchPost();
      } else {
        alert(result.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const canDeleteComment = (comment: FeedbackCommentWithAuthor) => {
    if (comment.deleted_at) return false;

    const commentAge = Date.now() - new Date(comment.created_at).getTime();
    const oneHour = 60 * 60 * 1000;

    return commentAge <= oneHour;
  };

  // Organize comments by parent-child relationship
  const topLevelComments = comments.filter((c) => !c.parent_comment_id);
  const getReplies = (commentId: string) =>
    comments.filter((c) => c.parent_comment_id === commentId);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4002B] mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Post not found</h3>
          <p className="text-gray-600 mb-6">This post may have been deleted or does not exist</p>
          <button
            onClick={() => router.push('/pilot/feedback')}
            className="px-6 py-3 bg-[#E4002B] text-white rounded-lg hover:bg-[#C00020] transition-colors"
          >
            Back to Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/pilot/feedback')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Feedback
      </button>

      {/* Post Card */}
      <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
        {/* Category Badge */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{post.category_icon || '💬'}</span>
          <span className="px-3 py-1 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full">
            {post.category_name}
          </span>
          {post.is_pinned && (
            <span className="px-3 py-1 text-sm font-semibold text-[#E4002B] bg-red-50 rounded-full">
              📌 Pinned
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

        {/* Author & Metadata */}
        <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{post.author_display_name}</span>
            {post.author_rank && <span className="text-xs">({post.author_rank})</span>}
            {post.is_anonymous && (
              <span className="flex items-center gap-1 text-xs text-purple-600">
                <Sparkles className="w-3 h-3" />
                Anonymous
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {post.view_count || 0} views
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {post.comment_count || 0} comments
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDate(post.created_at)}
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none mb-6">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <MessageCircle className="w-6 h-6 mr-2" />
          Comments ({comments.length})
        </h2>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit(onSubmitComment)} className="mb-8">
          <div className="mb-3">
            <textarea
              {...register('content')}
              rows={4}
              placeholder={replyingTo ? 'Write your reply...' : 'Share your thoughts...'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent resize-none"
            />
            {errors.content && (
              <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
            )}
          </div>
          {replyingTo && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel Reply
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#E4002B] text-white rounded-lg hover:bg-[#C00020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>

        {/* Comments List */}
        <div className="space-y-6">
          {topLevelComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            topLevelComments.map((comment) => (
              <div key={comment.id} className="space-y-4">
                {/* Top-level comment */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">
                      {comment.author_name?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-semibold text-gray-900">{comment.author_name}</span>
                          {comment.author_rank && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({comment.author_rank})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-sm text-gray-600 hover:text-[#E4002B] transition-colors"
                      >
                        Reply
                      </button>
                      {canDeleteComment(comment) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-sm text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Replies */}
                    {getReplies(comment.id).length > 0 && (
                      <div className="ml-8 mt-4 space-y-4">
                        {getReplies(comment.id).map((reply) => (
                          <div key={reply.id} className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-gray-600">
                                {reply.author_name?.[0] || '?'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <span className="font-semibold text-gray-900 text-sm">
                                      {reply.author_name}
                                    </span>
                                    {reply.author_rank && (
                                      <span className="text-xs text-gray-500 ml-2">
                                        ({reply.author_rank})
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(reply.created_at)}
                                  </span>
                                </div>
                                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                  {reply.content}
                                </p>
                              </div>
                              {canDeleteComment(reply) && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="text-xs text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 mt-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
