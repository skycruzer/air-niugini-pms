/**
 * @fileoverview Documents Management Page
 * Main page for document and digital forms management
 *
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-10-07
 */

'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Upload,
  Filter,
  Download,
  Eye,
  Trash2,
  Folder,
  Plus,
  Search,
  BarChart3,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UploadDocumentModal } from '@/components/documents/UploadDocumentModal';
import { NewFormModal } from '@/components/documents/NewFormModal';
import { apiGet } from '@/lib/api-client';
import { format } from 'date-fns';

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNewFormModalOpen, setIsNewFormModalOpen] = useState(false);

  // Fetch documents
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', selectedCategory],
    queryFn: async () => {
      const params = selectedCategory !== 'all' ? `?category_id=${selectedCategory}` : '';
      return apiGet(`/api/documents${params}`);
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      return apiGet('/api/documents?action=categories');
    },
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['document-stats'],
    queryFn: async () => {
      return apiGet('/api/documents?action=statistics');
    },
  });

  // Fetch pilots
  const { data: pilots } = useQuery({
    queryKey: ['pilots'],
    queryFn: async () => {
      return apiGet('/api/pilots');
    },
  });

  // Fetch digital forms
  const { data: forms } = useQuery({
    queryKey: ['digital-forms'],
    queryFn: async () => {
      return apiGet('/api/forms?action=list');
    },
  });

  // Filter documents by search
  const filteredDocuments = documents?.data?.filter((doc: any) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['document-stats'] });
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
    queryClient.invalidateQueries({ queryKey: ['document-stats'] });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileText className="w-8 h-8 mr-3 text-blue-600" />
                Document Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage pilot documents, certifications, and digital forms
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Document
              </button>
              <button
                onClick={() => setIsNewFormModalOpen(true)}
                className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Form
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats?.data && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Documents"
                value={stats.data.totalDocuments}
                icon={FileText}
                color="blue"
                trend="+12%"
              />
              <StatCard
                title="Recent Uploads"
                value={stats.data.recentUploads}
                icon={Upload}
                color="green"
                subtitle="Last 7 days"
              />
              <StatCard
                title="Pending Forms"
                value={stats.data.pendingFormSubmissions}
                icon={BarChart3}
                color="yellow"
                subtitle="Awaiting approval"
              />
              <StatCard
                title="Categories"
                value={categories?.data?.length || 0}
                icon={Folder}
                color="purple"
              />
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* View Toggle */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700'
                  } hover:bg-blue-700 hover:text-white transition-colors`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700'
                  } hover:bg-blue-700 hover:text-white transition-colors`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Documents
            </button>
            {categories?.data?.map((category: any) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Documents Display */}
          {documentsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600">Upload your first document to get started</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc: any) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Uploaded By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDocuments.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="font-medium text-gray-900">{doc.title}</div>
                            <div className="text-sm text-gray-500">{doc.file_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.category && (
                          <span
                            className="px-2 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: doc.category.color + '20',
                              color: doc.category.color,
                            }}
                          >
                            {doc.category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {doc.uploader?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(doc.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Upload Modal */}
          <UploadDocumentModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onSuccess={handleUploadSuccess}
            categories={categories?.data || []}
            pilots={pilots?.data || []}
          />

          {/* New Form Modal */}
          <NewFormModal
            isOpen={isNewFormModalOpen}
            onClose={() => setIsNewFormModalOpen(false)}
            onSuccess={handleFormSuccess}
            forms={forms?.data || []}
            pilots={pilots?.data || []}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function StatCard({ title, value, icon: Icon, color, trend, subtitle }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ document }: { document: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        {document.category && (
          <span
            className="px-2 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: document.category.color + '20',
              color: document.category.color,
            }}
          >
            {document.category.name}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 truncate">{document.title}</h3>
      <p className="text-sm text-gray-500 mb-3 truncate">{document.file_name}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{format(new Date(document.created_at), 'MMM d, yyyy')}</span>
        <span>{document.uploader?.name || 'Unknown'}</span>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
          <Eye className="w-4 h-4 mr-1" />
          View
        </button>
        <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
