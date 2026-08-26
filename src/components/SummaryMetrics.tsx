import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { AggregateRangeSummary } from '../types';
import { formatAmount, formatUnits } from '../utils/calculator';

interface SummaryMetricsProps {
  summary: AggregateRangeSummary;
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ summary }) => {
  const isNetInflow = summary.netFlowAmount >= 0;

  return (
    <div id="summary-metrics-section" className="space-y-3">
      {/* 4-Card Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Net Flow Estimated Amount */}
        <div
          id="metric-net-flow"
          className="relative overflow-hidden rounded-xl bg-[#1c1c1c] p-4 border border-[#242424] transition-all hover:border-[#333333]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-[#a0a0a0] font-medium">
              Overall Flow / 淨資金流向
            </p>
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                isNetInflow
                  ? 'bg-[#00f6ff]/15 text-[#00f6ff]'
                  : 'bg-[#ff6b5b]/15 text-[#ff6b5b]'
              }`}
            >
              {isNetInflow ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
            </div>
          </div>

          <div className="mt-2">
            <div
              className={`text-2xl sm:text-3xl font-semibold tracking-tight font-mono ${
                isNetInflow ? 'text-[#00f6ff]' : 'text-[#ff6b5b]'
              }`}
            >
              {formatAmount(summary.netFlowAmount)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#a0a0a0]">
              <span>淨受益單位變動</span>
              <span
                className={`font-mono font-medium ${
                  summary.netFlowUnits >= 0
                    ? 'text-[#00f6ff]'
                    : 'text-[#ff6b5b]'
                }`}
              >
                {formatUnits(summary.netFlowUnits)}
              </span>
            </div>
          </div>

          <div
            className={`absolute bottom-0 left-0 h-[2px] w-full ${
              isNetInflow ? 'bg-[#00f6ff]' : 'bg-[#ff6b5b]'
            }`}
          />
        </div>

        {/* Card 2: Total Creation (申購流入) */}
        <div
          id="metric-creation-flow"
          className="relative overflow-hidden rounded-xl bg-[#1c1c1c] p-4 border border-[#242424] transition-all hover:border-[#333333]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-[#a0a0a0] font-medium">
              Net Creation / 總估算申購
            </p>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00f6ff]/15 text-[#00f6ff]">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#00f6ff] font-mono">
              +{formatAmount(summary.totalCreationAmount, false)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#a0a0a0]">
              <span>申購受益單位</span>
              <span className="font-mono font-medium text-[#f0f0f0]">
                {formatUnits(summary.totalCreationUnits, false)}
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[#00f6ff]/40" />
        </div>

        {/* Card 3: Total Redemption (贖回流出) */}
        <div
          id="metric-redemption-flow"
          className="relative overflow-hidden rounded-xl bg-[#1c1c1c] p-4 border border-[#242424] transition-all hover:border-[#333333]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-[#a0a0a0] font-medium">
              Net Redemption / 總估算贖回
            </p>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6b5b]/15 text-[#ff6b5b]">
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#ff6b5b] font-mono">
              -{formatAmount(summary.totalRedemptionAmount, false)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#a0a0a0]">
              <span>贖回受益單位</span>
              <span className="font-mono font-medium text-[#f0f0f0]">
                {formatUnits(summary.totalRedemptionUnits, false)}
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[#ff6b5b]/40" />
        </div>

        {/* Card 4: ETF Pool Composition & Inflow/Outflow Ratio */}
        <div
          id="metric-pool-stats"
          className="relative overflow-hidden rounded-xl bg-[#1c1c1c] p-4 border border-[#242424] transition-all hover:border-[#333333]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-[#a0a0a0] font-medium">
              Active Symbols / 標的消長比
            </p>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0a0a0a] text-[#00f6ff]">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-[#f0f0f0] font-mono">
                {summary.selectedCount}
              </span>
              <span className="text-xs text-[#a0a0a0]">檔監控標的</span>
            </div>

            {/* Inflow vs Outflow Mini Progress Bar */}
            <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-[#0a0a0a]">
              <div
                className="bg-[#00f6ff] transition-all duration-500"
                style={{
                  width: `${
                    summary.selectedCount > 0
                      ? (summary.creationCount / summary.selectedCount) * 100
                      : 0
                  }%`,
                }}
              />
              <div
                className="bg-[#ff6b5b] transition-all duration-500"
                style={{
                  width: `${
                    summary.selectedCount > 0
                      ? (summary.redemptionCount / summary.selectedCount) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#a0a0a0]">
              <span className="text-[#00f6ff] font-medium">
                {summary.creationCount} 檔淨流入
              </span>
              <span className="text-[#ff6b5b] font-medium">
                {summary.redemptionCount} 檔淨流出
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[#242424]" />
        </div>
      </div>

      {/* Mandatory Estimation Notice Banner */}
      <div
        id="estimation-notice-banner"
        className="flex items-center gap-2 rounded-lg bg-[#0d0d0d] px-3.5 py-2 border border-[#242424] text-xs text-[#a0a0a0]"
      >
        <ShieldAlert className="h-4 w-4 text-[#00f6ff] flex-shrink-0" />
        <span className="leading-relaxed text-[11px]">
          <strong className="text-[#f0f0f0]">金額為估算值說明：</strong>
          申購/贖回金額係依每日公布之「已發行受益單位數增減 × 當日淨值 (NAV)」推算，非官方直接揭露之精確交割金額，僅供市場資金動能與籌碼情緒參考。
        </span>
      </div>
    </div>
  );
};
