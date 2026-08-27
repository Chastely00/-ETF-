/**
 * 一次性歷史資料匯入腳本 (One-off Historical Data Import Script)
 *
 * 用途：
 *   將從 CMoney 匯出、經轉換的歷史「已發行受益權單位數」資料
 *   (compactRecords_historical.json，涵蓋 2005-01-03 ~ 資料匯出當日)
 *   安全併入正式的 src/data/compactRecords.json。
 *
 * 重要原則：
 * 1. 【現有資料優先】只要某個日期在正式檔案裡已經存在，一律保留現有內容，
 *    絕不用歷史檔案覆蓋——因為 daily_updater.ts 抓到的即時資料含有真實
 *    淨值/收盤價，歷史檔案該欄位是 0，覆蓋會讓資料變差。
 * 2. 只補「正式檔案裡完全沒有的日期」。
 * 3. 寫檔沿用 daily_updater.ts 的安全寫入模式：先寫暫存檔、重新讀回驗證
 *    為合法 JSON 才覆蓋正式檔案。
 * 4. 這是「跑一次就好」的匯入腳本，不掛進每日排程；跑完確認無誤後，
 *    建議把 compactRecords_historical.json 從 repo 移除，避免混淆。
 *
 * 使用方式：
 *   npx tsx scripts/import_historical_units.ts
 *
 * 前置條件：
 *   把 compactRecords_historical.json 放在跟本腳本同一個 scripts/ 資料夾底下
 *   （或自行修改下方 HISTORICAL_PATH 常數指向實際位置）。
 */

import * as fs from 'fs';
import * as path from 'path';

// 緊湊格式: [date, outstandingUnits, nav, closePrice, unitDiff, estAmount]
type RawCompactRecord = [string, number, number, number, number, number];

const dataDir = path.join(process.cwd(), 'src', 'data');
const seriesPath = path.join(dataDir, 'compactRecords.json');
const HISTORICAL_PATH = path.join(process.cwd(), 'scripts', 'compactRecords_historical.json');

/**
 * 先寫入暫存檔，重新讀取並驗證能被 JSON.parse 成功後，才覆蓋正式檔案。
 */
function safeWriteJson(targetPath: string, data: unknown): void {
  const tmpPath = `${targetPath}.tmp`;
  const content = JSON.stringify(data);

  fs.writeFileSync(tmpPath, content, 'utf-8');

  const verifyContent = fs.readFileSync(tmpPath, 'utf-8');
  JSON.parse(verifyContent); // 解析失敗會直接拋出例外，中止寫入

  fs.renameSync(tmpPath, targetPath);
}

function main() {
  console.log('================================================================');
  console.log('開始匯入歷史 ETF 單位數資料...');
  console.log('================================================================');

  if (!fs.existsSync(HISTORICAL_PATH)) {
    console.error(`❌ 找不到歷史資料檔案: ${HISTORICAL_PATH}`);
    console.error('   請確認 compactRecords_historical.json 已放在 scripts/ 資料夾下');
    process.exit(1);
  }

  let historicalData: Record<string, RawCompactRecord[]>;
  try {
    historicalData = JSON.parse(fs.readFileSync(HISTORICAL_PATH, 'utf-8'));
  } catch (e: any) {
    console.error(`❌ 歷史資料檔案不是合法 JSON，中止匯入：${e.message}`);
    process.exit(1);
  }

  let existingData: Record<string, RawCompactRecord[]> = {};
  if (fs.existsSync(seriesPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(seriesPath, 'utf-8'));
    } catch (e: any) {
      console.error(
        `❌ 現有 compactRecords.json 無法解析（${e.message}），為安全起見中止匯入，` +
          `請先確認現有檔案是否正常`
      );
      process.exit(1);
    }
  } else {
    console.log('⚠️ 現有 compactRecords.json 不存在，將直接以歷史資料建立新檔案');
  }

  let totalAdded = 0;
  let totalSkippedExisting = 0;
  let newCodeCount = 0;

  for (const code of Object.keys(historicalData)) {
    const historicalRecords = historicalData[code];
    const existingRecords = existingData[code] || [];

    if (existingRecords.length === 0) {
      newCodeCount++;
    }

    // 用 Map 以日期為 key，現有資料先放入（優先權最高）
    const recordMap = new Map<string, RawCompactRecord>(
      existingRecords.map((r) => [r[0], r])
    );

    for (const rec of historicalRecords) {
      const date = rec[0];
      if (recordMap.has(date)) {
        // 該日期已有現有資料（通常含真實淨值），不覆蓋
        totalSkippedExisting++;
        continue;
      }
      recordMap.set(date, rec);
      totalAdded++;
    }

    existingData[code] = Array.from(recordMap.values()).sort((a, b) =>
      b[0].localeCompare(a[0])
    );
  }

  try {
    safeWriteJson(seriesPath, existingData);
  } catch (e: any) {
    console.error(`❌ 寫入驗證失敗，未覆蓋正式檔案：${e.message}`);
    process.exit(1);
  }

  console.log('================================================================');
  console.log(`✅ 匯入完成！`);
  console.log(`   新增歷史資料點：${totalAdded} 筆`);
  console.log(`   已存在、跳過不覆蓋：${totalSkippedExisting} 筆`);
  console.log(`   本次新增的 ETF 代號數：${newCodeCount} 檔`);
  console.log(`💾 已寫入: ${seriesPath}`);
  console.log('================================================================');
  console.log('建議：確認網站顯示正常後，可將 compactRecords_historical.json 從 repo 移除。');
}

main();
