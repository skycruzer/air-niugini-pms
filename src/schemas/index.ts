/**
 * @fileoverview Central Zod Schemas Export
 * Exports all Zod validation schemas from a single location
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-30
 */

// ===== PILOT SCHEMAS =====
export {
  employeeIdSchema,
  pilotRoleSchema,
  captainQualificationsSchema,
  dateStringSchema,
  optionalDateStringSchema,
  uuidSchema as pilotUuidSchema,
  createPilotSchema,
  updatePilotSchema,
  pilotFilterSchema,
  pilotIdSchema,
  pilotIdsSchema,
  pilotBulkActionSchema,
  pilotQuerySchema,
  pilotDataSchema,
} from './pilot.schema';

export type {
  CreatePilotInput,
  UpdatePilotInput,
  PilotFilterInput,
  PilotBulkActionInput,
  PilotQueryInput,
  PilotData,
} from './pilot.schema';

// ===== CERTIFICATION SCHEMAS =====
export {
  certificationStatusSchema,
  checkCategorySchema,
  upsertCertificationSchema,
  updateCertificationSchema,
  bulkCertificationUpdateSchema,
  certificationFilterSchema,
  expiringCertificationsQuerySchema,
  certificationQuerySchema,
  certificationDataSchema,
  certificationWithRelationsSchema,
  checkTypeDataSchema,
  createCheckTypeSchema,
  updateCheckTypeSchema,
  certificationStatisticsSchema,
} from './certification.schema';

export type {
  UpsertCertificationInput,
  UpdateCertificationInput,
  BulkCertificationUpdateInput,
  CertificationFilterInput,
  ExpiringCertificationsQueryInput,
  CertificationQueryInput,
  CertificationData,
  CertificationWithRelations,
  CheckTypeData,
  CreateCheckTypeInput,
  UpdateCheckTypeInput,
  CertificationStatistics,
} from './certification.schema';

// ===== LEAVE REQUEST SCHEMAS =====
export {
  leaveTypeSchema,
  leaveStatusSchema,
  rosterPeriodSchema,
  createLeaveRequestSchema,
  updateLeaveRequestSchema,
  updateLeaveStatusSchema,
  leaveConflictCheckSchema,
  leaveFilterSchema,
  leaveQuerySchema,
  leaveRequestDataSchema,
  leaveRequestWithRelationsSchema,
  leaveConflictSchema,
  leaveConflictCheckResponseSchema,
  leaveStatisticsSchema,
  rosterPeriodDataSchema,
} from './leave.schema';

export type {
  CreateLeaveRequestInput,
  UpdateLeaveRequestInput,
  UpdateLeaveStatusInput,
  LeaveConflictCheckInput,
  LeaveFilterInput,
  LeaveQueryInput,
  LeaveRequestData,
  LeaveRequestWithRelations,
  LeaveConflict,
  LeaveConflictCheckResponse,
  LeaveStatistics,
  RosterPeriodData,
} from './leave.schema';

// ===== API RESPONSE SCHEMAS =====
export {
  apiResponseSchema,
  apiErrorSchema,
  errorResponseSchema,
  paginationMetadataSchema,
  successResponseSchema,
  emptySuccessResponseSchema,
  dashboardStatsResponseSchema,
  bulkOperationResultSchema,
  fileUploadResponseSchema,
  reportGenerationResponseSchema,
  loginResponseSchema,
  validationErrorResponseSchema,
  healthCheckResponseSchema,
  chartDataResponseSchema,
  analyticsResultSchema,
  settingsUpdateResponseSchema,
  createApiResponse,
  createErrorResponse,
  createSuccessResponse,
} from './api-response.schema';

export type {
  ApiResponse,
  ApiError,
  ErrorResponse,
  PaginationMetadata,
  EmptySuccessResponse,
  DashboardStatsResponse,
  BulkOperationResult,
  FileUploadResponse,
  ReportGenerationResponse,
  LoginResponse,
  ValidationErrorResponse,
  HealthCheckResponse,
  ChartDataResponse,
  AnalyticsResult,
  SettingsUpdateResponse,
} from './api-response.schema';
