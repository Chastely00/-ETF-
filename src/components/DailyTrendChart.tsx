import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { getDailyAggregateTrend, formatAmount } from '../utils/calculator';

interface DailyTrendChartProps {
  startDate: string;
  endDate: string;
  selectedCodes: string[];
  includeForeign: boolean;
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
  startDate,
  endDate,
  selectedCodes,
  includeForeign,
}) => {
  const trendData = getDailyAggregateTrend(
    startDate,
    endDate,
    selectedCodes,
    includeForeign
  );

  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg bg-[#141414]/95 p-3 text-xs shadow-2xl border border-[#2a2a2a] backdrop-blur-md">
          <div className="font-bold text-[#f0f0f0] mb-1.5 border-b border-[#242424] pb-1">
            {data.fullDate} 籌碼變化
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4 text-[#a0a0a0]">
              <span className="text-[#00f6ff]">當日申購金額：</span>
              <span className="font-bold text-[#00f6ff]">
                +{formatAmount(data.creationAmount, false)}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-[#a0a0a0]">
              <span className="text-[#ff6b5b]">當日贖回金額：</span>
              <span className="font-bold text-[#ff6b5b]">
                -{formatAmount(data.redemptionAmount, false)}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-[#f0f0f0] border-t border-[#242424] pt-1 mt-1 font-semibold">
              <span>當日淨資金流向：</span>
              <span
                className={
                  data.netAmount >= 0 ? 'text-[#00f6ff]' : 'text-[#ff6b5b]'
                }
              >
                {formatAmount(data.netAmount)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="daily-trend-section"
      className="rounded-xl bg-[#1c1c1c] p-4 sm:p-5 border border-[#242424] space-y-4"
    >
      <div className="flex items-center justify-between border-b border-[#242424] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0a0a0a] text-[#00f6ff] border border-[#242424]">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00f6ff]">
                DAILY FLOW TREND
              </span>
              <span className="text-xs text-[#666666]">|</span>
              <h2 className="text-xs sm:text-sm font-bold text-[#f0f0f0]">
                每日申購/贖回金額消長趨勢
              </h2>
            </div>
            <p className="text-[11px] text-[#a0a0a0]">
              所選標的於各交易日之申購 (青色) 與贖回 (橘紅色) 金額對照 (單位：新台幣億元)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-[#00f6ff]">
            <span className="h-2 w-2 rounded-xs bg-[#00f6ff] shadow-[0_0_6px_#00f6ff]" />
            申購 (億元)
          </span>
          <span className="flex items-center gap-1.5 text-[#ff6b5b]">
            <span className="h-2 w-2 rounded-xs bg-[#ff6b5b] shadow-[0_0_6px_#ff6b5b]" />
            贖回 (億元)
          </span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={trendData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#242424" />
            <XAxis
              dataKey="date"
              stroke="#a0a0a0"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#a0a0a0"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${v}億`}
            />
            <Tooltip content={<CustomTrendTooltip />} />
            <ReferenceLine y={0} stroke="#444444" />
            <Bar
              dataKey="creationAmount"
              name="申購金額"
              fill="#00f6ff"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="redemptionAmount"
              name="贖回金額"
              fill="#ff6b5b"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
