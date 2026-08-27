import React, { useState } from 'react';
import {
  X,
  Search,
  CheckSquare,
  Square,
  Globe,
  Sliders,
  Check,
  RotateCcw,
} from 'lucide-react';
import { EtfMaster } from '../types';

interface EtfSelectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allEtfs: EtfMaster[];
  selectedCodes: string[];
  onApplySelection: (codes: string[]) => void;
}

export const EtfSelectorDrawer: React.FC<EtfSelectorDrawerProps> = ({
  isOpen,
  onClose,
  allEtfs,
  selectedCodes,
  onApplySelection,
}) => {
  if (!isOpen) return null;

  const [tempSelected, setTempSelected] = useState<string[]>([...selectedCodes]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selectedIssuer, setSelectedIssuer] = useState<string>('all');

  const categories = [
    'all',
    '市值型',
    '高股息',
    '債券型',
    '正向槓桿',
    '反向型',
    '主動型',
    '海外股票',
    '主題/產業型',
  ];

  // 取得投信發行商列表 (過濾掉 undefined/null)
  const issuers = [
    'all',
    ...Array.from(
      new Set(
        allEtfs
          .map((e) => e.issuer)
          .filter((iss): iss is string => Boolean(iss && iss.trim()))
      )
    ),
  ];

  const filteredEtfs = allEtfs.filter((etf) => {
    if (selectedCat !== 'all' && (etf.category || '其他') !== selectedCat) return false;
    if (selectedIssuer !== 'all' && (etf.issuer || '其他投信') !== selectedIssuer) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const code = (etf.code || '').toLowerCase();
      const name = (etf.name || '').toLowerCase();
      const fullName = (etf.fullName || '').toLowerCase();
      const trackingIndex = (etf.trackingIndex || '').toLowerCase();
      const issuer = (etf.issuer || '').toLowerCase();

      return (
        code.includes(q) ||
        name.includes(q) ||
        fullName.includes(q) ||
        issuer.includes(q) ||
        trackingIndex.includes(q)
      );
    }
    return true;
  });

  const handleToggle = (code: string) => {
    if (tempSelected.includes(code)) {
      setTempSelected(tempSelected.filter((c) => c !== code));
    } else {
      setTempSelected([...tempSelected, code]);
    }
  };

  const handleSelectAllVisible = () => {
    const visibleCodes = filteredEtfs.map((e) => e.code);
    const merged = Array.from(new Set([...tempSelected, ...visibleCodes]));
    setTempSelected(merged);
  };

  const handleDeselectAllVisible = () => {
    const visibleCodes = new Set(filteredEtfs.map((e) => e.code));
    setTempSelected(tempSelected.filter((c) => !visibleCodes.has(c)));
  };

  const handleSave = () => {
    onApplySelection(tempSelected);
    onClose();
  };

  return (
    <div
      id="etf-selector-drawer-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm p-4"
    >
      <div
        id="etf-selector-drawer-content"
        className="flex h-[90vh] max-h-[800px] w-full max-w-3xl flex-col rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242424] p-4 bg-[#141414]">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-[#00f6ff]" />
            <div>
              <h3 className="text-base font-bold text-[#f0f0f0]">
                自訂勾選比較之 ETF 標的
              </h3>
              <p className="text-xs text-[#a0a0a0]">
                已選取{' '}
                <strong className="text-[#00f6ff]">{tempSelected.length}</strong>{' '}
                / {allEtfs.length} 檔 ETF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#a0a0a0] hover:bg-[#242424] hover:text-[#f0f0f0] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-[#242424] space-y-3 bg-[#171717]">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a0a0a0]" />
            <input
              type="text"
              placeholder="搜尋代號、名稱、指數..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-[#0a0a0a] py-2 pl-9 pr-4 text-xs text-[#f0f0f0] placeholder-[#666666] border border-[#2a2a2a] focus:border-[#00f6ff] focus:outline-none"
            />
          </div>

          {/* Categories & Issuers dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="rounded-lg bg-[#0a0a0a] px-2.5 py-1.5 text-xs text-[#f0f0f0] border border-[#2a2a2a] focus:outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? '全部類別' : c}
                  </option>
                ))}
              </select>

              <select
                value={selectedIssuer}
                onChange={(e) => setSelectedIssuer(e.target.value)}
                className="rounded-lg bg-[#0a0a0a] px-2.5 py-1.5 text-xs text-[#f0f0f0] border border-[#2a2a2a] focus:outline-none cursor-pointer"
              >
                {issuers.map((iss) => (
                  <option key={iss} value={iss}>
                    {iss === 'all' ? '全部投信' : iss}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="rounded bg-[#242424] px-2.5 py-1 text-xs font-medium text-[#f0f0f0] hover:text-[#00f6ff] hover:bg-[#2a2a2a] transition-all"
              >
                選取目前顯示 ({filteredEtfs.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAllVisible}
                className="rounded bg-[#242424] px-2.5 py-1 text-xs font-medium text-[#a0a0a0] hover:text-[#ff6b5b] hover:bg-[#2a2a2a] transition-all"
              >
                取消目前顯示
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable ETF Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredEtfs.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-[#a0a0a0] text-xs">
              無符合條件之 ETF
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredEtfs.map((etf) => {
                const isChecked = tempSelected.includes(etf.code);
                return (
                  <div
                    key={etf.code}
                    onClick={() => handleToggle(etf.code)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-[#00f6ff]/10 border-[#00f6ff]/60 shadow-[0_0_8px_rgba(0,246,255,0.15)]'
                        : 'bg-[#141414] border-[#242424] hover:bg-[#1a1a1a] hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded ${
                          isChecked
                            ? 'bg-[#00f6ff] text-[#0a0a0a]'
                            : 'border border-[#444444]'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-[#00f6ff]">
                            {etf.code}
                          </span>
                          <span className="font-semibold text-xs text-[#f0f0f0] truncate">
                            {etf.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#a0a0a0] mt-0.5">
                          <span>{etf.category || '其他'}</span>
                          <span>·</span>
                          <span>{etf.issuer || '其他投信'}</span>
                          <span>·</span>
                          <span>規模 {(etf.marketCap ?? 0).toLocaleString()}億</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0 text-right">
                      <span className="text-[11px] font-mono text-[#f0f0f0]">
                        NT$ {(etf.currentNav ?? 0).toFixed(2)}
                      </span>
                      <span
                        className={`text-[9px] px-1 rounded ${
                          (etf.market || 'TWSE') === 'TWSE'
                            ? 'text-blue-400 bg-blue-950/40'
                            : 'text-purple-400 bg-purple-950/40'
                        }`}
                      >
                        {etf.market || 'TWSE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between border-t border-[#242424] p-4 bg-[#141414]">
          <button
            type="button"
            onClick={() => setTempSelected([])}
            className="flex items-center gap-1 text-xs text-[#a0a0a0] hover:text-[#ff6b5b]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重設清空
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#242424] px-4 py-2 text-xs font-medium text-[#f0f0f0] hover:bg-[#2a2a2a] transition-all"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-[#00f6ff] px-5 py-2 text-xs font-bold text-[#0a0a0a] shadow-[0_0_12px_rgba(0,246,255,0.3)] hover:brightness-110 transition-all"
            >
              套用選取 ({tempSelected.length} 檔)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
