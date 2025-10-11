/**
 * Feedback Categories API
 * GET /api/pilot/feedback/categories - Get all feedback categories
 * POST /api/pilot/feedback/categories - Create new category (pilot-created)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAllCategories, createCategory } from '@/lib/feedback-service';
import { supabase } from '@/lib/supabase';

// Validation schema for category creation
const categorySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
});

/**
 * GET - Get all feedback categories
 */
export async function GET(request: NextRequest) {
  try {
    const categories = await getAllCategories();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('GET /api/pilot/feedback/categories error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new feedback category
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated pilot user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const pilotUserId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = categorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { name, description, icon } = validationResult.data;

    // Create category
    const result = await createCategory(pilotUserId, name, description, icon);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create category',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Category created successfully',
        categoryId: result.categoryId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/pilot/feedback/categories error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
