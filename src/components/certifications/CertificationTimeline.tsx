'use client';

import { useState, useRef, useEffect } from 'react';
import { format, differenceInDays, addDays, min, max } from 'date-fns';
import {
  getCertificationStatus,
  getCategoryColor,
  getCategoryIcon,
} from '@/lib/certification-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CertificationEvent {
  id: string;
  checkCode: string;
  checkDescription: string;
  category: string;
  expiryDate: Date;
  pilotName?: string;
  employeeId?: string;
}

interface CertificationTimelineProps {
  certifications: CertificationEvent[];
  onCertificationClick?: (certification: CertificationEvent) => void;
  showPilotNames?: boolean;
  categories?: string[];
}

/**
 * CertificationTimeline Component
 *
 * Displays a horizontal timeline of certifications with:
 * - Visual status indicators (red/yellow/green)
 * - Zoom in/out functionality
 * - Category filtering
 * - Today marker
 * - Hover details
 * - Keyboard navigation
 */
export function CertificationTimeline({
  certifications,
  onCertificationClick,
  showPilotNames = false,
  categories = [],
}: CertificationTimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories);
  const [hoveredCert, setHoveredCert] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  // Get all unique categories if not provided
  const availableCategories =
    categories.length > 0 ? categories : Array.from(new Set(certifications.map((c) => c.category)));

  // Filter certifications by selected categories
  const filteredCertifications =
    selectedCategories.length === 0
      ? certifications
      : certifications.filter((c) => selectedCategories.includes(c.category));

  // Calculate timeline range
  const dates = filteredCertifications.map((c) => c.expiryDate);
  const minDate = dates.length > 0 ? min(dates) : addDays(today, -30);
  const maxDate = dates.length > 0 ? max(dates) : addDays(today, 90);
  const totalDays = differenceInDays(maxDate, minDate);

  // Calculate position on timeline (0-100%)
  const getPosition = (date: Date): number => {
    const daysFromStart = differenceInDays(date, minDate);
    return (daysFromStart / totalDays) * 100;
  };

  // Get today's position
  const todayPosition = getPosition(today);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));

  // Category filter toggle
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  // Scroll controls
  const scrollTimeline = (direction: 'left' | 'right') => {
    if (timelineRef.current) {
      const scrollAmount = 200;
      const newPosition =
        direction === 'left'
          ? timelineRef.current.scrollLeft - scrollAmount
          : timelineRef.current.scrollLeft + scrollAmount;

      timelineRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth',
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scrollTimeline('left');
      } else if (e.key === 'ArrowRight') {
        scrollTimeline('right');
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Controls */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 text-[#E4002B] mr-2" />
              Certification Timeline
            </h3>
            <span className="text-sm text-gray-500">
              {filteredCertifications.length} certification
              {filteredCertifications.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Scroll Controls */}
            <button
              onClick={() => scrollTimeline('left')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Scroll left (Arrow Left)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollTimeline('right')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Scroll right (Arrow Right)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-2"></div>

            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom in (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-2"></div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-[#E4002B] text-white'
                  : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategories([])}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategories.length === 0
                      ? 'bg-[#E4002B] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Categories
                </button>
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-[#E4002B] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{getCategoryIcon(category)}</span>
                    {category}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Date Labels */}
        <div className="px-6 pt-4 pb-2 border-b border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{format(minDate, 'MMM dd, yyyy')}</span>
            <span>Today: {format(today, 'MMM dd, yyyy')}</span>
            <span>{format(maxDate, 'MMM dd, yyyy')}</span>
          </div>
        </div>

        {/* Timeline Scroll Container */}
        <div
          ref={timelineRef}
          className="overflow-x-auto"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
          }}
          onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
        >
          <div
            className="relative h-48 py-6"
            style={{
              width: `${100 * zoom}%`,
              minWidth: '800px',
            }}
          >
            {/* Today Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#E4002B] z-10"
              style={{ left: `${todayPosition}%` }}
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#E4002B] text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Today
              </div>
            </div>

            {/* Timeline Base Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>

            {/* Certification Events */}
            {filteredCertifications.map((cert, index) => {
              const position = getPosition(cert.expiryDate);
              const status = getCertificationStatus(cert.expiryDate);
              const daysUntilExpiry = differenceInDays(cert.expiryDate, today);
              const isHovered = hoveredCert === cert.id;

              return (
                <motion.div
                  key={cert.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer"
                  style={{ left: `${position}%` }}
                  onMouseEnter={() => setHoveredCert(cert.id)}
                  onMouseLeave={() => setHoveredCert(null)}
                  onClick={() => onCertificationClick?.(cert)}
                >
                  {/* Event Marker */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      status.color === 'red'
                        ? 'bg-red-500 border-red-600'
                        : status.color === 'yellow'
                          ? 'bg-yellow-500 border-yellow-600'
                          : status.color === 'green'
                            ? 'bg-green-500 border-green-600'
                            : 'bg-gray-400 border-gray-500'
                    } ${isHovered ? 'scale-150' : 'scale-100'}`}
                  ></div>

                  {/* Hover Card */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-64 p-4 rounded-lg shadow-lg border z-20 ${
                          status.color === 'red'
                            ? 'bg-red-50 border-red-200'
                            : status.color === 'yellow'
                              ? 'bg-yellow-50 border-yellow-200'
                              : status.color === 'green'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {showPilotNames && cert.pilotName && (
                          <div className="mb-2 pb-2 border-b border-gray-200">
                            <p className="font-semibold text-gray-900">{cert.pilotName}</p>
                            {cert.employeeId && (
                              <p className="text-xs text-gray-500">ID: {cert.employeeId}</p>
                            )}
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <span className="font-bold text-[#E4002B]">{cert.checkCode}</span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(cert.category)}`}
                            >
                              {cert.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{cert.checkDescription}</p>
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600">Expiry Date:</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {format(cert.expiryDate, 'MMM dd, yyyy')}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                daysUntilExpiry < 0
                                  ? 'text-red-600'
                                  : daysUntilExpiry <= 30
                                    ? 'text-yellow-600'
                                    : 'text-green-600'
                              }`}
                            >
                              {daysUntilExpiry < 0
                                ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                                : daysUntilExpiry === 0
                                  ? 'Expires today'
                                  : `${daysUntilExpiry} days remaining`}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-gray-700">Expired</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-gray-700">Expiring Soon (≤30 days)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-gray-700">Current</span>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="px-6 py-2 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-center text-gray-500">
            <span className="font-medium">Keyboard shortcuts:</span> Arrow keys to scroll • +/- to
            zoom
          </p>
        </div>
      </div>
    </div>
  );
}
