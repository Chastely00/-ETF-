import etfMasterData from './etf_master.json';
import { DailyRecord, EtfMaster } from '../types';

export const ETF_MASTER_LIST: EtfMaster[] = etfMasterData as EtfMaster[];

/**
 * 產生自 2025-01-02 至 2026-08-25 的所有台股交易日 (排除週六週日)
 */
function generateTradingDates(): string[] {
  const dates: string[] = [];
  const start = new Date(2025, 0, 1); // 2025-01-01
  const end = new Date(2026, 7, 25);  // 2026-08-25

  const curr = new Date(end);
  while (curr >= start) {
    const dayOfWeek = curr.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
    }
    curr.setDate(curr.getDate() - 1);
  }
  return dates;
}

export const AVAILABLE_TRADING_DATES: string[] = generateTradingDates();

// 偽隨機但固定可重現的種子產生器
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// 根據 ETF 與日期產生逼真且吻合台灣市場籌碼的歷史數據 (支援 2025 全年 + 2026 至今)
function generateHistoricalTimeSeries(): Record<string, DailyRecord[]> {
  const dataset: Record<string, DailyRecord[]> = {};

  ETF_MASTER_LIST.forEach((etf, etfIdx) => {
    const records: DailyRecord[] = [];
    let currentUnits = etf.currentUnits;
    let baseNav = etf.currentNav;

    for (let dayIdx = 0; dayIdx < AVAILABLE_TRADING_DATES.length; dayIdx++) {
      const date = AVAILABLE_TRADING_DATES[dayIdx];
      const seed = etfIdx * 100000 + dayIdx * 37 + 19;
      const rnd = pseudoRandom(seed);
      const rnd2 = pseudoRandom(seed + 101);

      // 波動度因 ETF 類型而異
      let volatility = 0.006;
      let navVolatility = 0.010;
      let bias = 0.02;

      if (etf.category === '高股息') {
        volatility = 0.008;
        bias = 0.08;
      } else if (etf.category === '債券型') {
        volatility = 0.010;
        bias = 0.05;
      } else if (etf.category === '正向槓桿') {
        volatility = 0.020;
        bias = -0.01;
        navVolatility = 0.022;
      } else if (etf.category === '反向型') {
        volatility = 0.022;
        bias = -0.03;
        navVolatility = 0.020;
      } else if (etf.category === '主動型') {
        volatility = 0.012;
        bias = 0.10;
      }

      // 產生今日與昨日單位數差異 (千單位)
      const diffMagnitude = Math.round(currentUnits * volatility * (rnd * 0.9 + 0.1));
      const isPositive = (rnd2 + bias) > 0.48;
      const unitDiff = isPositive ? diffMagnitude : -diffMagnitude;

      // 每日 NAV 跳動
      const navChange = (rnd - 0.48) * navVolatility * baseNav;
      const dayNav = Math.max(1, +(baseNav + navChange).toFixed(2));
      const closePrice = Math.max(1, +(dayNav * (1 + (rnd2 - 0.5) * 0.005)).toFixed(2));

      // 估算申購/贖回金額 (億元 NT$) = (unitDiff * 1000 * dayNav) / 100,000,000
      const estAmount = +( (unitDiff * 1000 * dayNav) / 100000000 ).toFixed(3);

      records.push({
        date,
        code: etf.code,
        outstandingUnits: currentUnits,
        nav: dayNav,
        iopv: +(dayNav * (1 + (rnd - 0.5) * 0.002)).toFixed(2),
        closePrice,
        unitDiff,
        estAmount,
      });

      // 倒推前一天發行單位數
      currentUnits = Math.max(10000, currentUnits - unitDiff);
      baseNav = dayNav;
    }

    dataset[etf.code] = records;
  });

  return dataset;
}

export const ETF_TIME_SERIES_DATA: Record<string, DailyRecord[]> = generateHistoricalTimeSeries();

export const LATEST_DATA_DATE = AVAILABLE_TRADING_DATES[0]; // 2026-08-25
export const DEFAULT_START_DATE = AVAILABLE_TRADING_DATES[4]; // 近 5 日
export const EARLIEST_DATA_DATE = AVAILABLE_TRADING_DATES[AVAILABLE_TRADING_DATES.length - 1]; // 2025-01-02
