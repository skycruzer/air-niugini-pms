// Pilot service client using Supabase
// Re-export all types and functions from the real pilot service

import * as pilotService from './pilot-service'

// Re-export all types
export * from './pilot-service'

// Export all functions from the pilot service
export const {
  getAllPilots,
  getPilotById,
  getPilotCertifications,
  createPilot,
  updatePilot,
  deletePilot,
  searchPilots,
  checkEmployeeIdExists,
  getPilotStats,
  getAllCheckTypes,
  getExpiringCertifications,
  getPilotsWithExpiredCertifications,
  // New certification management functions
  updatePilotCertification,
  updatePilotCertifications,
  getPilotCertificationsWithAllTypes
} = pilotService

console.log('🚀 Using REAL pilot service with Supabase')