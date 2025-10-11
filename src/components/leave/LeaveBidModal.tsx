'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { getAllPilots } from '@/lib/pilot-service';
import { getRosterPeriodFromDate, formatRosterPeriod } from '@/lib/roster-utils';
import { useAuth } from '@/contexts/AuthContext';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Calendar, User, FileText, Clock } from 'lucide-react';

const leaveBidSchema = z
  .object({
    pilot_id: z.string().min(1, 'Please select a pilot'),
    // Choice 1 (required)
    choice1_start: z.string().min(1, 'Choice 1 start date is required'),
    choice1_end: z.string().min(1, 'Choice 1 end date is required'),
    // Choice 2 (required)
    choice2_start: z.string().min(1, 'Choice 2 start date is required'),
    choice2_end: z.string().min(1, 'Choice 2 end date is required'),
    // Choice 3 (required)
    choice3_start: z.string().min(1, 'Choice 3 start date is required'),
    choice3_end: z.string().min(1, 'Choice 3 end date is required'),
    reason: z.string().min(10, 'Please provide a reason (minimum 10 characters)'),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = parseISO(data.choice1_start);
      const end = parseISO(data.choice1_end);
      return end >= start;
    },
    {
      message: 'End date must be on or after start date',
      path: ['choice1_end'],
    }
  )
  .refine(
    (data) => {
      const start = parseISO(data.choice2_start);
      const end = parseISO(data.choice2_end);
      return end >= start;
    },
    {
      message: 'End date must be on or after start date',
      path: ['choice2_end'],
    }
  )
  .refine(
    (data) => {
      const start = parseISO(data.choice3_start);
      const end = parseISO(data.choice3_end);
      return end >= start;
    },
    {
      message: 'End date must be on or after start date',
      path: ['choice3_end'],
    }
  )
  .refine(
    (data) => {
      const choice1End = parseISO(data.choice1_end);
      const choice2Start = parseISO(data.choice2_start);
      return choice2Start > choice1End;
    },
    {
      message: 'Choice 2 start date must be after Choice 1 end date',
      path: ['choice2_start'],
    }
  )
  .refine(
    (data) => {
      const choice2End = parseISO(data.choice2_end);
      const choice3Start = parseISO(data.choice3_start);
      return choice3Start > choice2End;
    },
    {
      message: 'Choice 3 start date must be after Choice 2 end date',
      path: ['choice3_start'],
    }
  );

type LeaveBidFormData = z.infer<typeof leaveBidSchema>;

interface LeaveBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Pilot {
  id: string;
  employee_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: string;
  is_active: boolean;
  seniority_number?: number;
}

