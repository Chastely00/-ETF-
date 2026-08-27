/**
 * 每日 ETF 申購/贖回真實籌碼同步腳本 (Daily Real ETF Creation/Redemption Sync Script)
 *
 * 資料來源：
 *   TWSE「ETF申贖資訊及即時淨值揭露專區」彙總 API
 *   https://mis.twse.com.tw/stock/data/all_etf.txt
 *
 * 此 API 由 TWSE 彙整全體投信公司各自申報的即時 ETF 資訊，欄位定義依官方
 * 《ETF 申贖資訊及即時淨值揭露專區 介接格式說明》：
 *   a: ETF代號
 *   b: ETF名稱
 *   c: 已發行受益權單位數
 *   d: 與前日已發行受益單位差異數（今日單位數-前日單位數；正值=淨申購，負值=淨贖回）
 *   e: 成交價
 *   f: 投信或總代理人預估淨值
 *   g: 預估折溢價幅度
 *   h: 前一營業日淨值
 *   i: 資料日期 (YYYYMMDD)
 *   j: 資料時間 (HH24:MI:SS)
 *   k: 標的指數或商品類型（"1"=國內成分證券ETF，其餘各值代表含海外成分，
 *      但各投信對非 1 的細分定義不一致，僅可用於「是否含海外標的」的二元判斷）
 *
 * 重要注意事項（吸取先前資料損毀的教訓）：
 * 1. 不同投信回傳的數字型態不一致（有些是 number，有些是帶千分位逗號的字串，
 *    例如 "119,605,000"；「前一營業日淨值」淨值未結出時可能是文字 "未結出"），
 *    所有數值一律經過 parseNumericField() 正規化，絕不直接假設型態。
 * 2. 拿到回應後一律先 JSON.parse 驗證成功，才進入解析流程；parse 失敗就整批放棄、
 *    絕不把原始回應內容（可能是壓縮過的二進位資料或錯誤頁面）寫入最終檔案。
 * 3. 每一筆 ETF 資料獨立處理，單筆欄位異常只跳過該筆並記錄，不影響其他資料。
 * 4. 寫檔一律先寫暫存檔、重新讀回驗證為合法 JSON 後才覆蓋正式檔案，任何一步
 *    失敗都不會動到既有正式檔案的內容。
 */

import * as fs from 'fs';
import * as path from 'path';

// ============ 型別定義 ============

interface EtfMasterItem {
  code: string;
  name: string;
  fullName?: string;
  issuer?: string;
  market?: 'TWSE' | 'TPEx';
  category?: string;
  hasForeignHolding: boolean;
  trackingIndex?: string;
  marketCap?: number;
  listedDate?: string;
  expenseRatio?: number;
  dividendFrequency?: string;
  currentNav?: number;
  currentPrice?: number;
  currentUnits?: number;
}

// 緊湊格式: [date, outstandingUnits, nav, closePrice, unitDiff, estAmount]
type RawCompactRecord = [string, number, number, number, number, number];

interface RawEtfEntry {
  a: unknown;
  b: unknown;
  c: unknown;
  d: unknown;
  e: unknown;
  f: unknown;
  g: unknown;
  h: unknown;
  i: unknown;
  j: unknown;
  k: unknown;
}

interface EtfGroupResponse {
  msgArray?: RawEtfEntry[];
  refURL?: string;
  userDelay?: unknown;
  rtMessage?: string;
  rtCode?: string;
}

interface AllEtfResponse {
  a1?: EtfGroupResponse[];
}

interface ParsedEtfRecord {
  code: string;
  name: string;
  outstandingUnits: number;
  unitDiff: number;
  price: number;
  nav: number;
  prevNav: number;
  date: string; // YYYY-MM-DD
  time: string;
  productType: string; // 原始 k 值
  hasForeignHolding: boolean;
  estAmount: number;
}

// ============ 常數 ============

const SOURCE_URL = 'https://mis.twse.com.tw/stock/data/all_etf.txt';
const REFERER =
  'https://mis.twse.com.tw/stock/various-areas/etf-price/indicator-disclosure-etf?lang=zhHant';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 股票分割（含反分割）偵測參數：
