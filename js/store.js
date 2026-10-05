/**
 * store.js —— 校园失物招领数据层
 *
 * 职责：所有与"数据"有关的逻辑都收敛在这里，页面只负责展示与交互。
 *  - 浏览器环境：用 localStorage 持久化（键名带项目命名空间，见下方说明）
 *  - Node 环境（单元测试）：module.exports 导出，存储实现可注入内存模拟
 *
 * 设计说明：Chrome 打开本地 file:// 页面时，所有 file:// 页面共享同一个
 * origin，localStorage 是共用的。为了避免与其它项目的数据互相串扰，
 * 键名带上了本项目的命名空间前缀 lf_102401529_。
 */
(function (global) {
  'use strict';

  var KEY_ITEMS = 'lf_102401529_items'; // 所有失物招领信息
  var KEY_MYIDS = 'lf_102401529_myids'; // 本机发布过的信息 id（用于识别"发布者"）

  /** 物品类别（与原型下拉选项一致） */
  var CATEGORIES = ['校园卡', '钥匙', '电子产品', '书籍', '衣物', '其他'];
  /** 地点（与原型下拉选项一致） */
  var LOCATIONS = ['教学楼', '宿舍区', '食堂', '图书馆', '运动场', '其他'];

  /* ---------------- 存储抽象 ---------------- */

  /** 创建一个内存存储实现（浏览器无 localStorage 时兜底；单元测试注入用） */
  function createMemoryStorage() {
    var m = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; }
    };
  }

  var storage = null;
  function getStorage() {
    if (storage) return storage;
    try {
      /* 个别隐私模式/受限环境下访问 localStorage 会抛 SecurityError，
         此时降级为内存存储：功能可用，只是刷新后数据不保留 */
      if (typeof localStorage !== 'undefined') {
        localStorage.getItem('__probe');
        storage = localStorage;
      }
    } catch (e) { /* 落入下方内存兜底 */ }
    if (!storage) storage = createMemoryStorage();
    return storage;
  }
  /** 测试钩子：注入自定义存储实现 */
  function _setStorage(impl) { storage = impl; }

  function loadItems() {
    var raw = getStorage().getItem(KEY_ITEMS);
    if (!raw) return [];
    try {
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return []; // 数据损坏时当作空数据，不阻塞页面
    }
  }
  function saveItems(items) {
    getStorage().setItem(KEY_ITEMS, JSON.stringify(items));
  }
  function loadMyIds() {
    var raw = getStorage().getItem(KEY_MYIDS);
    if (!raw) return [];
    try {
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }
  function saveMyIds(ids) {
    getStorage().setItem(KEY_MYIDS, JSON.stringify(ids));
  }

  /* ---------------- 工具函数 ---------------- */

  /** Date 转 "YYYY-MM-DDTHH:mm"（datetime-local 输入框格式，按本地时区） */
  function toLocalInput(d) {
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /**
   * 相对时间显示：今天 HH:mm / 昨天 HH:mm / N天前 / YYYY-MM-DD
   * 按日期部分比较（避免时区、夏令时带来的误差）
   */
  function formatTime(iso, now) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso || '';
    var base = now ? new Date(now) : new Date();
    function dayStart(x) {
      return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    }
    var diffDays = Math.round((dayStart(base) - dayStart(d)) / 86400000);
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    var hm = p(d.getHours()) + ':' + p(d.getMinutes());
    if (diffDays <= 0) return '今天 ' + hm;
    if (diffDays === 1) return '昨天 ' + hm;
    if (diffDays < 7) return diffDays + '天前';
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /** 状态文案：寻物解决=已找到，招领解决=已归还（核心状态机对外表现） */
  function statusText(item) {
    if (item.status === 'resolved') {
      return item.type === 'lost' ? '已找到' : '已归还';
    }
    return '未解决';
  }

  /* ---------------- 示例数据（seed） ---------------- */

  /**
   * 构建示例数据。时间全部按 now 往前推偏移量，保证首次打开时
   * 相对时间显示（今天/昨天/N天前）自然、多样，方便评分演示。
   */
  function buildSeed(now) {
    var H = 3600000, D = 24 * H;
    function ago(ms) { return toLocalInput(new Date(now - ms)); }
    return [
      {
        id: 'seed001', type: 'lost', name: '校园卡', category: '校园卡',
        location: '图书馆', time: ago(2 * H), desc: '卡面贴有蓝色贴纸，姓名李某，捡到请联系我，万分感谢！',
        contact: '微信 abc123', status: 'active', createdAt: new Date(now - 2 * H).toISOString(), resolvedAt: null
      },
      {
        id: 'seed002', type: 'found', name: '钥匙', category: '钥匙',
        location: '食堂', time: ago(5 * H), desc: '两把黄铜色钥匙加一个蓝色门禁扣，挂着灰色小挂绳。',
        contact: 'QQ 123456789', status: 'active', createdAt: new Date(now - 5 * H).toISOString(), resolvedAt: null
      },
      {
        id: 'seed003', type: 'lost', name: '蓝牙耳机', category: '电子产品',
        location: '运动场', time: ago(3 * D), desc: '白色入耳式蓝牙耳机，充电盒背面有一道浅划痕。已找回，感谢好心同学！',
        contact: '手机号 138****8888', status: 'resolved', createdAt: new Date(now - 3 * D).toISOString(),
        resolvedAt: new Date(now - 2 * D).toISOString()
      },
      {
        id: 'seed004', type: 'found', name: '雨伞', category: '其他',
        location: '教学楼', time: ago(26 * H), desc: '深蓝色折叠伞，在教三 201 教室捡到的。',
        contact: '微信 13512345678', status: 'active', createdAt: new Date(now - 26 * H).toISOString(), resolvedAt: null
      },
      {
        id: 'seed005', type: 'lost', name: '高等数学教材', category: '书籍',
        location: '图书馆', time: ago(2 * D), desc: '同济版高数上册，封面写有班级和姓名，扉页有笔记。',
        contact: 'QQ 987654321', status: 'active', createdAt: new Date(now - 2 * D).toISOString(), resolvedAt: null
      },
      {
        id: 'seed006', type: 'found', name: '水杯', category: '其他',
        location: '图书馆', time: ago(30 * H), desc: '白色保温杯，杯身贴有卡通贴纸，在图书馆三楼自习区拾到。',
        contact: '手机号 159****0000', status: 'active', createdAt: new Date(now - 30 * H).toISOString(), resolvedAt: null
      },
      {
        id: 'seed007', type: 'found', name: '眼镜', category: '其他',
        location: '食堂', time: ago(5 * D), desc: '黑框近视眼镜，装在一个深色眼镜盒里。已归还失主。',
        contact: '微信 lucky777', status: 'resolved', createdAt: new Date(now - 5 * D).toISOString(),
        resolvedAt: new Date(now - 4 * D).toISOString()
      },
      {
        id: 'seed008', type: 'lost', name: '充电宝', category: '电子产品',
        location: '宿舍区', time: ago(3 * D), desc: '白色 10000mAh 充电宝，带一根短的白色数据线。',
        contact: '微信 13000001111', status: 'active', createdAt: new Date(now - 3 * D).toISOString(), resolvedAt: null
      }
    ];
  }

  /** 首次使用时写入示例数据；已存在数据则不做任何事（幂等） */
  function ensureSeed(now) {
    if (getStorage().getItem(KEY_ITEMS) === null) {
      saveItems(buildSeed(now || Date.now()));
    }
  }

  /* ---------------- 增删改查 ---------------- */

  /** 读取全部信息（不排序，排序交给 sortItems） */
  function getAll() {
    return loadItems();
  }

  function getById(id) {
    var list = loadItems();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  /**
   * 新增一条信息。发布页在调用前已用 validateItem 校验通过。
   * 返回创建好的完整对象；本机发布的 id 记入 myids，用于识别"发布者"。
   */
  function addItem(data, now) {
    var t = now || Date.now();
    var item = {
      id: 'L' + t.toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      type: data.type,
      name: String(data.name).trim(),
      category: data.category,
      location: data.location,
      time: data.time,
      desc: String(data.desc || '').trim(),
      contact: String(data.contact).trim(),
      status: 'active',
      createdAt: new Date(t).toISOString(),
      resolvedAt: null
    };
    var items = loadItems();
    items.push(item);
    saveItems(items);
    var myIds = loadMyIds();
    myIds.push(item.id);
    saveMyIds(myIds);
    return item;
  }

  /**
   * 更新状态：'active'（未解决）<-> 'resolved'（已找到/已归还），可双向切换。
   * 标记解决时记录 resolvedAt，改回未解决时清空。返回更新后的条目，找不到返回 null。
   */
  function updateStatus(id, status, now) {
    if (status !== 'active' && status !== 'resolved') return null;
    var items = loadItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        items[i].status = status;
        items[i].resolvedAt = status === 'resolved'
          ? new Date(now || Date.now()).toISOString()
          : null;
        saveItems(items);
        return items[i];
      }
    }
    return null;
  }

  /** 删除信息（同时从"我的发布"记录中移除） */
  function deleteItem(id) {
    var items = loadItems();
    var next = items.filter(function (it) { return it.id !== id; });
    saveItems(next);
    saveMyIds(loadMyIds().filter(function (x) { return x !== id; }));
    return next.length < items.length; // 返回是否真的删掉了
  }

  /* ---------------- 搜索 / 筛选 ---------------- */

  /**
   * 组合搜索：关键词（匹配名称+描述，大小写不敏感）+ 类型/类别/地点/状态筛选。
   * 各条件均可省略；条件之间是"与"的关系。
   */
  function searchItems(opts) {
    opts = opts || {};
    var kw = String(opts.keyword || '').trim().toLowerCase();
    var items = loadItems();
    return items.filter(function (it) {
      if (kw) {
        var name = String(it.name || '').toLowerCase();
        var desc = String(it.desc || '').toLowerCase();
        if (name.indexOf(kw) === -1 && desc.indexOf(kw) === -1) return false;
      }
      if (opts.type && it.type !== opts.type) return false;
      if (opts.category && it.category !== opts.category) return false;
      if (opts.location && it.location !== opts.location) return false;
      if (opts.status && it.status !== opts.status) return false;
      return true;
    });
  }

  /**
   * 发布前的"相似信息提醒"：同类型、未解决、名称互相包含（至少 2 个字）
   * 的已有条目。防止同一条失物被重复发布。
   */
  function findSimilar(form) {
    var name = String(form.name || '').trim();
    if (name.length < 2) return [];
    return loadItems().filter(function (it) {
      if (it.type !== form.type || it.status !== 'active') return false;
      var other = String(it.name || '').trim();
      return other.length >= 2 && (other.indexOf(name) !== -1 || name.indexOf(other) !== -1);
    });
  }

  /* ---------------- 表单校验 ---------------- */

  /**
   * 发布表单校验。返回 { errors: {字段: 错误信息} }，errors 为空对象表示全部通过。
   * 规则：
   *  - 名称：必填，不超过 20 字
   *  - 类别/地点：必选（必须为合法选项）
   *  - 时间：必填、可解析、不得晚于当前时刻
   *  - 联系方式：必填，不超过 50 字
   *  - 描述：选填，不超过 200 字
   */
  function validateItem(form, now) {
    var errors = {};
    var name = String(form.name || '').trim();
    if (!name) errors.name = '请填写物品名称';
    else if (name.length > 20) errors.name = '物品名称不能超过 20 个字';

    if (CATEGORIES.indexOf(form.category) === -1) errors.category = '请选择物品类别';
    if (LOCATIONS.indexOf(form.location) === -1) errors.location = '请选择地点';

    var timeStr = String(form.time || '').trim();
    if (!timeStr) {
      errors.time = '请选择时间';
    } else {
      var t = new Date(timeStr).getTime();
      if (isNaN(t)) errors.time = '时间格式不正确';
      else if (t > (now || Date.now())) errors.time = '时间不能晚于当前时刻';
    }

    var contact = String(form.contact || '').trim();
    if (!contact) errors.contact = '请填写联系方式';
    else if (contact.length > 50) errors.contact = '联系方式不能超过 50 个字';

    var desc = String(form.desc || '').trim();
    if (desc.length > 200) errors.desc = '描述不能超过 200 个字';

    return { errors: errors };
  }

  /* ---------------- 我的发布 / 统计 / 排序 ---------------- */

  function isMine(id) {
    return loadMyIds().indexOf(id) !== -1;
  }

  function getMyItems() {
    var myIds = loadMyIds();
    return loadItems().filter(function (it) { return myIds.indexOf(it.id) !== -1; });
  }

  /** 统计：总条数 / 未解决 / 已解决 / 解决率（百分比，取整） */
  function getStats() {
    var items = loadItems();
    var resolved = items.filter(function (it) { return it.status === 'resolved'; }).length;
    var total = items.length;
    return {
      total: total,
      active: total - resolved,
      resolved: resolved,
      rate: total ? Math.round(resolved * 100 / total) : 0
    };
  }

  /**
   * 列表排序：未解决在前（按发布时间倒序），已解决置底（按解决时间倒序），
   * 让需要帮助的信息优先被看到，已解决的不再打扰用户。
   */
  function sortItems(list) {
    var copy = list.slice();
    copy.sort(function (a, b) {
      var ra = a.status === 'resolved' ? 1 : 0;
      var rb = b.status === 'resolved' ? 1 : 0;
      if (ra !== rb) return ra - rb;
      var ta = ra ? (a.resolvedAt || '') : (a.createdAt || '');
      var tb = rb ? (b.resolvedAt || '') : (b.createdAt || '');
      return ta < tb ? 1 : (ta > tb ? -1 : 0);
    });
    return copy;
  }

  /* ---------------- 导出 ---------------- */

  var Store = {
    CATEGORIES: CATEGORIES,
    LOCATIONS: LOCATIONS,
    createMemoryStorage: createMemoryStorage,
    _setStorage: _setStorage,
    buildSeed: buildSeed,
    ensureSeed: ensureSeed,
    getAll: getAll,
    getById: getById,
    addItem: addItem,
    updateStatus: updateStatus,
    deleteItem: deleteItem,
    searchItems: searchItems,
    findSimilar: findSimilar,
    validateItem: validateItem,
    isMine: isMine,
    getMyItems: getMyItems,
    getStats: getStats,
    sortItems: sortItems,
    formatTime: formatTime,
    statusText: statusText,
    toLocalInput: toLocalInput
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Store; // Node（单元测试）
  }
  global.Store = Store; // 浏览器
})(typeof window !== 'undefined' ? window : globalThis);
