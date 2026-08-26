import React from 'react';
import {
  Layers,
  Sparkles,
  TrendingUp,
  Landmark,
  TrendingDown,
  Search,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import { QuickFilterPreset } from '../types';

interface QuickFilterBarProps {
  currentPreset: QuickFilterPreset;
  onSelectPreset: (preset: QuickFilterPreset) => void;
  selectedCount: number;
  totalFilteredCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  currentPreset,
  onSelectPreset,
  selectedCount,
  totalFilteredCount,
  searchQuery,
  onSearchChange,
  onSelectAll,
  onDeselectAll,
}) => {
  const filterPresets = [
    {
      id: 'top10_market_cap' as QuickFilterPreset,
      name: '市值前十大 ETF',
      icon: Layers,
      description: '全市場依規模排序前 10 檔',
    },
    {
      id: 'top10_active' as QuickFilterPreset,
      name: '主動型 ETF 前十大',
      icon: Sparkles,
      description: '新一代主動操盤選股 ETF',
    },
    {
      id: 'leveraged_all' as QuickFilterPreset,
      name: '正向槓桿型（全部）',
      icon: TrendingUp,
      description: '含台指正2、海外指數正2等',
    },
    {
      id: 'bond_all' as QuickFilterPreset,
      name: '債券型 ETF（全部）',
      icon: Landmark,
      description: '美債、投資級公司債、金融債等',
    },
    {
      id: 'inverse_all' as QuickFilterPreset,
      name: '反向型 ETF（全部）',
      icon: TrendingDown,
      description: '避險反向1倍 ETF 群組',
    },
  ];

  return (
    <div
      id="quick-filter-bar"
      className="flex flex-col gap-3 rounded-xl bg-[#1c1c1c] p-3.5 sm:p-4 border border-[#242424]"
    >
      {/* 5 Preset Quick Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242424] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00f6ff]">
            QUICK FILTERS / 一鍵篩選
          </span>
          <span className="text-xs text-[#a0a0a0] font-light">
            (切換清單與圓餅圖標的)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#a0a0a0] text-[11px]">
            已選取 <strong className="text-[#00f6ff] font-mono">{selectedCount}</strong> /{' '}
            {totalFilteredCount} 檔
          </span>
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs text-[#a0a0a0] hover:text-[#00f6ff] transition-colors underline underline-offset-2 ml-2"
          >
            全選
          </button>
          <span className="text-[#333333]">|</span>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-xs text-[#a0a0a0] hover:text-[#ff6b5b] transition-colors underline underline-offset-2"
          >
            清空
          </button>
        </div>
      </div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {filterPresets.map((preset) => {
          const Icon = preset.icon;
          const isActive = currentPreset === preset.id;

          return (
            <button
              key={preset.id}
              id={`preset-btn-${preset.id}`}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                isActive
                  ? 'bg-[#0a0a0a] border-[#00f6ff]/70 shadow-[0_0_10px_rgba(0,246,255,0.15)] text-[#00f6ff]'
                  : 'bg-[#0d0d0d] border-[#242424] hover:border-[#333333] hover:bg-[#141414] text-[#a0a0a0]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? 'text-[#00f6ff]' : 'text-[#a0a0a0]'
                    }`}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      isActive ? 'text-[#00f6ff]' : 'text-[#f0f0f0]'
                    }`}
                  >
                    {preset.name}
                  </span>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00f6ff] shadow-[0_0_4px_#00f6ff]" />
                )}
              </div>
              <span className="text-[10px] text-[#888888] line-clamp-1">
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a0a0a0]" />
          <input
            id="etf-search-input"
            type="text"
            placeholder="搜尋代號或名稱 (如 0050, 美債...)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg bg-[#0a0a0a] py-1.5 pl-8 pr-3 text-xs text-[#f0f0f0] placeholder-[#555555] border border-[#2a2a2a] focus:border-[#00f6ff]/60 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#a0a0a0] hover:text-[#f0f0f0]"
            >
              ✕
            </button>
          )}
        </div>

        {currentPreset === 'custom' && (
          <div className="inline-flex items-center gap-1.5 rounded-md bg-[#0a0a0a] px-2.5 py-1 text-xs text-[#00f6ff] border border-[#00f6ff]/30">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00f6ff] animate-ping" />
            <span className="text-[11px] font-mono">自訂個別勾選模式</span>
          </div>
        )}
      </div>
    </div>
  );
};