// 單位數倍率跟「前日淨值/今日淨值」倒數倍率互相吻合，視為同一次分割事件，
// 而不是真實申購/贖回（否則分割日會因單位數暴增，被誤判成天量申購/贖回）。
const SPLIT_RATIO_TOLERANCE = 0.05; // 兩個倍率之間允許 5% 誤差
const MIN_UNIT_JUMP_RATIO = 1.3; // 單位數變動須超過 30% 才進入分割檢查，排除一般正常申贖

// ============ 工具函式 ============

/**
 * 正規化各投信不一致的數字欄位：
 * - 可能是 number、字串數字、或帶千分位逗號的字串（如 "119,605,000"）
 * - 可能是 "未結出" 等非數字文字（前一營業日淨值尚未公告時）
 * 一律回傳 number，無法解析則回傳 NaN，呼叫端須自行檢查。
 */
function parseNumericField(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (cleaned === '' || cleaned === '未結出') return NaN;
    const n = Number(cleaned);
    return n;
  }
  return NaN;
}

/** "20260827" -> "2026-08-27"；格式不符回傳 null */
function formatDate(raw: unknown): string | null {
  if (typeof raw !== 'string' || !/^\d{8}$/.test(raw)) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

/**
 * 解析單一 ETF 原始資料，任何必要欄位異常則回傳 null（呼叫端負責記錄並跳過）。
 * 絕不拋出例外中斷整批處理。
 */
function parseEtfEntry(raw: RawEtfEntry): ParsedEtfRecord | null {
  try {
    const code = typeof raw.a === 'string' ? raw.a.trim() : '';
    const name = typeof raw.b === 'string' ? raw.b.trim() : '';
    if (!code || !name) return null;

    const outstandingUnits = parseNumericField(raw.c);
    const unitDiff = parseNumericField(raw.d);
    const price = parseNumericField(raw.e);
    const nav = parseNumericField(raw.f);
    const prevNav = parseNumericField(raw.h);
    const date = formatDate(raw.i);
    const time = typeof raw.j === 'string' ? raw.j : '';
    const productType = typeof raw.k === 'string' ? raw.k : String(raw.k ?? '');

    // 必要欄位缺一不可：沒有日期、單位數或差異數，這筆資料就沒有意義
    if (!date || Number.isNaN(outstandingUnits) || Number.isNaN(unitDiff)) {
      return null;
    }

    // 估算申贖金額：優先用投信預估淨值，缺值時退而求其次用成交價
    const navForCalc = !Number.isNaN(nav) && nav > 0 ? nav : price;
    const estAmount = !Number.isNaN(navForCalc)
      ? Math.round(unitDiff * navForCalc)
      : 0;

    return {
      code,
      name,
      outstandingUnits,
      unitDiff,
      price: Number.isNaN(price) ? 0 : price,
      nav: Number.isNaN(nav) ? 0 : nav,
      prevNav: Number.isNaN(prevNav) ? 0 : prevNav,
      date,
      time,
      productType,
      // 依約定：k = "1" 代表純國內成分，其餘一律視為含海外標的
      hasForeignHolding: productType !== '1',
      estAmount,
    };
  } catch {
    return null;
  }
}

/**
 * 抓取並解析 TWSE ETF 申贖/淨值揭露彙總資料。
 * 任何層級失敗都回傳空陣列並印出警告，讓呼叫端可以安全地
 * 「這次沒抓到就跳過，不動既有檔案」，而不是寫入壞資料。
 */
async function fetchAllEtfData(): Promise<ParsedEtfRecord[]> {
  const url = `${SOURCE_URL}?_=${Date.now()}`;

  let rawText: string;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Referer: REFERER,
        Accept: 'application/json, text/plain, */*',
      },
    });
    if (!res.ok) {
      console.error(`❌ TWSE ETF 資料來源回應非 200：HTTP ${res.status}`);
      return [];
    }
    rawText = await res.text();
  } catch (e: any) {
    console.error(`❌ 連線 TWSE ETF 資料來源失敗：${e.message}`);
    return [];
  }

  let parsed: AllEtfResponse;
  try {
    parsed = JSON.parse(rawText);
  } catch (e: any) {
    // 這正是先前資料損毀的成因：回應不是合法 JSON 時絕不寫檔，只記錄並中止本次抓取
    console.error(`❌ TWSE ETF 資料來源回應不是合法 JSON，本次抓取放棄：${e.message}`);
    return [];
  }

  if (!parsed || !Array.isArray(parsed.a1)) {
    console.error('❌ TWSE ETF 資料來源回應結構異常（找不到 a1 陣列），本次抓取放棄');
    return [];
  }

  const records: ParsedEtfRecord[] = [];
  let skippedCount = 0;

  for (const group of parsed.a1) {
    if (!group || !Array.isArray(group.msgArray)) continue; // 忽略空群組（如回應尾端的 {}）
    for (const entry of group.msgArray) {
      const parsedEntry = parseEtfEntry(entry);
      if (parsedEntry) {
        records.push(parsedEntry);
      } else {
        skippedCount++;
      }
    }
  }

  console.log(
    `📡 成功解析 TWSE ETF 資料 ${records.length} 筆（跳過異常資料 ${skippedCount} 筆）`
  );
  return records;
}