export function LeaveBidModal({ isOpen, onClose, onSuccess }: LeaveBidModalProps) {
  const { user } = useAuth();
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Minimum date is today
  const minDate = format(new Date(), 'yyyy-MM-dd');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeaveBidFormData>({
    resolver: zodResolver(leaveBidSchema),
    defaultValues: {
      pilot_id: '',
      choice1_start: '',
      choice1_end: '',
      choice2_start: '',
      choice2_end: '',
      choice3_start: '',
      choice3_end: '',
      reason: '',
      notes: '',
    },
  });

  const selectedPilotId = watch('pilot_id');
  const selectedPilot = pilots.find((p) => p.id === selectedPilotId);

  // Watch all date fields for auto-population and roster period display
  const choice1Start = watch('choice1_start');
  const choice1End = watch('choice1_end');
  const choice2Start = watch('choice2_start');
  const choice2End = watch('choice2_end');
  const choice3Start = watch('choice3_start');
  const choice3End = watch('choice3_end');

  // Calculate roster periods for display
  const choice1Roster =
    choice1Start && choice1End
      ? getRosterPeriodFromDate(parseISO(choice1Start))
      : null;
  const choice2Roster =
    choice2Start && choice2End
      ? getRosterPeriodFromDate(parseISO(choice2Start))
      : null;
  const choice3Roster =
    choice3Start && choice3End
      ? getRosterPeriodFromDate(parseISO(choice3Start))
      : null;

  // AUTO-POPULATION LOGIC: Choice 1 End Date
  useEffect(() => {
    if (choice1Start && !choice1End) {
      setValue('choice1_end', choice1Start);
    }
  }, [choice1Start, choice1End, setValue]);

  // AUTO-POPULATION LOGIC: Choice 2 Start Date
  useEffect(() => {
    if (choice1End && !choice2Start) {
      setValue('choice2_start', choice1End);
    }
  }, [choice1End, choice2Start, setValue]);

  // AUTO-POPULATION LOGIC: Choice 2 End Date
  useEffect(() => {
    if (choice2Start && !choice2End) {
      setValue('choice2_end', choice2Start);
    }
  }, [choice2Start, choice2End, setValue]);

  // AUTO-POPULATION LOGIC: Choice 3 Start Date
  useEffect(() => {
    if (choice2End && !choice3Start) {
      setValue('choice3_start', choice2End);
    }
  }, [choice2End, choice3Start, setValue]);

  // AUTO-POPULATION LOGIC: Choice 3 End Date
  useEffect(() => {
    if (choice3Start && !choice3End) {
      setValue('choice3_end', choice3Start);
    }
  }, [choice3Start, choice3End, setValue]);

  // Load pilots on component mount
  useEffect(() => {
    const loadPilots = async () => {
      try {
        const pilotsData = await getAllPilots();
        const activePilots = pilotsData
          .filter((p) => p.is_active)
          .sort((a, b) => {
            // Sort by seniority number (lower is more senior)
            if (a.seniority_number && b.seniority_number) {
              return a.seniority_number - b.seniority_number;
            }
            return 0;
          });
        setPilots(activePilots);
      } catch (error) {
        console.error('Error loading pilots:', error);
      }
    };

    if (isOpen) {
      loadPilots();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        pilot_id: '',
        choice1_start: '',
        choice1_end: '',
        choice2_start: '',
        choice2_end: '',
        choice3_start: '',
        choice3_end: '',
        reason: '',
        notes: '',
      });
      setSubmitError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: LeaveBidFormData) => {
    setLoading(true);
    setSubmitError(null);

    try {
      // Auto-detect roster period from first choice start date
      const rosterPeriod = getRosterPeriodFromDate(parseISO(data.choice1_start));

      // Format the dates into readable strings for the database
      const preferredDates = `${format(parseISO(data.choice1_start), 'MMM d')} - ${format(parseISO(data.choice1_end), 'MMM d, yyyy')}`;
      const alternativeDates = `Choice 2: ${format(parseISO(data.choice2_start), 'MMM d')} - ${format(parseISO(data.choice2_end), 'MMM d, yyyy')} | Choice 3: ${format(parseISO(data.choice3_start), 'MMM d')} - ${format(parseISO(data.choice3_end), 'MMM d, yyyy')}`;

      // API payload - matches API expectations (with priority field set to 'HIGH')
      const payload = {
        pilot_id: data.pilot_id,
        roster_period_code: rosterPeriod.code,
        preferred_dates: preferredDates,
        alternative_dates: alternativeDates,
        priority: 'HIGH', // Default priority (API requires this field)
        reason: data.reason,
        notes: data.notes || null,
      };

      const response = await fetch('/api/leave-bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit leave bid');
      }

      console.log('[SUCCESS] Leave bid submitted:', result.data);

      if (onSuccess) {
        onSuccess();
      }

      reset();
      onClose();
    } catch (error) {
      console.error('[ERROR] Error submitting leave bid:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit leave bid. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Annual Leave Bid"
      icon={<Calendar className="w-6 h-6 text-blue-600" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Select Your Preferred Dates</h4>
              <p className="text-sm text-blue-700">
                Choose any future dates starting from today. The roster period will be automatically
                detected based on the dates you select.
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Select 3 preferred date ranges in order of preference. Dates will auto-populate
                as you select them to speed up entry.
              </p>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 flex items-center">
              <span className="mr-2">⚠️</span>
              {submitError}
            </p>
          </div>
        )}

        {/* Pilot Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilot <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              {...register('pilot_id')}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.pilot_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select a pilot...</option>
              {pilots.map((pilot) => (
                <option key={pilot.id} value={pilot.id}>
                  {pilot.employee_id} - {pilot.first_name}{' '}
                  {pilot.middle_name ? `${pilot.middle_name} ` : ''}
                  {pilot.last_name} ({pilot.role})
                  {pilot.seniority_number ? ` - Seniority #${pilot.seniority_number}` : ''}
                </option>
              ))}
            </select>
          </div>
          {errors.pilot_id && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.pilot_id.message}
            </p>
          )}
          {selectedPilot && (
            <p className="mt-2 text-xs text-gray-600">
              ✓ Selected: <strong>{selectedPilot.role}</strong>
              {selectedPilot.seniority_number && (
                <> | Seniority: <strong>#{selectedPilot.seniority_number}</strong></>
              )}
            </p>
          )}
        </div>

        {/* Choice 1 - First Preference */}
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
            <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">
              1
            </span>
            First Choice (Most Preferred) <span className="text-red-500 ml-1">*</span>
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                {...register('choice1_start')}
                min={minDate}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.choice1_start ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.choice1_start && (
                <p className="mt-1 text-xs text-red-600">{errors.choice1_start.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                {...register('choice1_end')}
                min={choice1Start || minDate}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.choice1_end ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.choice1_end && (
                <p className="mt-1 text-xs text-red-600">{errors.choice1_end.message}</p>
              )}
            </div>
          </div>
          {/* Display Roster Period for Choice 1 */}
          {choice1Roster && (
            <div className="mt-3 px-3 py-2 bg-white border border-green-200 rounded-md">
              <p className="text-xs text-green-800 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <strong>Roster Period:</strong>
                <span className="ml-1">{formatRosterPeriod(choice1Roster)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Choice 2 - Second Preference */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">
              2
            </span>
            Second Choice (Alternative) <span className="text-red-500 ml-1">*</span>
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                {...register('choice2_start')}
                min={choice1End || minDate}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.choice2_start ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.choice2_start && (
                <p className="mt-1 text-xs text-red-600">{errors.choice2_start.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                {...register('choice2_end')}
                min={choice2Start || minDate}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.choice2_end ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.choice2_end && (
                <p className="mt-1 text-xs text-red-600">{errors.choice2_end.message}</p>
              )}
            </div>
          </div>
          {/* Display Roster Period for Choice 2 */}
          {choice2Roster && (
            <div className="mt-3 px-3 py-2 bg-white border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <strong>Roster Period:</strong>
                <span className="ml-1">{formatRosterPeriod(choice2Roster)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Choice 3 - Third Preference */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center">
            <span className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">
              3
            </span>
            Third Choice (Last Option) <span className="text-red-500 ml-1">*</span>
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                {...register('choice3_start')}
                min={choice2End || minDate}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                  errors.choice3_start ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.choice3_start && (
                <p className="mt-1 text-xs text-red-600">{errors.choice3_start.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                {...register('choice3_end')}
                min={choice3Start || minDate}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                  errors.choice3_end ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.choice3_end && (
                <p className="mt-1 text-xs text-red-600">{errors.choice3_end.message}</p>
              )}
            </div>
          </div>
          {/* Display Roster Period for Choice 3 */}
          {choice3Roster && (
            <div className="mt-3 px-3 py-2 bg-white border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <strong>Roster Period:</strong>
                <span className="ml-1">{formatRosterPeriod(choice3Roster)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              {...register('reason')}
              rows={4}
              placeholder="Briefly explain the reason for this leave bid..."
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.reason ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.reason.message}
            </p>
          )}
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Any additional information or special considerations..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-[#C00020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Leave Bid'
            )}
          </button>
        </div>
      </form>
    </ModalSheet>
  );
}
