'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Pin,
  PinOff,
  Archive,
  RotateCcw,
  Trash2,
  Eye,
  MessageCircle,
  Clock,
  Sparkles,
  Filter,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import type { AdminFeedbackPostWithDetails } from '@/lib/feedback-admin-service';

interface ModerationStats {
  total_posts: number;
  active_posts: number;
  pinned_posts: number;
  anonymous_posts: number;
  archived_posts: number;
  total_comments: number;
}

export default function FeedbackModerationPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminFeedbackPostWithDetails[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/feedback/posts?include_stats=true');
      const result = await response.json();

      if (result.success) {
        setPosts(result.data || []);
        setStats(result.stats || null);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeratePost = async (postId: string, action: string) => {
    const confirmMessages = {
      pin: 'Pin this post?',
      unpin: 'Unpin this post?',
      archive: 'Archive this post? It will be hidden from pilots.',
      activate: 'Activate this post? It will be visible to pilots.',
      remove: 'Remove this post? This action cannot be easily undone.',
    };

    if (!confirm(confirmMessages[action as keyof typeof confirmMessages])) return;

    setProcessingId(postId);

    try {
      const response = await fetch(`/api/admin/feedback/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (result.success) {
        fetchPosts();
      } else {
        alert(result.error || `Failed to ${action} post`);
      }
    } catch (error) {
      console.error(`Error ${action}ing post:`, error);
      alert(`Failed to ${action} post`);
    } finally {
      setProcessingId(null);
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

  const filteredPosts = posts.filter((post) => {
    if (statusFilter === 'all') return true;
    return post.status === statusFilter;
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4002B] mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading moderation dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <MessageSquare className="w-8 h-8 mr-3 text-[#E4002B]" />
          Feedback Moderation
        </h1>
        <p className="text-gray-600 mt-2">
          Review and moderate pilot feedback posts
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_posts}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active_posts}</p>
              </div>
              <Eye className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Pinned</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.pinned_posts}</p>
              </div>
              <Pin className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Anonymous</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.anonymous_posts}</p>
              </div>
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Archived</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.archived_posts}</p>
              </div>
              <Archive className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Comments</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.total_comments}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-semibold text-gray-700">Filter:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#E4002B] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-[#E4002B] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'archived'
                ? 'bg-[#E4002B] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts to moderate</h3>
            <p className="text-gray-600">All posts have been reviewed</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className={`bg-white rounded-xl shadow-md p-6 border ${
                post.status === 'archived'
                  ? 'border-orange-200 bg-orange-50'
                  : post.is_pinned
                  ? 'border-blue-200'
                  : 'border-gray-200'
              }`}
            >
              {/* Status Badges */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{post.category_icon || '💬'}</span>
                <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">
                  {post.category_name}
                </span>
                {post.is_pinned && (
                  <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full flex items-center gap-1">
                    <Pin className="w-3 h-3" />
                    Pinned
                  </span>
                )}
                {post.status === 'archived' && (
                  <span className="px-3 py-1 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full flex items-center gap-1">
                    <Archive className="w-3 h-3" />
                    Archived
                  </span>
                )}
                {post.is_anonymous && (
                  <span className="px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Anonymous
                  </span>
                )}
              </div>

              {/* Title */}
              <h3
                className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-[#E4002B] transition-colors"
                onClick={() => router.push(`/pilot/feedback/${post.id}`)}
              >
                {post.title}
              </h3>

              {/* Content Preview */}
              <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>

              {/* Author Info - Shows real identity for anonymous posts */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      {post.is_anonymous ? 'Real Author (Admin Only):' : 'Author:'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {post.real_author_name}
                      </span>
                      {post.real_author_rank && (
                        <span className="text-xs text-gray-500">({post.real_author_rank})</span>
                      )}
                      <span className="text-xs text-gray-500 font-mono">
                        {post.real_author_employee_id}
                      </span>
                    </div>
                    {post.is_anonymous && (
                      <p className="text-xs text-purple-600 mt-1">
                        Displayed as: {post.author_display_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.view_count || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.comment_count || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Moderation Actions */}
              <div className="flex gap-2">
                {post.status === 'active' ? (
                  <>
                    {post.is_pinned ? (
                      <button
                        onClick={() => handleModeratePost(post.id, 'unpin')}
                        disabled={processingId === post.id}
                        className="px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <PinOff className="w-4 h-4" />
                        Unpin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleModeratePost(post.id, 'pin')}
                        disabled={processingId === post.id}
                        className="px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <Pin className="w-4 h-4" />
                        Pin
                      </button>
                    )}
                    <button
                      onClick={() => handleModeratePost(post.id, 'archive')}
                      disabled={processingId === post.id}
                      className="px-3 py-1.5 text-sm font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleModeratePost(post.id, 'activate')}
                    disabled={processingId === post.id}
                    className="px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Activate
                  </button>
                )}
                <button
                  onClick={() => router.push(`/pilot/feedback/${post.id}`)}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
