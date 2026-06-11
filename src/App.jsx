import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Copy,
  Cpu,
  Database,
  Eye,
  EyeOff,
  Globe2,
  History,
  KeyRound,
  Layers,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Zap
} from "lucide-react";
import { categories, defaultProducts } from "./data/catalog";

const PRODUCTS_KEY = "ai-transfer-products-v5";
const HISTORY_KEY = "ai-transfer-update-history-v1";
const TELEGRAM_KEY = "ai-transfer-telegram-v1";
const ADMIN_SESSION_KEY = "ai-transfer-admin-session-v1";
const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || "admin";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "aitransfer2026";
const DEFAULT_TELEGRAM_USERNAME = "ailorenzo";
const LEGACY_TELEGRAM_USERNAMES = ["AITransfer", "sanndpas", "legionxyz"];
const DEFAULT_TELEGRAM_MESSAGE = "你好，我想咨询 AI 资源报价。";
const COMMUNITY_URL = "https://t.me/+Jcxwvnyg6ecwNTlk";

const today = () => new Date().toISOString().slice(0, 10);

function isAdminHost() {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname.toLowerCase();
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocal) return window.location.pathname.replace(/\/+$/, "").endsWith("/admin");
  return hostname.startsWith("admin.") || hostname.startsWith("admin-");
}

function getPathView() {
  if (typeof window === "undefined") return "home";
  return isAdminHost() ? "admin" : "home";
}

