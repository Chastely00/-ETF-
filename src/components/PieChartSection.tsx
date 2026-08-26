import React, { useState } from 'react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import { PieChart as PieIcon, Split, Merge, AlertCircle } from 'lucide-react';
import { AggregateRangeSummary, PieDisplayMode, RangeSummaryItem } from '../types';
import { formatAmount } from '../utils/calculator';

interface PieChartSectionProps {
  summary: AggregateRangeSummary;
  displayMode: PieDisplayMode;
  onDisplayModeChange: (mode: PieDisplayMode) => void;
  onSelectEtfModal: (item: RangeSummaryItem) => void;
}

const CREATION_COLORS = [
  '#00f6ff',
  '#38bdf8',
  '#00d2df',
  '#22d3ee',
  '#0ea5e9',
  '#06b6d4',
  '#0284c7',
  '#2dd4bf',
  '#059669',
  '#67e8f9',
];

const REDEMPTION_COLORS = [
  '#ff6b5b',
  '#f87171',
  '#fb7185',
  '#fb923c',
  '#f43f5e',
  '#e11d48',
  '#f97316',
  '#ea580c',
  '#ef4444',
  '#fca5a5',
];

export const PieChartSection: React.FC<PieChartSectionProps> = ({
  summary,
  displayMode,
  onDisplayModeChange,
  onSelectEtfModal,
}) => {
  const [activeIndexMerged, setActiveIndexMerged] = useState<number | null>(null);
  const [activeIndexCreation, setActiveIndexCreation] = useState<number | null>(null);
  const [activeIndexRedemption, setActiveIndexRedemption] = useState<number | null>(null);

  // 整理申購資料
  const creationItems = summary.items.filter((i) => i.totalEstAmount > 0.001);
  const totalCreationVal = creationItems.reduce(
    (acc, curr) => acc + curr.totalEstAmount,
    0
  );
  const creationChartData = creationItems.map((item, idx) => ({
    name: `${item.etf.code} ${item.etf.name}`,
    code: item.etf.code,
    rawName: item.etf.name,
    category: item.etf.category,
    amount: item.totalEstAmount,
    sharePercent:
      totalCreationVal > 0
        ? +((item.totalEstAmount / totalCreationVal) * 100).toFixed(1)
        : 0,
    flowType: 'creation' as const,
    color: CREATION_COLORS[idx % CREATION_COLORS.length],
    rawItem: item,
  }));

  // 整理贖回資料
  const redemptionItems = summary.items.filter(
    (i) => i.totalEstAmount < -0.001
  );
  const totalRedemptionVal = redemptionItems.reduce(
    (acc, curr) => acc + Math.abs(curr.totalEstAmount),
    0
  );
  const redemptionChartData = redemptionItems.map((item, idx) => ({
    name: `${item.etf.code} ${item.etf.name}`,
    code: item.etf.code,
    rawName: item.etf.name,
    category: item.etf.category,
    amount: Math.abs(item.totalEstAmount),
    sharePercent:
      totalRedemptionVal > 0
        ? +((Math.abs(item.totalEstAmount) / totalRedemptionVal) * 100).toFixed(1)
        : 0,
    flowType: 'redemption' as const,
    color: REDEMPTION_COLORS[idx % REDEMPTION_COLORS.length],
    rawItem: item,
  }));

  // 合併模式資料
  const combinedTotal = totalCreationVal + totalRedemptionVal;
  const mergedChartData = [
    ...creationChartData.map((d) => ({
      ...d,
      overallShare:
        combinedTotal > 0
          ? +((d.amount / combinedTotal) * 100).toFixed(1)
          : 0,
    })),
    ...redemptionChartData.map((d) => ({
      ...d,
      overallShare:
        combinedTotal > 0
          ? +((d.amount / combinedTotal) * 100).toFixed(1)
          : 0,
    })),
  ];

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isCreation = data.flowType === 'creation';
      return (
        <div className="rounded-lg bg-[#141414]/95 p-3 text-xs shadow-2xl border border-[#2a2a2a] backdrop-blur-md z-50">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-bold text-[#f0f0f0]">
              {data.code} {data.rawName}
            </span>
            <span className="rounded bg-[#242424] px-1.5 py-0.5 text-[10px] text-[#a0a0a0]">
              {data.category}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between gap-4 text-[#a0a0a0]">
              <span>性質：</span>
              <span
                className={`font-semibold ${
                  isCreation ? 'text-[#00f6ff]' : 'text-[#ff6b5b]'
                }`}
              >
                {isCreation ? '淨申購 (資金流入)' : '淨贖回 (資金流出)'}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-[#a0a0a0]">
              <span>估算金額：</span>
              <span className="font-bold text-[#f0f0f0]">
                {formatAmount(data.amount, false)}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-[#a0a0a0]">
              <span>同向類別佔比：</span>
              <span className="font-bold text-[#00f6ff]">
                {data.sharePercent}%
              </span>
            </div>

            {data.overallShare !== undefined && (
              <div className="flex justify-between gap-4 text-[#a0a0a0]">
                <span>總資金進出佔比：</span>
                <span className="font-semibold text-[#f0f0f0]">
                  {data.overallShare}%
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 text-[10px] text-[#666666] italic text-center">
            點擊可查看該 ETF 歷史申贖明細
          </div>
        </div>
      );
    }
    return null;
  };

  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: `drop-shadow(0px 0px 8px ${fill})` }}
        />
      </g>
    );
  };

  return (
    <div
      id="pie-chart-section"
      className="rounded-xl bg-[#1c1c1c] p-4 sm:p-5 border border-[#242424] space-y-4"
    >
      {/* Chart Section Header with Display Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0a0a0a] text-[#00f6ff] border border-[#242424]">
            <PieIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00f6ff]">
                FLOW COMPOSITION
              </span>
              <span className="text-xs text-[#666666]">|</span>
              <h2 className="text-xs sm:text-sm font-bold text-[#f0f0f0]">
                申購/贖回金額佔比視覺化圓餅圖
              </h2>
            </div>
            <p className="text-[11px] text-[#a0a0a0]">
              比較各 ETF 於查詢區間內的資金籌碼佔比 (點擊扇形或列表可展開個股歷史明細)
            </p>
          </div>
        </div>

        {/* Display Mode Toggle */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-[#0a0a0a] p-1 rounded-lg border border-[#242424]">
          <button
            id="mode-merged-btn"
            type="button"
            onClick={() => onDisplayModeChange('merged')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
              displayMode === 'merged'
                ? 'bg-[#1c1c1c] text-[#00f6ff] font-semibold border border-[#333333] shadow-sm'
                : 'text-[#a0a0a0] hover:text-[#f0f0f0]'
            }`}
          >
            <Merge className="h-3.5 w-3.5" />
            <span>合併模式</span>
          </button>

          <button
            id="mode-separated-btn"
            type="button"
            onClick={() => onDisplayModeChange('separated')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
              displayMode === 'separated'
                ? 'bg-[#1c1c1c] text-[#00f6ff] font-semibold border border-[#333333] shadow-sm'
                : 'text-[#a0a0a0] hover:text-[#f0f0f0]'
            }`}
          >
            <Split className="h-3.5 w-3.5" />
            <span>分離模式 (雙圖)</span>
          </button>
        </div>
      </div>

      {/* No Data State */}
      {summary.items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center p-6 bg-[#0a0a0a] rounded-lg border border-dashed border-[#2a2a2a]">
          <AlertCircle className="h-8 w-8 text-[#a0a0a0] mb-2" />
          <p className="text-sm text-[#f0f0f0] font-medium">尚未選取任何 ETF 標的</p>
          <p className="text-xs text-[#a0a0a0] mt-1">
            請點選上方的一鍵群組（例如「市值前十大 ETF」）或勾選想比較的標的。
          </p>
        </div>
      ) : displayMode === 'merged' ? (
        /* MODE 1: MERGED MODE (合併模式) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Chart Canvas Area */}
          <div className="lg:col-span-7 h-72 sm:h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  activeIndex={activeIndexMerged !== null ? activeIndexMerged : undefined}
                  activeShape={renderActiveShape}
                  data={mergedChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={2}
                  dataKey="amount"
                  onMouseEnter={(_, index) => setActiveIndexMerged(index)}
                  onMouseLeave={() => setActiveIndexMerged(null)}
                  onClick={(entry: any) => {
                    const raw = entry?.rawItem || entry?.payload?.rawItem;
                    if (raw) onSelectEtfModal(raw);
                  }}
                  cursor="pointer"
                >
                  {mergedChartData.map((entry, index) => (
                    <Cell
                      key={`merged-cell-${index}`}
                      fill={entry.color}
                      stroke="#0a0a0a"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPie>
            </ResponsiveContainer>

            {/* Donut Center Display */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] text-[#a0a0a0] font-medium">
                總資金流動規模
              </span>
              <span className="text-base sm:text-lg font-black text-[#f0f0f0]">
                {formatAmount(combinedTotal, false)}
              </span>
              <span className="text-[10px] text-[#00f6ff]">
                共 {mergedChartData.length} 檔
              </span>
            </div>
          </div>

          {/* Right: Legend Breakdown List */}
          <div className="lg:col-span-5 flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
            {/* Creation Legend Section */}
            {creationChartData.length > 0 && (
              <div className="rounded-lg bg-[#0a0a0a] p-3 border border-[#242424]">
                <div className="flex items-center justify-between text-xs font-bold text-[#00f6ff] mb-2 border-b border-[#242424] pb-1.5">
                  <span>淨申購 (資金流入) 佔比</span>
                  <span>{formatAmount(totalCreationVal, false)}</span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {creationChartData.map((d, i) => (
                    <div
                      key={d.code}
                      onClick={() => onSelectEtfModal(d.rawItem)}
                      className="flex items-center justify-between text-xs p-1 rounded hover:bg-[#1c1c1c] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="text-[#f0f0f0] font-medium truncate">
                          {d.code} {d.rawName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 text-[#a0a0a0]">
                        <span className="text-[#f0f0f0]">
                          {formatAmount(d.amount, false)}
                        </span>
                        <span className="w-10 text-right font-semibold text-[#00f6ff]">
                          {d.sharePercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Redemption Legend Section */}
            {redemptionChartData.length > 0 && (
              <div className="rounded-lg bg-[#0a0a0a] p-3 border border-[#242424]">
                <div className="flex items-center justify-between text-xs font-bold text-[#ff6b5b] mb-2 border-b border-[#242424] pb-1.5">
                  <span>淨贖回 (資金流出) 佔比</span>
                  <span>{formatAmount(totalRedemptionVal, false)}</span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {redemptionChartData.map((d, i) => (
                    <div
                      key={d.code}
                      onClick={() => onSelectEtfModal(d.rawItem)}
                      className="flex items-center justify-between text-xs p-1 rounded hover:bg-[#1c1c1c] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="text-[#f0f0f0] font-medium truncate">
                          {d.code} {d.rawName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 text-[#a0a0a0]">
                        <span className="text-[#f0f0f0]">
                          {formatAmount(d.amount, false)}
                        </span>
                        <span className="w-10 text-right font-semibold text-[#ff6b5b]">
                          {d.sharePercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MODE 2: SEPARATED MODE (分離模式 - 雙圓餅圖) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Chart: Creation Breakdown (申購金額佔比) */}
          <div className="rounded-xl bg-[#0a0a0a] p-4 border border-[#242424]">
            <div className="flex items-center justify-between border-b border-[#242424] pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00f6ff]" />
                <h3 className="text-xs font-bold text-[#00f6ff]">
                  申購金額佔比 (Creation Breakdown)
                </h3>
              </div>
              <span className="text-xs font-bold text-[#f0f0f0]">
                合計 {formatAmount(totalCreationVal, false)}
              </span>
            </div>

            {creationChartData.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-xs text-[#a0a0a0]">
                所選標的於此區間內無淨申購資料
              </div>
            ) : (
              <div className="h-60 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      activeIndex={
                        activeIndexCreation !== null
                          ? activeIndexCreation
                          : undefined
                      }
                      activeShape={renderActiveShape}
                      data={creationChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="amount"
                      onMouseEnter={(_, index) => setActiveIndexCreation(index)}
                      onMouseLeave={() => setActiveIndexCreation(null)}
                      onClick={(entry: any) => {
                        const raw = entry?.rawItem || entry?.payload?.rawItem;
                        if (raw) onSelectEtfModal(raw);
                      }}
                      cursor="pointer"
                    >
                      {creationChartData.map((entry, index) => (
                        <Cell
                          key={`creation-cell-${index}`}
                          fill={entry.color}
                          stroke="#0a0a0a"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            )}

            {/* List */}
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {creationChartData.map((d) => (
                <div
                  key={d.code}
                  onClick={() => onSelectEtfModal(d.rawItem)}
                  className="flex items-center justify-between text-xs p-1 rounded hover:bg-[#1c1c1c] cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-[#f0f0f0] truncate">
                      {d.code} {d.rawName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#a0a0a0]">
                      {formatAmount(d.amount, false)}
                    </span>
                    <span className="font-bold text-[#00f6ff] w-12 text-right">
                      {d.sharePercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Chart: Redemption Breakdown (贖回金額佔比) */}
          <div className="rounded-xl bg-[#0a0a0a] p-4 border border-[#242424]">
            <div className="flex items-center justify-between border-b border-[#242424] pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#ff6b5b]" />
                <h3 className="text-xs font-bold text-[#ff6b5b]">
                  贖回金額佔比 (Redemption Breakdown)
                </h3>
              </div>
              <span className="text-xs font-bold text-[#f0f0f0]">
                合計 {formatAmount(totalRedemptionVal, false)}
              </span>
            </div>

            {redemptionChartData.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-xs text-[#a0a0a0]">
                所選標的於此區間內無淨贖回資料
              </div>
            ) : (
              <div className="h-60 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      activeIndex={
                        activeIndexRedemption !== null
                          ? activeIndexRedemption
                          : undefined
                      }
                      activeShape={renderActiveShape}
                      data={redemptionChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="amount"
                      onMouseEnter={(_, index) => setActiveIndexRedemption(index)}
                      onMouseLeave={() => setActiveIndexRedemption(null)}
                      onClick={(entry: any) => {
                        const raw = entry?.rawItem || entry?.payload?.rawItem;
                        if (raw) onSelectEtfModal(raw);
                      }}
                      cursor="pointer"
                    >
                      {redemptionChartData.map((entry, index) => (
                        <Cell
                          key={`redemption-cell-${index}`}
                          fill={entry.color}
                          stroke="#0a0a0a"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            )}

            {/* List */}
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {redemptionChartData.map((d) => (
                <div
                  key={d.code}
                  onClick={() => onSelectEtfModal(d.rawItem)}
                  className="flex items-center justify-between text-xs p-1 rounded hover:bg-[#1c1c1c] cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-[#f0f0f0] truncate">
                      {d.code} {d.rawName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#a0a0a0]">
                      {formatAmount(d.amount, false)}
                    </span>
                    <span className="font-bold text-[#ff6b5b] w-12 text-right">
                      {d.sharePercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
