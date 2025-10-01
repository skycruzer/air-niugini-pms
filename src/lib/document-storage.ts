/**
 * @fileoverview Document Storage Service for Air Niugini B767 PMS
 * Handles secure file uploads, downloads, and management with Supabase Storage
 *
 * Features:
 * - Secure file upload with validation
 * - Signed URL generation for secure access
 * - File versioning and organization
 * - Document metadata management
 * - Access logging and audit trail
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-01
 */

import { getSupabaseAdmin } from './supabase';
import { nanoid } from 'nanoid';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type DocumentType =
  | 'LICENSE'
  | 'MEDICAL'
  | 'PASSPORT'
  | 'TRAINING'
  | 'EMERGENCY_CONTACT'
  | 'CONTRACT'
  | 'VISA'
  | 'ID_CARD'
  | 'INSURANCE'
  | 'OTHER';

export type AccessLevel = 'public' | 'restricted' | 'confidential';
export type DocumentStatus = 'active' | 'archived' | 'deleted' | 'expired';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface DocumentMetadata {
  id?: string;
  pilot_id: string;
  document_type: DocumentType;
  document_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_number?: string;
  expiry_date?: string;
  issue_date?: string;
  issuing_authority?: string;
  version_number?: number;
  is_current_version?: boolean;
  replaces_document_id?: string;
  is_encrypted?: boolean;
  access_level?: AccessLevel;
  status?: DocumentStatus;
  verification_status?: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  uploaded_by: string;
  notes?: string;
  tags?: string[];
}

export interface UploadOptions {
  pilotId: string;
  documentType: DocumentType;
  file: File;
  metadata?: {
    document_number?: string;
    expiry_date?: string;
    issue_date?: string;
    issuing_authority?: string;
    notes?: string;
    tags?: string[];
  };
  uploadedBy: string;
  replaceDocumentId?: string;
}

export interface DownloadOptions {
  documentId: string;
  expiresIn?: number; // Seconds until signed URL expires (default: 3600 = 1 hour)
}

export interface DocumentSearchOptions {
  pilotId?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  verificationStatus?: VerificationStatus;
  expiringWithinDays?: number;
  isCurrentVersion?: boolean;
  limit?: number;
  offset?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_BUCKET = 'pilot-documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
];

// =============================================================================
// FILE VALIDATION
// =============================================================================

/**
 * Validates file before upload
 * Checks file size, type, and other constraints
 *
 * @param file - File to validate
 * @returns Validation result with errors if any
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: PDF, JPG, PNG, GIF`,
    };
  }

  return { valid: true };
}

/**
 * Generates a secure, unique file path for storage
 * Format: pilots/{pilot_id}/{document_type}/{timestamp}_{unique_id}.{ext}
 *
 * @param pilotId - Pilot ID
 * @param documentType - Type of document
 * @param fileName - Original file name
 * @returns Secure file path
 */
export function generateFilePath(
  pilotId: string,
  documentType: DocumentType,
  fileName: string
): string {
  const timestamp = Date.now();
  const uniqueId = nanoid(10);
  const extension = fileName.split('.').pop()?.toLowerCase() || 'pdf';
  const sanitizedFileName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50);

  return `pilots/${pilotId}/${documentType.toLowerCase()}/${timestamp}_${uniqueId}_${sanitizedFileName}.${extension}`;
}

// =============================================================================
// STORAGE BUCKET MANAGEMENT
// =============================================================================

/**
 * Ensures the storage bucket exists and is properly configured
 * Creates bucket if it doesn't exist
 *
 * @returns Success status
 */
