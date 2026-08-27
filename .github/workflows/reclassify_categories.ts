/**
 * 一次性 ETF 分類修正腳本 (One-off Category Reclassification Script)
 *
 * 背景：
 *   daily_updater.ts 每次發現母表裡沒有的新代碼時，一律先標記 category 為
 *   「待分類」，之後從不回頭更新。長期執行下來，大量後來才被發現的 ETF
 *   （尤其是主動型）就一直卡在「待分類」，導致依分類篩選（例如「主動型前十大」）
 *   永遠找不到完整名單。
 *
 * 修正邏輯：
 *   1. 依「代碼字尾」判斷（可信度高，台灣 ETF 命名慣例相當一致）：
 *        B -> 債券型
 *        L -> 正向槓桿
 *        R -> 反向型
 *        A -> 主動型
 *        D -> 主動型（主動債券/複合收益型）
 *        T -> 平衡型
 *   2. 純數字代碼（無字尾）無法用代碼判斷，改用名稱關鍵字輔助：
 *        含「高股息」「高息」-> 高股息
 *        含常見海外市場關鍵字 -> 海外股票
 *   3. 兩種規則都判斷不出來的，維持「待分類」，不亂猜，等人工確認。
 *   4. 只處理目前 category 為「待分類」的項目，不會動到已經人工確認過、
 *      標記為其他正確分類的既有資料。
 *
 * 使用方式：
 *   npx tsx scripts/reclassify_categories.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface EtfMasterItem {
  code: string;
  name: string;
  category?: string;
  [key: string]: unknown;
}

const masterPath = path.join(process.cwd(), 'src', 'data', 'etf_master.json');

const FOREIGN_KEYWORDS = [
  'NASDAQ', 'S&P', '那斯達克', '標普', '日本', '中國', 'A股', '印度',
  '歐洲', '美國', '全球', '越南', '韓國', 'KOSPI', '東證', '費城',
  '道瓊', 'FANG', '不動產', 'REITs', '澳洲', '香港',
];

/**
 * 依代碼字尾與名稱關鍵字推斷分類。
 * 無法判斷時回傳 null，呼叫端保留原本的「待分類」，不強行分類。
 */
function inferCategory(code: string, name: string): string | null {
  const suffixMatch = code.match(/[A-Z]+$/);
  const suffix = suffixMatch ? suffixMatch[0] : '';

  if (suffix === 'B') return '債券型';
  if (suffix === 'L') return '正向槓桿';
  if (suffix === 'R') return '反向型';
  if (suffix === 'A' || suffix === 'D') return '主動型';
  if (suffix === 'T') return '平衡型';

  // 純數字代碼（或未知字尾）：退而求其次用名稱關鍵字判斷
  if (name.includes('高股息') || name.includes('高息')) return '高股息';
  if (FOREIGN_KEYWORDS.some((k) => name.includes(k))) return '海外股票';

  return null; // 無法判斷，保留待分類
}

function safeWriteJson(targetPath: string, data: unknown): void {
  const tmpPath = `${targetPath}.tmp`;
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(tmpPath, content, 'utf-8');
  const verifyContent = fs.readFileSync(tmpPath, 'utf-8');
  JSON.parse(verifyContent);
  fs.renameSync(tmpPath, targetPath);
}

function main() {
  console.log('================================================================');
  console.log('開始重新分類母表中「待分類」的 ETF...');
  console.log('================================================================');

  if (!fs.existsSync(masterPath)) {
    console.error(`❌ 找不到母表檔案: ${masterPath}`);
    process.exit(1);
  }

  const masterList: EtfMasterItem[] = JSON.parse(fs.readFileSync(masterPath, 'utf-8'));

  let reclassifiedCount = 0;
  let stillUnclassifiedCount = 0;
  const reclassifiedLog: string[] = [];
  const stillUnclassifiedLog: string[] = [];

  for (const item of masterList) {
    if (item.category !== '待分類') continue; // 不動已經正確分類的資料

    const inferred = inferCategory(item.code, item.name);
    if (inferred) {
      reclassifiedLog.push(`${item.code} ${item.name}：待分類 -> ${inferred}`);
      item.category = inferred;
      reclassifiedCount++;
    } else {
      stillUnclassifiedLog.push(`${item.code} ${item.name}`);
      stillUnclassifiedCount++;
    }
  }

  try {
    safeWriteJson(masterPath, masterList);
  } catch (e: any) {
    console.error(`❌ 寫入驗證失敗，未覆蓋正式檔案：${e.message}`);
    process.exit(1);
  }

  console.log('================================================================');
  console.log(`✅ 重新分類完成！`);
  console.log(`   成功分類：${reclassifiedCount} 檔`);
  reclassifiedLog.forEach((line) => console.log(`   - ${line}`));
  console.log(`⚠️ 仍無法自動判斷、維持「待分類」：${stillUnclassifiedCount} 檔（建議人工確認）`);
  stillUnclassifiedLog.forEach((line) => console.log(`   - ${line}`));
  console.log(`💾 已寫入: ${masterPath}`);
  console.log('================================================================');
}

main();
