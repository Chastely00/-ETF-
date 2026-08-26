import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { AVAILABLE_TRADING_DATES, LATEST_DATA_DATE, EARLIEST_DATA_DATE } from '../data/timeSeriesData';

interface RangePickerBarProps {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  tradingDaysCount: number;
}

export const RangePickerBar: React.FC<RangePickerBarProps> = ({
  startDate,
  endDate,
  onRangeChange,
  tradingDaysCount,
}) => {
  const latestDate = LATEST_DATA_DATE;
  const earliestDate = EARLIEST_DATA_DATE;

  // 定義預設按鈕：包含 1日、5日、20日、30日、2026今年以來 (YTD)、2025去年整年 (Full Year 2025)
  const presets = [
    {
      label: '最新 1 日',
      getRange: () => ({
        start: AVAILABLE_TRADING_DATES[0],
        end: latestDate,
      }),
    },
    {
      label: '近 5 日',
      getRange: () => ({
        start: AVAILABLE_TRADING_DATES[Math.min(4, AVAILABLE_TRADING_DATES.length - 1)],
        end: latestDate,
      }),
    },
    {
      label: '近 20 日',
      getRange: () => ({
        start: AVAILABLE_TRADING_DATES[Math.min(19, AVAILABLE_TRADING_DATES.length - 1)],
        end: latestDate,
      }),
    },
    {
      label: '近 30 日',
      getRange: () => ({
        start: AVAILABLE_TRADING_DATES[Math.min(29, AVAILABLE_TRADING_DATES.length - 1)],
        end: latestDate,
      }),
    },
    {
      label: '今年整年 (2026 YTD)',
      getRange: () => {
        // 2026年第一個交易日到最新日
        const dates2026 = AVAILABLE_TRADING_DATES.filter((d) => d.startsWith('2026-'));
        return {
          start: dates2026[dates2026.length - 1] || '2026-01-02',
          end: latestDate,
        };
      },
    },
    {
      label: '去年整年 (2025 全年)',
      getRange: () => {
        // 2025年完整交易日
        const dates2025 = AVAILABLE_TRADING_DATES.filter((d) => d.startsWith('2025-'));
        return {
          start: dates2025[dates2025.length - 1] || '2025-01-02',
          end: dates2025[0] || '2025-12-31',
        };
      },
    },
  ];

  return (
    <div
      id="range-picker-container"
      className="rounded-xl bg-[#1c1c1c] p-3 sm:p-4 border border-[#242424] shadow-sm transition-all"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Range Selection Inputs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f0f0f0]">
            <Calendar className="h-3.5 w-3.5 text-[#00f6ff]" />
            <span className="text-[11px] uppercase tracking-wider text-[#a0a0a0]">查詢區間</span>
          </div>

          <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-lg px-2.5 py-1.5 border border-[#2a2a2a]">
            <input
              id="start-date-input"
              type="date"
              value={startDate}
              min={earliestDate}
              max={latestDate}
              onChange={(e) => onRangeChange(e.target.value, endDate)}
              className="bg-transparent text-xs text-[#f0f0f0] focus:outline-none cursor-pointer [color-scheme:dark]"
            />
            <span className="text-xs text-[#666666]">至</span>
            <input
              id="end-date-input"
              type="date"
              value={endDate}
              min={earliestDate}
              max={latestDate}
              onChange={(e) => onRangeChange(startDate, e.target.value)}
              className="bg-transparent text-xs text-[#f0f0f0] focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          <span className="inline-flex items-center rounded-md bg-[#0a0a0a] px-2 py-1 text-[11px] font-medium text-[#a0a0a0] border border-[#242424]">
            <Clock className="mr-1 h-3 w-3 text-[#00f6ff]" />
            累計 {tradingDaysCount} 個交易日
          </span>
        </div>

        {/* Right: Quick Range Presets styled as elegant dark segment controls */}
        <div className="flex items-center gap-1.5 bg-[#0a0a0a] p-1 rounded-lg border border-[#242424] overflow-x-auto">
          {presets.map((p) => {
            const range = p.getRange();
            const isActive = startDate === range.start && endDate === range.end;

            return (
              <button
                key={p.label}
                id={`preset-range-${p.label.replace(/\s+/g, '-').toLowerCase()}`}
                type="button"
                onClick={() => onRangeChange(range.start, range.end)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1c1c1c] text-[#00f6ff] font-semibold border border-[#333333] shadow-sm'
                    : 'text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-[#141414]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
