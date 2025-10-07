/**
 * @fileoverview Documents API Route
 * Handles document management operations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDocuments,
  getDocumentCategories,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentStatistics,
  logDocumentAccess,
} from '@/lib/document-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Get document categories
    if (action === 'categories') {
      const categories = await getDocumentCategories();
      return NextResponse.json({ success: true, data: categories });
    }

    // Get statistics
    if (action === 'statistics') {
      const stats = await getDocumentStatistics();
      return NextResponse.json({ success: true, data: stats });
    }

    // Get documents with filters
    const filters = {
      category_id: searchParams.get('category_id') || undefined,
      pilot_id: searchParams.get('pilot_id') || undefined,
      status: searchParams.get('status') || undefined,
      uploaded_by: searchParams.get('uploaded_by') || undefined,
    };

    const documents = await getDocuments(filters);
    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    console.error('[API] Error in GET /api/documents:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // Log document access
    if (action === 'log_access') {
      await logDocumentAccess(data);
      return NextResponse.json({ success: true });
    }

    // Create new document
    const document = await createDocument(data);
    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error: any) {
    console.error('[API] Error in POST /api/documents:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create document' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const document = await updateDocument(id, updates);
    return NextResponse.json({ success: true, data: document });
  } catch (error: any) {
    console.error('[API] Error in PUT /api/documents:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const document = await deleteDocument(id);
    return NextResponse.json({ success: true, data: document });
  } catch (error: any) {
    console.error('[API] Error in DELETE /api/documents:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}
