/**
 * 從 .txt 分析報告中解析出結構化的站台數據
 * @param {string} content .txt 檔案內容
 * @param {number} id 站台 ID (序號)
 * @returns {Object} 結構化的站台數據物件
 */
export function parseAnalysisReport(content, id) {
  const lines = content.split('\n').map(l => l.replace(/\r$/, ''));

  // --- Parse header (前 6 行) ---
  const headerMap = {};
  for (let i = 0; i < Math.min(7, lines.length); i++) {
    const match = lines[i].match(/^(.+?):\s*(.+)$/);
    if (match) {
      headerMap[match[1].trim()] = match[2].trim();
    }
  }

  const site = headerMap['廠商名稱'] || '';
  const url = headerMap['網址'] || '';
  const market = headerMap['市場'] || '';
  const apiId = headerMap['APIID'] || '';

  // --- Parse §6 總結 (Executive Summary) ---
  const summaryData = parseSummarySection(lines);

  // --- Parse §4 曝光佔有率 (Share of Voice) ---
  const sovData = parseSOVSection(lines);

  // --- Parse §5 黃金版位分析 (Prime Visibility) ---
  const primeData = parsePrimeSection(lines);

  // --- Parse 綜合洞察 (Insights) ---
  const analysis = parseInsights(lines);

  return {
    id,
    site,
    url,
    market,
    apiId,
    sov: sovData.sov,
    rank: sovData.rank,
    prime: summaryData.prime,
    competitor: summaryData.competitor,
    totalInstances: sovData.totalInstances,
    jiliInstances: sovData.jiliInstances,
    largeBanner: primeData.largeBanner,
    nonLargeBanner: primeData.nonLargeBanner,
    firstScreen: primeData.firstScreen,
    totalLargeBanner: primeData.totalLargeBanner,
    totalNonLargeBanner: primeData.totalNonLargeBanner,
    firstScreenTotal: primeData.firstScreenTotal,
    analysis,
  };
}

/**
 * 解析 §6 總結區塊
 */
function parseSummarySection(lines) {
  let prime = 'Low';
  let competitor = '';

  const summaryStart = lines.findIndex(l => l.includes('6. 總結') || l.includes('Executive Summary'));
  if (summaryStart === -1) return { prime, competitor };

  for (let i = summaryStart; i < Math.min(summaryStart + 30, lines.length); i++) {
    const line = lines[i];

    // 黃金版位曝光率及評級
    if (line.includes('黃金版位曝光率及評級')) {
      const parts = line.split('|').map(s => s.trim()).filter(Boolean);
      const val = parts[parts.length - 1] || '';
      if (val.includes('High')) prime = 'High';
      else if (val.includes('Medium')) prime = 'Medium';
      else prime = 'Low';
    }

    // 主要競爭對手
    if (line.includes('主要競爭對手')) {
      const parts = line.split('|').map(s => s.trim()).filter(Boolean);
      competitor = parts[parts.length - 1]?.replace(/^\*+|\*+$/g, '').trim() || '';
    }
  }

  return { prime, competitor };
}

/**
 * 解析 §4 曝光佔有率區塊
 */
function parseSOVSection(lines) {
  let sov = 0;
  let rank = 99;
  let totalInstances = 0;
  let jiliInstances = 0;

  const sovStart = lines.findIndex(l => l.includes('4. 曝光佔有率') || l.includes('Share of Voice'));
  if (sovStart === -1) return { sov, rank, totalInstances, jiliInstances };

  const sovEnd = lines.findIndex((l, i) => i > sovStart && (l.includes('### 5.') || l.includes('5. 黃金版位')));
  const sectionEnd = sovEnd === -1 ? Math.min(sovStart + 40, lines.length) : sovEnd;

  for (let i = sovStart; i < sectionEnd; i++) {
    const line = lines[i];
    if (!line.includes('|')) continue;

    const cells = line.split('|').map(s => s.trim()).filter(Boolean);
    if (cells.length < 3) continue;

    // Skip header and separator rows
    if (cells[0].includes(':---') || cells[0].includes('供應商') || cells[0] === '-') continue;

    // Total row
    if (cells[0].includes('Total') || cells[0].includes('**Total**')) {
      const totalStr = cells[1].replace(/\*+/g, '').trim();
      totalInstances = parseInt(totalStr) || 0;
      continue;
    }

    // JILI row
    if (cells[0].toUpperCase().includes('JILI')) {
      jiliInstances = parseInt(cells[1]) || 0;
      const sovStr = cells[2].replace(/%/g, '').trim();
      sov = parseFloat(sovStr) || 0;
      const rankStr = cells.length >= 4 ? cells[3].replace(/[^0-9]/g, '') : '';
      rank = rankStr ? parseInt(rankStr) : (sov > 0 ? 1 : 99);
      if (cells[3] && cells[3].includes('-')) rank = 99;
    }
  }

  return { sov, rank, totalInstances, jiliInstances };
}

