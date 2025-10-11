/**
 * Pilot Registration API Route
 * POST /api/pilot/register - Register new pilot account (pending approval)
 */

import { NextRequest, NextResponse } from 'next/server';
import { registerPilot, type PilotRegistrationData } from '@/lib/pilot-registration-service';
import { z } from 'zod';

// Validation schema
const registrationSchema = z.object({
  employee_id: z
    .string()
    .min(1, 'Employee ID is required')
    .regex(/^[A-Z0-9-]+$/, 'Invalid Employee ID format'),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  rank: z.enum(['Captain', 'First Officer'], {
    errorMap: () => ({ message: 'Rank must be Captain or First Officer' }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = registrationSchema.safeParse(body);

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

    const data = validationResult.data;

    // Check password confirmation
    if (data.password !== data.confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Passwords do not match',
        },
        { status: 400 }
      );
    }

    // Prepare registration data
    const registrationData: PilotRegistrationData = {
      employee_id: data.employee_id,
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
      rank: data.rank,
    };

    // Register pilot (service layer handles all business logic)
    const result = await registerPilot(registrationData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Registration failed',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Registration submitted successfully! Please check your email to verify your account. Your registration will be reviewed by an administrator.',
        userId: result.userId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during registration',
      },
      { status: 500 }
    );
  }
}
