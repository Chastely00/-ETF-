import {
  AggregateRangeSummary,
  DailyRecord,
  EtfMaster,
  QuickFilterPreset,
  RangeSummaryItem,
} from '../types';
import {
  AVAILABLE_TRADING_DATES,
  ETF_MASTER_LIST,
  ETF_TIME_SERIES_DATA,
} from '../data/timeSeriesData';

/**
 * daily_updater.ts 寫入的 estAmount 是「新台幣元」原始金額，
 * 但本檔案內所有金額欄位（totalEstAmount、grossCreationAmount 等）
 * 以及 formatAmount() 一律以「億元」為單位運作。
 * 所有從 estAmount／unitDiff×NAV 換算金額的地方，都必須先除以這個常數。
 */
const YI_DIVISOR = 100_000_000; // 1 億 = 100,000,000 元

/**
 * 依據海外投資標的開關篩選 ETF 列表
 */
export function getFilteredEtfList(includeForeign: boolean): EtfMaster[] {
  if (includeForeign) {
    return ETF_MASTER_LIST;
  }
  return ETF_MASTER_LIST.filter((etf) => !etf.hasForeignHolding);
}

/**
 * 取得特定預設群組選取的 ETF 代號清單
 */
export function getPresetEtfCodes(
  preset: QuickFilterPreset,
  includeForeign: boolean
): string[] {
  const filteredList = getFilteredEtfList(includeForeign);

  switch (preset) {
    case 'top10_market_cap': {
      // 市值由大到小排序取前 10
      return [...filteredList]
        .sort((a, b) => b.marketCap - a.marketCap)
        .slice(0, 10)
        .map((etf) => etf.code);
    }
    case 'top10_active': {
      // 主動型 ETF 前十大
      const activeList = filteredList.filter((etf) => etf.category === '主動型');
      return [...activeList]
        .sort((a, b) => b.marketCap - a.marketCap)
        .slice(0, 10)
        .map((etf) => etf.code);
    }
    case 'leveraged_all': {
      // 正向槓桿型（全部）
      return filteredList
        .filter((etf) => etf.category === '正向槓桿')
        .map((etf) => etf.code);
    }
    case 'bond_all': {
      // 債券型（全部）
      return filteredList
        .filter((etf) => etf.category === '債券型')
        .map((etf) => etf.code);
    }
    case 'inverse_all': {
      // 反向型（全部）
      return filteredList
        .filter((etf) => etf.category === '反向型')
        .map((etf) => etf.code);
    }
    case 'custom':
    default:
      return [];
  }
}

/**
 * 計算指定日期區間與選定 ETF 的申購贖回總量與詳細匯總
 * 修正說明：
 * 卡片總申購/總贖回為「分開計算 (Gross Calculation)」：
 * 將區間內所有申購日之金額與所有贖回日之金額各自累積，真實反映實際發生的申購總量與贖回總量。
 * 金額欄位一律在此處換算為「億元」單位（原始 estAmount 為「元」），
 * 後續所有讀取這些欄位的地方（含 formatAmount）都不需要再重複換算。
 */