function readStorage(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function categoryById(id) {
  return categories.find((category) => category.id === id);
}

function getPublicPrice(product) {
  if (!product) return "请选择产品";
  return product.showPrice ? product.publicPrice : "需咨询确认";
}

function buildTelegramText({ category, products, demand }) {
  const selectedProducts = products.length ? products : [];
  const productText = selectedProducts.length
    ? selectedProducts.map((product) => product.name).join(" / ")
    : "未选择";
  const priceText = selectedProducts.length
    ? selectedProducts.map((product) => `${product.name}：${getPublicPrice(product)}`).join("；")
    : "未选择";

  return [
    "你好，我想咨询 AI 资源报价。",
    "",
    `分类：${category?.label ?? "未选择"}`,
    `产品：${productText}`,
    `预计用量：${demand.usage || "未填写"}`,
    `使用场景：${demand.scenario || "未填写"}`,
    `公司签约：${demand.contract || "不确定"}`,
    `官方账号需求：${demand.officialAccount || "不确定"}`,
    `海外权限：${demand.overseas || "不确定"}`,
    `参考价格：${priceText}`,
    `其他说明：${demand.notes || "无"}`,
    "",
    "请帮我确认具体报价和开通方式。"
  ].join("\n");
}

function normalizeTelegramUsername(value) {
  return value
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/t\.me\//, "")
    .replace(/[/?#].*$/, "");
}

function buildTelegramHref(text, username) {
  const target = normalizeTelegramUsername(username);

  if (target) return `https://t.me/${target}?text=${encodeURIComponent(text)}`;

  return `https://t.me/share/url?url=${encodeURIComponent("https://aitransfer.cyou")}&text=${encodeURIComponent(text)}`;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back for browsers or embedded views that block Clipboard API writes.
    }
  }

  const editor = document.querySelector(".telegram-editor");
  if (editor) {
    editor.focus();
    editor.select();
    editor.setSelectionRange(0, editor.value.length);

    try {
      if (document.execCommand("copy")) return true;
    } catch {
      // Try the detached textarea fallback below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    const copied = document.execCommand("copy");
    if (!copied && editor) {
      editor.focus();
      editor.select();
      editor.setSelectionRange(0, editor.value.length);
    }
    return copied;
  } finally {
    document.body.removeChild(textarea);
  }
}

function App() {
  const [activeView, setActiveViewState] = useState(getPathView);
  const [products, setProducts] = useState(() => readStorage(PRODUCTS_KEY, defaultProducts));
  const [history, setHistory] = useState(() => readStorage(HISTORY_KEY, []));
  const [telegram, setTelegram] = useState(() => {
    const stored = readStorage(TELEGRAM_KEY, { username: DEFAULT_TELEGRAM_USERNAME });
    const username = LEGACY_TELEGRAM_USERNAMES.includes(stored.username) ? DEFAULT_TELEGRAM_USERNAME : stored.username;
    return { username: username || DEFAULT_TELEGRAM_USERNAME };
  });
  const [adminAuthed, setAdminAuthed] = useState(() => window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "ok");
  const [designVersion, setDesignVersion] = useState("premium");
  const [selectedCategory, setSelectedCategory] = useState("pool");
  const [selectedProductIds, setSelectedProductIds] = useState(["pool-claude-opus-4-7"]);
  const [demand, setDemand] = useState({
    usage: "",
    scenario: "",
    contract: "不确定",
    officialAccount: "不确定",
    overseas: "不确定",
    notes: ""
  });
  const [telegramText, setTelegramText] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => writeStorage(PRODUCTS_KEY, products), [products]);
  useEffect(() => writeStorage(HISTORY_KEY, history), [history]);
  useEffect(() => writeStorage(TELEGRAM_KEY, telegram), [telegram]);

  useEffect(() => {
    const handlePopState = () => setActiveViewState(getPathView());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const listedProducts = useMemo(() => products.filter((product) => product.isListed), [products]);
  const category = categoryById(selectedCategory);
  const selectedProducts = useMemo(
    () =>
      selectedProductIds
        .map((productId) => products.find((item) => item.id === productId))
        .filter(Boolean),
    [products, selectedProductIds]
  );
  const generatedTelegramText = useMemo(
    () => buildTelegramText({ category, products: selectedProducts, demand }),
    [category, selectedProducts, demand]
  );
  const telegramHref = buildTelegramHref(telegramText || generatedTelegramText, telegram.username);
  const homeTelegramHref = buildTelegramHref(DEFAULT_TELEGRAM_MESSAGE, telegram.username);

  useEffect(() => {
    setTelegramText(generatedTelegramText);
    setCopied(false);
    setCopyFailed(false);
  }, [generatedTelegramText]);

  function setActiveView(view) {
    if (isAdminHost()) {
      setActiveViewState("admin");
      return;
    }

    setActiveViewState(view);

    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
  }

  function selectCategory(categoryId, productId) {
    const nextProduct = productId
      ? listedProducts.find((item) => item.id === productId)
      : listedProducts.find((item) => item.category === categoryId);
    setSelectedCategory(categoryId);
    setSelectedProductIds(nextProduct ? [nextProduct.id] : []);
    setActiveView("quote");
  }

  function updateProduct(productId, patch) {
    const current = products.find((item) => item.id === productId);
    const entries = Object.entries(patch).filter(([key, value]) => current?.[key] !== value);
    if (entries.length === 0) return;

    setProducts((items) =>
      items.map((item) =>
        item.id === productId
          ? {
              ...item,
              ...patch,
              updatedAt: today()
            }
          : item
      )
    );

    const records = entries.map(([field, nextValue]) => ({
      id: `${Date.now()}-${productId}-${field}`,
      timestamp: new Date().toLocaleString("zh-CN", { hour12: false }),
      product: current?.name ?? productId,
      field,
      before: String(current?.[field] ?? ""),
      after: String(nextValue ?? ""),
      publicImpact: ["isListed", "showPrice", "publicPrice", "customerDescription"].includes(field),
      actor: "Admin / Codex"
    }));
    setHistory((items) => [...records, ...items].slice(0, 80));
  }

  function resetDemoData() {
    setProducts(defaultProducts);
    setHistory([
      {
        id: `${Date.now()}-reset`,
        timestamp: new Date().toLocaleString("zh-CN", { hour12: false }),
        product: "全部产品",
        field: "reset",
        before: "当前配置",
        after: "默认报价配置",
        publicImpact: true,
        actor: "Admin / Codex"
      },
      ...history
    ]);
  }

  async function copyTelegramText() {
    const ok = await copyTextToClipboard(telegramText);
    setCopied(ok);
    setCopyFailed(!ok);
    window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 1600);
  }

  function handleAdminLogin(username, password) {
    if (username.trim() === ADMIN_USER && password === ADMIN_PASSWORD) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, "ok");
      setAdminAuthed(true);
      return true;
    }
    return false;
  }

  function handleAdminLogout() {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminAuthed(false);
  }

  return (
    <div className="app-shell">
      <Header
        activeView={activeView}
        designVersion={designVersion}
        setActiveView={setActiveView}
        setDesignVersion={setDesignVersion}
      />
      <main>
        {activeView === "home" && (
          <Home
            designVersion={designVersion}
            products={listedProducts}
            telegramHref={homeTelegramHref}
            setDesignVersion={setDesignVersion}
            onQuote={selectCategory}
            setActiveView={setActiveView}
          />
        )}
        {activeView === "quote" && (
          <QuoteFinder
            categories={categories}
            products={listedProducts}
            selectedCategory={selectedCategory}
            selectedProductIds={selectedProductIds}
            demand={demand}
            telegramHref={telegramHref}
            telegramText={telegramText}
            generatedTelegramText={generatedTelegramText}
            copied={copied}
            copyFailed={copyFailed}
            setDemand={setDemand}
            setTelegramText={setTelegramText}
            setSelectedCategory={selectCategory}
            setSelectedProductIds={setSelectedProductIds}
            copyTelegramText={copyTelegramText}
          />
        )}
        {activeView === "admin" && (
          adminAuthed ? (
            <Admin
              products={products}
              history={history}
              telegram={telegram}
              updateProduct={updateProduct}
              setTelegram={setTelegram}
              resetDemoData={resetDemoData}
              onLogout={handleAdminLogout}
            />
          ) : (
            <AdminLogin onLogin={handleAdminLogin} />
          )
        )}
      </main>
    </div>
  );
}

