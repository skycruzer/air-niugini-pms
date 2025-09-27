'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, User, AlertTriangle, Eye, Grid, List } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfYear, endOfYear, eachMonthOfInterval, addYears, subYears } from 'date-fns'

interface CertificationEvent {
  id: string
  pilotName: string
  employeeId: string
  checkCode: string
  checkDescription: string
  expiryDate: Date
  status: 'expired' | 'expiring_soon' | 'due_soon'
}

interface CertificationCalendarProps {
  certifications: CertificationEvent[]
  onDateSelect?: (date: Date, events: CertificationEvent[]) => void
}

type ViewMode = 'month' | 'year'

export function CertificationCalendar({ certifications, onDateSelect }: CertificationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  // Group certifications by date
  const eventsByDate = certifications.reduce((acc, cert) => {
    const dateKey = format(cert.expiryDate, 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(cert)
    return acc
  }, {} as Record<string, CertificationEvent[]>)

  const getEventsForDate = (date: Date): CertificationEvent[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return eventsByDate[dateKey] || []
  }

  const getDateStatus = (date: Date): { hasEvents: boolean; status: string; count: number } => {
    const events = getEventsForDate(date)
    if (events.length === 0) {
      return { hasEvents: false, status: 'none', count: 0 }
    }

    const hasExpired = events.some(e => e.status === 'expired')
    const hasExpiringSoon = events.some(e => e.status === 'expiring_soon')
    const hasDueSoon = events.some(e => e.status === 'due_soon')

    if (hasExpired) {
      return { hasEvents: true, status: 'expired', count: events.length }
    } else if (hasExpiringSoon) {
      return { hasEvents: true, status: 'expiring_soon', count: events.length }
    } else if (hasDueSoon) {
      return { hasEvents: true, status: 'due_soon', count: events.length }
    }

    return { hasEvents: true, status: 'normal', count: events.length }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const events = getEventsForDate(date)
    onDateSelect?.(date, events)
  }

  const navigateTime = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
    } else {
      setCurrentDate(prev => direction === 'prev' ? subYears(prev, 1) : addYears(prev, 1))
    }
  }

  const getDayClasses = (date: Date) => {
    const { hasEvents, status } = getDateStatus(date)
    const baseClasses = "relative flex items-center justify-center text-sm cursor-pointer transition-all duration-200 rounded-lg"

    let classes = baseClasses

    if (viewMode === 'month') {
      classes += " w-full h-12"
    } else {
      classes += " w-8 h-8 m-0.5"
    }

    // Month styling
    if (!isSameMonth(date, currentDate) && viewMode === 'month') {
      classes += " text-gray-300"
    } else {
      classes += " text-gray-900"
    }

    // Today styling
    if (isToday(date)) {
      classes += " ring-2 ring-blue-500 font-bold bg-blue-50"
    }

    // Selected date styling
    if (selectedDate && isSameDay(date, selectedDate)) {
      classes += " bg-[#E4002B] text-white shadow-lg"
    } else if (hasEvents) {
      // Event status styling with enhanced colors
      switch (status) {
        case 'expired':
          classes += " bg-red-500 text-white font-semibold shadow-md hover:bg-red-600"
          break
        case 'expiring_soon':
          classes += " bg-yellow-400 text-gray-900 font-semibold shadow-md hover:bg-yellow-500"
          break
        case 'due_soon':
          classes += " bg-orange-400 text-white font-semibold shadow-md hover:bg-orange-500"
          break
        default:
          classes += " bg-green-400 text-white shadow-md hover:bg-green-500"
      }
    } else {
      classes += " hover:bg-gray-100 hover:shadow-sm"
    }

    return classes
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expired':
        return '🚫'
      case 'expiring_soon':
        return '⚠️'
      case 'due_soon':
        return '⏰'
      default:
        return '✅'
    }
  }

  const getMonthEvents = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    return monthDays.reduce((count, day) => {
      const events = getEventsForDate(day)
      return count + events.length
    }, 0)
  }

  const getMonthStatus = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    let hasExpired = false
    let hasExpiringSoon = false
    let hasDueSoon = false

    for (const day of monthDays) {
      const events = getEventsForDate(day)
      for (const event of events) {
        if (event.status === 'expired') hasExpired = true
        if (event.status === 'expiring_soon') hasExpiringSoon = true
        if (event.status === 'due_soon') hasDueSoon = true
      }
    }

    if (hasExpired) return 'expired'
    if (hasExpiringSoon) return 'expiring_soon'
    if (hasDueSoon) return 'due_soon'
    return 'normal'
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    return (
      <div className="p-6">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="h-10 flex items-center justify-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
              {day.substring(0, 3)}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(date => {
            const { hasEvents, status, count } = getDateStatus(date)
            return (
              <div
                key={date.toISOString()}
                className={getDayClasses(date)}
                onClick={() => handleDateClick(date)}
              >
                <span className="text-sm font-medium">{format(date, 'd')}</span>
                {hasEvents && (
                  <>
                    <div className="absolute top-1 right-1 text-xs">
                      {getStatusIcon(status)}
                    </div>
                    {count > 1 && (
                      <div className="absolute bottom-1 left-1 bg-white text-gray-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow">
                        {count}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate)
    const yearEnd = endOfYear(currentDate)
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })

    return (
      <div className="p-6">
        <div className="grid grid-cols-3 gap-6">
          {months.map(month => {
            const monthStart = startOfMonth(month)
            const monthEnd = endOfMonth(month)
            const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
            const eventCount = getMonthEvents(month)
            const monthStatus = getMonthStatus(month)

            return (
              <div key={month.toISOString()} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{format(month, 'MMMM')}</h4>
                  {eventCount > 0 && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      monthStatus === 'expired' ? 'bg-red-500 text-white' :
                      monthStatus === 'expiring_soon' ? 'bg-yellow-400 text-gray-900' :
                      monthStatus === 'due_soon' ? 'bg-orange-400 text-white' :
                      'bg-green-400 text-white'
                    }`}>
                      {eventCount}
                    </div>
                  )}
                </div>

                {/* Mini calendar grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="bg-gray-50 text-xs text-gray-500 p-1 text-center font-medium">
                      {day}
                    </div>
                  ))}
                  {monthDays.map(date => {
                    const { hasEvents, status } = getDateStatus(date)
                    return (
                      <div
                        key={date.toISOString()}
                        className={getDayClasses(date)}
                        onClick={() => {
                          setViewMode('month')
                          setCurrentDate(date)
                          handleDateClick(date)
                        }}
                      >
                        <span className="text-xs">{format(date, 'd')}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[#E4002B] to-[#C00020] text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6" />
            <div>
              <h3 className="text-xl font-bold">Certification Calendar</h3>
              <p className="text-red-100 text-sm">
                {viewMode === 'month' ? 'Monthly View' : 'Yearly Overview'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex bg-red-800/30 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white text-[#E4002B]'
                    : 'text-red-100 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4 inline mr-1" />
                Month
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'year'
                    ? 'bg-white text-[#E4002B]'
                    : 'text-red-100 hover:text-white'
                }`}
              >
                <List className="w-4 h-4 inline mr-1" />
                Year
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateTime('prev')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h4 className="text-lg font-semibold min-w-[160px] text-center">
                {viewMode === 'month'
                  ? format(currentDate, 'MMMM yyyy')
                  : format(currentDate, 'yyyy')
                }
              </h4>
              <button
                onClick={() => navigateTime('next')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      {viewMode === 'month' ? renderMonthView() : renderYearView()}

      {/* Enhanced Legend */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-lg shadow"></div>
            <span className="text-gray-700 font-medium">Expired</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-lg shadow"></div>
            <span className="text-gray-700 font-medium">Expiring Soon</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-400 rounded-lg shadow"></div>
            <span className="text-gray-700 font-medium">Due Soon</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-400 rounded-lg shadow"></div>
            <span className="text-gray-700 font-medium">Current</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-50 border-2 border-blue-500 rounded-lg"></div>
            <span className="text-gray-700 font-medium">Today</span>
          </div>
        </div>
      </div>

      {/* Enhanced Selected Date Details */}
      {selectedDate && (
        <div className="border-t border-gray-200 bg-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h4>
              <Eye className="w-5 h-5 text-gray-400" />
            </div>

            {getEventsForDate(selectedDate).length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {getEventsForDate(selectedDate).map((event, index) => (
                  <div
                    key={`${event.id}-${index}`}
                    className={`p-4 rounded-lg border-l-4 ${
                      event.status === 'expired' ? 'bg-red-50 border-red-500' :
                      event.status === 'expiring_soon' ? 'bg-yellow-50 border-yellow-400' :
                      event.status === 'due_soon' ? 'bg-orange-50 border-orange-400' :
                      'bg-green-50 border-green-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-900">{event.pilotName}</span>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {event.employeeId}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-[#E4002B] bg-red-100 px-2 py-1 rounded">
                            {event.checkCode}
                          </span>
                          <span className="text-sm text-gray-600">{event.checkDescription}</span>
                        </div>
                      </div>
                      {event.status === 'expired' && (
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No certifications expiring on this date.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}