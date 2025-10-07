/**
 * @fileoverview Document Management Service
 * Handles document CRUD operations, file uploads, and access logging
 *
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-10-07
 */

import { getSupabaseAdmin } from '@/lib/supabase';

export interface DocumentCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  display_order: number;
  is_active: boolean;
}

export interface Document {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  mime_type: string | null;
  uploaded_by: string | null;
  pilot_id: string | null;
  status: 'active' | 'archived' | 'deleted';
  version: number;
  is_public: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DigitalForm {
  id: string;
  form_type: string;
  title: string;
  description: string | null;
  form_schema: any;
  is_active: boolean;
  requires_approval: boolean;
  allowed_roles: string[];
}

export interface FormSubmission {
  id: string;
  form_id: string;
  form_data: any;
  submitted_by: string | null;
  pilot_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  attachments: any;
  created_at: string;
  updated_at: string;
}

// =====================================================
// DOCUMENT CATEGORIES
// =====================================================

export async function getDocumentCategories() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('document_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching document categories:', error);
    throw error;
  }

  return data as DocumentCategory[];
}

// =====================================================
// DOCUMENTS
// =====================================================

export async function getDocuments(filters?: {
  category_id?: string;
  pilot_id?: string;
  status?: string;
  uploaded_by?: string;
}) {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('documents')
    .select(`
      *,
      category:document_categories(id, name, icon, color),
      uploader:an_users!documents_uploaded_by_fkey(id, name),
      pilot:pilots(id, first_name, last_name, employee_id)
    `)
    .order('created_at', { ascending: false });

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  if (filters?.pilot_id) {
    query = query.eq('pilot_id', filters.pilot_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.uploaded_by) {
    query = query.eq('uploaded_by', filters.uploaded_by);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }

  return data;
}

export async function getDocumentById(id: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      category:document_categories(id, name, icon, color),
      uploader:an_users!documents_uploaded_by_fkey(id, name),
      pilot:pilots(id, first_name, last_name, employee_id)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching document:', error);
    throw error;
  }

  return data;
}

export async function createDocument(document: {
  title: string;
  description?: string;
  category_id?: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  mime_type?: string;
  uploaded_by: string;
  pilot_id?: string;
  is_public?: boolean;
  expires_at?: string;
}) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('documents')
    .insert([document])
    .select()
    .single();

  if (error) {
    console.error('Error creating document:', error);
    throw error;
  }

  return data;
}

export async function updateDocument(id: string, updates: Partial<Document>) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating document:', error);
    throw error;
  }

  return data;
}

export async function deleteDocument(id: string) {
  const supabase = getSupabaseAdmin();

  // Soft delete by setting status to 'deleted'
  const { data, error } = await supabase
    .from('documents')
    .update({ status: 'deleted' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error deleting document:', error);
    throw error;
  }

  return data;
}

// =====================================================
// DIGITAL FORMS
// =====================================================

export async function getDigitalForms() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('digital_forms')
    .select('*')
    .eq('is_active', true)
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching digital forms:', error);
    throw error;
  }

  return data as DigitalForm[];
}

export async function getDigitalFormById(id: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('digital_forms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching digital form:', error);
    throw error;
  }

  return data as DigitalForm;
}

// =====================================================
// FORM SUBMISSIONS
// =====================================================

export async function getFormSubmissions(filters?: {
  form_id?: string;
  submitted_by?: string;
  pilot_id?: string;
  status?: string;
}) {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('form_submissions')
    .select(`
      *,
      form:digital_forms(id, title, form_type),
      submitter:an_users!form_submissions_submitted_by_fkey(id, name),
      pilot:pilots(id, first_name, last_name, employee_id),
      approver:an_users!form_submissions_approved_by_fkey(id, name)
    `)
    .order('created_at', { ascending: false });

  if (filters?.form_id) {
    query = query.eq('form_id', filters.form_id);
  }
  if (filters?.submitted_by) {
    query = query.eq('submitted_by', filters.submitted_by);
  }
  if (filters?.pilot_id) {
    query = query.eq('pilot_id', filters.pilot_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching form submissions:', error);
    throw error;
  }

  return data;
}

export async function createFormSubmission(submission: {
  form_id: string;
  form_data: any;
  submitted_by: string;
  pilot_id?: string;
  attachments?: any;
}) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('form_submissions')
    .insert([submission])
    .select()
    .single();

  if (error) {
    console.error('Error creating form submission:', error);
    throw error;
  }

  return data;
}

export async function updateFormSubmissionStatus(
  id: string,
  status: 'approved' | 'rejected' | 'completed',
  approved_by: string,
  rejection_reason?: string
) {
  const supabase = getSupabaseAdmin();

  const updates: any = {
    status,
    approved_by,
    approved_at: new Date().toISOString(),
  };

  if (rejection_reason) {
    updates.rejection_reason = rejection_reason;
  }

  const { data, error } = await supabase
    .from('form_submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating form submission:', error);
    throw error;
  }

  return data;
}

// =====================================================
// DOCUMENT ACCESS LOGGING
// =====================================================

export async function logDocumentAccess(access: {
  document_id: string;
  user_id: string;
  action: 'view' | 'download' | 'update' | 'delete';
  ip_address?: string;
  user_agent?: string;
}) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('document_access_log').insert([access]);

  if (error) {
    console.error('Error logging document access:', error);
    // Don't throw - logging should not break the flow
  }
}

// =====================================================
// STATISTICS
// =====================================================

export async function getDocumentStatistics() {
  const supabase = getSupabaseAdmin();

  // Total documents
  const { count: totalDocs } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Documents by category
  const { data: byCategory } = await supabase
    .from('documents')
    .select('category_id, document_categories(name)')
    .eq('status', 'active');

  // Recent uploads (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: recentUploads } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('created_at', sevenDaysAgo.toISOString());

  // Pending form submissions
  const { count: pendingForms } = await supabase
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    totalDocuments: totalDocs || 0,
    recentUploads: recentUploads || 0,
    pendingFormSubmissions: pendingForms || 0,
    documentsByCategory: byCategory || [],
  };
}
