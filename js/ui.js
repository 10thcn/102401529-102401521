/**
 * ui.js —— 共享 UI 工具层
 *
 * 各页面重复使用的渲染与交互封装：卡片 HTML、空状态、Toast、确认弹窗、
 * 剪贴板复制（带降级方案）等。所有用户输入渲染前都经过 escapeHTML，
 * 防止发布的内容里带 HTML 标签破坏页面或注入脚本。
 */

(function (global) {
  'use strict';

  var Store = global.Store;

  /** HTML 转义，用户输入渲染前必须调用 */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function typePill(item) {
    return item.type === 'lost'
      ? '<span class="pill pill-lost">寻物</span>'
      : '<span class="pill pill-found">招领</span>';
  }

  function statusPill(item) {
    return item.status === 'resolved'
      ? '<span class="pill pill-resolved">' + esc(Store.statusText(item)) + '</span>'
      : '<span class="pill pill-active">未解决</span>';
  }

  /** 列表卡片 HTML（首页 / 搜索 / 我的发布通用） */
  function cardHTML(item, extra) {
    var cls = 'card' + (item.status === 'resolved' ? ' resolved' : '');
    return '<div class="' + cls + '" data-id="' + esc(item.id) + '">' +
      '<div class="card-head">' +
        '<div class="card-name">' + esc(item.name) + '</div>' +
        typePill(item) + statusPill(item) +
      '</div>' +
      '<div class="card-cat">类别：' + esc(item.category) + '</div>' +
      '<div class="card-meta"><span class="loc">📍 ' + esc(item.location) + '</span> · ' +
        esc(Store.formatTime(item.time)) + '</div>' +
      (extra || '') +
    '</div>';
  }

  /** 渲染卡片列表；空数组时显示空状态 */
  function renderCards(el, items, emptyOpts) {
    if (!items || !items.length) {
      el.innerHTML = emptyHTML(emptyOpts);
      return;
    }
    el.innerHTML = items.map(function (it) { return cardHTML(it); }).join('');
  }

  /** 空状态占位 */
  function emptyHTML(opts) {
    opts = opts || {};
    var link = opts.link
      ? '<a class="empty-link" href="' + esc(opts.link) + '">' + esc(opts.linkText || '') + '</a>'
      : '';
    return '<div class="empty">' +
      '<div class="empty-ic">' + (opts.icon || '🔍') + '</div>' +
      '<div class="empty-txt">' + esc(opts.text || '暂无数据').replace(/\n/g, '<br>') + '</div>' +
      link + '</div>';
  }

  /** 轻提示弹窗：icon + 标题 + 说明 + 一个按钮 */
  function toast(opts) {
    var ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML =
      '<div class="toast">' +
        '<div class="toast-ic">' + (opts.icon || '✓') + '</div>' +
        '<div class="toast-title">' + esc(opts.title || '') + '</div>' +
        '<div class="toast-sub">' + esc(opts.sub || '') + '</div>' +
        '<button class="toast-btn">' + esc(opts.btnText || '确定') + '</button>' +
      '</div>';
    document.body.appendChild(ov);
    ov.querySelector('.toast-btn').addEventListener('click', function () {
      document.body.removeChild(ov);
      if (opts.onBtn) opts.onBtn();
    });
  }

  /**
   * 通用确认弹窗：标题 + 说明 + 可选自定义内容 + 取消/确认。
   * opts: { title, sub, bodyHTML, okText, cancelText, danger, onOk, onCancel }
   * 点击确认后自动关闭并回调 onOk。
   */
  function dialog(opts) {
    opts = opts || {};
    var ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML =
      '<div class="dialog">' +
        '<div class="dlg-title">' + esc(opts.title || '') + '</div>' +
        (opts.sub ? '<div class="dlg-sub">' + opts.sub + '</div>' : '') +
        (opts.bodyHTML || '') +
        '<div class="dlg-btns">' +
          '<div class="dlg-cancel">' + esc(opts.cancelText || '取消') + '</div>' +
          '<div class="dlg-ok' + (opts.danger ? ' danger' : '') + '">' + esc(opts.okText || '确定') + '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    function close() { document.body.removeChild(ov); }
    ov.querySelector('.dlg-cancel').addEventListener('click', function () {
      close();
      if (opts.onCancel) opts.onCancel();
    });
    ov.querySelector('.dlg-ok').addEventListener('click', function () {
      close();
      if (opts.onOk) opts.onOk();
    });
    return ov;
  }

  /**
   * 复制文本到剪贴板。
   * 优先使用 Clipboard API（file:// 在 Chrome 中属于安全上下文，可用）；
   * 失败时降级为隐藏 textarea + document.execCommand('copy') 的经典方案。
   */
  function copyText(text, done) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { done(true); },
        function () { fallback(); }
      );
    } else {
      fallback();
    }
  }

  var UI = {
    esc: esc,
    typePill: typePill,
    statusPill: statusPill,
    cardHTML: cardHTML,
    renderCards: renderCards,
    emptyHTML: emptyHTML,
    toast: toast,
    dialog: dialog,
    copyText: copyText
  };

  global.UI = UI;
})(typeof window !== 'undefined' ? window : globalThis);
