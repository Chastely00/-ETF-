import etfMasterData from './etf_master.json';
import realTimeSeriesData from './realTimeSeries.json';
import { DailyRecord, EtfMaster } from '../types';

export const ETF_MASTER_LIST: EtfMaster[] = etfMasterData as EtfMaster[];

export const ETF_TIME_SERIES_DATA: Record<string, DailyRecord[]> = realTimeSeriesData as Record<
  string,
  DailyRecord[]
>;

/**
 * 從真實資料集動態提煉所有實際存在的台股交易日 (時間由新到舊排序)
 */
function extractAvailableTradingDates(): string[] {
  const datesSet = new Set<string>();
  Object.values(ETF_TIME_SERIES_DATA).forEach((records) => {
    records.forEach((r) => {
      if (r.date) datesSet.add(r.date);
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
