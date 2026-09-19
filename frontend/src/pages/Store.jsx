import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Search, Download, Sparkles, TrendingUp, ShieldCheck, ArrowDownWideNarrow, X, Flame, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api, { API, resolveUrl } from "@/lib/api";
import SEOHead from "@/components/SEOHead";
import { useSettings, sectionEnabled } from "@/context/SettingsContext";
import AppCard from "@/components/AppCard";
import AppIcon from "@/components/AppIcon";
import RippleButton from "@/components/RippleButton";
import FaqSection from "@/components/FaqSection";
import LegalSection from "@/components/LegalSection";
import LegalDialog from "@/components/LegalDialog";
import SiteFooter from "@/components/SiteFooter";
import ReviewsSection from "@/components/ReviewsSection";
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
      // Silent fail
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleDownload = (app) => {
    toast.success(`Opening: ${app.name}`, { description: `45 MB • v2026 Latest` });
    
    if (app.apk_url && app.apk_url.startsWith("http")) {
      window.open(app.apk_url, "_blank"); 
      api.get(`/apps/${app.id}/download`).catch(() => {});
    } else {
      window.open(`${API}/apps/${app.id}/download`, "_blank");
    }
  };

  // Ensure all apps display version as "2026 Latest" and proper size
  const allAppsList = useMemo(() => {
    const rawList = data?.apps || parsedCache?.apps || data?.featured || parsedCache?.featured || [];
    return rawList.map(app => ({
      ...app,
      version: "2026 Latest",
      size: app.size || "45 MB"
    }));
  }, [data, parsedCache]);

  const handleKeywordClick = (kw) => {
    const cleanKw = kw.replace(/apk|download|2026|app|online|india|game|games/gi, "").trim();
    const matchedApp = allAppsList.find(a => normalize(a.name).includes(normalize(cleanKw)) || normalize(cleanKw).includes(normalize(a.name)));
    
    if (matchedApp) {
      navigate(`/${matchedApp.slug || matchedApp.id}`, { state: { app: matchedApp } });
    } else {
      setSearch(cleanKw || kw);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }
  };

  const categories = useMemo(() => {
    const rawList = allAppsList;
    if (rawList.length === 0) return ["All"];
    const set = new Set();
    rawList.forEach((a) => a.category && set.add(a.category));
    return ["All", ...Array.from(set)];
  }, [allAppsList]);

  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const rawApps = allAppsList;
    const q = normalize(deferredSearch);
    const hasFilter = category !== "All" || q;
    let list = hasFilter ? [...rawApps] : [...rawApps];
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
  }, [allAppsList, category, deferredSearch, sort]);

  const isDefaultView = !search.trim() && category === "All";
  const hero = settings?.hero || {};

  return (
    <div className="app-shell pb-10 bg-[#FAFAFA] text-[#111111] min-h-screen">
      <SEOHead
        title="YONO GAMES - Play and Win | Premium Rummy & Games APK Store 2026"
        description="Download the latest 100+ Yono Rummy and gaming APK apps with ₹501 sign-up bonus and instant UPI withdrawal on newyono.games."
        keywords="yono games all app, yono games apk, all yono games list apk, yono games, rummy apk, newyono.games"
        canonical="https://newyono.games/"
        image="/logo-v2.png"
      />

      {/* Clean Thin Header Title */}
      <div className="px-4 pt-4 text-center">
        <h1 className="font-display text-lg font-bold text-[#111111]">Welcome to YONO GAMES 👑</h1>
        <p className="text-xs text-[#777777]">PLAY &amp; WIN • SIGN-UP BONUS ₹501 🎮</p>
      </div>

      {/* Hero Banner (If enabled) */}
      {hero.enabled !== false && (
        <div className="px-4 pt-3">
          <div className="overflow-hidden rounded-[20px] border border-[#E5E7EB] shadow-sm">
            <OptimizedImage 
              src={resolveUrl(hero.banner_url || "/hero-banner.png")} 
              alt={hero.headline || "newyono.games"} 
              className="block w-full" 
              fetchPriority="high"
            />
          </div>
        </div>
      )}

      {/* Sticky Clean Search Bar & Categories */}
      <div className="sticky top-0 z-30 bg-[#FAFAFA]/95 px-4 py-3 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777]" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 100+ games..."
            className="h-11 rounded-full border-[#E5E7EB] bg-white pl-10 pr-10 text-base shadow-sm focus-visible:ring-[#FFC107]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#F1F1F1] text-[#777777]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                category === c ? "bg-[#FFC107] text-[#111111] shadow-sm" : "border border-[#E5E7EB] bg-white text-[#555555]"
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto space-y-4 px-4 pt-4">
        {/* Top 3 Trending Games: #1 Spotlight & #2, #3 Side-by-Side with full details */}
        {isDefaultView && (
          <section className="space-y-3.5">
            <div className="flex items-center gap-2 px-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-r from-[#FFC107] to-[#FF8F00] text-white shadow-sm">
                <Trophy className="h-4 w-4" />
              </span>
              <h2 className="font-display text-base font-black text-[#111111]">Top 3 Trending Games</h2>
            </div>
            {(() => {
              const top3 = allAppsList.slice(0, 3);
              if (top3.length === 0) return null;
              const first = top3[0];
              const second = top3[1];
              const third = top3[2];
              return (
                <div className="space-y-3">
                  {/* #1 Elite Main Spotlight Game Card */}
                  {first && (
                    <div
                      onClick={() => navigate(`/${first.slug || first.id}`, { state: { app: first } })}
                      className="group relative flex cursor-pointer items-center gap-4 rounded-[24px] border-2 border-[#FFC107] bg-gradient-to-r from-[#FFFDE7] via-white to-white p-4.5 shadow-md hover:scale-[1.01] transition-all"
                    >
                      <span className="absolute -left-2.5 -top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-[#FFC107] to-[#FF8F00] text-xs font-black text-[#111111] shadow-md border-2 border-white">
                        1
                      </span>
                      <AppIcon src={resolveUrl(first.icon_url)} alt={first.name} className="h-16 w-16 sm:h-20 sm:w-20 rounded-[20px] object-cover shadow-md shrink-0 ring-1 ring-black/5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm sm:text-base font-extrabold text-[#111111] truncate">{first.name}</h3>
                          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600">HOT</span>
                        </div>
                        <p className="text-xs text-[#777777] mt-0.5">2026 Latest • {first.size}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-bold text-amber-600">⭐ {first.rating?.toFixed(1) || "4.8"}</span>
                          <span className="text-[11px] text-[#555555]">👥 4.2M+ players</span>
                        </div>
                        <div className="mt-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8E1] px-2 py-0.5 text-[10px] font-bold text-[#B45309] border border-[#FFE082]">
                            🎁 Bonus ₹501
                          </span>
                        </div>
                      </div>
                      <RippleButton
                        onClick={(e) => { e.stopPropagation(); handleDownload(first); }}
                        className="shrink-0 flex items-center gap-1.5 rounded-full bg-[#FFC107] px-4 py-3 text-xs font-bold text-[#111111] shadow-sm hover:bg-[#FFB300]"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </RippleButton>
                    </div>
                  )}

                  {/* #2 and #3 Side-by-Side Grid Cards with Full Details */}
                  <div className="grid grid-cols-2 gap-3">
                    {[second, third].map((app, idx) => {
                      if (!app) return null;
                      const rank = idx + 2;
                      return (
                        <div
                          key={app.id}
                          onClick={() => navigate(`/${app.slug || app.id}`, { state: { app } })}
                          className="relative flex flex-col cursor-pointer rounded-[20px] border border-[#E5E7EB] bg-white p-3.5 shadow-sm hover:border-[#FFC107] transition-all"
                        >
                          <span 
                            className="absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white shadow-md border-2 border-white"
                            style={{ backgroundColor: rank === 2 ? "#64748B" : "#D97706" }}
                          >
                            {rank}
                          </span>
                          <div className="flex items-start gap-2.5 mb-2">
                            <AppIcon src={resolveUrl(app.icon_url)} alt={app.name} className="h-12 w-12 rounded-[14px] object-cover shadow-sm shrink-0 ring-1 ring-black/5" />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-display text-xs font-bold text-[#111111] truncate">{app.name}</h4>
                              <p className="text-[10px] text-[#777777] mt-0.5">⭐ {app.rating?.toFixed(1) || "4.8"}</p>
                              <p className="text-[10px] text-[#555555]">2026 Latest</p>
                            </div>
                          </div>
                          <div className="mb-2.5 space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8E1] px-2 py-0.5 text-[9px] font-bold text-[#B45309]">
                              🎁 ₹501 Bonus
                            </span>
                            <p className="text-[10px] text-[#22C55E] font-medium">✓ Verified Safe</p>
                          </div>
                          <RippleButton
                            onClick={(e) => { e.stopPropagation(); handleDownload(app); }}
                            className="w-full mt-auto flex items-center justify-center gap-1 rounded-full bg-[#FFC107] py-2 text-[11px] font-bold text-[#111111] shadow-sm hover:bg-[#FFB300]"
                          >
                            <Download className="h-3 w-3" /> Download
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

        {/* All Games List Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#111111]">
              {isDefaultView ? "All Games (100+ Apps)" : "Search Results"}
            </h2>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-8 w-auto gap-1 rounded-full border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#555555]">
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

          {filtered.length === 0 ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-3.5 rounded-[20px] border border-[#E5E7EB] bg-white p-3.5 animate-pulse">
                  <div className="h-14 w-14 rounded-xl bg-gray-200 shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-9 w-20 bg-gray-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((app, i) => (
                <AppCard key={app.id} app={app} index={i} onDownload={handleDownload} />
              ))}
            </div>
          )}
        </section>

        {/* 3-Tab SEO Dashboard */}
        {isDefaultView && (
          <section className="rounded-[22px] border border-[#E5E7EB] bg-white p-4 shadow-sm space-y-3">
            <div className="flex border-b border-[#E5E7EB] pb-2 gap-4 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab("description")}
                className={`text-xs font-bold pb-2 border-b-2 whitespace-nowrap ${activeTab === "description" ? "border-[#FFC107] text-[#111111]" : "border-transparent text-[#777777]"}`}
              >
                1. Complete Description 📄
              </button>
              <button 
                onClick={() => setActiveTab("mobileapps")}
                className={`text-xs font-bold pb-2 border-b-2 whitespace-nowrap ${activeTab === "mobileapps" ? "border-[#FFC107] text-[#111111]" : "border-transparent text-[#777777]"}`}
              >
                2. Mobile Apps & Add-Ons 📱
              </button>
              <button 
                onClick={() => setActiveTab("gameslist")}
                className={`text-xs font-bold pb-2 border-b-2 whitespace-nowrap ${activeTab === "gameslist" ? "border-[#FFC107] text-[#111111]" : "border-transparent text-[#777777]"}`}
              >
                3. All Yono Games List 🎮
              </button>
            </div>

            <div className="text-xs text-[#555555] leading-relaxed">
              {activeTab === "description" && (
                <p><strong>newyono.games</strong> offers 100+ games including Yono Rummy, Teen Patti, and Slots with a ₹501 sign-up bonus and instant UPI withdrawals.</p>
              )}
              {activeTab === "mobileapps" && (
                <p>Explore exclusive mobile addons, web extensions, and optimized APK packages for seamless Android gaming performance.</p>
              )}
              {activeTab === "gameslist" && (
                <p>Access the complete directory of 100+ Yono-style apps like Rummy 365, Spin Winner, and Yono 777 with verified download links.</p>
              )}
            </div>
          </section>
        )}

        {/* Keywords Cloud */}
        {isDefaultView && (
          <section className="rounded-[22px] border border-[#E5E7EB] bg-white p-4 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#FFC107] fill-[#FFC107]" />
              <h3 className="font-display text-xs font-bold text-[#111111]">Top Google Search Keywords</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LANDING_100_KEYWORDS.map((kw, i) => (
                <button
                  key={i}
                  onClick={() => handleKeywordClick(kw)}
                  className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-1 text-[10px] font-medium text-[#555555] hover:bg-[#FFF8E1] hover:text-[#B45309]"
                >
                  #{kw}
                </button>
              ))}
            </div>
          </section>
        )}

        {isDefaultView && <FaqSection />}
      </main>

      <SiteFooter onOpenLegal={setLegalId} />
      <LegalDialog openId={legalId} onClose={() => setLegalId(null)} />
    </div>
  );
}
