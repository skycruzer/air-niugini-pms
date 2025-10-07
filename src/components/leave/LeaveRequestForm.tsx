'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { getAllPilots } from '@/lib/pilot-service';
import {
  createLeaveRequest,
  updateLeaveRequest,
  checkLeaveConflicts,
  type LeaveRequestFormData,
  type LeaveRequest,
} from '@/lib/leave-service';
import {
  getCurrentRosterPeriod,
  getRosterPeriodFromDate,
  getAffectedRosterPeriods,
} from '@/lib/roster-utils';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';

const leaveRequestSchema = z
  .object({
    pilot_id: z.string().min(1, 'Please select a pilot'),
    request_type: z.enum(
      ['RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'],
      {
        message: 'Please select a leave type',
      }
    ),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    request_date: z.string().min(1, 'Date of request is required'),
    request_method: z.enum(['ORACLE', 'EMAIL', 'LEAVE_BIDS', 'SYSTEM'], {
      message: 'Please select how you were advised',
    }),
    reason: z.string().optional(),
    is_late_request: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      return !isAfter(startDate, endDate);
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      const requestDate = new Date(data.request_date);
      const startDate = new Date(data.start_date);
      return !isAfter(requestDate, startDate);
    },
    {
      message: 'Request date cannot be after start date',
      path: ['request_date'],
    }
  );

interface LeaveRequestFormProps {
  onSuccess: (request: LeaveRequest) => void;
  onCancel: () => void;
  editingRequest?: LeaveRequest;
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
  commencement_date?: Date;
}

