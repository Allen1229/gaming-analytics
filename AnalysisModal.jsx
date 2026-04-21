import React from 'react';
import { Target, ExternalLink, X, Calculator, Info, FileDown } from 'lucide-react';
import { generateSiteReport } from '../services/pdfGenerator';

export default function AnalysisModal({ site, onClose }) {
  if (!site) return null;

  const sovColor = site.sov >= 20 ? 'var(--accent-emerald)' : site.sov >= 10 ? 'var(--accent-amber)' : 'var(--accent-red)';

  const handleExportPDF = () => {
    generateSiteReport(site);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: '#ede9fe', borderRadius: '12px' }}>
              <Target style={{ color: 'var(--accent-indigo)', width: 24, height: 24 }} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{site.site}</h3>
              <a href={site.url} target="_blank" rel="noopener noreferrer" 
                style={{ color: 'var(--accent-blue)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', marginTop: '4px' }}>
                {site.url} <ExternalLink style={{ width: 12, height: 12 }} />
              </a>
            </div>
          </div>
          <button onClick={onClose} style={{ 
            background: '#f0f2f5', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', 
            color: 'var(--text-muted)', transition: 'all 0.2s' 
          }}
            onMouseEnter={(e) => { e.target.style.color = 'var(--text-primary)'; e.target.style.background = '#dce1e8'; }}
            onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.background = '#f0f2f5'; }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {/* Card 1: 品牌曝光率 */}
            <div className="stat-card">
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>品牌曝光率</p>
              <p style={{ fontSize: '28px', fontWeight: 900, color: sovColor }}>
                {site.sov}%
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '8px' }}>
                  排 {site.rank === 99 ? '未上榜' : `#${site.rank}`}
                </span>
              </p>
            </div>
            {/* Card 2: 品牌曝光數 / 全站總樣本數 */}
            <div className="stat-card">
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>曝光總數</p>
              <p style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)' }}>
                {site.jiliInstances}
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px' }}>/ {site.totalInstances}</span>
              </p>
            </div>
            {/* Card 3: 黃金版位品牌大圖數 & 非大圖數 vs 總數 */}
            <div className="stat-card" style={{ background: '#ede9fe', borderColor: '#c4b5fd' }}>
              <p style={{ color: 'var(--accent-indigo)', fontSize: '13px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>黃金版位</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--accent-indigo)' }}>{site.largeBanner}</span>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#8b5cf6' }}> / {site.totalLargeBanner || 0}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', marginLeft: '4px' }}>大圖</span>
                </div>
                <div style={{ width: '1px', height: '22px', background: '#c4b5fd', alignSelf: 'center' }} />
                <div>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--accent-indigo)' }}>{site.nonLargeBanner || 0}</span>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#8b5cf6' }}> / {site.totalNonLargeBanner || 0}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', marginLeft: '4px' }}>非大圖</span>
                </div>
              </div>
            </div>
            {/* Card 4: 最大競品 */}
            <div className="stat-card">
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>最大競品</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
                {site.competitor.split('(')[0]}
              </p>
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px', fontSize: '15px' }}>
              綜合洞察與建議
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ 
                  flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', 
                  background: '#ede9fe', color: 'var(--accent-indigo)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' 
                }}>
                  <Calculator style={{ width: 14, height: 14 }} />
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>數據統計：</strong>本站 JILI 總曝光數為 <strong style={{ color: 'var(--accent-emerald)' }}>{site.jiliInstances}</strong> 次 (全站 {site.totalInstances} 次)。黃金版位：大圖推薦 <strong>{site.largeBanner} / {site.totalLargeBanner || 0}</strong> 次、非大圖首屏 <strong>{site.nonLargeBanner || 0} / {site.totalNonLargeBanner || 0}</strong> 次。
                </p>
              </li>
              {site.analysis.map((text, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ 
                    flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', 
                    background: '#ede9fe', color: 'var(--accent-blue)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '12px', fontWeight: 700, marginTop: '2px' 
                  }}>
                    {idx + 1}
                  </span>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7 }}>{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href={site.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <ExternalLink style={{ width: 16, height: 16 }} /> 前往站台
            </a>
            <button onClick={handleExportPDF} className="btn btn-export">
              <FileDown style={{ width: 16, height: 16 }} /> 產出報告
            </button>
          </div>
          <button onClick={onClose} className="btn btn-primary">關閉報告</button>
        </div>
      </div>
    </div>
  );
}
