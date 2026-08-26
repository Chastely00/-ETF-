export type MarketType = 'TWSE' | 'TPEx';

export type EtfCategory =
  | '市值型'
  | '高股息'
  | '債券型'
  | '正向槓桿'
  | '反向型'
  | '主動型'
  | '主題/產業型'
  | '海外股票';

export interface EtfMaster {
  code: string;
  name: string;
  fullName: string;
  issuer: string;
  market: MarketType;
  category: EtfCategory;
  hasForeignHolding: boolean;
  trackingIndex: string;
  marketCap: number; // in 億元 NT$
  listedDate: string;
  expenseRatio: number; // in %
  dividendFrequency: '月配' | '季配' | '半年配' | '年配' | '不配息';
  currentNav: number; // 最新淨值
  currentPrice: number; // 最新市價
  currentUnits: number; // 最新已發行受益單位數 (千單位/千股)
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  code: string;
  outstandingUnits: number; // 千受益單位
  nav: number; // 淨值
  iopv?: number; // 預估淨值
  closePrice: number; // 收盤價
  unitDiff: number; // 當日申購/贖回單位數 (千單位)
  estAmount: number; // 估算申購/贖回金額 (億元 NT$) = (unitDiff * 1000 * nav) / 100,000,000
}

export type QuickFilterPreset =
  | 'top10_market_cap'
  | 'top10_active'
  | 'leveraged_all'
  | 'bond_all'
  | 'inverse_all'
  | 'custom';

export type PieDisplayMode = 'merged' | 'separated';

export interface RangeSummaryItem {
  etf: EtfMaster;
  totalUnitDiff: number; // 區間累積淨申贖單位 (千單位)
  totalEstAmount: number; // 區間累積淨估算金額 (億元)
  grossCreationAmount: number; // 區間內所有正向申購日之累積金額 (億元)
  grossRedemptionAmount: number; // 區間內所有負向贖回日之累積金額 (億元，正數)
  grossCreationUnits: number; // 區間內所有正向申購日之累積單位數 (千單位)
  grossRedemptionUnits: number; // 區間內所有負向贖回日之累積單位數 (千單位，正數)
  startUnits: number;
  endUnits: number;
  growthRate: number; // 單位數成長率 %
  avgNav: number;
  flowType: 'creation' | 'redemption' | 'neutral';
  dailyRecords: DailyRecord[];
}

export interface AggregateRangeSummary {
  startDate: string;
  endDate: string;
  totalCreationAmount: number; // 總估算申購金額 (分開加總所有申購日, 億元)
  totalRedemptionAmount: number; // 總估算贖回金額 (分開加總所有贖回日, 億元)
  netFlowAmount: number; // 淨申購/贖回總金額 (億元)
  totalCreationUnits: number; // 總申購單位數 (千單位)
  totalRedemptionUnits: number; // 總贖回單位數 (千單位)
  netFlowUnits: number; // 淨申購/贖回總單位數 (千單位)
  selectedCount: number;
  creationCount: number;
  redemptionCount: number;
  neutralCount: number;
  items: RangeSummaryItem[];
}