export function LeaveRequestForm({ onSuccess, onCancel, editingRequest }: LeaveRequestFormProps) {
  console.log(
    '🔧 LeaveRequestForm mounted/updated with editingRequest:',
    editingRequest?.id,
    editingRequest?.pilot_id
  );

  const { user } = useAuth();
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<LeaveRequest[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [affectedRosterPeriods, setAffectedRosterPeriods] = useState<any[]>([]);
  const currentRoster = getCurrentRosterPeriod();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      pilot_id: '',
      request_type: 'RDO',
      start_date: '',
      end_date: '',
      request_date: format(new Date(), 'yyyy-MM-dd'),
      request_method: 'EMAIL',
      reason: '',
      is_late_request: false,
    },
  });

  const pilotId = watch('pilot_id');
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  // Load pilots on component mount
  useEffect(() => {
    const loadPilots = async () => {
      try {
        const pilotsData = await getAllPilots();
        const transformedPilots = pilotsData
          .filter((p) => p.is_active)
          .map((pilot) => ({
            ...pilot,
            commencement_date: pilot.commencement_date
              ? new Date(pilot.commencement_date)
              : undefined,
          }));
        setPilots(transformedPilots);
        console.log('🔧 Pilots loaded:', transformedPilots.length, 'pilots');
        if (editingRequest) {
          console.log('🔧 Looking for pilot with ID:', editingRequest.pilot_id);
          const foundPilot = transformedPilots.find((p) => p.id === editingRequest.pilot_id);
          console.log('🔧 Found pilot:', foundPilot);
        }
      } catch (error) {
        console.error('Error loading pilots:', error);
      }
    };
    loadPilots();
  }, []);

  // Set form values when editing request changes and pilots are loaded
  useEffect(() => {
    console.log('🔧 Form values useEffect triggered:', {
      editingRequest: editingRequest?.id,
      pilot_id: editingRequest?.pilot_id,
      pilotsLoaded: pilots.length > 0,
    });

    if (editingRequest) {
      // Only set values if we have pilots loaded, to avoid race conditions
      if (pilots.length === 0) {
        console.log('🔧 Pilots not loaded yet, skipping setValue for edit mode');
        return;
      }

      console.log('🔧 Setting individual form values for editing:', editingRequest.pilot_id);

      // Verify pilot exists in the loaded pilots
      const pilotExists = pilots.find((p) => p.id === editingRequest.pilot_id);
      console.log(
        '🔧 Pilot exists in list:',
        !!pilotExists,
        pilotExists?.first_name,
        pilotExists?.last_name
      );

      // Set each field individually using setValue
      setValue('pilot_id', editingRequest.pilot_id, { shouldValidate: false });
      setValue('request_type', editingRequest.request_type, { shouldValidate: false });
      setValue('start_date', editingRequest.start_date, { shouldValidate: false });
      setValue('end_date', editingRequest.end_date, { shouldValidate: false });
      setValue('request_date', editingRequest.request_date || format(new Date(), 'yyyy-MM-dd'), {
        shouldValidate: false,
      });
      setValue('request_method', editingRequest.request_method || 'EMAIL', {
        shouldValidate: false,
      });
      setValue('reason', editingRequest.reason || '', { shouldValidate: false });
      setValue('is_late_request', editingRequest.is_late_request || false, {
        shouldValidate: false,
      });

      console.log('🔧 All form values set for edit mode');
    } else {
      // Reset to empty form for new requests
      console.log('🔧 Setting form to empty for new request');
      setValue('pilot_id', '', { shouldValidate: false });
      setValue('request_type', 'RDO', { shouldValidate: false });
      setValue('start_date', '', { shouldValidate: false });
      setValue('end_date', '', { shouldValidate: false });
      setValue('request_date', format(new Date(), 'yyyy-MM-dd'), { shouldValidate: false });
      setValue('request_method', 'EMAIL', { shouldValidate: false });
      setValue('reason', '', { shouldValidate: false });
      setValue('is_late_request', false, { shouldValidate: false });
      console.log('🔧 All form values set for new request mode');
    }
  }, [editingRequest?.id, setValue, pilots.length]);

  // Check for conflicts and update roster periods when pilot or dates change
  useEffect(() => {
    const checkConflicts = async () => {
      if (!pilotId || !startDate || !endDate) {
        setConflicts([]);
        setAffectedRosterPeriods([]);
        setCheckingConflicts(false);
        return;
      }

      setCheckingConflicts(true);

      // Calculate affected roster periods
      try {
        const periods = getAffectedRosterPeriods(new Date(startDate), new Date(endDate));
        setAffectedRosterPeriods(periods);
      } catch (error) {
        console.error('Error calculating roster periods:', error);
        setAffectedRosterPeriods([]);
      }

      try {
        const conflictingRequests = await checkLeaveConflicts(
          pilotId,
          startDate,
          endDate,
          editingRequest?.id
        );
        setConflicts(conflictingRequests);

        if (conflictingRequests.length > 0) {
          setError('start_date', {
            type: 'manual',
            message: `Conflicts with existing leave requests`,
          });
        } else {
          clearErrors(['start_date', 'end_date']);
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
      } finally {
        setCheckingConflicts(false);
      }
    };

    const timeoutId = setTimeout(checkConflicts, 500); // Increased debounce time
    return () => clearTimeout(timeoutId);
  }, [pilotId, startDate, endDate, setError, clearErrors]);

  const onSubmit = async (data: LeaveRequestFormData) => {
    if (!user) return;

    // Final conflict check
    if (conflicts.length > 0) {
      setError('start_date', {
        type: 'manual',
        message: 'Please resolve conflicts before submitting',
      });
      return;
    }

    // Validate dates are within reasonable bounds
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    const today = new Date();

    if (isBefore(endDate, today)) {
      setError('end_date', {
        type: 'manual',
        message: 'Cannot request leave for past dates',
      });
      return;
    }

    try {
      setLoading(true);

      // Check if request is late and add flag
      const isLate = checkIsLateRequest(data.request_date, data.start_date, data.request_type);
      const requestData = {
        ...data,
        is_late_request: isLate,
      };

      let result: LeaveRequest;
      if (editingRequest) {
        // Update existing request
        result = await updateLeaveRequest(editingRequest.id, requestData);
      } else {
        // Create new request
        result = await createLeaveRequest(requestData);
      }

      onSuccess(result);
    } catch (error) {
      console.error(`Error ${editingRequest ? 'updating' : 'creating'} leave request:`, error);
      setError('root', {
        type: 'manual',
        message:
          error instanceof Error
            ? error.message
            : `Failed to ${editingRequest ? 'update' : 'create'} leave request`,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    const startDate = watch('start_date');
    const endDate = watch('end_date');

    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isAfter(start, end)) return 0;

    return differenceInDays(end, start) + 1;
  };

  // Check if request is late (requires 21 days advance notice except for compassionate leave)
  const checkIsLateRequest = (requestDate: string, startDate: string, requestType: string) => {
    if (requestType === 'COMPASSIONATE') {
      return false; // Compassionate leave is exempt from advance notice rule
    }

    const requestDateTime = new Date(requestDate);
    const startDateTime = new Date(startDate);
    const daysAdvance = differenceInDays(startDateTime, requestDateTime);

    return daysAdvance < 21;
  };

  // Get late request warning message
  const getLateRequestInfo = () => {
    const requestDate = watch('request_date');
    const startDate = watch('start_date');
    const requestType = watch('request_type');

    if (!requestDate || !startDate || !requestType) return null;

    const isLate = checkIsLateRequest(requestDate, startDate, requestType);

    if (isLate && requestType !== 'COMPASSIONATE') {
      const daysAdvance = differenceInDays(new Date(startDate), new Date(requestDate));
      return {
        isLate: true,
        daysAdvance,
        message: `This request is considered LATE (${daysAdvance} days advance notice). Minimum 21 days required except for compassionate leave.`,
      };
    }

    return null;
  };

  const selectedPilot = pilots.find((p) => p.id === watch('pilot_id'));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="text-xl mr-2">{editingRequest ? '✏️' : '📝'}</span>
          {editingRequest ? 'Edit Leave Request' : 'New Leave Request'}
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 mt-1">
          <div>
            Current roster: <span className="font-medium text-[#E4002B]">{currentRoster.code}</span>
            <span className="mx-2">•</span>
            Ends: {format(currentRoster.endDate, 'dd MMM yyyy')}
          </div>
          {affectedRosterPeriods.length > 0 && (
            <div className="sm:ml-auto">
              Request affects:{' '}
              <span className="font-medium text-blue-600">
                {affectedRosterPeriods.map((p) => p.code).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Pilot Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilot <span className="text-red-500">*</span>
          </label>
          <select
            {...register('pilot_id')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
          >
            <option value="">Select a pilot...</option>
            {pilots.map((pilot) => (
              <option key={pilot.id} value={pilot.id}>
                {pilot.first_name} {pilot.middle_name && `${pilot.middle_name} `}
                {pilot.last_name} - {pilot.employee_id} ({pilot.role})
                {pilot.seniority_number && ` - Seniority #${pilot.seniority_number}`}
              </option>
            ))}
          </select>
          {errors.pilot_id && (
            <p className="text-red-600 text-sm mt-1">{errors.pilot_id.message}</p>
          )}

          {/* Selected Pilot Info */}
          {selectedPilot && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Staff ID:</span>
                  <p className="text-blue-900">{selectedPilot.employee_id}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Role:</span>
                  <p className="text-blue-900">{selectedPilot.role}</p>
                </div>
                {selectedPilot.seniority_number && (
                  <div>
                    <span className="font-medium text-blue-700">Seniority:</span>
                    <p className="text-blue-900">#{selectedPilot.seniority_number}</p>
                  </div>
                )}
                {selectedPilot.commencement_date && (
                  <div>
                    <span className="font-medium text-blue-700">Service:</span>
                    <p className="text-blue-900">
                      {Math.floor(
                        differenceInDays(new Date(), new Date(selectedPilot.commencement_date)) /
                          365
                      )}{' '}
                      years
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Leave Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Leave Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'RDO', label: 'RDO', description: 'Rostered Day Off', icon: '🏠' },
              { value: 'SDO', label: 'SDO', description: 'Substitute Day Off', icon: '🔄' },
              { value: 'ANNUAL', label: 'Annual', description: 'Annual Leave', icon: '🏖️' },
              { value: 'SICK', label: 'Sick', description: 'Sick Leave', icon: '🏥' },
              { value: 'LSL', label: 'LSL', description: 'Long Service Leave', icon: '🎖️' },
              { value: 'LWOP', label: 'LWOP', description: 'Leave Without Pay', icon: '📋' },
              {
                value: 'MATERNITY',
                label: 'Maternity',
                description: 'Maternity Leave',
                icon: '🤱',
              },
              {
                value: 'COMPASSIONATE',
                label: 'Compassionate',
                description: 'Compassionate Leave',
                icon: '💝',
              },
            ].map((type) => (
              <label key={type.value} className="relative">
                <input
                  type="radio"
                  {...register('request_type')}
                  value={type.value}
                  className="sr-only peer"
                />
                <div className="border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-[#E4002B]/50 peer-checked:border-[#E4002B] peer-checked:bg-[#E4002B]/5 transition-colors">
                  <div className="text-center">
                    <span className="text-2xl block mb-1">{type.icon}</span>
                    <span className="font-medium text-sm">{type.label}</span>
                    <span className="text-xs text-gray-500 block">{type.description}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.request_type && (
            <p className="text-red-600 text-sm mt-1">{errors.request_type.message}</p>
          )}
        </div>

        {/* Date of Request and Advisory Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Request <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('request_date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
              max={format(new Date(), 'yyyy-MM-dd')}
            />
            {errors.request_date && (
              <p className="text-red-600 text-sm mt-1">{errors.request_date.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">When did you make this request?</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advisory Method <span className="text-red-500">*</span>
            </label>
            <select
              {...register('request_method')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
            >
              <option value="">Select advisory method...</option>
              <option value="ORACLE">Oracle (Rostering System)</option>
              <option value="EMAIL">Email Communication</option>
              <option value="LEAVE_BIDS">Leave Bids System</option>
            </select>
            {errors.request_method && (
              <p className="text-red-600 text-sm mt-1">{errors.request_method.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">How were you advised about this leave?</p>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('start_date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
              min={format(new Date(), 'yyyy-MM-dd')}
            />
            {errors.start_date && (
              <p className="text-red-600 text-sm mt-1">{errors.start_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('end_date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
              min={watch('start_date') || format(new Date(), 'yyyy-MM-dd')}
            />
            {errors.end_date && (
              <p className="text-red-600 text-sm mt-1">{errors.end_date.message}</p>
            )}
          </div>
        </div>

        {/* Days Calculation and Roster Period Info */}
        {watch('start_date') && watch('end_date') && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-blue-800 font-medium">
                Duration: {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Roster Period Information */}
            {affectedRosterPeriods.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h5 className="text-purple-800 font-medium mb-2">Roster Period(s) Affected:</h5>
                <div className="space-y-1">
                  {affectedRosterPeriods.map((period, index) => (
                    <div key={period.code} className="text-sm text-purple-700">
                      <span className="font-medium">{period.code}</span>
                      <span className="ml-2">
                        ({format(period.startDate, 'dd MMM')} -{' '}
                        {format(period.endDate, 'dd MMM yyyy')})
                      </span>
                    </div>
                  ))}
                </div>
                {affectedRosterPeriods.length > 1 && (
                  <p className="text-xs text-purple-600 mt-2">
                    ⚠️ This request spans multiple roster periods
                  </p>
                )}
              </div>
            )}

            {/* Late Request Warning */}
            {(() => {
              const lateInfo = getLateRequestInfo();
              if (!lateInfo?.isLate) return null;

              return (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <span className="text-orange-500 mr-2 text-lg">⚠️</span>
                    <div>
                      <h5 className="text-orange-800 font-medium mb-1">Late Request Notice</h5>
                      <p className="text-sm text-orange-700">{lateInfo.message}</p>
                      <p className="text-xs text-orange-600 mt-2">
                        ℹ️ Late requests may require management approval and special consideration.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Conflict Warning */}
        {checkingConflicts && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <span className="text-yellow-800">⏳ Checking for conflicts...</span>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-red-800 font-medium mb-2 flex items-center">
              <span className="mr-2">⚠️</span>
              Conflicting Leave Requests
            </h4>
            <div className="space-y-2">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="text-sm text-red-700">
                  <span className="font-medium">{conflict.request_type}</span>
                  <span className="mx-2">•</span>
                  {format(new Date(conflict.start_date), 'dd MMM')} -{' '}
                  {format(new Date(conflict.end_date), 'dd MMM yyyy')}
                  <span className="mx-2">•</span>
                  <span className="capitalize">{conflict.status.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
          <textarea
            {...register('reason')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent resize-none"
            placeholder="Provide additional details for your leave request..."
          />
        </div>

        {/* Root Error */}
        {errors.root && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{errors.root.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || conflicts.length > 0}
            className="px-6 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-[#C00020] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {editingRequest ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <span className="mr-2">{editingRequest ? '✏️' : '📝'}</span>
                {editingRequest ? 'Update Request' : 'Submit Request'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
