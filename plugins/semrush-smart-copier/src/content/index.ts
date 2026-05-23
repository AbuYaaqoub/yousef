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
  //  COLUMN SELECTOR PANEL
  // ══════════════════════════════════════
  let panelOpen = false;
  let columnConfig: ColumnConfig[] = [];
  let currentHeaders: string[] = [];

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

    const panel = document.createElement('div');
    panel.className = 'sc-panel';

    panel.innerHTML = `
      <div class="sc-panel-header">الأعمدة</div>
      <div class="sc-column-list" id="sc-col-list"></div>
    `;

    const list = panel.querySelector('#sc-col-list') as HTMLElement;

    if (!columnConfig.length) {
      list.innerHTML = `<div style="padding:12px;color:var(--sc-text-dim);font-size:12px;text-align:center">افتح صفحة جدول في SEMrush أولاً</div>`;
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
      document.addEventListener('DOMContentLoaded', createUI);
    } else {
      createUI();
    }
  }

  init();

})();
