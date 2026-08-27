import etfMasterData from './etf_master.json';
import compactData from './compactRecords.json';
import { DailyRecord, EtfMaster } from '../types';

export const ETF_MASTER_LIST: EtfMaster[] = etfMasterData as EtfMaster[];

// 緊湊格式: [date, outstandingUnits, nav, closePrice, unitDiff, estAmount]
type RawCompactRecord = [string, number, number, number, number, number];
const rawRecords = compactData as unknown as Record<string, RawCompactRecord[]>;

/**
 * 將超輕量緊湊格式還原為標準 DailyRecord 結構
 */
function inflateTimeSeriesData(): Record<string, DailyRecord[]> {
  const result: Record<string, DailyRecord[]> = {};

  for (const code of Object.keys(rawRecords)) {
    const list = rawRecords[code] || [];
    result[code] = list.map(([date, outstandingUnits, nav, closePrice, unitDiff, estAmount]) => ({
      date,
      code,
      outstandingUnits,
      nav,
      iopv: closePrice,
      closePrice,
      unitDiff,
      estAmount,
    }));
  }

  return result;
}

export const ETF_TIME_SERIES_DATA: Record<string, DailyRecord[]> = inflateTimeSeriesData();

/**
 * 從真實資料集動態提煉所有實際存在的台股交易日 (時間由新到舊排序)
 */
function extractAvailableTradingDates(): string[] {
  const datesSet = new Set<string>();
  Object.values(rawRecords).forEach((records) => {
    records.forEach(([date]) => {
      if (date) datesSet.add(date);
    });
  });

  return Array.from(datesSet).sort().reverse();
}

export const AVAILABLE_TRADING_DATES: string[] = extractAvailableTradingDates();

export const LATEST_DATA_DATE = AVAILABLE_TRADING_DATES[0] || '2026-08-26';
export const DEFAULT_START_DATE =
  AVAILABLE_TRADING_DATES[Math.min(4, AVAILABLE_TRADING_DATES.length - 1)] ||
  AVAILABLE_TRADING_DATES[0];
export const EARLIEST_DATA_DATE =
  AVAILABLE_TRADING_DATES[AVAILABLE_TRADING_DATES.length - 1] || '2025-01-02';