/**
 * 解析 §5 黃金版位分析區塊
 */
function parsePrimeSection(lines) {
  let largeBanner = 0;
  let nonLargeBanner = 0;
  let firstScreen = 0;
  let totalLargeBanner = 0;
  let totalNonLargeBanner = 0;
  let firstScreenTotal = 0;

  const primeStart = lines.findIndex(l => l.includes('5. 黃金版位') || l.includes('Prime Visibility'));
  if (primeStart === -1) return { largeBanner, nonLargeBanner, firstScreen, totalLargeBanner, totalNonLargeBanner, firstScreenTotal };

  const primeEnd = lines.findIndex((l, i) => i > primeStart && (l.includes('### 6.') || l.includes('6. 總結')));
  const sectionEnd = primeEnd === -1 ? Math.min(primeStart + 30, lines.length) : primeEnd;

  for (let i = primeStart; i < sectionEnd; i++) {
    const line = lines[i];
    if (!line.includes('|')) continue;

    const cells = line.split('|').map(s => s.trim()).filter(Boolean);
    if (cells.length < 3) continue;

    // Skip header and separator rows
    if (cells[0].includes(':---') || cells[0].includes('供應商')) continue;

    // Total row
    if (cells[0].includes('Total') || cells[0].includes('**Total**')) {
      totalLargeBanner = parseInt(cells[1]?.replace(/\*+/g, '')) || 0;
      totalNonLargeBanner = parseInt(cells[2]?.replace(/\*+/g, '')) || 0;
      firstScreenTotal = parseInt(cells[3]?.replace(/\*+/g, '')) || 0;
      continue;
    }

    // JILI row
    if (cells[0].toUpperCase().includes('JILI')) {
      largeBanner = parseInt(cells[1]) || 0;
      nonLargeBanner = parseInt(cells[2]) || 0;
      firstScreen = parseInt(cells[3]) || 0;
    }
  }

  return { largeBanner, nonLargeBanner, firstScreen, totalLargeBanner, totalNonLargeBanner, firstScreenTotal };
}

/**
 * 解析綜合洞察區塊
 */
function parseInsights(lines) {
  const insights = [];
  const insightStart = lines.findIndex(l => l.includes('綜合洞察') || l.includes('Insights'));
  if (insightStart === -1) return insights;

  let current = '';
  for (let i = insightStart + 1; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a numbered insight line (e.g., "1.  xxx" or "2.  xxx")
    const numberedMatch = line.match(/^\d+\.\s+\*\*(.+?)\*\*[：:]\s*(.*)/);
    if (numberedMatch) {
      if (current) insights.push(current.trim());
      current = `${numberedMatch[1]}：${numberedMatch[2]}`;
      continue;
    }

    // Check for continuation lines (bulleted sub-items)
    const bulletMatch = line.match(/^\s*\*\s+(.+)/);
    if (bulletMatch && current) {
      current += '\n' + bulletMatch[1];
      continue;
    }

    // Plain continuation line under a numbered item
    if (line.trim() && current && !line.startsWith('#') && !line.startsWith('|')) {
      current += ' ' + line.trim();
      continue;
    }

    // Empty line or section break
    if (!line.trim() && current) {
      insights.push(current.trim());
      current = '';
    }
  }

  if (current) insights.push(current.trim());

  return insights.length > 0 ? insights : ['暫無分析資料'];
}

/**
 * 從檔案清單中配對 .txt 和 .png 檔案
 * @param {Array} files Google Drive 檔案清單
 * @returns {{ txtFiles: Array, imageMap: Object }} 
 *   txtFiles: txt 檔案清單
 *   imageMap: baseName → imageFileId 對照表
 */
export function pairFiles(files) {
  const txtFiles = [];
  const pngMap = {};

  for (const file of files) {
    const name = file.name;
    if (name.endsWith('.txt')) {
      txtFiles.push(file);
    } else if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
      const baseName = name.replace(/\.(png|jpg|jpeg)$/i, '');
      pngMap[baseName] = file.id;
    }
  }

  // Build imageMap: siteId → imageFileId (will be populated after parsing)
  const imageMap = {};
  const txtBasenames = [];
  for (const txt of txtFiles) {
    const baseName = txt.name.replace(/\.txt$/i, '');
    txtBasenames.push({ fileId: txt.id, baseName });
    if (pngMap[baseName]) {
      imageMap[baseName] = pngMap[baseName];
    }
  }

  return { txtFiles: txtBasenames, imageMap };
}
