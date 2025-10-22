import React from 'react';
import { Calendar } from 'lucide-react';

/**
 * PeriodSelector - Date range selection component
 * 
 * Provides preset period buttons (14d, 30d, 90d) and custom date inputs
 * for flexible analysis period selection.
 * 
 * @param {Date} props.startDate - Currently selected start date
 * @param {Date} props.endDate - Currently selected end date
 * @param {Object} props.availableDates - { min: Date, max: Date } available date range from CSV
 * @param {Function} props.onChange - Callback when dates change: (startDate, endDate) => void
 * 
 * @version 2.1.0
 */
export default function PeriodSelector({ startDate, endDate, availableDates, onChange }) {
  if (!availableDates) {
    return null;
  }

  const handlePresetClick = (days) => {
    const end = new Date(availableDates.max);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    
    // Ensure start is not before available data
    const actualStart = start < availableDates.min ? availableDates.min : start;
    
    onChange(actualStart, end);
  };

  const handleCustomStartChange = (e) => {
    const newStart = new Date(e.target.value);
    if (newStart <= endDate && newStart >= availableDates.min) {
      onChange(newStart, endDate);
    }
  };

  const handleCustomEndChange = (e) => {
    const newEnd = new Date(e.target.value);
    if (newEnd >= startDate && newEnd <= availableDates.max) {
      onChange(startDate, newEnd);
    }
  };

  // Calculate current period length
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Format dates for input fields (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format dates for display (DD-MM-YYYY)
  const formatDateForDisplay = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-100">Analysis Period</h3>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-3">
        <PresetButton
          label="14 days"
          days={14}
          onClick={() => handlePresetClick(14)}
          isActive={daysDiff === 14}
          isDisabled={false}
        />
        <PresetButton
          label="30 days"
          days={30}
          onClick={() => handlePresetClick(30)}
          isActive={daysDiff === 30}
          isDisabled={false}
        />
        <PresetButton
          label="90 days"
          days={90}
          onClick={() => handlePresetClick(90)}
          isActive={daysDiff === 90}
          isDisabled={false}
        />
      </div>

      {/* Custom Date Inputs */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formatDateForInput(startDate)}
              min={formatDateForInput(availableDates.min)}
              max={formatDateForInput(endDate)}
              onChange={handleCustomStartChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         hover:border-gray-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Available from: {formatDateForDisplay(availableDates.min)}
            </p>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={formatDateForInput(endDate)}
              min={formatDateForInput(startDate)}
              max={formatDateForInput(availableDates.max)}
              onChange={handleCustomEndChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         hover:border-gray-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Available until: {formatDateForDisplay(availableDates.max)}
            </p>
          </div>
        </div>

        {/* Current Selection Summary */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Selected period:</span>
            <span className="font-medium text-gray-100">
              {formatDateForDisplay(startDate)} → {formatDateForDisplay(endDate)}
              <span className="text-gray-500 ml-2">({daysDiff} days)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PresetButton - Reusable button component for preset periods
 */
function PresetButton({ label, days, onClick, isActive, isDisabled }) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        px-4 py-2 rounded-md font-medium text-sm transition-all
        ${isActive 
          ? 'bg-blue-600 text-white border-2 border-blue-400' 
          : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
        }
        ${isDisabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
      `}
    >
      {label}
    </button>
  );
}
