import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Globe, Trophy, AlertTriangle, 
  ArrowUpDown, Activity, FileText, ExternalLink, Info, Check, X as XIcon, 
  BarChart, HelpCircle, Pencil, CalendarDays, Image, Loader, ChevronDown
} from 'lucide-react';
import { fetchDateFolders, fetchFilesInFolder, fetchFileContent, fetchImageDataUrl, isConfigured } from '../services/googleDriveService';
import { parseAnalysisReport, pairFiles } from '../services/dataParser';
import MarketCell from './MarketCell';
import AnalysisModal from './AnalysisModal';
import ImageModal from './ImageModal';

// localStorage key for exposure overrides
const EXPOSURE_OVERRIDES_KEY = 'gaming_analytics_exposure_overrides';

function loadExposureOverrides() {
  try {
    const stored = localStorage.getItem(EXPOSURE_OVERRIDES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveExposureOverrides(overrides) {
  try {
    localStorage.setItem(EXPOSURE_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch { /* ignore */ }
}

export default function MasterDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [marketFilter, setMarketFilter] = useState('All');
  const [selectedSite, setSelectedSite] = useState(null);
  const [kpiFilter, setKpiFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'exposurePoints', direction: 'desc' });
  const [marketOverrides, setMarketOverrides] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);

  // Google Drive states
  const [dateFolders, setDateFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [rawSiteData, setRawSiteData] = useState([]);
  const [imageMap, setImageMap] = useState({});
  const [siteImageIds, setSiteImageIds] = useState({}); // siteId → imageFileId
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Exposure rating overrides
  const [exposureOverrides, setExposureOverrides] = useState(loadExposureOverrides);
  const [editingExposure, setEditingExposure] = useState(null); // row.id being edited

  // Image modal
  const [imageSite, setImageSite] = useState(null);

  // 1. Load date folders on mount
  useEffect(() => {
    async function loadFolders() {
      if (!isConfigured()) {
        setIsLoading(false);
        setLoadError('請先部署 Google Apps Script 並設定 APPS_SCRIPT_URL（見 google_apps_script.js）');
        return;
      }
      try {
        const folders = await fetchDateFolders();
        setDateFolders(folders);
        if (folders.length > 0) {
          setSelectedFolder(folders[0]); // default to latest
        } else {
          setIsLoading(false);
          setLoadError('Google Drive 中尚無日期資料夾');
        }
      } catch (err) {
        setIsLoading(false);
        setLoadError(`無法連接 Google Drive: ${err.message}`);
      }
    }
    loadFolders();
  }, []);

  // 2. Load data when selected folder changes
  const loadFolderData = useCallback(async (folder) => {
    if (!folder) return;
    setIsLoading(true);
    setLoadError(null);

    try {
      const files = await fetchFilesInFolder(folder.id);
      const { txtFiles, imageMap: imgMap } = pairFiles(files);

      // Fetch and parse all .txt files
      const parsed = [];
      const siteImgIds = {};

      const results = await Promise.allSettled(
        txtFiles.map(async ({ fileId, baseName }, index) => {
          const content = await fetchFileContent(fileId);
          const siteData = parseAnalysisReport(content, index + 1);
          // Use site+apiId as stable key for cross-date overrides
          siteData.stableKey = `${siteData.site}_${siteData.apiId}`;
          return { siteData, baseName };
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { siteData, baseName } = result.value;
          parsed.push(siteData);
          if (imgMap[baseName]) {
            siteImgIds[siteData.stableKey] = imgMap[baseName];
          }
        }
      });

      setRawSiteData(parsed);
      setImageMap(imgMap);
      setSiteImageIds(siteImgIds);
    } catch (err) {
      setLoadError(`資料載入失敗: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      loadFolderData(selectedFolder);
    }
  }, [selectedFolder, loadFolderData]);

  // Save exposure overrides to localStorage whenever they change
  useEffect(() => {
    saveExposureOverrides(exposureOverrides);
  }, [exposureOverrides]);

  const enrichedSiteData = useMemo(() => {
    return rawSiteData.map(item => {
      const key = item.stableKey;
      const currentMarket = marketOverrides[key] || item.market;
      const fs = item.firstScreen || 0;
      const lb = item.largeBanner || 0;
      const jiliInstances = item.jiliInstances || Math.round(item.sov * item.totalInstances / 100);
      const hasLargeBanner = lb > 0;
      const hasNonLargeBanner = (item.nonLargeBanner || 0) > 0;
      const hasOtherExposure = (jiliInstances - lb - (item.nonLargeBanner || 0)) > 0;

      // Check for exposure override (using stableKey for cross-date consistency)
      const override = exposureOverrides[key];
      let exposureLevel, exposurePoints;

      if (override) {
        exposureLevel = override;
        exposurePoints = override === '高' ? 2 : override === '中' ? 1 : 0;
      } else {
        exposureLevel = '低';
        exposurePoints = 0;
        if (hasLargeBanner && (hasNonLargeBanner || hasOtherExposure)) {
          exposureLevel = '高';
          exposurePoints = 2;
        } else if (hasLargeBanner || hasNonLargeBanner || hasOtherExposure) {
          exposureLevel = '中';
          exposurePoints = 1;
        }
      }

      return { ...item, market: currentMarket, firstScreen: fs, largeBanner: lb, exposureLevel, exposurePoints, jiliInstances, hasOtherExposure };
    });
  }, [marketOverrides, rawSiteData, exposureOverrides]);

  const markets = ['All', ...new Set(enrichedSiteData.map(item => item.market))].sort();

  const baseFilteredData = useMemo(() => {
    return enrichedSiteData.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = item.site.toLowerCase().includes(searchLower) ||
                          (item.apiId && item.apiId.toLowerCase().includes(searchLower));
      const matchMarket = marketFilter === 'All' || item.market === marketFilter;
      return matchSearch && matchMarket;
    });
  }, [searchTerm, marketFilter, enrichedSiteData]);

  const totalSites = baseFilteredData.length;
  const highCount = baseFilteredData.filter(item => item.exposurePoints === 2).length;
  const midCount = baseFilteredData.filter(item => item.exposurePoints === 1).length;
  const zeroCount = baseFilteredData.filter(item => item.exposurePoints === 0).length;

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const tableData = useMemo(() => {
    let data = baseFilteredData;
    if (kpiFilter === 'high') data = data.filter(item => item.exposurePoints === 2);
    else if (kpiFilter === 'mid') data = data.filter(item => item.exposurePoints === 1);
    else if (kpiFilter === 'zero') data = data.filter(item => item.exposurePoints === 0);

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      let result = 0;
      if (bVal > aVal) result = 1;
      else if (bVal < aVal) result = -1;
      // 同評級時，以曝光率 (sov) 作為第二層排序
      if (result === 0 && sortConfig.key === 'exposurePoints') {
        if (b.sov > a.sov) result = 1;
        else if (b.sov < a.sov) result = -1;
      }
      return sortConfig.direction === 'asc' ? -result : result;
    });
  }, [baseFilteredData, kpiFilter, sortConfig]);

  const getLevelStyle = (level) => {
    if (level === '高') return { background: '#e6f4ea', color: '#1e7e34', border: '1px solid #c3e6cb' };
    if (level === '中') return { background: '#e7f3ff', color: '#0056b3', border: '1px solid #b8daff' };
    return { background: '#fdf2f2', color: '#9b2c2c', border: '1px solid #f5c6cb' };
  };

  const handleExposureChange = (stableKey, newLevel) => {
    setExposureOverrides(prev => {
      const updated = { ...prev, [stableKey]: newLevel };
      return updated;
    });
    setEditingExposure(null);
  };

  const handleClearExposureOverride = (stableKey) => {
    setExposureOverrides(prev => {
      const updated = { ...prev };
      delete updated[stableKey];
      return updated;
    });
    setEditingExposure(null);
  };

  const formatDateFolder = (name) => {
    // Convert "20260421" to "2026/04/21"
    if (name && name.length === 8) {
      return `${name.slice(0, 4)}/${name.slice(4, 6)}/${name.slice(6, 8)}`;
    }
    return name;
  };

  const handleImageClick = async (row) => {
    const imageFileId = siteImageIds[row.stableKey];
    if (imageFileId) {
      // Show modal immediately with loading state
      setImageSite({ ...row, imageUrl: null, imageFileId });
      try {
        const dataUrl = await fetchImageDataUrl(imageFileId);
        setImageSite(prev => prev ? { ...prev, imageUrl: dataUrl } : null);
      } catch (err) {
        setImageSite(prev => prev ? { ...prev, imageUrl: 'error' } : null);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '48px', backgroundColor: 'var(--bg-primary)' }}>
      <header className="header-bg" style={{ padding: '24px 0', borderBottom: '2px solid #4c1d95' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px', color: '#4c1d95', letterSpacing: '-0.02em' }}>
              <div style={{ padding: '8px', background: '#4c1d95', borderRadius: '8px' }}>
                <Activity style={{ color: '#ffffff', width: 24, height: 24 }} />
              </div>
              BRAND EXPOSURE MONITORING
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info style={{ width: 15, height: 15, color: '#4c1d95' }} />
              曝光評級｜高：大圖 ＋ 任一其他曝光 ｜ 中：僅大圖 或 僅其他曝光 ｜ 低：皆無曝光
            </p>
          </div>

          {/* Date folder selector */}
          <div className="date-selector-wrapper">
            <CalendarDays size={14} style={{ color: '#4c1d95' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#4c1d95' }}>資料日期：</span>
            <select
              className="date-selector"
              value={selectedFolder?.id || ''}
              onChange={(e) => {
                const folder = dateFolders.find(f => f.id === e.target.value);
                if (folder) setSelectedFolder(folder);
              }}
            >
              {dateFolders.map(f => (
                <option key={f.id} value={f.id}>{formatDateFolder(f.name)}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Loading overlay */}
        {isLoading && (
          <div className="loading-card">
            <Loader size={28} className="spinner" style={{ color: '#4c1d95' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '15px' }}>
              正在從 Google Drive 載入資料...
            </span>
          </div>
        )}

        {/* Error state */}
        {loadError && !isLoading && (
          <div className="error-card">
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span style={{ fontWeight: 600, color: '#9b2c2c' }}>{loadError}</span>
          </div>
        )}

        {/* KPI Cards — 四欄比例優化 */}
        {!isLoading && !loadError && (
          <>
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                { key: 'all', icon: <Globe />, label: '全部站台', value: totalSites, color: '#1a202c', bg: '#edf2f7' },
                { key: 'high', icon: <Trophy />, label: '高曝光', value: highCount, color: '#276749', bg: '#e6f4ea' },
                { key: 'mid', icon: <BarChart />, label: '中曝光', value: midCount, color: '#2c5282', bg: '#ebf8ff' },
                { key: 'zero', icon: <AlertTriangle />, label: '低 / 無曝光', value: zeroCount, color: '#9b2c2c', bg: '#fff5f5' },
              ].map((card, i) => (
                <div key={i}
                  className={`kpi-card ${kpiFilter === card.key ? 'active' : ''}`}
                  onClick={() => setKpiFilter(prev => prev === card.key ? 'all' : card.key)}
                  style={{ border: kpiFilter === card.key ? '2px solid #4c1d95' : '1px solid var(--border-subtle)' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{card.label}</span>
                      <div style={{ color: card.color }}>{React.cloneElement(card.icon, { size: 18 })}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: card.color }}>{card.value}</span>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ {totalSites}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter Bar */}
            <div className="filter-bar filter-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 280px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: 16, height: 16 }} />
                <input className="filter-input" style={{ width: '100%', paddingLeft: '36px', border: '1px solid #d1d5db' }} type="text"
                  placeholder="搜尋站台名稱..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="filter-input" style={{ width: '160px' }} value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)}>
                {markets.map(m => <option key={m} value={m}>{m === 'All' ? '所有市場' : m}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="table-container" style={{ border: '1px solid #4c1d95' }}>
              <div className="table-scroll">
                <table style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#4c1d95' }}>
                      <th style={{ textAlign: 'left', width: '14%', color: '#ffffff' }}>運營商站台</th>
                      <th style={{ textAlign: 'center', width: '7%', color: '#ffffff', fontSize: '13px' }}>APIID</th>
                      <th style={{ textAlign: 'left', width: '9%', color: '#ffffff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          市場
                          <Pencil size={11} style={{ opacity: 0.6 }} />
                        </div>
                      </th>
                      <th className="sortable" style={{ textAlign: 'center', width: '12%', color: '#ffffff', position: 'relative' }} onClick={() => handleSort('exposurePoints')}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          曝光評級
                          <Pencil size={11} style={{ opacity: 0.6 }} />
                          <ArrowUpDown size={14} />
                          <div
                            onClick={(e) => { e.stopPropagation(); setShowTooltip(prev => !prev); }}
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            style={{ display: 'inline-flex', cursor: 'help', marginLeft: '2px' }}
                          >
                            <HelpCircle size={14} style={{ opacity: 0.8 }} />
                          </div>
                        </div>
                        {showTooltip && (
                          <div style={{
                            position: 'absolute', top: '100%', left: '0',
                            zIndex: 100, width: '340px', padding: '14px 18px',
                            background: '#1e1b4b', color: '#e0e7ff', borderRadius: '8px',
                            fontSize: '13px', lineHeight: '2', textAlign: 'left',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.35)', border: '1px solid #6d28d9',
                            whiteSpace: 'normal', wordBreak: 'keep-all'
                          }}>
                            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '8px', color: '#c4b5fd' }}>📋 曝光評級規則</div>
                            <div>🟢 <b>高</b>：有大圖 + 任一其他曝光</div>
                            <div style={{ paddingLeft: '24px', fontSize: '11px', color: '#a5b4fc', lineHeight: '1.5', marginTop: '-2px' }}>（黃金版位非大圖 或 其他區塊揭露）</div>
                            <div>🔵 <b>中</b>：僅有大圖，或僅有其他曝光</div>
                            <div>🔴 <b>低</b>：三項皆無曝光</div>
                            <div style={{ borderTop: '1px solid #6d28d9', marginTop: '8px', paddingTop: '6px', color: '#a5b4fc', fontSize: '11px' }}>＊ 同評級內依曝光率（SOV%）排序</div>
                          </div>
                        )}
                      </th>
                      <th style={{ textAlign: 'center', width: '10%', color: '#ffffff', fontSize: '13px' }}>黃金版位大圖</th>
                      <th style={{ textAlign: 'center', width: '10%', color: '#ffffff', fontSize: '13px' }}>黃金版位非大圖</th>
                      <th style={{ textAlign: 'center', width: '13%', color: '#ffffff', fontSize: '13px' }}>其他區塊品牌揭露</th>
                      <th style={{ textAlign: 'center', width: '21%', color: '#ffffff' }}>資料分析</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length > 0 ? tableData.map((row) => (
                      <tr key={row.id}>
                        <td style={{ textAlign: 'left', padding: '16px' }}>
                          <div style={{ fontWeight: 800, color: '#1a202c', fontSize: '15px' }}>{row.site}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {row.apiId || '—'}
                        </td>
                        <td style={{ textAlign: 'left' }}>
                          <MarketCell row={row} marketOverrides={marketOverrides} setMarketOverrides={setMarketOverrides} marketFilter={marketFilter} setMarketFilter={setMarketFilter} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            {editingExposure === row.stableKey ? (
                              <div className="exposure-edit-dropdown">
                                {['高', '中', '低'].map(level => (
                                  <button
                                    key={level}
                                    className={`exposure-option ${row.exposureLevel === level ? 'active' : ''}`}
                                    onClick={() => handleExposureChange(row.stableKey, level)}
                                    style={getLevelStyle(level)}
                                  >
                                    {level}
                                  </button>
                                ))}
                                {exposureOverrides[row.stableKey] && (
                                  <button
                                    className="exposure-option reset"
                                    onClick={() => handleClearExposureOverride(row.stableKey)}
                                    style={{ background: '#f0f2f5', color: '#64748b', border: '1px solid #cbd5e0', fontSize: '11px' }}
                                  >
                                    還原
                                  </button>
                                )}
                              </div>
                            ) : (
                              <>
                                <span style={{
                                  display: 'inline-flex', padding: '4px 12px',
                                  borderRadius: '4px', fontSize: '12px', fontWeight: 800,
                                  ...getLevelStyle(row.exposureLevel),
                                  position: 'relative',
                                }}>
                                  {row.exposureLevel.toUpperCase()}
                                  {exposureOverrides[row.stableKey] && (
                                    <span className="modified-dot" title="已人工調整" />
                                  )}
                                </span>
                                <Pencil
                                  size={13}
                                  style={{ color: '#a0aec0', cursor: 'pointer', opacity: 0.6, flexShrink: 0 }}
                                  onClick={() => setEditingExposure(row.stableKey)}
                                  title="修改評級"
                                />
                              </>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {row.largeBanner > 0 ? (
                            <Check style={{ color: '#276749', width: 22, height: 22, strokeWidth: 3 }} />
                          ) : (
                            <XIcon style={{ color: '#9b2c2c', width: 20, height: 20, opacity: 0.3 }} />
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {row.firstScreen > 0 ? (
                            <Check style={{ color: '#276749', width: 22, height: 22, strokeWidth: 3 }} />
                          ) : (
                            <XIcon style={{ color: '#9b2c2c', width: 20, height: 20, opacity: 0.3 }} />
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {row.hasOtherExposure ? (
                            <Check style={{ color: '#276749', width: 22, height: 22, strokeWidth: 3 }} />
                          ) : (
                            <XIcon style={{ color: '#9b2c2c', width: 20, height: 20, opacity: 0.3 }} />
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button className="btn btn-ghost" style={{ backgroundColor: '#ffffff', border: '1px solid #4c1d95', color: '#4c1d95' }} onClick={() => setSelectedSite(row)}>
                              <FileText size={14} /> 數據分析
                            </button>
                            {siteImageIds[row.stableKey] && (
                              <button
                                className="btn-icon-action btn-image"
                                onClick={() => handleImageClick(row)}
                                title="查看來源圖片"
                              >
                                <Image size={15} />
                              </button>
                            )}
                            <a href={row.url} target="_blank" rel="noopener noreferrer"
                               className="btn-icon-action btn-link"
                               title="前往站台">
                              <ExternalLink size={15} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="8" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>
                          NO MATCHING DATA FOUND
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="table-footer" style={{ backgroundColor: '#4c1d95', color: '#ffffff', fontWeight: 700 }}>
                TOTAL RECORDS: {tableData.length}
              </div>
            </div>
          </>
        )}
      </main>

      <AnalysisModal site={selectedSite} onClose={() => setSelectedSite(null)} />

      {imageSite && (
        <ImageModal
          site={imageSite}
          imageUrl={imageSite.imageUrl}
          onClose={() => setImageSite(null)}
        />
      )}
    </div>
  );
}