function Header({ activeView, designVersion, setActiveView, setDesignVersion }) {
  const navItems = [
    ["home", "首页"],
    ["quote", "寻找报价"]
  ];
  const adminMode = activeView === "admin";

  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => setActiveView("home")}>
        <span className="brand-mark">AT</span>
        <span>
          <strong>AI Transfer</strong>
          <small>Quote Platform</small>
        </span>
      </button>
      {adminMode ? (
        <div className="admin-domain-badge">
          <LockKeyhole size={16} />
          后台域名访问
        </div>
      ) : (
      <nav aria-label="主导航">
        <div className="version-switch" aria-label="版本切换">
          <button
            className={designVersion === "premium" ? "version-chip active" : "version-chip"}
            type="button"
            onClick={() => {
              setDesignVersion("premium");
              setActiveView("home");
            }}
          >
            高端经纪版
          </button>
          <button
            className={designVersion === "market" ? "version-chip active" : "version-chip"}
            type="button"
            onClick={() => {
              setDesignVersion("market");
              setActiveView("home");
            }}
          >
            市场仪表盘版
          </button>
        </div>
        {navItems.map(([id, label]) => (
          <button
            className={activeView === id ? "nav-link active" : "nav-link"}
            type="button"
            key={id}
            onClick={() => setActiveView(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      )}
    </header>
  );
}

function Home({ designVersion, products, telegramHref, setDesignVersion, onQuote, setActiveView }) {
  const [wechatProduct, setWechatProduct] = useState(null);

  function handleConsult(categoryId, productId) {
    const product = products.find((item) => item.id === productId);

    if (product?.category === "accounts") {
      setWechatProduct(product);
      return;
    }

    onQuote(categoryId, productId);
  }

  return designVersion === "market" ? (
    <>
      <MarketDashboardHome products={products} telegramHref={telegramHref} setDesignVersion={setDesignVersion} onQuote={handleConsult} setActiveView={setActiveView} />
      {wechatProduct && <WechatConsultModal product={wechatProduct} onClose={() => setWechatProduct(null)} />}
    </>
  ) : (
    <>
      <PremiumBrokerHome products={products} telegramHref={telegramHref} setDesignVersion={setDesignVersion} onQuote={handleConsult} setActiveView={setActiveView} />
      {wechatProduct && <WechatConsultModal product={wechatProduct} onClose={() => setWechatProduct(null)} />}
    </>
  );
}

function WechatConsultModal({ product, onClose }) {
  useEffect(() => {
    function handleKeydown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onClose]);

  return (
    <div className="wechat-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="wechat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wechat-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="wechat-modal-close" type="button" onClick={onClose} aria-label="关闭微信弹窗">
          ×
        </button>
        <div className="wechat-modal-copy">
          <span>添加微信咨询</span>
          <h2 id="wechat-modal-title">{product.name}</h2>
          <p>扫码添加微信，发送商品名称即可确认库存、开通方式和售后说明。</p>
          <strong>{getPublicPrice(product)}</strong>
        </div>
        <div className="wechat-qr-frame">
          <img src="/wechat-qr.png" alt="微信二维码" />
        </div>
      </section>
    </div>
  );
}

function PremiumBrokerHome({ products, telegramHref, setDesignVersion, onQuote, setActiveView }) {
  const [activeBusiness, setActiveBusiness] = useState("pool");
  const [activeSubCategory, setActiveSubCategory] = useState("claude-code-pool");
  const [catalogSearch, setCatalogSearch] = useState("");
  const activeCategory = categoryById(activeBusiness);
  const activeProducts = products.filter((product) => product.category === activeBusiness);
  const catalogRows = [
    { id: "pool", icon: Building2, badge: "稳定号池" },
    { id: "enterprise", icon: Globe2, badge: "企业级方案" },
    { id: "video", icon: Layers, badge: "视频生成" },
    { id: "domestic", icon: Cpu, badge: "国产模型" },
    { id: "accounts", icon: KeyRound, badge: "账号开护" }
  ];
  const activeCatalogRow = catalogRows.find((item) => item.id === activeBusiness) ?? catalogRows[0];
  const ActiveIcon = activeCatalogRow.icon;
  const subCategories = Array.from(
    activeProducts.reduce((items, product) => {
      const key = product.subCategory || "default";
      if (!items.has(key)) {
        items.set(key, product.subCategoryLabel || product.subCategory || activeCategory?.label);
      }
      return items;
    }, new Map())
  ).map(([id, label]) => ({ id, label }));
  const scopedProducts = activeSubCategory
    ? activeProducts.filter((product) => (product.subCategory || "default") === activeSubCategory)
    : activeProducts;
  const searchTerm = catalogSearch.trim().toLowerCase();
  const visibleCatalogProducts = searchTerm
    ? scopedProducts.filter((product) =>
        [product.name, product.publicPrice, product.customerDescription, product.minimumRequirement]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm)
      )
    : scopedProducts;
  const activeProduct = visibleCatalogProducts[0] ?? scopedProducts[0] ?? activeProducts[0];
  const firstSubCategory = activeProducts[0]?.subCategory || "default";

  useEffect(() => {
    setActiveSubCategory(firstSubCategory);
  }, [activeBusiness, firstSubCategory]);

  return (
    <div className="home-surface premium-surface">
      <section className="premium-hero">
        <div className="premium-copy">
          <div className="eyebrow gold">
            <Sparkles size={16} />
            企业级 AI 资源撮合与报价服务
          </div>
          <h1>
            值得信赖的
            <span>AI 资源撮合与报价台</span>
          </h1>
          <p>为企业与开发者匹配优质 AI 资源和最佳方案，提供透明、专业、高效的一站式报价服务。</p>
          <div className="hero-actions">
            <button className="gold-button" type="button" onClick={() => setActiveView("quote")}>
              寻找报价
              <ArrowRight size={18} />
            </button>
            <a className="dark-outline-button" href={telegramHref} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              Telegram 咨询
            </a>
            <a className="dark-outline-button" href={COMMUNITY_URL} target="_blank" rel="noreferrer">
              <Users size={18} />
              加入社群
            </a>
          </div>
          <div className="premium-stats">
            <div><ShieldCheck size={20} /><strong>99.9%</strong><span>服务可用性</span></div>
            <div><Building2 size={20} /><strong>2000+</strong><span>企业客户</span></div>
            <div><Globe2 size={20} /><strong>50+</strong><span>地区覆盖</span></div>
            <div><Zap size={20} /><strong>10min</strong><span>极速响应</span></div>
          </div>
        </div>

        <div className="premium-quote-card">
          <div className="quote-card-head">
            <strong>报价流程预览</strong>
            <span>只需 3 步</span>
          </div>
          <div className="premium-steps">
            {["选择分类", "填写需求", "生成 Telegram 文案"].map((item, index) => (
              <div className="premium-step" key={item}>
                <span>{index + 1}</span>
                <div>
                  <strong>{item}</strong>
                  <p>{index === 0 ? "选择您需要的 AI 资源类型" : index === 1 ? "告诉我们使用场景与需求" : "一键生成需求文案发送给我们"}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="premium-summary">
            <span>{activeCategory?.label}</span>
            <strong>{activeProduct?.name ?? "请选择业务"}</strong>
            <p>{activeProduct?.customerDescription ?? activeCategory?.description}</p>
            <div className="price-strip">
              <small>价格参考区间</small>
              <b>{getPublicPrice(activeProduct)}</b>
            </div>
          </div>
          <button className="gold-button full" type="button" onClick={() => onQuote(activeBusiness, activeProduct?.id)}>
            <MessageCircle size={18} />
            咨询该业务价格
          </button>
        </div>
      </section>

      <section className="premium-resources">
        <aside className="catalog-sidebar">
          <div className="catalog-title">
            <span>类别</span>
            <h2>商品分类</h2>
          </div>
          <div className="catalog-category-list">
            {categories.map((categoryItem) => {
              const meta = catalogRows.find((item) => item.id === categoryItem.id) ?? catalogRows[0];
              const Icon = meta.icon;
              const count = products.filter((product) => product.category === categoryItem.id).length;

              return (
                <button
                  className={activeBusiness === categoryItem.id ? "catalog-category active" : "catalog-category"}
                  type="button"
                  key={categoryItem.id}
                  onClick={() => {
                    setActiveBusiness(categoryItem.id);
                    setCatalogSearch("");
                  }}
                >
                  <span className="catalog-category-icon"><Icon size={19} /></span>
                  <strong>{categoryItem.label}</strong>
                  <em>{count}</em>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="catalog-content">
          <div className="catalog-content-head">
            <div>
              <span>目录</span>
              <h2>{activeCategory?.label}</h2>
              <p>{activeCategory?.summary}</p>
              {subCategories.length > 1 && (
                <div className="catalog-subcategory-list" aria-label={`${activeCategory?.label}子分类`}>
                  {subCategories.map((item) => (
                    <button
                      className={activeSubCategory === item.id ? "catalog-subcategory active" : "catalog-subcategory"}
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setActiveSubCategory(item.id);
                        setCatalogSearch("");
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="catalog-search">
              <Search size={20} />
              <input
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="搜索资源关键词"
                aria-label="搜索资源关键词"
              />
            </div>
          </div>

          <div className="catalog-table">
            <div className="catalog-table-head">
              <span>产品 / 服务</span>
              <span>参考价格</span>
              <span>操作</span>
            </div>
            {visibleCatalogProducts.map((product) => (
              <article className="catalog-row" key={product.id}>
                <span className="catalog-product-icon"><ActiveIcon size={22} /></span>
                <div className="catalog-product-main">
                  <strong>{product.name}</strong>
                  <p>{product.customerDescription}</p>
                  <div className="catalog-tags">
                    <span>{activeCatalogRow.badge}</span>
                    <span>{product.minimumRequirement}</span>
                  </div>
                </div>
                <b>{getPublicPrice(product)}</b>
                <button type="button" onClick={() => onQuote(activeBusiness, product.id)}>
                  咨询
                </button>
              </article>
            ))}
            {visibleCatalogProducts.length === 0 && (
              <div className="catalog-empty">
                没有匹配的资源
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="premium-footer-band">
        <div><ShieldCheck size={30} /><strong>资源真实</strong><span>官方来源，品质保障</span></div>
        <div><LockKeyhole size={30} /><strong>隐私保护</strong><span>严格保密，安全第一</span></div>
        <div><MessageCircle size={30} /><strong>专属支持</strong><span>一对一服务，快速响应</span></div>
        <div><RefreshCw size={30} /><strong>持续稳定</strong><span>长期维护，稳定供应</span></div>
        <button className="version-link" type="button" onClick={() => setDesignVersion("market")}>
          查看市场仪表盘版
        </button>
      </section>
    </div>
  );
}

function MarketDashboardHome({ products, telegramHref, setDesignVersion, onQuote, setActiveView }) {
  const [activeBusiness, setActiveBusiness] = useState("pool");
  const activeProducts = products.filter((product) => product.category === activeBusiness);
  const [activeProductId, setActiveProductId] = useState(activeProducts[0]?.id ?? "pool-claude-opus-4-7");
  const activeProduct = products.find((product) => product.id === activeProductId) ?? activeProducts[0];

  useEffect(() => {
    const nextProduct = products.find((product) => product.category === activeBusiness);
    if (nextProduct) setActiveProductId(nextProduct.id);
  }, [activeBusiness, products]);

  return (
    <div className="home-surface market-surface">
      <section className="market-hero">
        <div className="market-copy">
          <div className="market-status">
            <span><i />价格每日更新 · 06-07 10:30</span>
          </div>
          <h1>
            企业级 AI 资源 · <span>快速询价平台</span>
          </h1>
          <p>号池 / 企业级 / 视频生成 / 国内模型 / 账号服务，覆盖全球优质资源。</p>
          <div className="hero-actions">
            <button className="neon-button" type="button" onClick={() => setActiveView("quote")}>
              <Zap size={18} />
              寻找报价
            </button>
            <a className="blue-outline-button" href={telegramHref} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              Telegram 咨询
            </a>
            <a className="blue-outline-button" href={COMMUNITY_URL} target="_blank" rel="noreferrer">
              <Users size={18} />
              加入社群
            </a>
          </div>
          <div className="market-badges">
            <span><Database size={16} />100+ 优质资源</span>
            <span><Eye size={16} />价格透明</span>
            <span><MessageCircle size={16} />需求直达 Telegram</span>
          </div>
        </div>
        <div className="market-orbit">
          <div className="orbit-core">AI</div>
          <span>报价</span>
          <span>号池</span>
          <span>Key</span>
          <span>线路</span>
        </div>
      </section>

      <section className="market-main">
        <div className="market-board">
          <div className="market-tabs">
            {categories.map((categoryItem) => (
              <button
                className={activeBusiness === categoryItem.id ? "active" : ""}
                type="button"
                key={categoryItem.id}
                onClick={() => setActiveBusiness(categoryItem.id)}
              >
                {categoryItem.label}
                <b>{products.filter((product) => product.category === categoryItem.id).length}</b>
              </button>
            ))}
          </div>
          <div className="board-toolbar">
            <strong>资源市场</strong>
            <span>实时参考区间 · 价格每日更新</span>
          </div>
          <div className="market-table">
            <div className="market-table-head">
              <span>产品 / 服务</span>
              <span>简介</span>
              <span>参考价格</span>
              <span>操作</span>
            </div>
            {activeProducts.map((product) => (
              <div
                className={activeProduct?.id === product.id ? "market-table-row active" : "market-table-row"}
                key={product.id}
                onClick={() => setActiveProductId(product.id)}
              >
                <strong>{product.name}</strong>
                <span>{product.customerDescription}</span>
                <b>{getPublicPrice(product)}</b>
                <button type="button" onClick={(event) => {
                  event.stopPropagation();
                  onQuote(product.category, product.id);
                }}>咨询</button>
              </div>
            ))}
          </div>
        </div>

        <aside className="market-builder">
          <h2>快速报价流程</h2>
          <div className="builder-steps">
            <span className="active">1 选择分类</span>
            <span>2 填写需求</span>
            <span>3 生成 Telegram 文案</span>
          </div>
          <div className="builder-preview">
            <small>已选择</small>
            <strong>{categoryById(activeBusiness)?.label} 〉 {activeProduct?.name}</strong>
            <button type="button" onClick={() => onQuote(activeBusiness, activeProduct?.id)}>进入报价选项</button>
          </div>
          <label>
            <span>使用场景</span>
            <input readOnly value={activeProduct?.customerDescription ?? "选择左侧产品后自动生成"} />
          </label>
          <label>
            <span>预计用量</span>
            <input readOnly value={activeProduct?.minimumRequirement ?? "按具体用量确认"} />
          </label>
          <div className="builder-message">
            <strong>生成的 Telegram 文案</strong>
            <p>您好，我想咨询 AI 资源报价，需求如下：分类{categoryById(activeBusiness)?.label}，产品 {activeProduct?.name}，参考价格 {getPublicPrice(activeProduct)}，请帮我确认可用方案。</p>
          </div>
          <button className="neon-button full" type="button" onClick={() => onQuote(activeBusiness, activeProduct?.id)}>
            咨询该产品价格
          </button>
        </aside>
      </section>

      <section className="market-footer-band">
        <span><CalendarDays size={20} />价格每日更新</span>
        <span><ShieldCheck size={20} />隐私安全保障</span>
        <span><MessageCircle size={20} />支持 Telegram 对接</span>
        <span><Settings size={20} />配置灵活维护</span>
        <button className="version-link" type="button" onClick={() => setDesignVersion("premium")}>
          查看高端经纪版
        </button>
      </section>
    </div>
  );
}

function QuoteFinder({
  categories: categoryItems,
  products,
  selectedCategory,
  selectedProductIds,
  demand,
  telegramHref,
  telegramText,
  generatedTelegramText,
  copied,
  copyFailed,
  setDemand,
  setTelegramText,
  setSelectedCategory,
  setSelectedProductIds,
  copyTelegramText
}) {
  const visibleProducts = products.filter((item) => item.category === selectedCategory);
  const selectedProducts = selectedProductIds
    .map((productId) => products.find((item) => item.id === productId))
    .filter((product) => product?.category === selectedCategory);
  const selectedCategoryItem = categoryById(selectedCategory);

  function toggleProduct(productId) {
    setSelectedProductIds((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }

      return [...current.filter((id) => visibleProducts.some((product) => product.id === id)), productId];
    });
  }

  return (
    <section className="workspace-layout">
      <div className="quote-panel">
        <div className="section-heading compact">
          <span>Quote Finder</span>
          <h1>寻找适合你的 AI 资源报价</h1>
          <p>选择分类和具体需求，系统会生成参考方案和可发送的 Telegram 咨询文案。</p>
        </div>

        <Step title="1. 选择分类">
          <div className="choice-grid">
            {categoryItems.map((item) => (
              <button
                className={selectedCategory === item.id ? "choice active" : "choice"}
                type="button"
                key={item.id}
                onClick={() => setSelectedCategory(item.id)}
              >
                <strong>{item.label}</strong>
                <span>{item.summary}</span>
              </button>
            ))}
          </div>
        </Step>

        <Step title="2. 选择产品">
          <div className="product-pills">
            {visibleProducts.map((item) => (
              <button
                className={selectedProductIds.includes(item.id) ? "pill active" : "pill"}
                type="button"
                key={item.id}
                onClick={() => toggleProduct(item.id)}
              >
                {selectedProductIds.includes(item.id) && <Check size={15} />}
                {item.name}
              </button>
            ))}
          </div>
        </Step>

        <Step title="3. 填写需求">
          <div className="form-grid">
            <label>
              <span>预计用量</span>
              <input
                value={demand.usage}
                onChange={(event) => setDemand({ ...demand, usage: event.target.value })}
                placeholder="例如：每月 5000 万 Tokens / 每日 3 万次"
              />
            </label>
            <label>
              <span>使用场景</span>
              <input
                value={demand.scenario}
                onChange={(event) => setDemand({ ...demand, scenario: event.target.value })}
                placeholder="例如：企业客服、批量视频生成、AI 编程"
              />
            </label>
            <SelectField
              label="是否需要公司签约"
              value={demand.contract}
              onChange={(value) => setDemand({ ...demand, contract: value })}
            />
            <SelectField
              label="是否需要官方账号"
              value={demand.officialAccount}
              onChange={(value) => setDemand({ ...demand, officialAccount: value })}
            />
            <SelectField
              label="是否需要海外权限"
              value={demand.overseas}
              onChange={(value) => setDemand({ ...demand, overseas: value })}
            />
            <label className="wide">
              <span>其他说明</span>
              <textarea
                value={demand.notes}
                onChange={(event) => setDemand({ ...demand, notes: event.target.value })}
                placeholder="补充平台、地区、模型版本、交付周期或其他限制"
              />
            </label>
          </div>
        </Step>
      </div>

      <aside className="result-panel">
        <div className="sticky-panel">
          <div className="plan-card">
            <span className="tag">参考方案</span>
            <h2>{selectedProducts.length ? `${selectedProducts.length} 个产品已选` : "请选择产品"}</h2>
            <dl>
              <div>
                <dt>分类</dt>
                <dd>{selectedCategoryItem?.label}</dd>
              </div>
              <div>
                <dt>参考价格</dt>
                <dd>{selectedProducts.length ? "按所选产品分别确认" : "请选择产品"}</dd>
              </div>
            </dl>
            <div className="selected-plan-list">
              {selectedProducts.map((product) => (
                <article key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{getPublicPrice(product)}</span>
                  </div>
                  <p>{product.customerDescription}</p>
                  <small>签约：{product.contractRequirement} · 权限：{product.permissionRequirement}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="telegram-box">
            <div className="telegram-head">
              <MessageCircle size={18} />
              <strong>Telegram 咨询文案</strong>
            </div>
            <textarea
              className="telegram-editor"
              value={telegramText}
              onChange={(event) => setTelegramText(event.target.value)}
              aria-label="可编辑的 Telegram 咨询文案"
            />
            <div className="action-row">
              <button className="ghost-button" type="button" onClick={copyTelegramText}>
                {copied ? <Check size={17} /> : <Copy size={17} />}
                {copied ? "已复制" : copyFailed ? "复制失败" : "复制文案"}
              </button>
              <button className="ghost-button" type="button" onClick={() => setTelegramText(generatedTelegramText)}>
                <RefreshCw size={17} />
                恢复默认
              </button>
              <a className="primary-button" href={telegramHref} target="_blank" rel="noreferrer">
                <MessageCircle size={17} />
                发送到 Telegram
              </a>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}

function Step({ title, children }) {
  return (
    <section className="step-block">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function SelectField({ label, value, onChange }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option>不确定</option>
        <option>是</option>
        <option>否</option>
      </select>
    </label>
  );
}

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submitLogin(event) {
    event.preventDefault();
    const ok = onLogin(username, password);
    if (!ok) setError("账号或密码不正确");
  }

  return (
    <section className="admin-login-shell">
      <form className="admin-login-card" onSubmit={submitLogin}>
        <div className="login-lock">
          <LockKeyhole size={28} />
        </div>
        <div className="section-heading compact">
          <span>Admin Login</span>
          <h1>后台管理员登录</h1>
          <p>登录后才能修改价格、上下架和前台价格显示状态。</p>
        </div>
        <label>
          <span>管理员账号</span>
          <input
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="请输入管理员账号"
          />
        </label>
        <label>
          <span>管理员密码</span>
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入管理员密码"
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button className="primary-button full" type="submit">
          <ShieldCheck size={17} />
          登录后台
        </button>
        <p className="login-hint">后台仅在管理员域名开放。账号密码可通过 Vercel 环境变量覆盖。</p>
      </form>
    </section>
  );
}

function Admin({ products, history, telegram, updateProduct, setTelegram, resetDemoData, onLogout }) {
  const [editingId, setEditingId] = useState(products[0]?.id);
  const [draft, setDraft] = useState(() => products[0] ?? null);
  const [filter, setFilter] = useState("all");
  const editingProduct = products.find((product) => product.id === editingId);

  useEffect(() => {
    setDraft(editingProduct ? { ...editingProduct } : null);
  }, [editingProduct]);

  const filteredProducts = products.filter((product) => {
    if (filter === "listed") return product.isListed;
    if (filter === "visible") return product.showPrice;
    if (filter === "hidden") return !product.showPrice;
    return true;
  });

  function saveDraft() {
    if (!draft) return;
    updateProduct(draft.id, draft);
  }

  return (
    <section className="admin-layout">
      <div className="section-heading compact">
        <span>Admin Console</span>
        <h1>后台价格配置</h1>
        <p>控制产品是否上架、是否显示价格、对外参考价和内部成本。内部字段不会进入客户咨询文案。</p>
      </div>

      <div className="admin-tools">
        <label>
          <span>Telegram 用户名</span>
          <input
            value={telegram.username}
            onChange={(event) => setTelegram({ username: event.target.value })}
            placeholder="例如：ailorenzo"
          />
        </label>
        <button className="ghost-button" type="button" onClick={resetDemoData}>
          <RefreshCw size={17} />
          重置默认数据
        </button>
        <button className="ghost-button" type="button" onClick={onLogout}>
          <LockKeyhole size={17} />
          退出后台
        </button>
      </div>

      <div className="filter-tabs" aria-label="价格筛选">
        {[
          ["all", "全部"],
          ["listed", "仅上架"],
          ["visible", "价格可见"],
          ["hidden", "价格隐藏"]
        ].map(([id, label]) => (
          <button className={filter === id ? "tab active" : "tab"} type="button" key={id} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="admin-grid">
        <div className="product-table">
          <div className="table-head">
            <span>分类</span>
            <span>产品</span>
            <span>状态</span>
            <span>对外参考价</span>
          </div>
          {filteredProducts.map((item) => (
            <button
              className={editingId === item.id ? "table-row active" : "table-row"}
              type="button"
              key={item.id}
              onClick={() => setEditingId(item.id)}
            >
              <span>{categoryById(item.category)?.label}</span>
              <strong>{item.name}</strong>
              <span className="status-pair">
                {item.isListed ? <Eye size={15} /> : <EyeOff size={15} />}
                {item.showPrice ? "显示价" : "隐藏价"}
              </span>
              <span>{item.showPrice ? item.publicPrice : "需咨询确认"}</span>
            </button>
          ))}
        </div>

        {draft && (
          <form className="editor-panel" onSubmit={(event) => event.preventDefault()}>
            <div className="editor-head">
              <Settings size={18} />
              <strong>编辑：{draft.name}</strong>
            </div>
            <div className="switch-row">
              <Toggle
                label="是否上架"
                active={draft.isListed}
                onClick={() => setDraft({ ...draft, isListed: !draft.isListed })}
              />
              <Toggle
                label="是否显示价格"
                active={draft.showPrice}
                onClick={() => setDraft({ ...draft, showPrice: !draft.showPrice })}
              />
            </div>
            <label>
              <span>对外参考价</span>
              <input value={draft.publicPrice} onChange={(event) => setDraft({ ...draft, publicPrice: event.target.value })} />
            </label>
            <label>
              <span>内部成本价</span>
              <input value={draft.internalCost} onChange={(event) => setDraft({ ...draft, internalCost: event.target.value })} />
            </label>
            <label>
              <span>最低用量要求</span>
              <input
                value={draft.minimumRequirement}
                onChange={(event) => setDraft({ ...draft, minimumRequirement: event.target.value })}
              />
            </label>
            <label>
              <span>签约要求</span>
              <input
                value={draft.contractRequirement}
                onChange={(event) => setDraft({ ...draft, contractRequirement: event.target.value })}
              />
            </label>
            <label>
              <span>权限要求</span>
              <input
                value={draft.permissionRequirement}
                onChange={(event) => setDraft({ ...draft, permissionRequirement: event.target.value })}
              />
            </label>
            <label>
              <span>客户可见说明</span>
              <textarea
                value={draft.customerDescription}
                onChange={(event) => setDraft({ ...draft, customerDescription: event.target.value })}
              />
            </label>
            <label>
              <span>后台备注</span>
              <textarea value={draft.adminNote} onChange={(event) => setDraft({ ...draft, adminNote: event.target.value })} />
            </label>
            <button className="primary-button full" type="button" onClick={saveDraft}>
              <Save size={17} />
              保存配置
            </button>
          </form>
        )}
      </div>

      <section className="history-section">
        <div className="editor-head">
          <History size={18} />
          <strong>AI / 后台更新记录</strong>
        </div>
        <div className="history-list">
          {history.length === 0 && <p className="empty-state">还没有更新记录。保存一次配置后，这里会记录修改前后。</p>}
          {history.map((item) => (
            <div className="history-row" key={item.id}>
              <span>{item.timestamp}</span>
              <strong>{item.product}</strong>
              <span>{item.field}</span>
              <span>{item.before}</span>
              <ArrowRight size={14} />
              <span>{item.after}</span>
              <em>{item.publicImpact ? "影响前台" : "仅后台"}</em>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function Toggle({ label, active, onClick }) {
  return (
    <button className={active ? "toggle active" : "toggle"} type="button" onClick={onClick}>
      <span>{active ? <Check size={14} /> : null}</span>
      {label}
    </button>
  );
}

export default App;