export function calculateRangeSummary(
  startDate: string,
  endDate: string,
  selectedCodes: string[],
  includeForeign: boolean
): AggregateRangeSummary {
  // 確保日期先後順序 (startDate <= endDate)
  let actualStart = startDate;
  let actualEnd = endDate;
  if (actualStart > actualEnd) {
    actualStart = endDate;
    actualEnd = startDate;
  }

  // 取得有效交易日集合
  const validDates = AVAILABLE_TRADING_DATES.filter(
    (d) => d >= actualStart && d <= actualEnd
  );
  const validDatesSet = new Set(validDates);

  const availableEtfs = getFilteredEtfList(includeForeign);
  const etfMap = new Map<string, EtfMaster>(
    availableEtfs.map((e) => [e.code, e])
  );

  const items: RangeSummaryItem[] = [];

  let totalGrossCreationAmount = 0;
  let totalGrossRedemptionAmount = 0;
  let totalGrossCreationUnits = 0;
  let totalGrossRedemptionUnits = 0;

  selectedCodes.forEach((code) => {
    const etf = etfMap.get(code);
    if (!etf) return;

    const allRecords = ETF_TIME_SERIES_DATA[code] || [];
    const inRangeRecords = allRecords.filter((r) => validDatesSet.has(r.date));

    if (inRangeRecords.length === 0) return;

    // 計算區間累計：包含淨值、淨增減、以及「分開計算」之總申購與總贖回
    let totalUnitDiff = 0;
    let totalEstAmount = 0; // 億元
    let grossCreationAmount = 0; // 億元
    let grossRedemptionAmount = 0; // 億元
    let grossCreationUnits = 0;
    let grossRedemptionUnits = 0;
    let sumNav = 0;

    inRangeRecords.forEach((rec) => {
      totalUnitDiff += rec.unitDiff;
      // rec.estAmount 是原始「元」，換算成「億」後再累加
      const estAmountInYi = rec.estAmount / YI_DIVISOR;
      totalEstAmount += estAmountInYi;
      sumNav += rec.nav;

      if (estAmountInYi > 0) {
        grossCreationAmount += estAmountInYi;
        grossCreationUnits += rec.unitDiff;
      } else if (estAmountInYi < 0) {
        grossRedemptionAmount += Math.abs(estAmountInYi);
        grossRedemptionUnits += Math.abs(rec.unitDiff);
      }
    });

    // 累計至全域總量 (分開計算，單位：億元)
    totalGrossCreationAmount += grossCreationAmount;
    totalGrossRedemptionAmount += grossRedemptionAmount;
    totalGrossCreationUnits += grossCreationUnits;
    totalGrossRedemptionUnits += grossRedemptionUnits;

    const avgNav = +(sumNav / inRangeRecords.length).toFixed(2);
    const latestRecord = inRangeRecords[0];
    const oldestRecord = inRangeRecords[inRangeRecords.length - 1];

    const endUnits = latestRecord.outstandingUnits;
    const startUnits = Math.max(
      1,
      oldestRecord.outstandingUnits - oldestRecord.unitDiff
    );

    const growthRate = +(
      ((endUnits - startUnits) / startUnits) *
      100
    ).toFixed(2);

    let flowType: 'creation' | 'redemption' | 'neutral' = 'neutral';
    if (totalEstAmount > 0.001) {
      flowType = 'creation';
    } else if (totalEstAmount < -0.001) {
      flowType = 'redemption';
    }

    items.push({
      etf,
      totalUnitDiff,
      totalEstAmount: +totalEstAmount.toFixed(3),
      grossCreationAmount: +grossCreationAmount.toFixed(3),
      grossRedemptionAmount: +grossRedemptionAmount.toFixed(3),
      grossCreationUnits,
      grossRedemptionUnits,
      startUnits,
      endUnits,
      growthRate,
      avgNav,
      flowType,
      dailyRecords: inRangeRecords,
    });
  });

  // 依估算金額絕對值大小降冪排序
  items.sort((a, b) => Math.abs(b.totalEstAmount) - Math.abs(a.totalEstAmount));

  // 淨金額為 (總申購 - 總贖回)，單位：億元
  const netFlowAmount = +(totalGrossCreationAmount - totalGrossRedemptionAmount).toFixed(3);
  const netFlowUnits = totalGrossCreationUnits - totalGrossRedemptionUnits;

  const creationCount = items.filter((i) => i.flowType === 'creation').length;
  const redemptionCount = items.filter((i) => i.flowType === 'redemption').length;
  const neutralCount = items.filter((i) => i.flowType === 'neutral').length;

  return {
    startDate: actualStart,
    endDate: actualEnd,
    totalCreationAmount: +totalGrossCreationAmount.toFixed(3),
    totalRedemptionAmount: +totalGrossRedemptionAmount.toFixed(3),
    netFlowAmount,
    totalCreationUnits: totalGrossCreationUnits,
    totalRedemptionUnits: totalGrossRedemptionUnits,
    netFlowUnits,
    selectedCount: items.length,
    creationCount,
    redemptionCount,
    neutralCount,
    items,
  };
}

