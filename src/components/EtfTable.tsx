import React, { useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Info,
  CheckSquare,
  Square,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { EtfMaster, RangeSummaryItem } from '../types';
import { formatAmount, formatUnits } from '../utils/calculator';

interface EtfTableProps {
  items: RangeSummaryItem[];
  allFilteredEtfs: EtfMaster[];
  selectedCodes: string[];
  onToggleSelect: (code: string) => void;
  onSelectEtfModal: (item: RangeSummaryItem) => void;
  searchQuery: string;
}

type SortField =
  | 'estAmount'
  | 'unitDiff'
  | 'growthRate'
  | 'marketCap'
  | 'nav'
  | 'code';

type SortDirection = 'asc' | 'desc';

export const EtfTable: React.FC<EtfTableProps> = ({
  items,
  allFilteredEtfs,
  selectedCodes,
  onToggleSelect,
  onSelectEtfModal,
  searchQuery,
}) => {
  const [sortField, setSortField] = useState<SortField>('estAmount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [marketFilter, setMarketFilter] = useState<string>('all');

  const categories = [
    'all',
    '市值型',
    '高股息',
    '債券型',
    '正向槓桿',
    '反向型',
    '主動型',
    '海外股票',
    '主題/產業型',
  ];

  // 處理排序與篩選
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredItems = items.filter((item) => {
    // 類別過濾
    if (categoryFilter !== 'all' && (item.etf.category || '其他') !== categoryFilter) {
      return false;
    }
    // 市場過濾 (TWSE / TPEx)
    if (marketFilter !== 'all' && (item.etf.market || 'TWSE') !== marketFilter) {
      return false;
    }
    // 關鍵字過濾
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const code = (item.etf.code || '').toLowerCase();
      const name = (item.etf.name || '').toLowerCase();
      const fullName = (item.etf.fullName || '').toLowerCase();
      const issuer = (item.etf.issuer || '').toLowerCase();
      const trackingIndex = (item.etf.trackingIndex || '').toLowerCase();

      return (
        code.includes(q) ||
        name.includes(q) ||
        fullName.includes(q) ||
        issuer.includes(q) ||
        trackingIndex.includes(q)
      );
    }
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const factor = sortDirection === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'estAmount':
        return ((a.totalEstAmount ?? 0) - (b.totalEstAmount ?? 0)) * factor;
      case 'unitDiff':
        return ((a.totalUnitDiff ?? 0) - (b.totalUnitDiff ?? 0)) * factor;
      case 'growthRate':
        return ((a.growthRate ?? 0) - (b.growthRate ?? 0)) * factor;
      case 'marketCap':
        return ((a.etf.marketCap ?? 0) - (b.etf.marketCap ?? 0)) * factor;
      case 'nav':
        return ((a.etf.currentNav ?? 0) - (b.etf.currentNav ?? 0)) * factor;
      case 'code':
        return (a.etf.code || '').localeCompare(b.etf.code || '') * factor;
      default:
        return 0;
    }
  });

  // 計算最大絕對值金額，用於繪製相對強度條
  const maxAmount = Math.max(
    1,
    ...items.map((i) => Math.abs(i.totalEstAmount))
  );

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-[#666666]" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-[#00f6ff]" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#00f6ff]" />
    );
  };

  return (
    <div
      id="etf-data-table-container"
      className="rounded-xl bg-[#1c1c1c] p-4 sm:p-5 border border-[#242424] space-y-4 shadow-sm"
    >
      {/* Table Top Controls & Filter Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#242424] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00f6ff]">
              VOLUME LEADERBOARD
            </span>
            <span className="text-xs text-[#666666]">|</span>
            <h2 className="text-xs sm:text-sm font-bold text-[#f0f0f0]">
              個股申贖估算籌碼排行榜
            </h2>
          </div>
          <p className="text-[11px] text-[#a0a0a0]">
            共顯示 {sortedItems.length} 檔標的 (點擊欄位標題可即時排序)
          </p>
        </div>

        {/* Category Pills Filter */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-[#0a0a0a] text-[#00f6ff] font-semibold border border-[#00f6ff]/40 shadow-sm'
                  : 'bg-[#0a0a0a] text-[#a0a0a0] border border-[#242424] hover:text-[#f0f0f0] hover:border-[#333333]'
              }`}
            >
              {cat === 'all' ? '全部類別' : cat}
            </button>
          ))}

          <div className="h-4 w-px bg-[#242424] mx-1" />

          {/* Market Filter */}
          <button
            type="button"
            onClick={() =>
              setMarketFilter(
                marketFilter === 'all'
                  ? 'TWSE'
                  : marketFilter === 'TWSE'
                  ? 'TPEx'
                  : 'all'
              )
            }
            className="rounded-md bg-[#0a0a0a] px-2.5 py-1 text-[11px] font-medium text-[#f0f0f0] border border-[#242424] hover:border-[#00f6ff]/40"
          >
            市場：{marketFilter === 'all' ? '上市+上櫃' : marketFilter}
          </button>
        </div>
      </div>

      {/* Desktop / Tablet Scrollable Data Table */}
      <div className="overflow-x-auto rounded-lg border border-[#242424]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0a0a0a] text-[#a0a0a0] uppercase tracking-widest text-[10px] font-bold border-b border-[#242424]">
            <tr>
              <th scope="col" className="p-3 w-10 text-center">
                選取
              </th>
              <th
                scope="col"
                onClick={() => handleSort('code')}
                className="p-3 cursor-pointer hover:text-[#f0f0f0] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>ETF 代號 / 名稱</span>
                  {getSortIcon('code')}
                </div>
              </th>
              <th scope="col" className="p-3 hidden sm:table-cell">
                屬性 / 市場
              </th>
              <th
                scope="col"
                onClick={() => handleSort('estAmount')}
                className="p-3 cursor-pointer hover:text-[#f0f0f0] transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>區間估算金額</span>
                  {getSortIcon('estAmount')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('unitDiff')}
                className="p-3 cursor-pointer hover:text-[#f0f0f0] transition-colors text-right hidden md:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>淨申贖單位數</span>
                  {getSortIcon('unitDiff')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('growthRate')}
                className="p-3 cursor-pointer hover:text-[#f0f0f0] transition-colors text-right hidden lg:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>單位成長率</span>
                  {getSortIcon('growthRate')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('nav')}
                className="p-3 cursor-pointer hover:text-[#f0f0f0] transition-colors text-right hidden lg:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>最新淨值 (NAV)</span>
                  {getSortIcon('nav')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('marketCap')}
                className="p-3 cursor-pointer hover:text-[#f0f0f0] transition-colors text-right hidden xl:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>資產規模</span>
                  {getSortIcon('marketCap')}
                </div>
              </th>
              <th scope="col" className="p-3 text-center w-20">
                操作
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#242424] bg-[#0d0d0d]">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-[#a0a0a0]">
                  無符合篩選條件的 ETF 資料
                </td>
              </tr>
            ) : (
              sortedItems.map((item, index) => {
                const isSelected = selectedCodes.includes(item.etf.code);
                const isPositive = item.totalEstAmount > 0;
                const isNegative = item.totalEstAmount < 0;
                const barWidth = `${Math.min(
                  100,
                  (Math.abs(item.totalEstAmount) / maxAmount) * 100
                )}%`;

                return (
                  <tr
                    key={item.etf.code}
                    id={`etf-row-${item.etf.code}`}
                    className={`transition-colors hover:bg-[#1f1f1f] ${
                      isSelected ? 'bg-[#1a1f24]/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleSelect(item.etf.code)}
                        className="text-[#a0a0a0] hover:text-[#00f6ff] transition-colors focus:outline-none"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[#00f6ff]" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    {/* ETF Code & Name */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectEtfModal(item)}
                          className="font-bold text-[#f0f0f0] hover:text-[#00f6ff] text-left transition-colors flex items-center gap-1.5"
                        >
                          <span className="font-mono text-sm tracking-tight text-[#00f6ff]">
                            {item.etf.code}
                          </span>
                          <span className="font-semibold text-xs text-[#f0f0f0]">
                            {item.etf.name}
                          </span>
                        </button>
                      </div>
                      <div className="text-[11px] text-[#a0a0a0] line-clamp-1 mt-0.5">
                        {item.etf.issuer || '其他投信'} · 追蹤：{item.etf.trackingIndex || '無特定追蹤指數'}
                      </div>
                    </td>

                    {/* Category & Market Badges */}
                    <td className="p-3 hidden sm:table-cell">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-[#242424] px-1.5 py-0.5 text-[10px] font-medium text-[#a0a0a0] border border-[#333333]">
                          {item.etf.category || '其他'}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            (item.etf.market || 'TWSE') === 'TWSE'
                              ? 'bg-blue-950/50 text-blue-300 border border-blue-800/40'
                              : 'bg-purple-950/50 text-purple-300 border border-purple-800/40'
                          }`}
                        >
                          {(item.etf.market || 'TWSE') === 'TWSE' ? '上市' : '上櫃'}
                        </span>
                        {item.etf.hasForeignHolding && (
                          <span
                            className="inline-flex items-center gap-0.5 rounded bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-800/30"
                            title="包含海外投資標的"
                          >
                            <Globe className="h-2.5 w-2.5" />
                            海外
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Estimated Flow Amount & Visual Bar */}
                    <td className="p-3 text-right">
                      <div
                        className={`font-mono font-bold text-sm ${
                          isPositive
                            ? 'text-[#00f6ff]'
                            : isNegative
                            ? 'text-[#ff6b5b]'
                            : 'text-[#a0a0a0]'
                        }`}
                      >
                        {formatAmount(item.totalEstAmount)}
                      </div>

                      {/* Visual proportional indicator bar */}
                      <div className="mt-1 flex justify-end h-1.5 w-full bg-[#0a0a0a] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isPositive
                              ? 'bg-[#00f6ff]'
                              : isNegative
                              ? 'bg-[#ff6b5b]'
                              : 'bg-transparent'
                          }`}
                          style={{ width: barWidth }}
                        />
                      </div>
                    </td>

                    {/* Net Unit Diff */}
                    <td className="p-3 text-right hidden md:table-cell font-mono">
                      <span
                        className={
                          item.totalUnitDiff > 0
                            ? 'text-[#00f6ff]'
                            : item.totalUnitDiff < 0
                            ? 'text-[#ff6b5b]'
                            : 'text-[#a0a0a0]'
                        }
                      >
                        {formatUnits(item.totalUnitDiff)}
                      </span>
                    </td>

                    {/* Growth Rate % */}
                    <td className="p-3 text-right hidden lg:table-cell font-mono">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                          item.growthRate > 0
                            ? 'bg-[#00f6ff]/10 text-[#00f6ff]'
                            : item.growthRate < 0
                            ? 'bg-[#ff6b5b]/10 text-[#ff6b5b]'
                            : 'text-[#a0a0a0]'
                        }`}
                      >
                        {item.growthRate > 0 ? '+' : ''}
                        {item.growthRate}%
                      </span>
                    </td>

                    {/* Current NAV & Price */}
                    <td className="p-3 text-right hidden lg:table-cell font-mono">
                      <div className="font-medium text-[#f0f0f0]">
                        NT$ {(item.etf.currentNav ?? 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#a0a0a0]">
                        市價 {(item.etf.currentPrice ?? 0).toFixed(2)}
                      </div>
                    </td>

                    {/* Market Cap (億元) */}
                    <td className="p-3 text-right hidden xl:table-cell font-mono text-[#a0a0a0]">
                      {(item.etf.marketCap ?? 0).toLocaleString()} 億
                    </td>

                    {/* Action: Inspect Details */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectEtfModal(item)}
                        className="rounded-md bg-[#242424] px-2 py-1 text-[11px] font-medium text-[#a0a0a0] hover:text-[#00f6ff] hover:bg-[#2e2e2e] transition-all"
                      >
                        明細
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