export async function ensureStorageBucket(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabaseAdmin.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError.message };
    }

    const bucketExists = buckets?.some((b) => b.name === STORAGE_BUCKET);

    if (!bucketExists) {
      // Create bucket with restricted access
      const { data, error: createError } = await supabaseAdmin.storage.createBucket(
        STORAGE_BUCKET,
        {
          public: false, // Private bucket requiring signed URLs
          fileSizeLimit: MAX_FILE_SIZE,
          allowedMimeTypes: ALLOWED_FILE_TYPES,
        }
      );

      if (createError) {
        console.error('Error creating bucket:', createError);
        return { success: false, error: createError.message };
      }

      console.log('✅ Storage bucket created successfully:', STORAGE_BUCKET);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error ensuring storage bucket:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// DOCUMENT UPLOAD
// =============================================================================

/**
 * Uploads a document to Supabase Storage and creates database record
 * Handles versioning and replaces old documents if specified
 *
 * @param options - Upload options including file, metadata, and pilot info
 * @returns Upload result with document metadata
 */
export async function uploadDocument(options: UploadOptions): Promise<{
  success: boolean;
  data?: DocumentMetadata;
  error?: string;
}> {
  try {
    const { pilotId, documentType, file, metadata, uploadedBy, replaceDocumentId } =
      options;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Ensure bucket exists
    const bucketResult = await ensureStorageBucket();
    if (!bucketResult.success) {
      return { success: false, error: bucketResult.error };
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Generate secure file path
    const filePath = generateFilePath(pilotId, documentType, file.name);

    // Upload file to storage
    const { data: uploadData, error: uploadError } =
      await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Never overwrite - always create new version
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { success: false, error: uploadError.message };
    }

    console.log('✅ File uploaded successfully:', uploadData.path);

    // Determine version number
    let versionNumber = 1;
    if (replaceDocumentId) {
      const { data: oldDoc } = await supabaseAdmin
        .from('pilot_documents')
        .select('version_number')
        .eq('id', replaceDocumentId)
        .single();

      if (oldDoc) {
        versionNumber = (oldDoc.version_number || 1) + 1;
      }
    }

    // Create document metadata in database
    const documentMetadata: DocumentMetadata = {
      pilot_id: pilotId,
      document_type: documentType,
      document_name: file.name,
      file_path: uploadData.path,
      file_size: file.size,
      file_type: file.type,
      document_number: metadata?.document_number,
      expiry_date: metadata?.expiry_date,
      issue_date: metadata?.issue_date,
      issuing_authority: metadata?.issuing_authority,
      version_number: versionNumber,
      is_current_version: true,
      replaces_document_id: replaceDocumentId,
      is_encrypted: false,
      access_level: 'restricted',
      status: 'active',
      verification_status: 'pending',
      uploaded_by: uploadedBy,
      notes: metadata?.notes,
      tags: metadata?.tags,
    };

    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('pilot_documents')
      .insert(documentMetadata)
      .select()
      .single();

    if (dbError) {
      console.error('Error creating document record:', dbError);

      // Cleanup: Delete uploaded file
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([uploadData.path]);

      return { success: false, error: dbError.message };
    }

    console.log('✅ Document record created:', dbData.id);

    // Log document access
    await logDocumentAccess({
      documentId: dbData.id,
      accessedBy: uploadedBy,
      accessType: 'upload',
      notes: `Document uploaded: ${file.name}`,
    });

    return { success: true, data: dbData };
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// DOCUMENT DOWNLOAD
// =============================================================================

/**
 * Generates a signed URL for secure document download
 *
 * @param options - Download options including document ID and expiry
 * @returns Signed URL for document download
 */
export async function getDocumentDownloadUrl(options: DownloadOptions): Promise<{
  success: boolean;
  data?: {
    url: string;
    expiresAt: Date;
    metadata: DocumentMetadata;
  };
  error?: string;
}> {
  try {
    const { documentId, expiresIn = 3600 } = options;

    const supabaseAdmin = getSupabaseAdmin();

    // Get document metadata
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('pilot_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return { success: false, error: 'Document not found' };
    }

    // Check if document is accessible
    if (document.status !== 'active') {
      return { success: false, error: 'Document is not accessible' };
    }

    // Generate signed URL
    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(document.file_path, expiresIn);

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError);
      return { success: false, error: signedUrlError?.message || 'Failed to generate download URL' };
    }

    console.log('✅ Signed URL generated for document:', documentId);

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      success: true,
      data: {
        url: signedUrlData.signedUrl,
        expiresAt,
        metadata: document,
      },
    };
  } catch (error: any) {
    console.error('Error getting document download URL:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// DOCUMENT SEARCH & RETRIEVAL
// =============================================================================

/**
 * Searches documents based on various criteria
 * Supports filtering by pilot, type, status, and expiry
 *
 * @param options - Search criteria
 * @returns List of matching documents
 */
export async function searchDocuments(options: DocumentSearchOptions): Promise<{
  success: boolean;
  data?: DocumentMetadata[];
  total?: number;
  error?: string;
}> {
  try {
    const {
      pilotId,
      documentType,
      status = 'active',
      verificationStatus,
      expiringWithinDays,
      isCurrentVersion = true,
      limit = 50,
      offset = 0,
    } = options;

    const supabaseAdmin = getSupabaseAdmin();

    let query = supabaseAdmin
      .from('pilot_documents')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .eq('is_current_version', isCurrentVersion);

    if (pilotId) {
      query = query.eq('pilot_id', pilotId);
    }

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    if (verificationStatus) {
      query = query.eq('verification_status', verificationStatus);
    }

    if (expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiringWithinDays);
      query = query
        .not('expiry_date', 'is', null)
        .lte('expiry_date', futureDate.toISOString().split('T')[0]);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error searching documents:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data || [],
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error searching documents:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Gets all documents for a specific pilot
 *
 * @param pilotId - Pilot ID
 * @returns Pilot's documents grouped by type
 */
export async function getPilotDocuments(pilotId: string): Promise<{
  success: boolean;
  data?: Record<DocumentType, DocumentMetadata[]>;
  error?: string;
}> {
  try {
    const result = await searchDocuments({
      pilotId,
      status: 'active',
      isCurrentVersion: true,
      limit: 100,
    });

    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    // Group documents by type
    const grouped = result.data.reduce((acc, doc) => {
      const type = doc.document_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(doc);
      return acc;
    }, {} as Record<DocumentType, DocumentMetadata[]>);

    return { success: true, data: grouped };
  } catch (error: any) {
    console.error('Error getting pilot documents:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// DOCUMENT DELETION
// =============================================================================

/**
 * Soft deletes a document (marks as deleted without removing file)
 *
 * @param documentId - Document ID to delete
 * @param deletedBy - User ID performing the deletion
 * @returns Deletion result
 */
export async function deleteDocument(
  documentId: string,
  deletedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Soft delete: Update status and set deleted_at
    const { error } = await supabaseAdmin
      .from('pilot_documents')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        is_current_version: false,
      })
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: error.message };
    }

    // Log document access
    await logDocumentAccess({
      documentId,
      accessedBy: deletedBy,
      accessType: 'delete',
      notes: 'Document soft deleted',
    });

    console.log('✅ Document deleted successfully:', documentId);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Permanently deletes a document from storage and database
 * CAUTION: This action cannot be undone
 *
 * @param documentId - Document ID to permanently delete
 * @param deletedBy - User ID performing the deletion
 * @returns Deletion result
 */
export async function permanentlyDeleteDocument(
  documentId: string,
  deletedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get document metadata
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('pilot_documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return { success: false, error: 'Document not found' };
    }

    // Delete file from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([document.file_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      return { success: false, error: storageError.message };
    }

    // Delete database record
    const { error: dbError } = await supabaseAdmin
      .from('pilot_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('Error deleting document record:', dbError);
      return { success: false, error: dbError.message };
    }

    console.log('✅ Document permanently deleted:', documentId);
    return { success: true };
  } catch (error: any) {
    console.error('Error permanently deleting document:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// DOCUMENT VERIFICATION
// =============================================================================

/**
 * Verifies or rejects a document
 *
 * @param documentId - Document ID to verify
 * @param verifiedBy - User ID performing verification
 * @param status - Verification status (verified or rejected)
 * @param notes - Optional notes about verification
 * @returns Verification result
 */
export async function verifyDocument(
  documentId: string,
  verifiedBy: string,
  status: 'verified' | 'rejected',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from('pilot_documents')
      .update({
        verification_status: status,
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        notes: notes || undefined,
      })
      .eq('id', documentId);

    if (error) {
      console.error('Error verifying document:', error);
      return { success: false, error: error.message };
    }

    // Log document access
    await logDocumentAccess({
      documentId,
      accessedBy: verifiedBy,
      accessType: 'verify',
      notes: `Document ${status}: ${notes || 'No notes'}`,
    });

    console.log(`✅ Document ${status}:`, documentId);
    return { success: true };
  } catch (error: any) {
    console.error('Error verifying document:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// ACCESS LOGGING
// =============================================================================

interface AccessLogOptions {
  documentId: string;
  accessedBy: string;
  accessType: 'view' | 'download' | 'upload' | 'delete' | 'verify' | 'share';
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

/**
 * Logs document access for audit trail
 *
 * @param options - Access log options
 * @returns Success status
 */
export async function logDocumentAccess(options: AccessLogOptions): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { documentId, accessedBy, accessType, ipAddress, userAgent, notes } = options;

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin.from('document_access_log').insert({
      document_id: documentId,
      accessed_by: accessedBy,
      access_type: accessType,
      ip_address: ipAddress,
      user_agent: userAgent,
      notes,
    });

    if (error) {
      console.error('Error logging document access:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error logging document access:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// EXPIRY MANAGEMENT
// =============================================================================

/**
 * Gets documents expiring within a specified number of days
 *
 * @param daysAhead - Number of days to look ahead
 * @returns Expiring documents with status
 */
export async function getExpiringDocuments(daysAhead: number = 30): Promise<{
  success: boolean;
  data?: {
    critical: DocumentMetadata[]; // Expiring in <= 7 days
    warning: DocumentMetadata[]; // Expiring in 8-30 days
    expired: DocumentMetadata[]; // Already expired
  };
  error?: string;
}> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabaseAdmin
      .from('pilot_documents')
      .select(
        `
        *,
        pilots!inner (id, first_name, last_name, employee_id)
      `
      )
      .eq('status', 'active')
      .eq('is_current_version', true)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching expiring documents:', error);
      return { success: false, error: error.message };
    }

    // Categorize documents
    const critical: DocumentMetadata[] = [];
    const warning: DocumentMetadata[] = [];
    const expired: DocumentMetadata[] = [];

    data?.forEach((doc) => {
      if (!doc.expiry_date) return;

      const expiryDate = new Date(doc.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry < 0) {
        expired.push(doc);
      } else if (daysUntilExpiry <= 7) {
        critical.push(doc);
      } else {
        warning.push(doc);
      }
    });

    return {
      success: true,
      data: { critical, warning, expired },
    };
  } catch (error: any) {
    console.error('Error getting expiring documents:', error);
    return { success: false, error: error.message };
  }
}
