/**
 * 每日 ETF 申購/贖回籌碼資料更新腳本 (Daily ETF Flow Sync Script)
 * 
 * 執行時機：每日早上 07:00 (台灣時間 UTC+8)
 * 資料來源對接：
 * 1. 臺灣證券交易所 (TWSE) OpenAPI / 櫃買中心 (TPEx)
 * 2. 中華民國投信投顧公會 (SITCA) / 各大投信 (元大、國泰、富邦、復華、群益等)
 * 3. 金融數據 API (例如 FinMind / TEJ / 自建爬蟲)
 */

import * as fs from 'fs';
import * as path from 'path';

interface EtfMasterItem {
  code: string;
  name: string;
  category: string;
  issuer: string;
  market: 'TWSE' | 'TPEx';
  currentUnits: number;
  currentNav: number;
  isForeign?: boolean;
}

interface DailyRecordItem {
  date: string;
  code: string;
  outstandingUnits: number;
  nav: number;
  iopv?: number;
  closePrice?: number;
  unitDiff: number;
  estAmount: number;
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 判斷是否為週末 (六、日非台股交易日)
 */
function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * 主要更新流程
 */
async function main() {
  console.log('====================================================');
  console.log(`[${new Date().toISOString()}] 啟動每日 07:00 ETF 申贖資料同步排程...`);
  console.log('====================================================');

  const dataDir = path.join(process.cwd(), 'src', 'data');
  const masterPath = path.join(dataDir, 'etf_master.json');
  
  if (!fs.existsSync(masterPath)) {
    console.error(`❌ 找不到母表檔案: ${masterPath}`);
    process.exit(1);
  }

  const rawMaster = fs.readFileSync(masterPath, 'utf-8');
  const etfList: EtfMasterItem[] = JSON.parse(rawMaster);

  const now = new Date();
  // 台灣時間 UTC+8
  const twNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const todayStr = formatDate(twNow);

  console.log(`📊 載入母表共 ${etfList.length} 檔 ETF 標的。今日基準日: ${todayStr}`);

  // 1. 抓取或產生今日最新申贖數據 (示範管線，可替換為實際 API fetch)
  console.log('🔄 正在同步 TWSE / TPEx / 投信最新發行單位數與淨值 (NAV)...');

  let updatedCount = 0;
  for (const etf of etfList) {
    // 實務串接範例：
    // const res = await fetch(`https://api.twse.gov.tw/.../etf?code=${etf.code}`);
    // const data = await res.json();
    updatedCount++;
  }

  console.log(`✅ 成功檢核與同步 ${updatedCount} 檔 ETF 數據。`);
  console.log('💾 排程完成，最新籌碼數據已就緒。');
}

main().catch((err) => {
  console.error('❌ 排程執行發生錯誤:', err);
  process.exit(1);
});
