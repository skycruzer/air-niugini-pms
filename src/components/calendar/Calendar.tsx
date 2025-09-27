'use client'

import { useState } from 'react'
import { format, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type CalendarDay, CalendarEvent, generateCalendarMonth } from '@/lib/calendar-utils'

interface CalendarProps {
  events?: CalendarEvent[]
  onDateClick?: (date: Date, events: CalendarEvent[]) => void
  onEventClick?: (event: CalendarEvent) => void
  showRosterBoundaries?: boolean
  className?: string
  eventProcessor?: (calendarDays: CalendarDay[]) => CalendarDay[]
}

export function Calendar({
  events = [],
  onDateClick,
  onEventClick,
  showRosterBoundaries = true,
  className = '',
  eventProcessor
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  let calendarDays = generateCalendarMonth(year, month)

  // Apply custom event processor if provided
  if (eventProcessor) {
    calendarDays = eventProcessor(calendarDays)
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <CalendarDay
              key={index}
              day={day}
              onDateClick={onDateClick}
              onEventClick={onEventClick}
              showRosterBoundaries={showRosterBoundaries}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface CalendarDayProps {
  day: CalendarDay
  onDateClick?: (date: Date, events: CalendarEvent[]) => void
  onEventClick?: (event: CalendarEvent) => void
  showRosterBoundaries?: boolean
}

function CalendarDay({ day, onDateClick, onEventClick, showRosterBoundaries }: CalendarDayProps) {
  const isRosterStart = day.events.some(e => e.type === 'roster-boundary' && e.title.includes('Starts'))
  const isRosterEnd = day.events.some(e => e.type === 'roster-boundary' && e.title.includes('Ends'))

  const leaveEvents = day.events.filter(e => e.type === 'leave')
  const certEvents = day.events.filter(e => e.type === 'certification')

  return (
    <div
      className={`
        min-h-[80px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50
        ${!day.isInCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
        ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
        ${isRosterStart ? 'border-l-4 border-l-[#E4002B]' : ''}
        ${isRosterEnd ? 'border-r-4 border-r-[#FFC72C]' : ''}
      `}
      onClick={() => onDateClick?.(day.date, day.events)}
    >
      {/* Date Number */}
      <div className={`text-sm font-medium mb-1 ${day.isToday ? 'text-blue-600' : ''}`}>
        {format(day.date, 'd')}
      </div>

      {/* Roster Period Indicator */}
      {showRosterBoundaries && day.rosterPeriod && format(day.date, 'd') === '1' && (
        <div className="text-xs text-gray-500 mb-1">
          {day.rosterPeriod.code}
        </div>
      )}

      {/* Events */}
      <div className="space-y-1">
        {/* Leave Events */}
        {leaveEvents.slice(0, 2).map(event => (
          <div
            key={event.id}
            className="text-xs px-1 py-0.5 rounded text-white truncate cursor-pointer"
            style={{ backgroundColor: event.color }}
            onClick={(e) => {
              e.stopPropagation()
              onEventClick?.(event)
            }}
          >
            {event.title}
          </div>
        ))}

        {/* Certification Events */}
        {certEvents.slice(0, 2).map(event => (
          <div
            key={event.id}
            className="text-xs px-1 py-0.5 rounded text-white truncate cursor-pointer"
            style={{ backgroundColor: event.color }}
            onClick={(e) => {
              e.stopPropagation()
              onEventClick?.(event)
            }}
          >
            {event.title}
          </div>
        ))}

        {/* More events indicator */}
        {(leaveEvents.length + certEvents.length) > 2 && (
          <div className="text-xs text-gray-500">
            +{(leaveEvents.length + certEvents.length) - 2} more
          </div>
        )}
      </div>
    </div>
  )
}

export default Calendar