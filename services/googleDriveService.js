/**
 * Google Drive Service — 透過 Google Apps Script Proxy 存取資料
 * 
 * 使用方式：
 * 1. 部署 google_apps_script.js 到 Google Apps Script
 * 2. 將部署後的 URL 填入下方 APPS_SCRIPT_URL
 */

// ⬇⬇⬇ 請將部署後的 Apps Script URL 貼在這裡 ⬇⬇⬇
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzebnEDbUPp4DzSm6QlYziWfmFPshDLv0MlAQDl_MNiVroImgl8LuHfvx2BW0NdAlaQIQ/exec';
// ⬆⬆⬆ 例: https://script.google.com/macros/s/AKfyc.../exec ⬆⬆⬆

/**
 * 呼叫 Apps Script proxy
 */
async function callProxy(params) {
  const url = new URL(APPS_SCRIPT_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Proxy error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(`Drive error: ${data.error}`);
  }
  return data;
}

/**
 * 列出「站台分析」下的所有日期子資料夾
 * @returns {Promise<Array<{id: string, name: string}>>} 按名稱降序排列
 */
export async function fetchDateFolders() {
  const data = await callProxy({ action: 'listFolders' });
  return data.folders || [];
}

/**
 * 列出指定日期資料夾內的所有檔案
 * @param {string} folderId 日期資料夾 ID
 * @returns {Promise<Array<{id: string, name: string, mimeType: string}>>}
 */
export async function fetchFilesInFolder(folderId) {
  const data = await callProxy({ action: 'listFiles', folderId });
  return data.files || [];
}

/**
 * 讀取 .txt 檔案的文字內容
 * @param {string} fileId 檔案 ID
 * @returns {Promise<string>} 檔案內容
 */
export async function fetchFileContent(fileId) {
  const data = await callProxy({ action: 'getFileContent', fileId });
  return data.content || '';
}

/**
 * 取得圖片的 data URL（base64）
 * @param {string} fileId 檔案 ID
 * @returns {Promise<string>} data:image/... URL
 */
export async function fetchImageDataUrl(fileId) {
  const data = await callProxy({ action: 'getImageBase64', fileId });
  return data.dataUrl || '';
}

/**
 * 取得圖片的 proxy URL（用於 img src）
 * 會在首次存取時載入且快取
 * @param {string} fileId 
 * @returns {string} proxy URL
 */
export function getImageUrl(fileId) {
  // 直接回傳 proxy URL，ImageModal 會透過 fetchImageDataUrl 載入
  return `${APPS_SCRIPT_URL}?action=getImageBase64&fileId=${fileId}`;
}

/**
 * 檢查 Apps Script URL 是否已設定
 */
export function isConfigured() {
  return APPS_SCRIPT_URL && !APPS_SCRIPT_URL.includes('__PASTE_');
}
