// src/content/index.ts
// SEMrush Smart Copier - Main Content Script
// Glues all TypeScript parts together and builds the UI

import { detectTable, getTableHeaders } from './detectTable';
import { extractRows } from './extractRows';
import { cleanData } from './cleanData';
import { convertToTSV, copyToClipboard } from './copyToClipboard';
import { saveColumnConfig, loadColumnConfig, getDefaultColumns } from '../utils/storage';
import { registerHotkeys } from '../hotkeys/index';
import { ColumnConfig } from '../types/index';

(function () {
  'use strict';

  // ── Prevent double-injection ──
  if ((window as any).__semrushSmartCopierLoaded) return;
  (window as any).__semrushSmartCopierLoaded = true;

  // ── Helper to proxy fetch requests through the background script (bypasses CSP & CORS) ──
  async function fetchFromBackground(url: string, options: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'FETCH_API', url, options }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && response.success) {
          const { result } = response;
          resolve({
            ok: result.ok,
            status: result.status,
            json: async () => result.data,
            text: async () => typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
          });
        } else {
          reject(new Error(response?.error || 'Failed to fetch from background worker'));
        }
      });
    });
  }

  // ══════════════════════════════════════
  //  TOAST NOTIFICATIONS
  // ══════════════════════════════════════
  let currentToast: HTMLDivElement | null = null;

  function showToast(message: string, type: 'success' | 'error' | 'loading' = 'success', duration = 2500): HTMLDivElement {
    if (currentToast) {
      currentToast.remove();
      currentToast = null;
    }

    const toast = document.createElement('div');
    toast.className = `sc-toast ${type}`;

    if (type === 'loading') {
      toast.innerHTML = `<div class="sc-spinner"></div><span>${message}</span>`;
    } else if (type === 'success') {
      toast.innerHTML = `<span style="font-size:14px">✅</span><span>${message}</span>`;
    } else {
      toast.innerHTML = `<span style="font-size:14px">❌</span><span>${message}</span>`;
    }

    document.body.appendChild(toast);
    currentToast = toast;

    if (duration > 0) {
      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
          if (toast.parentNode) toast.remove();
          if (currentToast === toast) currentToast = null;
        }, 200);
      }, duration);
    }

    return toast;
  }

  // ══════════════════════════════════════
  //  MAIN COPY FUNCTION
  // ══════════════════════════════════════
  async function performCopy() {
    const loadingToast = showToast('جاري استخراج الجدول...', 'loading', 0);

    try {
      const table = detectTable();
      if (!table) {
        loadingToast.remove();
        showToast('لم يتم العثور على جدول في الصفحة', 'error');
        return;
      }

      const headers = getTableHeaders(table);
      if (!headers.length) {
        loadingToast.remove();
        showToast('لم يتم العثور على أعمدة', 'error');
        return;
      }

      let rows = extractRows(table, headers);
      rows = cleanData(rows);

      if (!rows.length) {
        loadingToast.remove();
        showToast('لم يتم العثور على بيانات', 'error');
        return;
      }

      // Get enabled columns
      const saved = loadColumnConfig();
      const columnConfig = saved || getDefaultColumns(headers);
      const enabledColumns = columnConfig.filter(c => c.enabled).map(c => c.key);

      const tsv = convertToTSV(headers, rows, enabledColumns);
      const ok = await copyToClipboard(tsv);

      loadingToast.remove();

      if (ok) {
        const colCount = enabledColumns.length || headers.length;
        showToast(`تم النسخ: ${rows.length} صف × ${colCount} عمود ✅`, 'success');
      } else {
        showToast('فشل النسخ — حاول مرة أخرى', 'error');
      }

    } catch (err: any) {
      loadingToast.remove();
      showToast('خطأ في الاستخراج: ' + err.message, 'error');
      console.error('[SEMrush Smart Copier]', err);
    }
  }

  // ══════════════════════════════════════
  //  DATABASE SYNC FUNCTION
  // ══════════════════════════════════════
  function parseVolume(val: string): number {
    if (!val) return 0;
    const cleaned = val.toUpperCase().trim().replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    if (cleaned.endsWith('K')) return Math.round(num * 1000);
    if (cleaned.endsWith('M')) return Math.round(num * 1000000);
    if (cleaned.endsWith('B')) return Math.round(num * 1000000000);
    return Math.round(num);
  }

  async function performSync() {
    if (syncMode === 'keywords') {
      if (!selectedClientId) {
        showToast('يرجى اختيار العميل المستهدف أولاً من قائمة الإعدادات ⚙️', 'error');
        return;
      }
      
      const loadingToast = showToast('جاري استخلاص وتصفية الكلمات المفتاحية... ⏳', 'loading', 0);

      try {
        const table = detectTable();
        if (!table) {
          loadingToast.remove();
          showToast('لم يتم العثور على جدول في الصفحة', 'error');
          return;
        }

        const headers = getTableHeaders(table);
        if (!headers.length) {
          loadingToast.remove();
          showToast('لم يتم العثور على أعمدة', 'error');
          return;
        }

        let rows = extractRows(table, headers);
        rows = cleanData(rows);

        if (!rows.length) {
          loadingToast.remove();
          showToast('لم يتم العثور على بيانات في الجدول', 'error');
          return;
        }

        // تحديد الأعمدة المناسبة للكلمات
        const keywordKey = headers.find(h => {
          const hLower = h.toLowerCase();
          return hLower === 'keyword' || hLower === 'keywords' || hLower.includes('الكلمة') || hLower.includes('الكلمات') || hLower === 'query';
        }) || headers[0];

        const kdKey = headers.find(h => {
          const hLower = h.toLowerCase();
          return hLower === 'kd' || hLower.includes('difficulty') || hLower.includes('صعوبة');
        });

        const volumeKey = headers.find(h => {
          const hLower = h.toLowerCase();
          return hLower.includes('volume') || hLower.includes('حجم');
        });

        const intentKey = headers.find(h => {
          const hLower = h.toLowerCase();
          return hLower === 'intent' || hLower.includes('نية') || hLower.includes('قصد');
        });

        const cpcKey = headers.find(h => {
          const hLower = h.toLowerCase();
          return hLower === 'cpc' || hLower.includes('cpc') || hLower.includes('سعر النقرة') || hLower.includes('تكلفة');
        });

        const sfKey = headers.find(h => {
          const hLower = h.toLowerCase();
          return hLower === 'sf' || hLower === 'serp features' || hLower.includes('ميزات') || hLower.includes('ميزة');
        });

        // بناء قائمة الكلمات المزامنة
        const currentPlatform = window.location.hostname.includes('ahrefs') ? 'ahrefs' : 'semrush';
        
        let detectedSourceSite = '';
        try {
          const urlParams = new URLSearchParams(window.location.search);
          detectedSourceSite = urlParams.get('q') || urlParams.get('query') || urlParams.get('target') || '';
          if (!detectedSourceSite) {
            const pathParts = window.location.pathname.split('/');
            const domainPart = pathParts.find(p => p.includes('.') && p.length > 3 && !p.endsWith('html'));
            if (domainPart) detectedSourceSite = domainPart;
          }
        } catch (e) {}

        const keywordList: Array<{ 
          keyword: string; 
          kd: number; 
          volume: number; 
          platform: string; 
          source_site: string;
          intent: string;
          cpc: number;
          sf: string;
        }> = [];

        rows.forEach(row => {
          const kwText = (row[keywordKey] || '').trim();
          if (!kwText) return;

          let kdVal = 0;
          if (kdKey) {
            const kdStr = (row[kdKey] || '').replace(/[^0-9]/g, '');
            kdVal = parseInt(kdStr) || 0;
          }

          let volVal = 0;
          if (volumeKey) {
            volVal = parseVolume(row[volumeKey] || '');
          }

          let intentVal = '';
          if (intentKey) {
            intentVal = (row[intentKey] || '').trim();
          }

          let cpcVal = 0.0;
          if (cpcKey) {
            const cpcStr = (row[cpcKey] || '').replace(/[^0-9.]/g, '');
            cpcVal = parseFloat(cpcStr) || 0.0;
          }

          let sfVal = '';
          if (sfKey) {
            sfVal = (row[sfKey] || '').trim();
          }

          keywordList.push({
            keyword: kwText,
            kd: kdVal,
            volume: volVal,
            platform: currentPlatform,
            source_site: detectedSourceSite,
            intent: intentVal,
            cpc: cpcVal,
            sf: sfVal
          });
        });

        if (keywordList.length === 0) {
          loadingToast.remove();
          showToast('لم يتم العثور على كلمات مفتاحية صالحة في الجدول', 'error');
          return;
        }

        loadingToast.remove();
        const syncToast = showToast(`جاري مزامنة ${keywordList.length} كلمة مع العميل المحدد... ◆`, 'loading', 0);

        const res = await fetchFromBackground('http://localhost:3000/api/seo/sync-keywords', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: selectedClientId,
            keywords: keywordList
          })
        });

        const data = await res.json();
        syncToast.remove();

        if (res.ok && data.success) {
          if (data.count === 0) {
            showToast('كل الكلمات المستخرجة مضافة مسبقاً للعميل بالفعل! ✅', 'success', 3500);
          } else {
            showToast(`مزامنة حية! تم إضافة ${data.count} كلمة مفتاحية جديدة للعميل 🚀`, 'success', 3500);
          }
        } else {
          showToast(`فشلت المزامنة: ${data.error || 'خطأ غير معروف'}`, 'error');
        }

      } catch (err: any) {
        loadingToast.remove();
        showToast('تعذر الاتصال بنقيب. تأكد من تشغيل تطبيق نقيب المحلي.', 'error', 3500);
        console.error('[Naqeeb Keyword Sync Error]', err);
      }

      return;
    }

    const loadingToast = showToast('جاري استخلاص وتصفية المتاجر... ⏳', 'loading', 0);

    try {
      const table = detectTable();
      if (!table) {
        loadingToast.remove();
        showToast('لم يتم العثور على جدول في الصفحة', 'error');
        return;
      }

      const headers = getTableHeaders(table);
      if (!headers.length) {
        loadingToast.remove();
        showToast('لم يتم العثور على أعمدة', 'error');
        return;
      }

      let rows = extractRows(table, headers);
      rows = cleanData(rows);

      if (!rows.length) {
        loadingToast.remove();
        showToast('لم يتم العثور على بيانات', 'error');
        return;
      }

      // Find all URL fields across columns
      const urlKeys = headers.filter(h => {
        const hLower = h.toLowerCase();
        return hLower.includes('url') || hLower.includes('link') || hLower.includes('page') || hLower.includes('website');
      });

      // Extract unique clean URLs
      const extractedUrls = new Set<string>();
      rows.forEach(row => {
        urlKeys.forEach(key => {
          const val = (row[key] || '').trim();
          if (val && val.startsWith('http')) {
            extractedUrls.add(val);
          }
        });
      });

      const urlList = Array.from(extractedUrls);

      if (urlList.length === 0) {
        loadingToast.remove();
        showToast('لم يتم العثور على روابط مواقع في الجدول', 'error');
        return;
      }

      // Smart filter: prioritize Salla/Zed or clean independent stores
      const sallaOrZedRegex = /(salla\.sa|salla\.co|zid\.store|zid\.sa|mahally\.com)/i;
      const socialOrSearchRegex = /(google\.com|semrush\.com|youtube\.com|facebook\.com|instagram\.com|tiktok\.com|twitter\.com|x\.com|snapchat\.com|pinterest\.com|linkedin\.com|wikipedia\.org)/i;

      // First find Salla/Zed stores
      let filteredUrls = urlList.filter(url => sallaOrZedRegex.test(url));

      // If none found, fallback to any independent URLs (excluding social media & major search engines)
      if (filteredUrls.length === 0) {
        filteredUrls = urlList.filter(url => !socialOrSearchRegex.test(url));
      }

      if (filteredUrls.length === 0) {
        loadingToast.remove();
        showToast('لم يتم العثور على روابط متاجر صالحة للتنصيب في نقيب', 'error');
        return;
      }

      // Update toast to show syncing state
      loadingToast.remove();
      const syncToast = showToast(`جاري مزامنة وإثراء ${filteredUrls.length} متجراً في نقيب... ◆`, 'loading', 0);

      // Resolve manual inputs with defaults
      const finalSource = manualSource || (window.location.hostname.includes('ahrefs') ? 'ahrefs' : 'semrush');
      
      let finalCategory = manualCategory;
      if (!finalCategory) {
        let defaultCategory = 'عام';
        const titleEl = document.querySelector('h1, title');
        if (titleEl && titleEl.textContent) {
          defaultCategory = titleEl.textContent.trim().split('|')[0].split('-')[0].trim();
        }
        finalCategory = defaultCategory;
      }

      // Fetch POST to Next.js Local Server
      const res = await fetchFromBackground('http://localhost:3000/api/leads/sync-plugin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          urls: filteredUrls,
          source: finalSource,
          category: finalCategory
        })
      });

      const data = await res.json();
      syncToast.remove();

      if (res.ok && data.success) {
        showToast(`مزامنة حية! تم مزامنة وإثراء ${data.count} متجراً بنجاح في نقيب ◆`, 'success', 3500);
      } else {
        showToast(`فشلت المزامنة: ${data.error || 'خطأ غير معروف'}`, 'error');
      }

    } catch (err: any) {
      loadingToast.remove();
      showToast('تعذر الاتصال بنقيب. تأكد من تشغيل تطبيق نقيب المحلي.', 'error', 3500);
      console.error('[Naqeeb Smart Copier Sync Error]', err);
    }
  }

  // ══════════════════════════════════════
  //  KEYWORDS CHECK & TABLE BADGES INJECTION
  // ══════════════════════════════════════
  let clientKeywordsMap: Record<string, 'targeted' | 'suggested'> = {};
  let observer: MutationObserver | null = null;
  let updateDebounceTimer: any = null;

  async function fetchClientKeywords() {
    if (!selectedClientId) {
      clientKeywordsMap = {};
      updateTableBadges();
      return;
    }
    try {
      const res = await fetchFromBackground(`http://localhost:3000/api/seo/quick-check?client_id=${selectedClientId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        clientKeywordsMap = data.keywords || {};
      } else {
        clientKeywordsMap = {};
      }
    } catch (e) {
      console.error('[Naqeeb Smart Copier] Failed to fetch client keywords map:', e);
      clientKeywordsMap = {};
    }
    updateTableBadges();
  }

  function updateTableBadges() {
    // Prevent infinite observer loops by disconnecting first
    if (observer) observer.disconnect();

    try {
      // 1. Remove existing badges to avoid duplicates
      document.querySelectorAll('.sc-table-badge, .sc-table-add-btn').forEach(el => el.remove());

      // 2. If not in keywords mode, or no client selected, do nothing
      if (syncMode !== 'keywords' || !selectedClientId) return;

      const table = detectTable();
      if (!table) return;

      const headers = getTableHeaders(table);
      if (!headers.length) return;

      // 3. Find keyword column index
      const keywordIndex = headers.findIndex(h => {
        const hLower = h.toLowerCase();
        return hLower === 'keyword' || hLower === 'keywords' || hLower.includes('الكلمة') || hLower.includes('الكلمات') || hLower === 'query';
      });

      if (keywordIndex === -1) return;

      // 4. Iterate over rows to inject status badges
      const rows = table.querySelectorAll('tbody tr, [role="row"]');
      rows.forEach(row => {
        if (row.querySelector('th, [role="columnheader"]')) return; // skip headers

        const cells = row.querySelectorAll('td, [role="gridcell"], [role="cell"]');
        const keywordCell = cells[keywordIndex] as HTMLElement;
        if (!keywordCell) return;

        // Clean cell content to extract clean keyword text
        const tempCell = keywordCell.cloneNode(true) as HTMLElement;
        tempCell.querySelectorAll('.sc-table-badge, .sc-table-add-btn, button, svg').forEach(el => el.remove());
        const keywordText = tempCell.textContent?.trim().toLowerCase().replace(/\s+/g, ' ') || '';

        if (!keywordText || keywordText.length < 2) return;

        const status = clientKeywordsMap[keywordText];

        // Ensure we don't double inject
        if (keywordCell.querySelector('.sc-table-badge, .sc-table-add-btn')) return;

        if (status === 'targeted') {
          const badge = document.createElement('span');
          badge.className = 'sc-table-badge targeted';
          badge.textContent = 'مستهدفة 🟢';
          badge.title = 'هذه الكلمة مستهدفة نشطة في خطة هذا العميل';
          keywordCell.appendChild(badge);
        } else if (status === 'suggested') {
          const badge = document.createElement('span');
          badge.className = 'sc-table-badge suggested';
          badge.textContent = 'مقترحة 🟡';
          badge.title = 'هذه الكلمة مضافة مسبقاً في قاعدة الكلمات المقترحة للعميل';
          keywordCell.appendChild(badge);
        } else {
          // New opportunity: add button (+)
          const addBtn = document.createElement('button');
          addBtn.className = 'sc-table-add-btn';
          addBtn.textContent = '+';
          addBtn.title = 'إضافة سريعة لقاعدة الكلمات المقترحة للعميل';
          
          addBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();

            addBtn.disabled = true;
            addBtn.textContent = '⏳';

            // Gather other fields from the row
            let kdVal = 0;
            let volVal = 0;
            let intentVal = '';
            let cpcVal = 0.0;
            let sfVal = '';

            const kdIndex = headers.findIndex(h => {
              const hLower = h.toLowerCase();
              return hLower === 'kd' || hLower.includes('difficulty') || hLower.includes('صعوبة');
            });
            const volIndex = headers.findIndex(h => {
              const hLower = h.toLowerCase();
              return hLower.includes('volume') || hLower.includes('حجم');
            });
            const intentIndex = headers.findIndex(h => {
              const hLower = h.toLowerCase();
              return hLower === 'intent' || hLower.includes('نية') || hLower.includes('قصد');
            });
            const cpcIndex = headers.findIndex(h => {
              const hLower = h.toLowerCase();
              return hLower === 'cpc' || hLower.includes('cpc') || hLower.includes('سعر النقرة') || hLower.includes('تكلفة');
            });
            const sfIndex = headers.findIndex(h => {
              const hLower = h.toLowerCase();
              return hLower === 'sf' || hLower === 'serp features' || hLower.includes('ميزات') || hLower.includes('ميزة');
            });

            if (kdIndex !== -1 && cells[kdIndex]) {
              kdVal = parseInt(cells[kdIndex].textContent?.replace(/[^0-9]/g, '') || '') || 0;
            }
            if (volIndex !== -1 && cells[volIndex]) {
              volVal = parseVolume(cells[volIndex].textContent || '');
            }
            if (intentIndex !== -1 && cells[intentIndex]) {
              intentVal = cells[intentIndex].textContent?.trim() || '';
            }
            if (cpcIndex !== -1 && cells[cpcIndex]) {
              cpcVal = parseFloat(cells[cpcIndex].textContent?.replace(/[^0-9.]/g, '') || '') || 0.0;
            }
            if (sfIndex !== -1 && cells[sfIndex]) {
              sfVal = cells[sfIndex].textContent?.trim() || '';
            }

            const currentPlatform = window.location.hostname.includes('ahrefs') ? 'ahrefs' : 'semrush';
            
            let detectedSourceSite = '';
            try {
              const urlParams = new URLSearchParams(window.location.search);
              detectedSourceSite = urlParams.get('q') || urlParams.get('query') || urlParams.get('target') || '';
              if (!detectedSourceSite) {
                const pathParts = window.location.pathname.split('/');
                const domainPart = pathParts.find(p => p.includes('.') && p.length > 3 && !p.endsWith('html'));
                if (domainPart) detectedSourceSite = domainPart;
              }
            } catch (err) {}

            try {
              const res = await fetchFromBackground('http://localhost:3000/api/seo/sync-keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  client_id: selectedClientId,
                  keywords: [{
                    keyword: tempCell.textContent?.trim() || '',
                    kd: kdVal,
                    volume: volVal,
                    platform: currentPlatform,
                    source_site: detectedSourceSite,
                    intent: intentVal,
                    cpc: cpcVal,
                    sf: sfVal
                  }]
                })
              });

              const resData = await res.json();
              if (res.ok && resData.success) {
                showToast(`تم حفظ الكلمة المفتاحية للعميل! 🚀`, 'success');
                clientKeywordsMap[keywordText] = 'suggested';
                addBtn.remove();

                const badge = document.createElement('span');
                badge.className = 'sc-table-badge suggested';
                badge.textContent = 'مقترحة 🟡';
                badge.title = 'هذه الكلمة مضافة مسبقاً في قاعدة الكلمات المقترحة للعميل';
                keywordCell.appendChild(badge);
              } else {
                showToast(`فشلت الإضافة: ${resData.error || 'خطأ غير معروف'}`, 'error');
                addBtn.disabled = false;
                addBtn.textContent = '+';
              }
            } catch (err) {
              showToast('خطأ في الاتصال بالسيرفر لإتمام الحفظ السريع.', 'error');
              addBtn.disabled = false;
              addBtn.textContent = '+';
            }
          });
          keywordCell.appendChild(addBtn);
        }
      });
    } finally {
      // Reconnect observer
      if (observer) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  }

  function initObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldUpdate = true;
          break;
        }
      }
      if (shouldUpdate) {
        clearTimeout(updateDebounceTimer);
        updateDebounceTimer = setTimeout(updateTableBadges, 300);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ══════════════════════════════════════
  //  COLUMN SELECTOR PANEL
  // ══════════════════════════════════════
  let panelOpen = false;
  let columnConfig: ColumnConfig[] = [];
  let currentHeaders: string[] = [];
  let manualSource = '';
  let manualCategory = '';
  let syncMode: 'leads' | 'keywords' = (localStorage.getItem('sc_sync_mode') as 'leads' | 'keywords') || 'leads';
  let selectedClientId = localStorage.getItem('sc_selected_client_id') || '';
  let clients: Array<{ id: string; name: string; website: string }> = [];

  async function loadClientsInSelect(selectEl: HTMLSelectElement) {
    if (!selectEl) return;
    try {
      const res = await fetchFromBackground('http://localhost:3000/api/seo/clients');
      const data = await res.json();
      if (res.ok && data.success) {
        clients = data.clients || [];
        if (clients.length === 0) {
          selectEl.innerHTML = '<option value="">❌ لا يوجد عملاء في لوحة التحكم</option>';
          return;
        }

        let optionsHtml = '';
        clients.forEach(c => {
          const isSel = selectedClientId === c.id ? 'selected' : '';
          optionsHtml += `<option value="${c.id}" ${isSel}>${c.name} (${c.website})</option>`;
        });
        selectEl.innerHTML = optionsHtml;

        if (!selectedClientId || !clients.some(c => c.id === selectedClientId)) {
          selectedClientId = clients[0].id;
          localStorage.setItem('sc_selected_client_id', selectedClientId);
        }
        fetchClientKeywords();
      } else {
        selectEl.innerHTML = '<option value="">❌ تعذر تحميل العملاء</option>';
      }
    } catch (err) {
      selectEl.innerHTML = '<option value="">❌ خطأ في الاتصال باللوحة</option>';
    }
  }

  function buildColumnPanel(container: HTMLElement) {
    const table = detectTable();
    if (table) {
      const headers = getTableHeaders(table);
      if (headers.length) {
        currentHeaders = headers;
        const saved = loadColumnConfig();
        columnConfig = saved || getDefaultColumns(headers);
        
        // Sync headers (add new columns that didn't exist before)
        headers.forEach(h => {
          if (!columnConfig.find(c => c.key === h)) {
            columnConfig.push({ key: h, label: h, enabled: true });
          }
        });
      }
    }

    // Set initial values if not already set by user manually
    if (!manualSource) {
      manualSource = window.location.hostname.includes('ahrefs') ? 'ahrefs' : 'semrush';
    }
    if (!manualCategory) {
      let defaultCategory = 'عام';
      const titleEl = document.querySelector('h1, title');
      if (titleEl && titleEl.textContent) {
        defaultCategory = titleEl.textContent.trim().split('|')[0].split('-')[0].trim();
      }
      manualCategory = defaultCategory;
    }

    const panel = document.createElement('div');
    panel.className = 'sc-panel';

    panel.innerHTML = `
      <div class="sc-panel-header">إعدادات المزامنة سحابياً ◆</div>
      <div class="sc-sync-settings" style="padding:12px;display:flex;flex-direction:column;gap:10px;">
        <div class="sc-setting-field" style="display:flex;flex-direction:column;gap:4px;">
          <label style="font-size:11px;font-weight:700;color:var(--sc-text-dim);">نوع المزامنة:</label>
          <select id="sc-sync-mode" class="sc-select" style="padding:6px;font-size:12px;border:1px solid var(--sc-border);border-radius:6px;background:#fff;font-family:var(--sc-font);outline:none;cursor:pointer;">
            <option value="leads" ${syncMode === 'leads' ? 'selected' : ''}>مزامنة متاجر مستهدفة (Leads)</option>
            <option value="keywords" ${syncMode === 'keywords' ? 'selected' : ''}>مزامنة كلمات مفتاحية (Keywords)</option>
          </select>
        </div>
        
        <!-- Leads Fields -->
        <div id="sc-leads-fields" style="display: ${syncMode === 'leads' ? 'flex' : 'none'}; flex-direction:column; gap:10px;">
          <div class="sc-setting-field" style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:11px;font-weight:700;color:var(--sc-text-dim);">منصة المصدر يدوياً:</label>
            <select id="sc-sync-source" class="sc-select" style="padding:6px;font-size:12px;border:1px solid var(--sc-border);border-radius:6px;background:#fff;font-family:var(--sc-font);outline:none;cursor:pointer;">
              <option value="semrush" ${manualSource === 'semrush' ? 'selected' : ''}>ملحق SEMrush</option>
              <option value="ahrefs" ${manualSource === 'ahrefs' ? 'selected' : ''}>ملحق Ahrefs</option>
              <option value="maps" ${manualSource === 'maps' ? 'selected' : ''}>خرائط جوجل</option>
              <option value="mahally" ${manualSource === 'mahally' ? 'selected' : ''}>سلة (محلي)</option>
              <option value="mazeed" ${manualSource === 'mazeed' ? 'selected' : ''}>زد (مزيد)</option>
              <option value="google_scrape" ${manualSource === 'google_scrape' ? 'selected' : ''}>بحث جوجل والويب</option>
            </select>
          </div>
          <div class="sc-setting-field" style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:11px;font-weight:700;color:var(--sc-text-dim);">اسم التصنيف / المشروع:</label>
            <input type="text" id="sc-sync-category" class="sc-input" placeholder="مثال: متاجر عطور الرياض" value="${manualCategory}" style="padding:6px;font-size:12px;border:1px solid var(--sc-border);border-radius:6px;font-family:var(--sc-font);outline:none;" />
          </div>
        </div>

        <!-- Keywords Fields -->
        <div id="sc-keywords-fields" style="display: ${syncMode === 'keywords' ? 'flex' : 'none'}; flex-direction:column; gap:10px;">
          <div class="sc-setting-field" style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:11px;font-weight:700;color:var(--sc-text-dim);">العميل المستهدف:</label>
            <select id="sc-sync-client" class="sc-select" style="padding:6px;font-size:12px;border:1px solid var(--sc-border);border-radius:6px;background:#fff;font-family:var(--sc-font);outline:none;cursor:pointer;">
              <option value="">جاري تحميل العملاء... ⏳</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="sc-panel-header" style="border-top: 1px solid var(--sc-border)">الأعمدة المستخرجة</div>
      <div class="sc-column-list" id="sc-col-list"></div>
    `;

    const syncModeSelect = panel.querySelector('#sc-sync-mode') as HTMLSelectElement;
    const leadsFields = panel.querySelector('#sc-leads-fields') as HTMLElement;
    const keywordsFields = panel.querySelector('#sc-keywords-fields') as HTMLElement;
    const clientSelect = panel.querySelector('#sc-sync-client') as HTMLSelectElement;

    if (syncModeSelect) {
      syncModeSelect.addEventListener('change', () => {
        syncMode = syncModeSelect.value as 'leads' | 'keywords';
        localStorage.setItem('sc_sync_mode', syncMode);
        
        if (syncMode === 'leads') {
          leadsFields.style.display = 'flex';
          keywordsFields.style.display = 'none';
          updateTableBadges();
        } else {
          leadsFields.style.display = 'none';
          keywordsFields.style.display = 'flex';
          loadClientsInSelect(clientSelect);
          fetchClientKeywords();
        }
      });
    }

    if (syncMode === 'keywords' && clientSelect) {
      loadClientsInSelect(clientSelect);
    }

    if (clientSelect) {
      clientSelect.addEventListener('change', () => {
        selectedClientId = clientSelect.value;
        localStorage.setItem('sc_selected_client_id', selectedClientId);
        fetchClientKeywords();
      });
    }

    // Hook up manual settings listeners
    const sourceSelect = panel.querySelector('#sc-sync-source') as HTMLSelectElement;
    if (sourceSelect) {
      sourceSelect.addEventListener('change', () => {
        manualSource = sourceSelect.value;
      });
    }

    const categoryInput = panel.querySelector('#sc-sync-category') as HTMLInputElement;
    if (categoryInput) {
      categoryInput.addEventListener('input', () => {
        manualCategory = categoryInput.value;
      });
    }

    const list = panel.querySelector('#sc-col-list') as HTMLElement;

    if (!columnConfig.length) {
      const serviceName = window.location.hostname.includes('ahrefs') ? 'Ahrefs' : 'SEMrush';
      list.innerHTML = `<div style="padding:12px;color:var(--sc-text-dim);font-size:12px;text-align:center">افتح صفحة جدول في ${serviceName} أولاً</div>`;
    } else {
      columnConfig.forEach((col, idx) => {
        const item = document.createElement('label');
        item.className = 'sc-col-item';
        item.innerHTML = `
          <input type="checkbox" data-idx="${idx}" ${col.enabled ? 'checked' : ''} />
          <span class="sc-col-label">${col.label}</span>
        `;
        const cb = item.querySelector('input') as HTMLInputElement;
        cb.addEventListener('change', () => {
          columnConfig[idx].enabled = cb.checked;
          saveColumnConfig(columnConfig);
        });
        list.appendChild(item);
      });
    }

    container.appendChild(panel);
  }

  // ══════════════════════════════════════
  //  UI: FLOATING BUTTON
  // ══════════════════════════════════════
  function createUI() {
    // Root container
    const root = document.createElement('div');
    root.id = 'semrush-smart-copier-root';

    // Main row
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;position:relative';

    // Settings button
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'sc-settings-btn';
    settingsBtn.title = 'اختيار الأعمدة';
    settingsBtn.innerHTML = `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 10a2 2 0 100-4 2 2 0 000 4zm5.657-2c0-.338-.03-.676-.087-1l1.257-.726a.5.5 0 00.183-.683l-1.5-2.598a.5.5 0 00-.683-.183l-1.248.72A5.97 5.97 0 009 3.07V1.5A.5.5 0 008.5 1h-1a.5.5 0 00-.5.5v1.57a5.97 5.97 0 00-1.579.92l-1.248-.72a.5.5 0 00-.683.183l-1.5 2.598a.5.5 0 00.183.683L3.43 7a5.93 5.93 0 000 2l-1.257.727a.5.5 0 00-.183.683l1.5 2.598a.5.5 0 00.683.183l1.248-.72A5.97 5.97 0 007 13.43V15a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1.57a5.97 5.97 0 001.579-.92l1.248.72a.5.5 0 00.683-.183l1.5-2.598a.5.5 0 00-.183-.683L12.57 10a5.95 5.95 0 00.087-1z"/>
      </svg>
    `;

    // Sync button
    const syncBtn = document.createElement('button');
    syncBtn.className = 'sc-sync-btn';
    syncBtn.title = 'مزامنة وإثراء في نقيب ◆';
    syncBtn.innerHTML = `
      <span class="sc-sync-icon">◆</span>
      <span class="sc-sync-text">مزامنة وإثراء</span>
    `;

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'sc-fab';
    copyBtn.innerHTML = `
      <svg class="sc-fab-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 1.5A1.5 1.5 0 018.5 0h-5A1.5 1.5 0 002 1.5v10A1.5 1.5 0 003.5 13H4v1.5A1.5 1.5 0 005.5 16h7a1.5 1.5 0 001.5-1.5v-10A1.5 1.5 0 0012.5 3H12V1.5zM3.5 1h5a.5.5 0 01.5.5V3H3.5a.5.5 0 00-.5.5v9h-.5A.5.5 0 012 12V1.5a.5.5 0 01.5-.5zm9 2.5a.5.5 0 01.5.5v10a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5h7z"/>
      </svg>
      <span class="sc-fab-text">نسخ الجدول</span>
      <span class="sc-fab-kbd">Alt+C</span>
    `;

    copyBtn.addEventListener('click', performCopy);
    syncBtn.addEventListener('click', performSync);

    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (panelOpen) {
        const existing = root.querySelector('.sc-panel');
        if (existing) existing.remove();
        panelOpen = false;
      } else {
        buildColumnPanel(row);
        panelOpen = true;
      }
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (panelOpen && !root.contains(e.target as Node)) {
        const existing = root.querySelector('.sc-panel');
        if (existing) existing.remove();
        panelOpen = false;
      }
    });

    row.appendChild(settingsBtn);
    row.appendChild(syncBtn);
    row.appendChild(copyBtn);
    root.appendChild(row);
    document.body.appendChild(root);
  }

  // ══════════════════════════════════════
  //  HOTKEY & INIT
  // ══════════════════════════════════════
  
  // Register Alt+C global hotkey
  registerHotkeys(performCopy);

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        createUI();
        if (syncMode === 'keywords') {
          fetchClientKeywords();
        }
        initObserver();
      });
    } else {
      createUI();
      if (syncMode === 'keywords') {
        fetchClientKeywords();
      }
      initObserver();
    }
  }

  init();

})();