// ============ 安全寫檔 ============

/**
 * 先寫入暫存檔，重新讀取並驗證能被 JSON.parse 成功後，才覆蓋正式檔案。
 * 任何一步失敗都不會動到原本正式檔案的內容（驗證失敗會拋出例外，呼叫端需接住）。
 */
function safeWriteJson(targetPath: string, data: unknown): void {
  const tmpPath = `${targetPath}.tmp`;
  const content = JSON.stringify(data);

  fs.writeFileSync(tmpPath, content, 'utf-8');

  // 驗證：重新讀回並解析，確保沒有寫入不完整或損毀的內容
  const verifyContent = fs.readFileSync(tmpPath, 'utf-8');
  JSON.parse(verifyContent); // 解析失敗會直接拋出例外，中止寫入

  fs.renameSync(tmpPath, targetPath);
}

// ============ 主流程 ============

async function main() {
  console.log('================================================================');
  console.log(`[${new Date().toISOString()}] 啟動台灣 ETF 每日真實籌碼同步排程...`);
  console.log('================================================================');

  const dataDir = path.join(process.cwd(), 'src', 'data');
  const masterPath = path.join(dataDir, 'etf_master.json');
  const seriesPath = path.join(dataDir, 'compactRecords.json');

  if (!fs.existsSync(masterPath)) {
    console.error(`❌ 找不到母表檔案: ${masterPath}`);
    process.exit(1);
  }

  const masterList: EtfMasterItem[] = JSON.parse(fs.readFileSync(masterPath, 'utf-8'));
  const masterByCode = new Map(masterList.map((item) => [item.code, item]));

  let timeSeries: Record<string, RawCompactRecord[]> = {};
  if (fs.existsSync(seriesPath)) {
    try {
      timeSeries = JSON.parse(fs.readFileSync(seriesPath, 'utf-8'));
    } catch (e: any) {
      console.error(
        `⚠️ 既有 compactRecords.json 無法解析（${e.message}），本次以空白資料重新建立`
      );
      timeSeries = {};
    }
  }

  // 1. 抓取並解析當日全體 ETF 資料
  const etfRecords = await fetchAllEtfData();

  if (etfRecords.length === 0) {
    console.error('❌ 本次未取得任何有效 ETF 資料，中止寫入，保留既有檔案不變');
    process.exit(1);
  }

  // 2. 逐筆更新時間序列與母表
  let updatedCount = 0;
  let newCodeCount = 0;
  const newCodesFound: string[] = [];
  const foreignFlagMismatches: string[] = [];
  const splitEventsDetected: string[] = [];

  for (const rec of etfRecords) {
    const existingRecords = timeSeries[rec.code] || [];
    const recordMap = new Map<string, RawCompactRecord>(
      existingRecords.map((r) => [r[0], r])
    );

    // 找出「今天之前最近一筆」既有紀錄，用來偵測股票分割
    // （用 < rec.date 而非直接取索引 0，避免同一天重跑時抓到自己）
    const prevRecord = existingRecords
      .filter((r) => r[0] < rec.date)
      .sort((a, b) => b[0].localeCompare(a[0]))[0];

    let finalUnitDiff = rec.unitDiff;
    let finalEstAmount = rec.estAmount;

    if (prevRecord) {
      const prevUnits = prevRecord[1];
      const prevNav = prevRecord[2];
      if (
        prevUnits > 0 &&
        prevNav > 0 &&
        rec.nav > 0 &&
        Math.abs(rec.outstandingUnits / prevUnits) >= MIN_UNIT_JUMP_RATIO
      ) {
        const unitRatio = rec.outstandingUnits / prevUnits;
        const navRatio = prevNav / rec.nav;
        if (navRatio > 0) {
          const diffPct = Math.abs(unitRatio - navRatio) / navRatio;
          if (diffPct <= SPLIT_RATIO_TOLERANCE) {
            // 單位數倍率跟淨值倒數倍率吻合 → 判定為股票分割，非真實申贖
            finalUnitDiff = 0;
            finalEstAmount = 0;
            splitEventsDetected.push(
              `${rec.code} ${rec.name}：${prevRecord[0]} -> ${rec.date}，` +
                `單位數 x${unitRatio.toFixed(2)}（淨值 ${prevNav} -> ${rec.nav}），已將當日單位差歸零`
            );
          }
        }
      }
    }

    recordMap.set(rec.date, [
      rec.date,
      rec.outstandingUnits,
      rec.nav,
      rec.price,
      finalUnitDiff,
      finalEstAmount,
    ]);

    timeSeries[rec.code] = Array.from(recordMap.values()).sort((a, b) =>
      b[0].localeCompare(a[0])
    );

    // 3. 同步母表現值
    let masterItem = masterByCode.get(rec.code);
    if (!masterItem) {
      // 母表沒有的新代碼：先建立最基本的一筆，分類標記為「待人工確認」
      masterItem = {
        code: rec.code,
        name: rec.name,
        hasForeignHolding: rec.hasForeignHolding,
        category: '待分類',
      };
      masterList.push(masterItem);
      masterByCode.set(rec.code, masterItem);
      newCodeCount++;
      newCodesFound.push(`${rec.code} ${rec.name}`);
    } else {
      // 既有代碼：比對自動判斷的海外標記跟人工維護的紀錄是否一致，
      // 不一致只警告、不覆蓋人工維護的結果，避免自動判斷的例外情況蓋掉正確分類
      if (masterItem.hasForeignHolding !== rec.hasForeignHolding) {
        foreignFlagMismatches.push(
          `${rec.code} ${rec.name}：母表記錄為${masterItem.hasForeignHolding ? '海外' : '國內'}，` +
            `但今日 k="${rec.productType}" 自動判斷為${rec.hasForeignHolding ? '海外' : '國內'}`
        );
      }
    }

    masterItem.currentPrice = rec.price;
    masterItem.currentNav = rec.nav;
    masterItem.currentUnits = rec.outstandingUnits;
    if (rec.price > 0) {
      masterItem.marketCap = +((rec.outstandingUnits * rec.price) / 100000000).toFixed(1);
    }

    updatedCount++;
  }

  // 4. 安全寫檔（先驗證再覆蓋，絕不留下半殘檔案）
  try {
    safeWriteJson(seriesPath, timeSeries);
    safeWriteJson(masterPath, masterList);
  } catch (e: any) {
    console.error(`❌ 寫入檔案時驗證失敗，本次未覆蓋任何正式檔案：${e.message}`);
    process.exit(1);
  }

  console.log('================================================================');
  console.log(`✅ 同步完成！共更新 ${updatedCount} 檔 ETF 的今日資料。`);
  if (newCodeCount > 0) {
    console.log(
      `🆕 發現 ${newCodeCount} 檔母表中沒有的新代碼，已標記為「待分類」，請人工確認分類：`
    );
    newCodesFound.forEach((line) => console.log(`   - ${line}`));
  }
  if (foreignFlagMismatches.length > 0) {
    console.log(
      `⚠️ 發現 ${foreignFlagMismatches.length} 檔海內外分類與今日自動判斷不一致，請人工複核：`
    );
    foreignFlagMismatches.forEach((line) => console.log(`   - ${line}`));
  }
  if (splitEventsDetected.length > 0) {
    console.log(
      `✂️ 偵測到 ${splitEventsDetected.length} 起疑似股票分割事件，已自動歸零當日單位差：`
    );
    splitEventsDetected.forEach((line) => console.log(`   - ${line}`));
  }
  console.log(`💾 資料已寫入:`);
  console.log(`   - ${seriesPath}`);
  console.log(`   - ${masterPath}`);
  console.log('================================================================');
}

main().catch((err) => {
  console.error('❌ 排程執行失敗:', err);
  process.exit(1);
});
