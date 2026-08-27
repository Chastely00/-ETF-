import React from 'react';
import {
  TrendingUp,
  Globe,
  SlidersHorizontal,
  Info,
  Download,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { LATEST_DATA_DATE } from '../data/timeSeriesData';

interface NavbarProps {
  includeForeign: boolean;
  onToggleForeign: (val: boolean) => void;
  onOpenSelector: () => void;
  onOpenAudit: () => void;
  onExportCsv: () => void;
  selectedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  includeForeign,
  onToggleForeign,
  onOpenSelector,
  onOpenAudit,
  onExportCsv,
  selectedCount,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full border-b border-[#1c1c1c] bg-[#0d0d0d]/95 backdrop-blur-md"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-6 bg-[#00f6ff] rounded-xs shadow-[0_0_10px_rgba(0,246,255,0.4)] inline-block" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#f0f0f0]">
                    ETF FLOW
                  </h1>
                  <span className="text-xs text-[#a0a0a0] font-light hidden sm:inline">
                    | 台灣市場申贖籌碼監控
                  </span>
                  <span className="hidden md:inline-flex items-center rounded bg-[#1c1c1c] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#00f6ff] border border-[#2a2a2a]">
                    TWSE / TPEx
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <p className="text-[10px] uppercase tracking-widest text-[#a0a0a0] flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00f6ff] animate-pulse"></span>
                    最新資料至 {LATEST_DATA_DATE.replace(/-/g, '/')} (T+1)
                  </p>
                  <span className="text-[10px] text-[#555555] hidden sm:inline">·</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-[#00f6ff]/90 bg-[#0a0a0a] px-1.5 py-0.5 rounded border border-[#242424]">
                    <span className="h-1 w-1 rounded-full bg-[#00f6ff]"></span>
                    每日 07:03 自動排程更新
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Tools & Global Toggles */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Foreign Holdings Toggle */}
            <div
              id="foreign-holding-toggle"
              className="flex items-center gap-2 rounded-lg bg-[#1c1c1c] px-3 py-1.5 border border-[#2a2a2a] transition-all hover:border-[#3a3a3a]"
              title="切換是否包含追蹤海外指數或投資海外標的的 ETF"
            >
              <Globe
                className={`h-3.5 w-3.5 transition-colors ${
                  includeForeign ? 'text-[#00f6ff]' : 'text-[#a0a0a0]'
                }`}
              />
              <span className="hidden md:inline text-[11px] uppercase tracking-wider font-medium text-[#f0f0f0]">
                含海外標的
              </span>
              <button
                id="toggle-foreign-btn"
                type="button"
                role="switch"
                aria-checked={includeForeign}
                onClick={() => onToggleForeign(!includeForeign)}
                className={`relative inline-flex h-4.5 w-8 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includeForeign ? 'bg-[#00f6ff]' : 'bg-[#242424]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-[#0a0a0a] shadow ring-0 transition duration-200 ease-in-out ${
                    includeForeign ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Custom Selector Drawer Trigger */}
            <button
              id="open-selector-btn"
              type="button"
              onClick={onOpenSelector}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1c1c1c] px-3 py-1.5 text-xs font-medium text-[#f0f0f0] border border-[#2a2a2a] hover:bg-[#242424] hover:border-[#00f6ff]/40 transition-all"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#00f6ff]" />
              <span className="hidden sm:inline">自訂選取</span>
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00f6ff]/20 px-1 text-[10px] font-bold text-[#00f6ff]">
                {selectedCount}
              </span>
            </button>

            {/* Export CSV */}
            <button
              id="export-csv-btn"
              type="button"
              onClick={onExportCsv}
              title="匯出目前區間計算結果為 CSV"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1c1c1c] px-3 py-1.5 text-xs font-medium text-[#f0f0f0] border border-[#2a2a2a] hover:bg-[#242424] hover:text-[#00f6ff] transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">匯出</span>
            </button>

            {/* WCAG & Principle Modal Trigger */}
            <button
              id="open-audit-btn"
              type="button"
              onClick={onOpenAudit}
              title="查看資料計算原理與 WCAG AA 對比度檢測"
              className="inline-flex items-center justify-center rounded-lg bg-[#1c1c1c] p-2 text-[#a0a0a0] hover:text-[#00f6ff] hover:bg-[#242424] border border-[#2a2a2a] transition-all"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
