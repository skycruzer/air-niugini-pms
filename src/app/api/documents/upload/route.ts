/**
 * @fileoverview Document Upload API Route
 * Handles file uploads to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category_id = formData.get('category_id') as string;
    const pilot_id = formData.get('pilot_id') as string;
    const is_public = formData.get('is_public') === 'true';
    const expires_at = formData.get('expires_at') as string;
    const uploaded_by = formData.get('uploaded_by') as string;

    if (!file || !title) {
      return NextResponse.json(
        { success: false, error: 'File and title are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pilot-documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[API] Storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message || 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('pilot-documents').getPublicUrl(filePath);

    // Create document record in database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        title,
        description: description || null,
        category_id: category_id || null,
        pilot_id: pilot_id || null,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: fileExt,
        mime_type: file.type,
        uploaded_by: uploaded_by || null,
        is_public,
        expires_at: expires_at || null,
        status: 'active',
        version: 1,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[API] Database insert error:', dbError);
      // Attempt to clean up uploaded file
      await supabase.storage.from('pilot-documents').remove([filePath]);
      return NextResponse.json(
        { success: false, error: dbError.message || 'Failed to create document record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...document, public_url: publicUrl },
    });
  } catch (error: any) {
    console.error('[API] Error in POST /api/documents/upload:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}