/**
 * 格式化金額 (億元 NT$ 或 萬元)
 * 注意：呼叫端傳入的 amountInBillion 必須已經是「億元」單位
 * （calculateRangeSummary / getDailyAggregateTrend 回傳的金額欄位皆已換算完成）。
 */
export function formatAmount(
  amountInBillion: number,
  showPlusSign = true,
  unit: '億' | '萬' | '自動' = '自動'
): string {
  if (isNaN(amountInBillion)) return 'NT$ 0';

  const sign = showPlusSign && amountInBillion > 0 ? '+' : '';

  if (unit === '萬' || (unit === '自動' && Math.abs(amountInBillion) < 0.1)) {
    const inWan = amountInBillion * 10000;
    return `${sign}${inWan.toLocaleString('zh-TW', {
      maximumFractionDigits: 1,
    })} 萬`;
  }

  return `${sign}${amountInBillion.toLocaleString('zh-TW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} 億`;
}

/**
 * 格式化受益單位數 (千股 / 千張 / 張 / 單位)
 */
export function formatUnits(
  unitsInThousand: number,
  showPlusSign = true
): string {
  if (isNaN(unitsInThousand)) return '0 張';
  const sign = showPlusSign && unitsInThousand > 0 ? '+' : '';
  const abs = Math.abs(unitsInThousand);

  if (abs >= 10000) {
    const inWan = unitsInThousand / 10; // 萬張
    return `${sign}${inWan.toLocaleString('zh-TW', {
      maximumFractionDigits: 1,
    })} 股;
  }

  return `${sign}${unitsInThousand.toLocaleString('zh-TW')} 張`;
}

/**
 * 產生每日加總時間序列數據 (用於趨勢長條圖，維持分開計算每日申購與贖回)
 * 金額欄位同樣在此處換算為「億元」單位。
 */
export function getDailyAggregateTrend(
  startDate: string,
  endDate: string,
  selectedCodes: string[],
  includeForeign: boolean
) {
  let actualStart = startDate;
  let actualEnd = endDate;
  if (actualStart > actualEnd) {
    actualStart = endDate;
    actualEnd = startDate;
  }

  const validDates = AVAILABLE_TRADING_DATES.filter(
    (d) => d >= actualStart && d <= actualEnd
  ).reverse(); // 時間順序由舊到新

  const availableEtfs = getFilteredEtfList(includeForeign);
  const etfMap = new Map<string, EtfMaster>(
    availableEtfs.map((e) => [e.code, e])
  );

  return validDates.map((date) => {
    let creationAmount = 0; // 億元
    let redemptionAmount = 0; // 億元
    let creationUnits = 0;
    let redemptionUnits = 0;

    selectedCodes.forEach((code) => {
      if (!etfMap.has(code)) return;
      const records = ETF_TIME_SERIES_DATA[code] || [];
      const rec = records.find((r) => r.date === date);
      if (!rec) return;

      const estAmountInYi = rec.estAmount / YI_DIVISOR;

      if (estAmountInYi > 0) {
        creationAmount += estAmountInYi;
        creationUnits += rec.unitDiff;
      } else if (estAmountInYi < 0) {
        redemptionAmount += Math.abs(estAmountInYi);
        redemptionUnits += Math.abs(rec.unitDiff);
      }
    });

    const netAmount = +(creationAmount - redemptionAmount).toFixed(3);

    return {
      date: date.length >= 10 ? date.slice(5) : date, // MM-DD
      fullDate: date,
      creationAmount: +creationAmount.toFixed(3),
      redemptionAmount: +redemptionAmount.toFixed(3),
      netAmount,
      creationUnits,
      redemptionUnits,
    };
  });
}
