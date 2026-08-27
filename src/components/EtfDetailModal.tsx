import React from 'react';
import {
  X,
  Building2,
  Calendar,
  Layers,
  Percent,
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Info,
  Calculator,
} from 'lucide-react';
import { RangeSummaryItem } from '../types';
import { formatAmount, formatUnits } from '../utils/calculator';

interface EtfDetailModalProps {
  item: RangeSummaryItem | null;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

export const EtfDetailModal: React.FC<EtfDetailModalProps> = ({
  item,
  startDate,
  endDate,
  onClose,
}) => {
  if (!item) return null;

  const {
    etf,
    totalEstAmount,
    grossCreationAmount,
    grossRedemptionAmount,
    totalUnitDiff,
    grossCreationUnits,
    grossRedemptionUnits,
    growthRate,
    dailyRecords,
  } = item;
  const isNetInflow = totalEstAmount >= 0;

  return (
    <div
      id="etf-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        id="etf-detail-modal-content"
        className="flex h-[90vh] max-h-[750px] w-full max-w-4xl flex-col rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#242424] bg-[#141414] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0a0a] text-[#00f6ff] font-bold font-mono text-base border border-[#2a2a2a]">
              {etf.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#f0f0f0]">
                  {etf.name}
                </h3>
                <span className="rounded bg-[#242424] px-2 py-0.5 text-xs text-[#a0a0a0]">
                  {etf.category || '其他'}
                </span>
                <span className="rounded bg-[#00f6ff]/10 px-2 py-0.5 text-xs text-[#00f6ff] border border-[#00f6ff]/20">
                  {etf.market || 'TWSE'}
                </span>
              </div>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                {etf.fullName || etf.name} · 發行商：{etf.issuer || '其他投信'} · 配息頻率：
                {etf.dividendFrequency || '不配息'} · 總經理費用：{etf.expenseRatio ?? 0}%
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#a0a0a0] hover:bg-[#242424] hover:text-[#f0f0f0] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Key Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl bg-[#0a0a0a] p-3.5 border border-[#2a2a2a]">
              <span className="text-xs text-[#a0a0a0]">區間淨估算金額</span>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  isNetInflow ? 'text-[#00f6ff]' : 'text-[#ff6b5b]'
                }`}
              >
                {formatAmount(totalEstAmount)}
              </div>
              <span className="text-[10px] text-[#666666]">
                {isNetInflow ? '資金呈淨流入' : '資金呈淨流出'}
              </span>
            </div>

            <div className="rounded-xl bg-[#0a0a0a] p-3.5 border border-[#2a2a2a]">
              <span className="text-xs text-[#a0a0a0]">分開實際累計申贖</span>
              <div className="flex items-center gap-2 mt-1 font-mono text-xs">
                <span className="text-[#00f6ff] font-bold">
                  +{formatAmount(grossCreationAmount, false)}
                </span>
                <span className="text-[#666666]">/</span>
                <span className="text-[#ff6b5b] font-bold">
                  -{formatAmount(grossRedemptionAmount, false)}
                </span>
              </div>
              <span className="text-[10px] text-[#666666]">
                申購: {formatUnits(grossCreationUnits, false)} | 贖回:{' '}
                {formatUnits(grossRedemptionUnits, false)}
              </span>
            </div>

            <div className="rounded-xl bg-[#0a0a0a] p-3.5 border border-[#2a2a2a]">
              <span className="text-xs text-[#a0a0a0]">最新淨值 / 市價</span>
              <div className="text-xl font-bold font-mono text-[#f0f0f0] mt-1">
                NT$ {(etf.currentNav ?? 0).toFixed(2)}
              </div>
              <span className="text-[10px] text-[#a0a0a0]">
                市價 NT$ {(etf.currentPrice ?? 0).toFixed(2)} (折溢價{' '}
                {etf.currentNav && etf.currentPrice
                  ? (((etf.currentPrice - etf.currentNav) / etf.currentNav) * 100).toFixed(2)
                  : '0.00'}
                %)
              </span>
            </div>

            <div className="rounded-xl bg-[#0a0a0a] p-3.5 border border-[#2a2a2a]">
              <span className="text-xs text-[#a0a0a0]">目前總已發行規模</span>
              <div className="text-xl font-bold font-mono text-[#f0f0f0] mt-1">
                {(etf.marketCap ?? 0).toLocaleString()} 億元
              </div>
              <span className="text-[10px] text-[#a0a0a0]">
                已發行 {formatUnits(etf.currentUnits ?? 0, false)}
              </span>
            </div>
          </div>

          {/* Calculation Formula Transparency Box */}
          <div className="rounded-xl bg-[#141414] p-4 border border-[#242424] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00f6ff]">
              <Calculator className="h-4 w-4" />
              <span>申購/贖回估算計算步驟推導：</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#a0a0a0] leading-relaxed">
              <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#2a2a2a]">
                <strong className="text-[#f0f0f0] block mb-1">
                  1. 單日申購/贖回單位數計算：
                </strong>
                <code className="text-[#00f6ff] font-mono block">
                  今日已發行受益單位數 － 昨日已發行受益單位數
                </code>
                <p className="text-[11px] text-[#888888] mt-1">
                  若單位數增加表示市場造市商進行「淨申購」；減少則為「淨贖回」。
                </p>
              </div>

              <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#2a2a2a]">
                <strong className="text-[#f0f0f0] block mb-1">
                  2. 估算申購/贖回金額計算：
                </strong>
                <code className="text-[#00f6ff] font-mono block">
                  變動單位數 (千股) × 1,000 × 當日淨值 (NAV)
                </code>
                <p className="text-[11px] text-[#888888] mt-1">
                  本系統於收盤後統一以每日公布之官方淨值推算資金規模。
                </p>
              </div>
            </div>
          </div>

          {/* Daily Trading Timeline Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#f0f0f0]">
                區間內每日申購/贖回明細日誌 ({dailyRecords.length} 筆)
              </h4>
              <span className="text-[11px] text-[#a0a0a0]">
                追蹤指數：{etf.trackingIndex}
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#2a2a2a]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0a0a0a] text-[#a0a0a0] font-semibold border-b border-[#2a2a2a]">
                  <tr>
                    <th className="p-2.5">交易日期</th>
                    <th className="p-2.5 text-right">已發行受益單位數</th>
                    <th className="p-2.5 text-right">單日淨申贖單位</th>
                    <th className="p-2.5 text-right">當日淨值 (NAV)</th>
                    <th className="p-2.5 text-right">當日收盤價</th>
                    <th className="p-2.5 text-right">估算資金流向</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242424] bg-[#141414] font-mono">
                  {dailyRecords.map((record) => {
                    const isRecPositive = record.estAmount > 0;
                    const isRecNegative = record.estAmount < 0;
                    return (
                      <tr key={record.date} className="hover:bg-[#1f1f1f]">
                        <td className="p-2.5 text-[#f0f0f0] font-sans">
                          {record.date}
                        </td>
                        <td className="p-2.5 text-right text-[#a0a0a0]">
                          {record.outstandingUnits.toLocaleString()} 千股
                        </td>
                        <td
                          className={`p-2.5 text-right font-bold ${
                            isRecPositive
                              ? 'text-[#00f6ff]'
                              : isRecNegative
                              ? 'text-[#ff6b5b]'
                              : 'text-[#a0a0a0]'
                          }`}
                        >
                          {formatUnits(record.unitDiff)}
                        </td>
                        <td className="p-2.5 text-right text-[#f0f0f0]">
                          NT$ {record.nav.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right text-[#a0a0a0]">
                          NT$ {record.closePrice.toFixed(2)}
                        </td>
                        <td
                          className={`p-2.5 text-right font-bold ${
                            isRecPositive
                              ? 'text-[#00f6ff]'
                              : isRecNegative
                              ? 'text-[#ff6b5b]'
                              : 'text-[#a0a0a0]'
                          }`}
                        >
                          {formatAmount(record.estAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#242424] p-4 bg-[#141414]">
          <span className="text-[11px] text-[#a0a0a0]">
            查詢區間：{startDate} 至 {endDate}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#242424] px-4 py-1.5 text-xs font-semibold text-[#f0f0f0] hover:bg-[#333333] transition-colors"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
