import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Send, Download, Sparkles, TrendingUp, ShieldCheck, ArrowDownWideNarrow, X, Flame, Gift, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api, { API, resolveUrl } from "@/lib/api";
import SEOHead from "@/components/SEOHead";
import { useSettings, sectionEnabled } from "@/context/SettingsContext";
import AppCard from "@/components/AppCard";
import AppIcon from "@/components/AppIcon";
import RippleButton from "@/components/RippleButton";
import RummyFeatures from "@/components/RummyFeatures";
import AnimatedCounter from "@/components/AnimatedCounter";
import { StoreSkeleton } from "@/components/Skeletons";
import FaqSection from "@/components/FaqSection";
import LegalSection from "@/components/LegalSection";
import LegalDialog from "@/components/LegalDialog";
import SiteFooter from "@/components/SiteFooter";
import LiveWinners from "@/components/LiveWinners";
import ReviewsSection from "@/components/ReviewsSection";
import RedeemBox from "@/components/RedeemBox";
import AdSlot from "@/components/AdSlot";
import OptimizedImage from "@/components/OptimizedImage";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "");
}

const SORTS = [
  { value: "downloads", label: "Most Downloaded" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
];

const LANDING_100_KEYWORDS = [
  "yono games all app", "yono games app", "yono app", "you games online", "all your game store", "you know games", "yono app link", "all yono game new", "rummy game app store", "new yono games", "yono games com apk", "yono game apk download for android latest version", "yono games apk lsgd", "yono games 2", "you know game", "yono game google", "yono genes", "all your game app download", "all you game", "all your app", "all many games", "all your game apk latest version", "you game game", "all your games download free", "all your gamespin crush", "yono games apk", "yono all games", "all your game apk", "all yono games list apk", "yono game home", "yono india", "all you know game", "all new game", "yono arcade all apk", "yono rummy games for android", "yono games all new apk", "yono games all new 2026 apk"
];

export default function Store() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  
  const cachedData = typeof window !== "undefined" ? localStorage.getItem("yono_apps_perm_cache") : null;
  const parsedCache = useMemo(() => {
    try {
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (e) {
      return null;
    }
  }, [cachedData]);

  const [data, setData] = useState(() => parsedCache);
  const [loading, setLoading] = useState(!parsedCache);
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("downloads");
  const [legalId, setLegalId] = useState(null);
  const [activeTab, setActiveTab] = useState("description");

  const fetchApps = async () => {
    try {
      const res = await api.get("/apps?limit=100");
      if (res.data) {
        setData(res.data);
        localStorage.setItem("yono_apps_perm_cache", JSON.stringify(res.data));
      }
    } catch (e) {
      if (!data) toast.error("Failed to load apps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (parsedCache) {
      setLoading(false);
      fetchApps();
    } else {
      fetchApps();
    }
  }, [parsedCache]);

  const handleDownload = (app) => {
    toast.success(`Opening: ${app.name}`, { description: `45 MB • v2026 Latest` });
    
    if (app.apk_url && app.apk_url.startsWith("http")) {
      window.open(app.apk_url, "_blank"); 
      api.get(`/apps/${app.id}/download`).catch(() => {});
    } else {
      window.open(`${API}/apps/${app.id}/download`, "_blank");
    }

    setData((prev) => {
      if (!prev) return prev;
      const bump = (a) => (a.id === app.id ? { ...a, downloads: a.downloads + 1 } : a);
      const updated = {
        ...prev,
        apps: (prev.apps || []).map(bump),
      };
      localStorage.setItem("yono_apps_perm_cache", JSON.stringify(updated));
      return updated;
    });
  };

  const allAppsList = useMemo(() => {
    if (!data) return [];
    return [...(data.apps || [])];
  }, [data]);

  const handleKeywordClick = (kw) => {
    const cleanKw = kw.replace(/apk|download|2026|app|online|india|game|games/gi, "").trim();
    const matchedApp = allAppsList.find(a => normalize(a.name).includes(normalize(cleanKw)) || normalize(cleanKw).includes(normalize(a.name)));
    
    if (matchedApp) {
      navigate(`/${matchedApp.slug || matchedApp.id}`, { state: { app: matchedApp } });
    } else {
      setSearch(cleanKw || kw);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const categories = useMemo(() => {
    if (!data) return ["All"];
    const set = new Set();
    [...(data.apps || [])].forEach((a) => a.category && set.add(a.category));
    return ["All", ...Array.from(set)];
  }, [data]);

  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = normalize(deferredSearch);
    const hasFilter = category !== "All" || q;
    let list = hasFilter ? [...(data.apps || [])] : [...(data.apps || [])];
    if (category !== "All") list = list.filter((a) => a.category === category);

    if (q) {
      const scored = [];
      for (const a of list) {
        const name = normalize(a.name);
        const haystack = `${name} ${normalize(a.slug)} ${normalize(a.category)} ${normalize(a.developer)}`;
        let score;
        if (name === q) score = 0;
        else if (name.startsWith(q)) score = 1;
        else if (name.includes(q)) score = 2;
        else if (haystack.includes(q)) score = 3;
        else continue;
        scored.push({ a, score });
      }
      scored.sort((x, y) => x.score - y.score || (y.a.downloads || 0) - (x.a.downloads || 0));
      list = scored.map((s) => s.a);
      return list;
    }

    if (sort === "downloads") list.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    else if (sort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === "newest") list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    return list;
  }, [data, category, deferredSearch, sort]);

  const totalDownloads = useMemo(() => {
    if (!data) return 0;
    return [...(data.apps || [])].reduce((s, a) => s + (a.downloads || 0), 0);
  }, [data]);

  const isDefaultView = !search.trim() && category === "All";
  const hero = settings?.hero || {};
  const stats = settings?.stats || {};
  const tg = settings?.telegram || {};

  const en = (id) => sectionEnabled(settings, id);

  const appListSection = (
    <section key="apps" id="apps" className="space-y-3" data-testid="apps-section">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#FFC107]" />
        <h2 className="font-display text-base font-bold text-[#111111]">
          {isDefaultView ? "All Apps (100+ Games)" : "Results"}
        </h2>
        <span className="text-xs text-[#999999]" aria-live="polite">
          ({filtered.length}{isDefaultView ? "" : filtered.length === 1 ? " match" : " matches"})
        </span>
        <div className="ml-auto">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger data-testid="sort-select" aria-label="Sort apps and games" className="h-8 w-auto gap-1 rounded-full border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#555555] focus:ring-[#FFC107]">
              <ArrowDownWideNarrow className="h-3.5 w-3.5 text-[#999999]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div data-testid="empty-state" className="rounded-[20px] border border-dashed border-[#E5E7EB] bg-white py-10 text-center">
          <p className="text-sm text-[#777777]">No apps found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app, i) => (
            <AppCard key={app.id} app={app} index={i} onDownload={handleDownload} />
          ))}
        </div>
      )}
    </section>
  );

  const renderers = {
    rummy: isDefaultView && en("rummy") ? <RummyFeatures key="rummy" /> : null,
    telegram: isDefaultView && en("telegram") && tg.enabled !== false ? (
      <a key="telegram" href={tg.link || "https://t.me/"} target="_blank" rel="noopener noreferrer" data-testid="telegram-cta"
        className="flex items-center gap-3 rounded-[20px] border border-[#229ED9]/20 bg-gradient-to-r from-[#229ED9]/10 to-[#229ED9]/5 p-3.5 transition-transform duration-200 active:scale-[0.98]">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#229ED9] shadow-[0_6px_16px_rgba(34,158,217,0.4)]">
          <Send className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-bold text-[#111111]">{tg.cta_text || "Join our Telegram"}</p>
          <p className="text-xs text-[#777777]">{tg.sub_text || "Get instant updates & new APK releases"}{tg.member_count ? ` • ${tg.member_count} members` : ""}</p>
        </div>
        <span className="rounded-full bg-[#229ED9] px-3 py-1.5 text-xs font-semibold text-white">Join</span>
      </a>
    ) : null,
    winners: isDefaultView && en("winners") ? <LiveWinners key="winners" config={settings?.winners_config} /> : null,
    apps: appListSection,
    reviews: isDefaultView && en("reviews") ? <ReviewsSection key="reviews" /> : null,
    faq: isDefaultView && en("faq") ? <FaqSection key="faq" /> : null,
    legal: isDefaultView && en("legal") ? <LegalSection key="legal" onOpen={setLegalId} /> : null,
  };

  const order = (settings?.sections || []).map((s) => s.id).filter(id => id !== "trending" && id !== "featured" && id !== "reviews" && id !== "faq" && id !== "legal");
  const finalOrder = order.includes("apps") ? order : [...order, "apps"];

  return (
    <div className="app-shell pb-10">
      <SEOHead
        title="YONO GAMES - Play and Win | Premium Rummy & Games APK Store 2026"
        description="Download the latest 100+ Yono Rummy and gaming APK apps with ₹501 sign-up bonus and instant UPI withdrawal on newyono.games."
        keywords="yono games all app, yono games apk, all yono games list apk, yono games, rummy apk, newyono.games"
        canonical="https://newyono.games/"
        image="/logo-v2.png"
      />

      <div className="px-4 pt-4 text-center">
        <h1 className="font-display text-lg font-bold text-[#111111]">Welcome to YONO GAMES 👑</h1>
        <p className="text-xs text-[#777777]">PLAY &amp; WIN • SIGN-UP BONUS ₹501 🎮</p>
      </div>

      {hero.enabled !== false && (
        <div className="px-4 pt-3">
          <div className="overflow-hidden rounded-[20px] border border-[#E5E7EB] shadow-[0_10px_30px_rgba(0,0,0,0.1)]" data-testid="hero-banner">
            <OptimizedImage 
              src={resolveUrl(hero.banner_url || "/hero-banner.png")} 
              alt={hero.headline || "newyono.games"} 
              className="block w-full" 
              fetchPriority="high"
            />
          </div>
          {(hero.headline || hero.subtitle) && (
            <div className="mt-3 text-center">
              {hero.headline && <h2 className="font-display text-xl font-bold text-[#111111]">{hero.headline}</h2>}
              {hero.subtitle && <p className="mt-0.5 text-sm text-[#777777]">{hero.subtitle}</p>}
            </div>
          )}
        </div>
      )}

      {stats.enabled !== false && (
        <div className="grid grid-cols-3 gap-2 px-4 pt-4">
          {(stats.items || []).slice(0, 3).map((s, i) => {
            const Icon = [Download, ShieldCheck, TrendingUp][i] || Sparkles;
            const color = ["#FFC107", "#22C55E", "#FFB300"][i] || "#FFC107";
            const autoVal = i === 0 ? totalDownloads : (data ? [...(data.apps || [])].length : 0);
            const isAuto = s.value === "auto";
            return (
              <div key={i} className="rounded-[16px] border border-[#E5E7EB] bg-white p-3 text-center shadow-[0_6px_20px_rgba(0,0,0,0.03)]">
                <Icon className="mx-auto h-4 w-4" style={{ color }} />
                <p className="mt-1 font-display text-base font-bold text-[#111111]">
                  {isAuto ? <AnimatedCounter value={autoVal} /> : s.value}
                  {s.suffix || ""}
                </p>
                <p className="text-[10px] text-[#777777]">{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="sticky top-0 z-30 bg-[#F8F9FA]/90 px-4 py-3 backdrop-blur-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777]" />
          <Input
            data-testid="search-input"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            aria-label="Search apps and games"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearch("")}
            placeholder="Search 100+ games..."
            className="h-11 rounded-full border-[#E5E7EB] bg-white pl-10 pr-10 text-base shadow-[0_4px_14px_rgba(0,0,0,0.03)] focus-visible:ring-[#FFC107]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              data-testid="search-clear"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#F1F1F1] text-[#777777] hover:bg-[#E5E7EB]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button key={c} data-testid={`category-${c}`} onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                category === c ? "bg-[#FFC107] text-[#111111] shadow-[0_4px_12px_rgba(255,193,7,0.4)]" : "border border-[#E5E7EB] bg-white text-[#555555]"
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <main className="space-y-5 px-4 pt-1">
        {loading && !data ? (
          <StoreSkeleton />
        ) : (
          <>
            {/* GRAND & LARGE TOP 3 GAMES PODIUM DESIGN */}
            {isDefaultView && (
              <section className="space-y-4 mb-4">
                <div className="flex items-center gap-2 px-1">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-r from-[#FFC107] to-[#FF8F00] text-white shadow-md">
                    <Trophy className="h-4 w-4" />
                  </span>
                  <h2 className="font-display text-base sm:text-lg font-black text-[#111111]">Top 3 Trending Games</h2>
                </div>
                {(() => {
                  const top3 = (data?.featured || data?.apps || []).slice(0, 3);
                  if (top3.length === 0) return null;
                  const first = top3[0];
                  const second = top3[1];
                  const third = top3[2];
                  return (
                    <div className="space-y-3.5">
                      {/* #1 Elite Large Spotlight Game Card */}
                      {first && (
                        <div
                          onClick={() => navigate(`/${first.slug || first.id}`, { state: { app: first } })}
                          className="group relative flex cursor-pointer items-center gap-4 rounded-[24px] border-2 border-[#FFC107] bg-gradient-to-r from-[#FFFDE7] via-white to-white p-5 shadow-[0_12px_35px_rgba(255,193,7,0.22)] transition-all hover:scale-[1.01]"
                        >
                          <div className="absolute -left-2.5 -top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white shadow-lg bg-gradient-to-r from-[#FFC107] to-[#FF8F00] border-2 border-white">
                            <span>1</span>
                          </div>
                          <AppIcon src={resolveUrl(first.icon_url)} alt={first.name} className="h-20 w-20 sm:h-24 sm:w-24 rounded-[20px] object-cover shadow-lg ring-1 ring-black/5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-display text-base sm:text-lg font-extrabold text-[#111111] truncate">{first.name}</h3>
                              <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#FFF8E1] px-3 py-1 border border-[#FFE082]">
                                <span className="text-xs font-bold text-[#B45309]">⭐ {first.rating?.toFixed(1) || "4.9"}</span>
                              </div>
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-[#777777]">v2026 Latest • {first.size || "45 MB"}</p>
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-[#555555]">👥 4.2M+ active players</span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFC107] px-2.5 py-1 text-[10px] font-black text-[#111111] shadow-sm">
                                🎁 Bonus ₹501
                              </span>
                            </div>
                          </div>
                          <RippleButton
                            onClick={(e) => { e.stopPropagation(); handleDownload(first); }}
                            className="flex shrink-0 items-center gap-2 rounded-full bg-[#FFC107] px-5 py-3 text-sm font-bold text-[#111111] shadow-[0_6px_20px_rgba(255,193,7,0.45)] hover:bg-[#FFB300] animate-pulse"
                          >
                            <Download className="h-4 w-4" /> Download
                          </RippleButton>
                        </div>
                      )}

                      {/* #2 and #3 Large Prominent Grid Cards */}
                      <div className="grid grid-cols-2 gap-3.5">
                        {[second, third].map((app, idx) => {
                          if (!app) return null;
                          const rank = idx + 2;
                          return (
                            <div
                              key={app.id}
                              onClick={() => navigate(`/${app.slug || app.id}`, { state: { app } })}
                              className="relative flex flex-col cursor-pointer rounded-[22px] border border-[#E5E7EB] bg-white p-4 shadow-md hover:shadow-lg transition-all"
                            >
                              <div
                                className="absolute -left-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white shadow-md border-2 border-white"
                                style={{ backgroundColor: rank === 2 ? "#64748B" : "#D97706" }}
                              >
                                <span>{rank}</span>
                              </div>
                              <div className="flex items-start gap-3 mb-3">
                                <AppIcon src={resolveUrl(app.icon_url)} alt={app.name} className="h-16 w-16 rounded-[16px] object-cover shadow-md shrink-0 ring-1 ring-black/5" />
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-display text-sm font-bold text-[#111111] truncate">{app.name}</h4>
                                  <div className="flex items-center gap-0.5 mt-1">
                                    <span className="text-xs font-bold text-[#B45309]">⭐ {app.rating?.toFixed(1) || "4.8"}</span>
                                  </div>
                                  <p className="text-xs text-[#777777] mt-0.5">{app.size || "45 MB"}</p>
                                </div>
                              </div>
                              <div className="mb-3">
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8E1] px-2.5 py-1 text-[10px] font-bold text-[#B45309]">
                                  🎁 ₹501 Bonus
                                </span>
                              </div>
                              <RippleButton
                                onClick={(e) => { e.stopPropagation(); handleDownload(app); }}
                                className="w-full mt-auto flex items-center justify-center gap-1.5 rounded-full bg-[#FFC107] py-2.5 text-xs font-bold text-[#111111] shadow-sm hover:bg-[#FFB300] animate-pulse"
                              >
                                <Download className="h-3.5 w-3.5" /> Download
                              </RippleButton>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </section>
            )}

            {/* RENDER OTHER SECTIONS */}
            {finalOrder.map((id) => renderers[id]).filter(Boolean)}

            {/* WHAT USERS SAY (REVIEWS) */}
            {isDefaultView && en("reviews") && <ReviewsSection key="reviews" />}

            {/* SEO DASHBOARD / 3 MENU TABS ON LANDING PAGE */}
            {isDefaultView && (
              <section className="rounded-[20px] sm:rounded-[24px] border border-[#E5E7EB] bg-white p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex border-b border-[#E5E7EB] pb-2 gap-4 overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setActiveTab("description")}
                    className={`text-xs sm:text-sm font-bold pb-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === "description" ? "border-[#FFC107] text-[#111111]" : "border-transparent text-[#777777]"}`}
                  >
                    1. Complete Description 📄
                  </button>
                  <button 
                    onClick={() => setActiveTab("mobileapps")}
                    className={`text-xs sm:text-sm font-bold pb-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === "mobileapps" ? "border-[#FFC107] text-[#111111]" : "border-transparent text-[#777777]"}`}
                  >
                    2. Mobile Apps & Add-Ons 📱
                  </button>
                  <button 
                    onClick={() => setActiveTab("gameslist")}
                    className={`text-xs sm:text-sm font-bold pb-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === "gameslist" ? "border-[#FFC107] text-[#111111]" : "border-transparent text-[#777777]"}`}
                  >
                    3. All Yono Games List 🎮
                  </button>
                </div>

                <div className="pt-2 text-xs sm:text-sm text-[#555555] leading-relaxed">
                  {activeTab === "description" && (
                    <div className="space-y-2">
                      <p><strong>newyono.games</strong> is the ultimate platform offering 100+ games including Yono Rummy, Teen Patti, Slots, and Ludo with a <strong>₹501 sign-up bonus</strong>.</p>
                      <p>Designed for Android users with fast 60 FPS performance, instant UPI withdrawals, and secure anti-ban mod files in 2026.</p>
                    </div>
                  )}
                  {activeTab === "mobileapps" && (
                    <div className="space-y-2">
                      <p>Explore exclusive mobile addons, productivity tools, customized web extensions, and optimized APK packages for seamless gaming experience across all Android devices.</p>
                    </div>
                  )}
                  {activeTab === "gameslist" && (
                    <div className="space-y-2">
                      <p>Access the complete directory of 100+ Yono-style apps including Rummy 365, Spin Winner, Yono 777, and Jaiho Slots with verified download links and ₹501 sign-up bonus.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* SEO DESCRIPTION */}
            {isDefaultView && (
              <section className="space-y-3 rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_6px_20px_rgba(0,0,0,0.03)]">
                <h2 className="font-display text-base font-bold text-[#111111]">
                  All Yono Games - Discover New Yono Apps & Play Top 100+ Gaming Apps
                </h2>
                <div className="space-y-3 text-sm leading-relaxed text-[#555555]">
                  <p>
                    Welcome to <strong>newyono.games</strong> - India's most trusted gaming platform in 2026. Get up to ₹501 sign-up bonus instantly, enjoy smooth 60 FPS gameplay, secure withdrawals, and access the latest 2026 Yono APK versions safely.
                  </p>
                  <p>
                    That's exactly what <strong>All New Yono Apps</strong> aims to deliver. Our platform brings together a collection of 100+ games that combine classic gameplay with modern mobile experiences. From popular card titles like <strong>Yono Rummy</strong> to the latest slot and arcade apps gaining popularity in India, every game listed here is chosen carefully for its entertainment value.
                  </p>
                </div>
              </section>
            )}

            {/* KEYWORDS CLOUD */}
            {isDefaultView && (
              <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.02)] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FFF8E1] text-[#FFC107]">
                    <Flame className="h-4 w-4 fill-[#FFC107]" />
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#111111]">Top Google Search Keywords</h3>
                    <p className="text-[10px] text-[#888888]">Click any keyword to explore games and instant download links</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {LANDING_100_KEYWORDS.map((kw, i) => (
                    <button
                      key={i}
                      onClick={() => handleKeywordClick(kw)}
                      className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1.5 text-xs font-medium text-[#555555] hover:bg-[#FFF8E1] hover:border-[#FFE082] hover:text-[#B45309] transition-colors text-left cursor-pointer"
                    >
                      #{kw}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* BOTTOM SECTIONS */}
            {isDefaultView && en("winners") && <RedeemBox />}
            {isDefaultView && AdSlot && <AdSlot ads={settings?.ads} />}
            {isDefaultView && en("faq") && <FaqSection key="faq" />}
            {isDefaultView && en("legal") && <LegalSection key="legal" onOpen={setLegalId} />}
          </>
        )}
      </main>

      <SiteFooter onOpenLegal={setLegalId} />
      <LegalDialog openId={legalId} onClose={() => setLegalId(null)} />
    </div>
  );
}
