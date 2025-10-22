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
    if (!endDate) return; // Need endDate to validate
    const newStart = new Date(e.target.value);
    if (newStart <= endDate && newStart >= availableDates.min) {
      onChange(newStart, endDate);
    }
  };

  const handleCustomEndChange = (e) => {
    if (!startDate) return; // Need startDate to validate
    const newEnd = new Date(e.target.value);
    if (newEnd >= startDate && newEnd <= availableDates.max) {
      onChange(startDate, newEnd);
    }
  };

  // Calculate current period length (only if both dates exist)
  const daysDiff = startDate && endDate 
    ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  // Format dates for input fields (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format dates for display (DD-MM-YYYY)
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="flex items-center gap-2" style={{ flexWrap: 'nowrap' }}>
      {/* Preset Buttons - Inline */}
      <div className="flex gap-2" style={{ flexShrink: 0 }}>
        <PresetButton
          label="14d"
          days={14}
          onClick={() => handlePresetClick(14)}
          isActive={daysDiff === 14}
          isDisabled={false}
        />
        <PresetButton
          label="30d"
          days={30}
          onClick={() => handlePresetClick(30)}
          isActive={daysDiff === 30}
          isDisabled={false}
        />
        <PresetButton
          label="90d"
          days={90}
          onClick={() => handlePresetClick(90)}
          isActive={daysDiff === 90}
          isDisabled={false}
        />
      </div>

      {/* Custom Date Inputs - Inline */}
      <div className="flex gap-2 items-center">
        {/* Start Date */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 whitespace-nowrap">
            Start
          </label>
          <input
            type="date"
            value={formatDateForInput(startDate)}
            min={formatDateForInput(availableDates.min)}
            max={formatDateForInput(endDate)}
            onChange={handleCustomStartChange}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm
                       focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 whitespace-nowrap">
            End
          </label>
          <input
            type="date"
            value={formatDateForInput(endDate)}
            min={formatDateForInput(startDate)}
            max={formatDateForInput(availableDates.max)}
            onChange={handleCustomEndChange}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm
                       focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        {/* Period Length Badge */}
        {daysDiff > 0 && (
          <div className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-300">
            {daysDiff} {daysDiff === 1 ? 'dag' : 'dagen'}
          </div>
        )}
      </div>
    </div>
  );
}

/**
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
