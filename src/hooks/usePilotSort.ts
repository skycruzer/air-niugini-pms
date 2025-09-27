'use client'

import { useState, useMemo } from 'react'
import { PilotWithCertifications } from '@/lib/pilot-service-client'
import { SortField, SortDirection } from '@/components/pilots/PilotListHeader'

export function usePilotSort(pilots: PilotWithCertifications[]) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedPilots = useMemo(() => {
    const sorted = [...pilots].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase()
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase()
          break

        case 'employee_id':
          aValue = a.employee_id.toLowerCase()
          bValue = b.employee_id.toLowerCase()
          break

        case 'role':
          aValue = a.role
          bValue = b.role
          break

        case 'seniority_number':
          aValue = a.seniority_number || 999999 // Put pilots without seniority at the end
          bValue = b.seniority_number || 999999
          break

        case 'is_active':
          aValue = a.is_active ? 1 : 0
          bValue = b.is_active ? 1 : 0
          break

        case 'certificationStatus':
          // Sort by expired (highest priority), then expiring, then current
          const getStatusPriority = (pilot: PilotWithCertifications) => {
            if (pilot.certificationStatus.expired > 0) return 3
            if (pilot.certificationStatus.expiring > 0) return 2
            return 1
          }
          aValue = getStatusPriority(a)
          bValue = getStatusPriority(b)
          break

        default:
          return 0
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Compare values
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [pilots, sortField, sortDirection])

  return {
    sortedPilots,
    sortField,
    sortDirection,
    handleSort
  }
}