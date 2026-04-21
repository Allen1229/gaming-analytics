import html2pdf from 'html2pdf.js';

/**
 * 產出站台分析 PDF 報告（支援中文）
 * @param {Object} site 站台資料物件
 */
export function generateSiteReport(site) {
  const exposureLabel = site.exposureLevel === '高' ? '高' : site.exposureLevel === '中' ? '中' : '低';
  const exposureEn = site.exposureLevel === '高' ? 'HIGH' : site.exposureLevel === '中' ? 'MEDIUM' : 'LOW';
  const exposureColor = site.exposureLevel === '高' ? '#059669' : site.exposureLevel === '中' ? '#2563eb' : '#dc2626';
  const exposureBg = site.exposureLevel === '高' ? '#ecfdf5' : site.exposureLevel === '中' ? '#eff6ff' : '#fef2f2';
  const sovColor = site.sov >= 20 ? '#059669' : site.sov >= 10 ? '#d97706' : '#dc2626';
  const dateStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

  const checkMark = '✅';
  const crossMark = '❌';
  const hasLarge = (site.largeBanner || 0) > 0;
  const hasNonLarge = (site.nonLargeBanner || 0) > 0;
  const hasOther = (site.firstScreen || 0) > 0;

  const html = `
    <div id="pdf-report" style="font-family: 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', 'Segoe UI', sans-serif; color: #1a202c; width: 700px; background: #fff;">
      
      <!-- ═══ HEADER ═══ -->
      <div style="background: linear-gradient(135deg, #3b0764 0%, #5b21b6 50%, #7c3aed 100%); padding: 30px 36px 24px 36px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top;">
              <p style="color: #e0e7ff; font-size: 11px; letter-spacing: 2px; margin: 0 0 4px 0; font-weight: 600;">GAMING ANALYTICS</p>
              <p style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: 0.5px;">品牌曝光分析報告</p>
              <p style="color: #c4b5fd; font-size: 11px; margin: 6px 0 0 0; letter-spacing: 1px;">BRAND EXPOSURE ANALYSIS REPORT</p>
            </td>
            <td style="vertical-align: top; text-align: right; width: 160px;">
              <p style="color: #c4b5fd; font-size: 10px; margin: 0; font-weight: 600;">報告日期</p>
              <p style="color: #ffffff; font-size: 16px; font-weight: 800; margin: 3px 0 0 0;">${dateStr}</p>
              <p style="color: #c4b5fd; font-size: 10px; margin: 3px 0 0 0;">${timeStr}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- ═══ SITE INFO (no table, plain text) ═══ -->
      <div style="padding: 20px 36px; border-bottom: 2px solid #e9d5ff; background: #faf5ff;">
        <p style="font-size: 24px; font-weight: 900; color: #3b0764; margin: 0 0 10px 0;">${site.site}</p>
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0;">
          🔗 <span style="color: #4b5563;">${site.url || 'N/A'}</span>
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          🌐 市場：<span style="color: #3b0764; font-weight: 700;">${site.market || 'N/A'}</span>
          &nbsp;&nbsp;│&nbsp;&nbsp;
          🆔 API ID：<span style="color: #3b0764; font-weight: 700;">${site.apiId || 'N/A'}</span>
        </p>
      </div>

      <!-- ═══ BODY ═══ -->
      <div style="padding: 28px 36px;">

        <!-- ── SECTION: 核心指標 ── -->
        <p style="font-size: 14px; font-weight: 800; color: #3b0764; margin: 0 0 14px 0; padding-bottom: 6px; border-bottom: 2px solid #e9d5ff;">
          📊 核心指標
        </p>

        <!-- Row 1: 曝光評級 + 品牌曝光率 (equal width) -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 10px;">
          <tr>
            <td style="width: 50%; background: ${exposureBg}; border: 2px solid ${exposureColor}; border-radius: 10px; padding: 16px 20px; vertical-align: top; text-align: center;">
              <p style="color: ${exposureColor}; font-size: 10px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 1px;">曝光評級</p>
              <p style="font-size: 28px; font-weight: 900; color: ${exposureColor}; margin: 0;">${exposureLabel}</p>
              <p style="font-size: 10px; color: ${exposureColor}; margin: 3px 0 0 0; opacity: 0.7;">${exposureEn}</p>
            </td>
            <td style="width: 50%; background: linear-gradient(135deg, #faf5ff, #f3e8ff); border: 2px solid #d8b4fe; border-radius: 10px; padding: 16px 20px; vertical-align: top; text-align: center;">
              <p style="color: #7c3aed; font-size: 10px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 1px;">品牌曝光率 SOV</p>
              <p style="margin: 0;">
                <span style="font-size: 28px; font-weight: 900; color: ${sovColor};">${site.sov}%</span>
              </p>
              <p style="font-size: 12px; color: #6b7280; margin: 3px 0 0 0;">排名 ${site.rank === 99 ? '未上榜' : '#' + site.rank}</p>
            </td>
          </tr>
        </table>

        <!-- Row 2: JILI曝光 + 黃金版位 (equal width) -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 10px;">
          <tr>
            <td style="width: 50%; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; vertical-align: top; text-align: center;">
              <p style="color: #059669; font-size: 10px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 1px;">JILI 曝光總數</p>
              <p style="margin: 0;">
                <span style="font-size: 28px; font-weight: 900; color: #059669;">${site.jiliInstances || 0}</span>
                <span style="font-size: 14px; color: #6b7280;"> / ${site.totalInstances || 0}</span>
              </p>
            </td>
            <td style="width: 50%; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px 20px; vertical-align: top; text-align: center;">
              <p style="color: #2563eb; font-size: 10px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 1px;">黃金版位</p>
              <p style="margin: 0;">
                <span style="font-size: 22px; font-weight: 900; color: #2563eb;">${site.largeBanner || 0}</span>
                <span style="font-size: 12px; color: #60a5fa;">/${site.totalLargeBanner || 0} 大圖</span>
                <span style="font-size: 14px; color: #bfdbfe; margin: 0 6px;">│</span>
                <span style="font-size: 22px; font-weight: 900; color: #2563eb;">${site.nonLargeBanner || 0}</span>
                <span style="font-size: 12px; color: #60a5fa;">/${site.totalNonLargeBanner || 0} 非大圖</span>
              </p>
            </td>
          </tr>
        </table>

        <!-- ── SECTION: 詳細數據 ── -->
        <p style="font-size: 14px; font-weight: 800; color: #3b0764; margin: 20px 0 14px 0; padding-bottom: 6px; border-bottom: 2px solid #e9d5ff;">
          📋 詳細數據
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
          <tr style="background: #4c1d95;">
            <td style="padding: 10px 14px; text-align: left; font-weight: 700; color: #ffffff; border: 1px solid #4c1d95;">指標</td>
            <td style="padding: 10px 14px; text-align: center; font-weight: 700; color: #ffffff; border: 1px solid #4c1d95;">JILI</td>
            <td style="padding: 10px 14px; text-align: center; font-weight: 700; color: #ffffff; border: 1px solid #4c1d95;">全站</td>
            <td style="padding: 10px 14px; text-align: center; font-weight: 700; color: #ffffff; border: 1px solid #4c1d95;">狀態</td>
          </tr>
          <tr style="background: #faf5ff;">
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; font-weight: 600;">黃金版位 — 大圖</td>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; text-align: center; font-weight: 700; color: #4c1d95;">${site.largeBanner || 0}</td>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${site.totalLargeBanner || 0}</td>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; text-align: center;">${hasLarge ? checkMark : crossMark}</td>
          </tr>
          <tr>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; font-weight: 600;">黃金版位 — 非大圖</td>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; text-align: center; font-weight: 700; color: #4c1d95;">${site.nonLargeBanner || 0}</td>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${site.totalNonLargeBanner || 0}</td>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; text-align: center;">${hasNonLarge ? checkMark : crossMark}</td>
          </tr>
          <tr style="background: #faf5ff;">
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; font-weight: 600;">其他區塊品牌揭露</td>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; text-align: center; font-weight: 700; color: #4c1d95;">${site.firstScreen || 0}</td>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${site.firstScreenTotal || 0}</td>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; text-align: center;">${hasOther ? checkMark : crossMark}</td>
          </tr>
          <tr>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; font-weight: 600;">曝光總數</td>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; text-align: center; font-weight: 700; color: #059669;">${site.jiliInstances || 0}</td>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${site.totalInstances || 0}</td>
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; text-align: center;">—</td>
          </tr>
          <tr style="background: #fef3c7;">
            <td style="padding: 8px 14px; border: 1px solid #e5e7eb; font-weight: 600;">主要競爭對手</td>
            <td colspan="3" style="padding: 8px 14px; border: 1px solid #e5e7eb; font-weight: 700; color: #92400e;">${site.competitor || 'N/A'}</td>
          </tr>
        </table>

        <!-- ── SECTION: 綜合洞察 ── -->
        <p style="font-size: 14px; font-weight: 800; color: #3b0764; margin: 0 0 12px 0; padding-bottom: 6px; border-bottom: 2px solid #e9d5ff;">
          💡 綜合洞察與建議
        </p>

        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 12px 16px; margin-bottom: 16px;">
          <p style="font-size: 12px; color: #1e40af; margin: 0; line-height: 1.8;">
            <strong>📋 數據摘要：</strong>JILI 曝光 <strong style="color: #059669;">${site.jiliInstances || 0}</strong>/${site.totalInstances || 0} 次
            ｜大圖 <strong>${site.largeBanner || 0}</strong>/${site.totalLargeBanner || 0}
            ｜非大圖 <strong>${site.nonLargeBanner || 0}</strong>/${site.totalNonLargeBanner || 0}
            ｜首屏 <strong>${site.firstScreen || 0}</strong>/${site.firstScreenTotal || 0}
          </p>
        </div>

        ${(site.analysis || []).map((text, idx) => `
          <div style="margin-bottom: 14px; padding: 0 0 14px 0; ${idx < (site.analysis || []).length - 1 ? 'border-bottom: 1px dashed #e5e7eb;' : ''}">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 32px; vertical-align: top; padding-top: 2px;">
                  <div style="width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #ffffff; text-align: center; line-height: 26px; font-size: 12px; font-weight: 800;">
                    ${idx + 1}
                  </div>
                </td>
                <td style="vertical-align: top; padding-left: 8px;">
                  <p style="font-size: 12px; color: #374151; line-height: 1.9; margin: 0;">${text}</p>
                </td>
              </tr>
            </table>
          </div>
        `).join('')}

      </div>

      <!-- ═══ FOOTER ═══ -->
      <div style="background: linear-gradient(135deg, #3b0764, #5b21b6); padding: 14px 36px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #c4b5fd; font-size: 10px;">Gaming Analytics Dashboard</td>
            <td style="color: #c4b5fd; font-size: 10px; text-align: center;">${site.site} — ${site.market || 'N/A'}</td>
            <td style="color: #c4b5fd; font-size: 10px; text-align: right;">${dateStr} ${timeStr}</td>
          </tr>
        </table>
      </div>

    </div>
  `;

  // Create temp container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = html;
  document.body.appendChild(container);

  const element = container.querySelector('#pdf-report');
  const fileName = `${site.site}_品牌曝光分析報告_${new Date().toISOString().slice(0, 10)}.pdf`;

  const opt = {
    margin: [8, 8, 8, 8],
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  // Generate and save PDF directly
  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      document.body.removeChild(container);
    })
    .catch((err) => {
      console.error('PDF generation failed:', err);
      document.body.removeChild(container);
    });
}
