/**
 * 一次性歷史資料匯入腳本 (One-off Historical Data Import Script)
 *
 * 用途：
 *   將從 CMoney 匯出、經轉換的歷史「已發行受益權單位數」與「淨值」資料
 *   (compactRecords_historical.json，涵蓋 2005-01-03 ~ 資料匯出當日)
 *   安全併入正式的 src/data/compactRecords.json。
 *
 * 重要原則（v2 修正版）：
 * 1. 【用「是否有真實收盤價」判斷資料來源，而非單純看日期是否存在】
 *    daily_updater.ts 每日排程寫入的資料一定帶有真實收盤價（closePrice > 0）；
 *    歷史匯入的資料因為來源檔案沒有收盤價，一律是 0。
 *    因此：現有紀錄 closePrice > 0 -> 視為真實即時資料，保護不覆蓋。
 *          現有紀錄 closePrice === 0 -> 視為先前歷史匯入的資料（可能待修正），
 *                                      這次匯入可以覆蓋更新。
 *    這避免了「重跑修正版歷史檔案時，被自己上一次的舊版匯入結果擋住」的問題。
 * 2. 寫檔沿用 daily_updater.ts 的安全寫入模式：先寫暫存檔、重新讀回驗證
 *    為合法 JSON 才覆蓋正式檔案。
 * 3. 這是「跑一次就好」的匯入腳本，不掛進每日排程；跑完確認無誤後，
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
  let totalOverwritten = 0;
  let totalSkippedRealData = 0;
  let newCodeCount = 0;

  for (const code of Object.keys(historicalData)) {
    const historicalRecords = historicalData[code];
    const existingRecords = existingData[code] || [];

    if (existingRecords.length === 0) {
      newCodeCount++;
    }

    // 用 Map 以日期為 key，先放入現有資料
    const recordMap = new Map<string, RawCompactRecord>(
      existingRecords.map((r) => [r[0], r])
    );

    for (const rec of historicalRecords) {
      const date = rec[0];
      const existing = recordMap.get(date);

      if (existing) {
        const existingClosePrice = existing[3];
        if (existingClosePrice > 0) {
          // 現有資料有真實收盤價 -> 判定為排程即時抓到的資料，保護不覆蓋
          totalSkippedRealData++;
          continue;
        }
        // 現有資料收盤價是 0 -> 判定為先前歷史匯入的舊資料，允許覆蓋更新
        recordMap.set(date, rec);
        totalOverwritten++;
      } else {
        recordMap.set(date, rec);
        totalAdded++;
      }
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
  console.log(`   新增歷史資料點（原本不存在）：${totalAdded} 筆`);
  console.log(`   覆蓋更新資料點（修正舊版歷史匯入）：${totalOverwritten} 筆`);
  console.log(`   跳過保護（現有為真實即時資料）：${totalSkippedRealData} 筆`);
  console.log(`   本次新增的 ETF 代號數：${newCodeCount} 檔`);
  console.log(`💾 已寫入: ${seriesPath}`);
  console.log('================================================================');
  console.log('建議：確認網站顯示正常後，可將 compactRecords_historical.json 從 repo 移除。');
}

main();
