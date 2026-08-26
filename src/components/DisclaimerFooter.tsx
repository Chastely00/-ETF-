import React from 'react';
import { ShieldCheck, AlertCircle, Database, ExternalLink } from 'lucide-react';
import { LATEST_DATA_DATE } from '../data/timeSeriesData';

export const DisclaimerFooter: React.FC = () => {
  return (
    <footer
      id="app-footer"
      className="mt-12 border-t border-[#242424] bg-[#0d0d0d] py-8 text-xs text-[#a0a0a0]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Source and Status row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-[#242424] pb-6">
          {/* Data Sources */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#f0f0f0]">
              <Database className="h-4 w-4 text-[#00f6ff]" />
              <span>官方公開資料來源</span>
            </div>
            <ul className="space-y-1 text-[11px] text-[#888888]">
              <li>• 臺灣證券交易所 (TWSE) ETF 專區 / OpenAPI</li>
              <li>• 證券櫃檯買賣中心 (TPEx) 上櫃 ETF 專區</li>
              <li>• 公開資訊觀測站 (MOPS) 與各投信公司官方每日淨值公告</li>
            </ul>
          </div>

          {/* Scope Boundaries */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#f0f0f0]">
              <ShieldCheck className="h-4 w-4 text-[#00f6ff]" />
              <span>非服務範疇說明 (Out of Scope)</span>
            </div>
            <ul className="space-y-1 text-[11px] text-[#888888]">
              <li>• 不提供盤中即時資料 (單位數為盤後結算，屬 T+1 數據)</li>
              <li>• 不做個股層級當沖籌碼分析 (僅參考處置王卡片密度排版)</li>
              <li>• 不提供交易下單、投資推薦或保證收益之功能</li>
            </ul>
          </div>

          {/* Principle and Update */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#f0f0f0]">
              <AlertCircle className="h-4 w-4 text-[#00f6ff]" />
              <span>計算原理與更新頻率</span>
            </div>
            <p className="text-[11px] text-[#888888] leading-relaxed">
              單日申贖單位 = 今日發行受益單位數 － 昨日發行受益單位數。
              估算金額 = 單位數變化 × 當日淨值 (NAV)。
              目前資料已完整收錄至 {LATEST_DATA_DATE.replace(/-/g, '/')} 收盤。
            </p>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-[#666666]">
          <p>
            免責聲明：本網頁應用程式所呈現之所有數據、圖表及估算數值均基於公開市場資訊推算，僅供學術交流與籌碼動態觀察參考，不構成任何形式之投資招攬、推薦或邀約。投資人應獨立判斷並自負盈虧。
          </p>
          <div className="flex-shrink-0 font-mono text-[10px] text-[#555555]">
            Taiwan ETF Tracker v2.5
          </div>
        </div>
      </div>
    </footer>
  );
};
