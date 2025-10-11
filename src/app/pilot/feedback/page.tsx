'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Plus,
  TrendingUp,
  Clock,
  Eye,
  MessageCircle,
  Filter,
  Search,
  Sparkles,
} from 'lucide-react';
import type { FeedbackPostWithDetails } from '@/lib/feedback-service';
import type { Database } from '@/types/supabase';
import { CreateCategoryModal } from '@/components/feedback/CreateCategoryModal';
import { CreatePostModal } from '@/components/feedback/CreatePostModal';

type FeedbackCategory = Database['public']['Tables']['feedback_categories']['Row'];

export default function PilotFeedbackPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<FeedbackCategory[]>([]);
  const [posts, setPosts] = useState<FeedbackPostWithDetails[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/pilot/feedback/categories');
      const result = await response.json();

      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const url = selectedCategory
        ? `/api/pilot/feedback/posts?category_id=${selectedCategory}`
        : '/api/pilot/feedback/posts';

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setPosts(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-[#E4002B]" />
            Feedback & Suggestions
          </h1>
          <p className="text-gray-600 mt-2">
            Share your ideas, suggestions, and feedback with the team
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateCategory(true)}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </button>
          <button
            onClick={() => setShowCreatePost(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#E4002B] rounded-lg hover:bg-[#C00020] transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search posts by title, content, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
        />
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Categories
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-[#E4002B] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Posts
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                selectedCategory === category.id
                  ? 'bg-[#E4002B] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{category.icon || '💬'}</span>
              {category.name}
              <span className="ml-2 text-xs opacity-75">({category.post_count || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
          <div className="text-sm text-gray-500">{filteredPosts.length} posts</div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4002B] mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-6">
              Be the first to share your feedback or suggestion
            </p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-6 py-3 bg-[#E4002B] text-white rounded-lg hover:bg-[#C00020] transition-colors"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => router.push(`/pilot/feedback/${post.id}`)}
                className="w-full bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:border-[#E4002B] hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{post.category_icon || '💬'}</span>
                      <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">
                        {post.category_name}
                      </span>
                      {post.is_pinned && (
                        <span className="px-3 py-1 text-xs font-semibold text-[#E4002B] bg-red-50 rounded-full">
                          📌 Pinned
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-gray-600 line-clamp-2 mb-3">{post.content}</p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {post.author_display_name}
                        </span>
                        {post.author_rank && (
                          <span className="text-xs text-gray-500">({post.author_rank})</span>
                        )}
                        {post.is_anonymous && (
                          <span className="flex items-center gap-1 text-xs text-purple-600">
                            <Sparkles className="w-3 h-3" />
                            Anonymous
                          </span>
                        )}
                      </div>
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
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Category Modal */}
      <CreateCategoryModal
        isOpen={showCreateCategory}
        onClose={() => setShowCreateCategory(false)}
        onSuccess={() => {
          fetchCategories();
          fetchPosts();
        }}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSuccess={() => {
          fetchPosts();
        }}
      />
    </div>
  );
}
