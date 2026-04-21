import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Loader } from 'lucide-react';

export default function ImageModal({ site, imageUrl, onClose }) {
  const [zoom, setZoom] = useState(1);

  if (!site) return null;

  const isLoading = imageUrl === null;
  const hasError = imageUrl === 'error';
  const isReady = imageUrl && !isLoading && !hasError;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 200 }}>
      <div
        className="image-modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="image-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: '#ede9fe', borderRadius: '10px' }}>
              <span style={{ fontSize: '18px' }}>🖼️</span>
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {site.site}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                來源截圖 — {site.market}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Zoom controls */}
            {isReady && (
              <div className="zoom-controls">
                <button className="zoom-btn" onClick={handleZoomOut} title="縮小">
                  <ZoomOut size={16} />
                </button>
                <span className="zoom-label">{Math.round(zoom * 100)}%</span>
                <button className="zoom-btn" onClick={handleZoomIn} title="放大">
                  <ZoomIn size={16} />
                </button>
                <button className="zoom-btn" onClick={handleResetZoom} title="重置">
                  <RotateCcw size={14} />
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                background: '#f0f2f5', border: 'none', borderRadius: '50%',
                padding: '8px', cursor: 'pointer', color: 'var(--text-muted)',
                transition: 'all 0.2s', marginLeft: '4px'
              }}
              onMouseEnter={(e) => { e.target.style.color = 'var(--text-primary)'; e.target.style.background = '#dce1e8'; }}
              onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.background = '#f0f2f5'; }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Image area */}
        <div className="image-modal-body">
          {isLoading && (
            <div className="image-loading">
              <Loader size={32} className="spinner" style={{ color: '#4c1d95' }} />
              <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>載入圖片中...</p>
            </div>
          )}
          {hasError && (
            <div className="image-error">
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>😵</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>圖片載入失敗</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                請確認 Google Drive 分享設定
              </p>
            </div>
          )}
          {isReady && (
            <img
              src={imageUrl}
              alt={`${site.site} 來源截圖`}
              className="source-image"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
