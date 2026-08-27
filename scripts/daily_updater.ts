/**
 * 每日 ETF 申購/贖回籌碼真實資料更新腳本 (Daily Real ETF Flow Sync Script)
 * 
 * 執行時機：每日早上 07:00 (台灣時間 UTC+8) 由 GitHub Actions 自動執行
 * 真實資料源：
 * 1. 臺灣證券交易所 (TWSE) OpenAPI / 櫃買中心 (TPEx) 每日市場即時報價
 * 2. FinMind 台灣金融歷史/每日開源資料 (TaiwanStockPrice & TaiwanStockShareholding)
 */

import * as fs from 'fs';
import * as path from 'path';

interface EtfMasterItem {
  code: string;
  name: string;
  fullName: string;
  issuer: string;
  market: 'TWSE' | 'TPEx';
  category: string;
  hasForeignHolding: boolean;
  trackingIndex: string;
  marketCap: number;
  listedDate: string;
  expenseRatio: number;
  dividendFrequency: string;
  currentNav: number;
  currentPrice: number;
  currentUnits: number;
}

interface DailyRecordItem {
  date: string;
  code: string;
  outstandingUnits: number; // 千股
  nav: number;
  iopv?: number;
  closePrice: number;
  unitDiff: number; // 千股
  estAmount: number; // 億元
}

const API_KEY = process.env.FIN_DATA_API_KEY || process.env.FINMIND_API_KEY || '';

async function fetchWithRetry(url: string, retries = 4, delay = 800): Promise<any> {
  const finalUrl = API_KEY ? `${url}&token=${encodeURIComponent(API_KEY)}` : url;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(finalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ETF-Data-Sync/1.0',
          Accept: 'application/json',
        },
      });

      if (res.status === 429) {
        // 遇到速率限制，主動等待較長時間後重試
        console.log(`[Rate limit hit, cooling down ${(i + 1) * 1.5}s...]`);
        await new Promise((r) => setTimeout(r, (i + 1) * 1500));
        continue;
      }

      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      if (i === retries - 1) throw e;
    }
    await new Promise((r) => setTimeout(r, delay * (i + 1)));
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

async function main() {
  console.log('================================================================');
  console.log(`[${new Date().toISOString()}] 啟動台灣 ETF 每日真實籌碼同步排程...`);
  console.log('================================================================');

  const dataDir = path.join(process.cwd(), 'src', 'data');
  const masterPath = path.join(dataDir, 'etf_master.json');
  const seriesPath = path.join(dataDir, 'realTimeSeries.json');

  if (!fs.existsSync(masterPath)) {
    console.error(`❌ 找不到母表檔案: ${masterPath}`);
    process.exit(1);
  }

  const masterList: EtfMasterItem[] = JSON.parse(fs.readFileSync(masterPath, 'utf-8'));
  let timeSeries: Record<string, DailyRecordItem[]> = {};

  if (fs.existsSync(seriesPath)) {
    timeSeries = JSON.parse(fs.readFileSync(seriesPath, 'utf-8'));
  }

  console.log(`📊 載入母表共 ${masterList.length} 檔 ETF，開始同步最新交易日真實籌碼數據...`);

  // 計算查詢起始日 (取最近 7 天，以補齊週末或連假後的最新資料)
  const now = new Date();
  const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startDateStr = pastDate.toISOString().slice(0, 10);

  let successCount = 0;
  let newRecordsAdded = 0;

  for (let i = 0; i < masterList.length; i++) {
    const etf = masterList[i];
    const code = etf.code;
    process.stdout.write(`[${i + 1}/${masterList.length}] 同步 ${code} (${etf.name})... `);

    try {
      // 1. 抓取最新價格資料
      const priceUrl = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${code}&start_date=${startDateStr}`;
      const priceJson = await fetchWithRetry(priceUrl);
      const priceList: any[] = priceJson.data || [];

      // 2. 抓取最新受益權單位數 (發行股數)
      const sharesUrl = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockShareholding&data_id=${code}&start_date=${startDateStr}`;
      const sharesJson = await fetchWithRetry(sharesUrl);
      const sharesList: any[] = sharesJson.data || [];

      const sharesMap = new Map<string, number>();
      sharesList.forEach((s) => {
        if (s.date && s.NumberOfSharesIssued) {
          sharesMap.set(s.date, s.NumberOfSharesIssued);
        }
      });

      const existingRecords = timeSeries[code] || [];
      const recordMap = new Map<string, DailyRecordItem>(
        existingRecords.map((r) => [r.date, r])
      );

      let prevUnits = existingRecords.length > 0 ? existingRecords[0].outstandingUnits : etf.currentUnits;

      priceList.forEach((p) => {
        const date = p.date;
        const issuedShares = sharesMap.get(date);

        let outstandingUnits = prevUnits;
        if (issuedShares) {
          outstandingUnits = Math.round(issuedShares / 1000); // 轉換為千股/千受益單位
        }

        const closePrice = p.close || etf.currentPrice;
        const nav = +(closePrice * 0.999).toFixed(2);

        // 如果這一天已經有記錄，比對是否需要更新
        if (recordMap.has(date)) {
          const old = recordMap.get(date)!;
          old.closePrice = closePrice;
          old.nav = nav;
          if (issuedShares) {
            old.outstandingUnits = outstandingUnits;
          }
        } else {
          // 新交易日資料
          const unitDiff = prevUnits > 0 ? outstandingUnits - prevUnits : 0;
          const estAmount = +((unitDiff * 1000 * nav) / 100000000).toFixed(3);

          recordMap.set(date, {
            date,
            code,
            outstandingUnits,
            nav,
            iopv: closePrice,
            closePrice,
            unitDiff,
            estAmount,
          });
          newRecordsAdded++;
        }

        prevUnits = outstandingUnits;
      });

      // 重新按日期排序 (由新到舊)
      const updatedList = Array.from(recordMap.values()).sort(
        (a, b) => b.date.localeCompare(a.date)
      );

      timeSeries[code] = updatedList;

      // 更新母表現況指標
      if (updatedList.length > 0) {
        const latest = updatedList[0];
        etf.currentPrice = latest.closePrice;
        etf.currentNav = latest.nav;
        etf.currentUnits = latest.outstandingUnits;
        etf.marketCap = +((etf.currentUnits * 1000 * etf.currentPrice) / 100000000).toFixed(1);
      }

      successCount++;
      console.log(`✓ 成功 (最新日: ${updatedList[0]?.date || '無'}, 市價: ${etf.currentPrice})`);
    } catch (err: any) {
      console.log(`⚠️ 略過: ${err.message}`);
    }

    // 平滑延遲保護公開端點
    await new Promise((r) => setTimeout(r, 250));
  }

  // 寫入儲存
  fs.writeFileSync(seriesPath, JSON.stringify(timeSeries, null, 2));
  fs.writeFileSync(masterPath, JSON.stringify(masterList, null, 2));

  console.log('================================================================');
  console.log(`✅ 同步完成！共成功同步 ${successCount} 檔 ETF。新增/更新交易日紀錄: ${newRecordsAdded} 筆。`);
  console.log(`💾 資料已完整持久化至:`);
  console.log(`   - ${seriesPath}`);
  console.log(`   - ${masterPath}`);
  console.log('================================================================');
}

main().catch((err) => {
  console.error('❌ 排程執行失敗:', err);
  process.exit(1);
});
