/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  AggregateRangeSummary,
  EtfMaster,
  PieDisplayMode,
  QuickFilterPreset,
  RangeSummaryItem,
} from './types';
import {
  AVAILABLE_TRADING_DATES,
  DEFAULT_START_DATE,
  LATEST_DATA_DATE,
} from './data/timeSeriesData';
import {
  calculateRangeSummary,
  getFilteredEtfList,
  getPresetEtfCodes,
} from './utils/calculator';

import { Navbar } from './components/Navbar';
import { RangePickerBar } from './components/RangePickerBar';
import { QuickFilterBar } from './components/QuickFilterBar';
import { SummaryMetrics } from './components/SummaryMetrics';
import { PieChartSection } from './components/PieChartSection';
import { DailyTrendChart } from './components/DailyTrendChart';
import { EtfTable } from './components/EtfTable';
import { EtfSelectorDrawer } from './components/EtfSelectorDrawer';
import { EtfDetailModal } from './components/EtfDetailModal';
import { WcagAuditModal } from './components/WcagAuditModal';
import { DisclaimerFooter } from './components/DisclaimerFooter';

export default function App() {
  // 全域海外標的開關 (預設為 true)
  const [includeForeign, setIncludeForeign] = useState<boolean>(true);

  // 查詢區間 (預設近 5 日)
  const [startDate, setStartDate] = useState<string>(DEFAULT_START_DATE);
  const [endDate, setEndDate] = useState<string>(LATEST_DATA_DATE);

  // 一鍵快速篩選群組 (預設為市值前十大)
  const [currentPreset, setCurrentPreset] =
    useState<QuickFilterPreset>('top10_market_cap');

  // 目前勾選選取的 ETF 代號清單 (預設為市值前十大)
  const [selectedCodes, setSelectedCodes] = useState<string[]>(() =>
    getPresetEtfCodes('top10_market_cap', true)
  );

  // 圓餅圖顯示模式 (合併模式 / 分離模式)
  const [displayMode, setDisplayMode] = useState<PieDisplayMode>('merged');

  // 搜尋與篩選狀態
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 彈出視窗狀態
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [selectedDetailItem, setSelectedDetailItem] =
    useState<RangeSummaryItem | null>(null);

  // 依海外開關取得目前有效 ETF 列表
  const allFilteredEtfs = useMemo(() => {
    return getFilteredEtfList(includeForeign);
  }, [includeForeign]);

  // 當海外標的開關變動時，更新選取項目與群組
  const handleToggleForeign = (val: boolean) => {
    setIncludeForeign(val);
    if (currentPreset !== 'custom') {
      const newCodes = getPresetEtfCodes(currentPreset, val);
      setSelectedCodes(newCodes);
    } else {
      // 若是自訂，則排除海外標的
      const validEtfs = getFilteredEtfList(val);
      const validCodesSet = new Set(validEtfs.map((e) => e.code));
      setSelectedCodes((prev) => prev.filter((c) => validCodesSet.has(c)));
    }
  };

  // 當切換預設群組時
  const handleSelectPreset = (preset: QuickFilterPreset) => {
    setCurrentPreset(preset);
    const codes = getPresetEtfCodes(preset, includeForeign);
    setSelectedCodes(codes);
  };

  // 單一標的 Checkbox 切換
  const handleToggleSelect = (code: string) => {
    setCurrentPreset('custom');
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter((c) => c !== code));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  // 全選目前有效標的
  const handleSelectAll = () => {
    setCurrentPreset('custom');
    setSelectedCodes(allFilteredEtfs.map((e) => e.code));
  };

  // 清空所有選取
  const handleDeselectAll = () => {
    setCurrentPreset('custom');
    setSelectedCodes([]);
  };

  // 自訂選取抽屜儲存回調
  const handleApplyCustomSelection = (codes: string[]) => {
    setCurrentPreset('custom');
    setSelectedCodes(codes);
  };

  // 區間內交易日天數
  const tradingDaysCount = useMemo(() => {
    let actualStart = startDate;
    let actualEnd = endDate;
    if (actualStart > actualEnd) {
      actualStart = endDate;
      actualEnd = startDate;
    }
    return AVAILABLE_TRADING_DATES.filter(
      (d) => d >= actualStart && d <= actualEnd
    ).length;
  }, [startDate, endDate]);

  // 目前選取標的之匯總統計（供指標卡片、圓餅圖、趨勢圖專屬計算）
  const summary: AggregateRangeSummary = useMemo(() => {
    return calculateRangeSummary(
      startDate,
      endDate,
      selectedCodes,
      includeForeign
    );
  }, [startDate, endDate, selectedCodes, includeForeign]);

  // 全市場所有有效 ETF 的區間統計（供排行榜表格、即時搜尋、分類篩選完整使用）
  const allSummaryItems: RangeSummaryItem[] = useMemo(() => {
    return calculateRangeSummary(
      startDate,
      endDate,
      allFilteredEtfs.map((e) => e.code),
      includeForeign
    ).items;
  }, [startDate, endDate, allFilteredEtfs, includeForeign]);

  // 匯出 CSV 報表
  const handleExportCsv = () => {
    const headers = [
      'ETF代號',
      'ETF名稱',
      '發行投信',
      '類別',
      '市場',
      '含海外標的',
      '區間估算金額(億元)',
      '區間淨申贖單位(千股)',
      '單位成長率(%)',
      '最新淨值(NAV)',
      '資產規模(億元)',
    ];

    const rows = summary.items.map((item) => [
      item.etf.code,
      item.etf.name,
      item.etf.issuer,
      item.etf.category,
      item.etf.market,
      item.etf.hasForeignHolding ? '是' : '否',
      item.totalEstAmount,
      item.totalUnitDiff,
      item.growthRate,
      item.etf.currentNav,
      item.etf.marketCap,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Taiwan_ETF_Flow_${startDate}_to_${endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] flex flex-col font-sans selection:bg-[#00f6ff] selection:text-[#0a0a0a]">
      {/* Navigation Header */}
      <Navbar
        includeForeign={includeForeign}
        onToggleForeign={handleToggleForeign}
        onOpenSelector={() => setIsSelectorOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        onExportCsv={handleExportCsv}
        selectedCount={selectedCodes.length}
      />

      {/* Main Workspace Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Row 1: Date Range Picker & Duration Bar */}
        <RangePickerBar
          startDate={startDate}
          endDate={endDate}
          onRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          tradingDaysCount={tradingDaysCount}
        />

        {/* Row 2: 5 Preset Quick Filter Groups + Search */}
        <QuickFilterBar
          currentPreset={currentPreset}
          onSelectPreset={handleSelectPreset}
          selectedCount={selectedCodes.length}
          totalFilteredCount={allFilteredEtfs.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />

        {/* Row 3: Summary Metrics Dashboard (4 Cards + Inflow/Outflow ratio) */}
        <SummaryMetrics summary={summary} />

        {/* Row 4: Visual Charts (Pie Chart with Dual Mode + Daily Trend Bar Chart) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7">
            <PieChartSection
              summary={summary}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              onSelectEtfModal={(item) => setSelectedDetailItem(item)}
            />
          </div>

          <div className="xl:col-span-5">
            <DailyTrendChart
              startDate={startDate}
              endDate={endDate}
              selectedCodes={selectedCodes}
              includeForeign={includeForeign}
            />
          </div>
        </div>

        {/* Row 5: Detailed Data Ranking Table (處置王 & 籌碼小宇風格) */}
        <EtfTable
          items={allSummaryItems}
          allFilteredEtfs={allFilteredEtfs}
          selectedCodes={selectedCodes}
          onToggleSelect={handleToggleSelect}
          onSelectEtfModal={(item) => setSelectedDetailItem(item)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectMultiple={(codes) => {
            setSelectedCodes((prev) => Array.from(new Set([...prev, ...codes])));
            setCurrentPreset('custom');
          }}
          onDeselectMultiple={(codes) => {
            const codeSet = new Set(codes);
            setSelectedCodes((prev) => prev.filter((c) => !codeSet.has(c)));
            setCurrentPreset('custom');
          }}
        />
      </main>

      {/* Footer Disclaimers & Data Source Notes */}
      <DisclaimerFooter />

      {/* Custom ETF Selection Drawer */}
      <EtfSelectorDrawer
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        allEtfs={allFilteredEtfs}
        selectedCodes={selectedCodes}
        onApplySelection={handleApplyCustomSelection}
      />

      {/* Single ETF Breakdown & Daily Timeline Modal */}
      <EtfDetailModal
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
      />

      {/* WCAG AA Contrast Audit & Principle Report Modal */}
      <WcagAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />
    </div>
  );
}
