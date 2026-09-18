import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Star, BadgeCheck, Download, Gift, ArrowLeft, ShieldCheck, Zap, Wifi, Sparkles, CheckCircle2, Search, X, Flame, Home } from "lucide-react";
import api, { API, resolveUrl } from "@/lib/api";
import SEOHead from "@/components/SEOHead";
import AppIcon from "@/components/AppIcon";
import RippleButton from "@/components/RippleButton";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import FaqSection from "@/components/FaqSection";
import { Input } from "@/components/ui/input";

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "");
}

const LANDING_100_KEYWORDS = [
  "yono games all app", "yono games app", "yono app", "you games online", "all your game store", "you know games", "yono app link", "all yono game new", "rummy game app store", "new yono games", "yono games com apk", "yono game apk download for android latest version", "yono games apk lsgd", "yono games 2", "you know game", "yono game google", "yono genes", "all your game app download", "all you game", "all your app", "all many games", "all your game apk latest version", "you game game", "all your games download free", "all your gamespin crush", "yono games apk", "yono all games", "all your game apk", "all yono games list apk", "yono game home", "yono india", "all you know game", "all new game", "yono arcade all apk", "yono rummy games for android", "yono games all new apk", "yono games all new 2026 apk"
];

export default function AppDetail() {
  const { id, slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const identifier = slug || id || pathSegments[pathSegments.length - 1];

  const cachedData = typeof window !== "undefined" ? localStorage.getItem("yono_apps_perm_cache") : null;
  const parsedCache = useMemo(() => {
    try {
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (e) {
      return null;
    }
  }, [cachedData]);

  const allCachedApps = useMemo(() => {
    if (!parsedCache) return [];
    return [...(parsedCache.apps || []), ...(parsedCache.featured || []), ...(parsedCache.trending || [])];
  }, [parsedCache]);

  const initialApp = useMemo(() => {
    if (location.state?.app) return location.state.app;
    if (allCachedApps.length > 0 && identifier && identifier !== "undefined") {
      return allCachedApps.find(a => 
        String(a.id) === String(identifier) || 
        a.slug === identifier || 
        normalize(a.name) === normalize(identifier)
      ) || allCachedApps[0];
    }
    return allCachedApps[0] || null;
  }, [location.state, allCachedApps, identifier]);

  const [app, setApp] = useState(initialApp);
  const [allStoreApps, setAllStoreApps] = useState(allCachedApps);
  
  const [similarApps, setSimilarApps] = useState(() => {
    const fallbackList = allCachedApps.length > 0 ? allCachedApps : (parsedCache?.apps || []);
    if (fallbackList.length > 0) {
      const currentId = initialApp?.id;
      return fallbackList.filter(a => String(a.id) !== String(currentId)).slice(0, 20);
    }
    return [];
  });

  const [loading, setLoading] = useState(!initialApp && allCachedApps.length === 0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!identifier || identifier === "undefined" || identifier === "null") {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchAppData = async () => {
      try {
        const res = await api.get(`/apps/${identifier}`);
        if (res.data && isMounted) {
          const fetchedApp = res.data.app || res.data;
          setApp(fetchedApp);
          
          const listRes = await api.get("/apps?limit=100");
          const all = [...(listRes.data.featured || []), ...(listRes.data.apps || []), ...(listRes.data.trending || [])];
          if (all.length > 0) {
            setAllStoreApps(all);
            const filteredSimilar = all.filter(a => String(a.id) !== String(fetchedApp.id) && a.slug !== fetchedApp.slug);
            setSimilarApps(filteredSimilar.slice(0, 20));
          }
        }
      } catch (e) {
        try {
          const listRes = await api.get("/apps?limit=100");
          const all = [...(listRes.data.featured || []), ...(listRes.data.apps || []), ...(listRes.data.trending || [])];
          if (all.length > 0) {
            setAllStoreApps(all);
            const found = all.find(a => String(a.id) === String(identifier) || a.slug === identifier || normalize(a.name) === normalize(identifier));
            if (found && isMounted) {
              setApp(found);
              setSimilarApps(all.filter(a => String(a.id) !== String(found.id) && a.slug !== identifier).slice(0, 20));
            }
          }
        } catch (err) {
          // Keep cached app if API fails
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (!initialApp) {
      fetchAppData();
    } else {
      setLoading(false);
      fetchAppData();
    }

    return () => { isMounted = false; };
  }, [identifier]);

  const handleDownload = (targetApp) => {
    const currentApp = targetApp || app;
    if (!currentApp) return;

    if (currentApp.apk_url && currentApp.apk_url.startsWith("http")) {
      window.open(currentApp.apk_url, "_blank"); 
      api.get(`/apps/${currentApp.id}/download`).catch(() => {});
    } else {
      window.open(`${API}/apps/${currentApp.id}/download`, "_blank");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeywordClick = (kw) => {
    const cleanKw = kw.replace(/apk|download|2026|app|online|india|game|games/gi, "").trim();
    navigate(`/?search=${encodeURIComponent(cleanKw)}`);
  };

  if (loading && !app) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FFC107] border-t-transparent"></div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] p-4 text-center text-[#111111]">
        <p className="text-base font-bold mb-2">App not found ❌</p>
        <RippleButton onClick={() => navigate("/")} className="rounded-full bg-[#FFC107] px-6 py-2.5 text-xs font-semibold text-[#111111]">
          Go to Home 🏠
        </RippleButton>
      </div>
    );
  }

  return (
    <div className="app-shell pb-10 bg-[#FAFAFA] text-[#111111] min-h-screen relative">
      <SEOHead
        title={`${app.name} APK Download 2026 - 501 Bonus Latest Version`}
        description={`Download ${app.name} APK latest version. Play best Yono Games, Rummy Games & Slots Games with ₹501 sign-up bonus and instant UPI withdrawal on newyono.games.`}
        canonical={`https://newyono.games/${app.slug || `app/${app.id}`}`}
        image={app.icon_url || "/logo-v2.png"}
      />

      {/* RIGHT SIDE FLOATING SOCIAL SIDEBAR */}
      <div className="fixed right-2 top-1/3 z-50 flex flex-col gap-2">
        <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#229ED9] text-white shadow-xl hover:scale-110 transition-transform">
          ✈️
        </a>
        <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-xl hover:scale-110 transition-transform">
          💬
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2] text-white shadow-xl hover:scale-110 transition-transform">
          📘
        </a>
        <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111827] text-white shadow-xl hover:scale-110 transition-transform">
          🎧
        </a>
      </div>

      {/* Top Header Bar with Larger Home & Back Buttons */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-[#FAFAFA]/95 px-4 py-3 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#111111] shadow-md hover:bg-gray-100 transition-transform border border-[#E5E7EB]" aria-label="Go to Home">
            <Home className="h-5 w-5" />
          </button>
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#111111] shadow-md hover:bg-gray-100 transition-transform border border-[#E5E7EB]" aria-label="Go Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
        <span className="truncate font-display text-sm font-bold text-[#111111] max-w-[180px] sm:max-w-xs">{app.name} 📥</span>
      </div>

      <main className="space-y-6 px-4 pt-6">
        {/* HERO MOCKUP SECTION WITH ANIMATED GLOWING DOWNLOAD BUTTON */}
        <div className="rounded-[24px] bg-white text-[#111111] p-6 text-center shadow-2xl relative border border-[#E5E7EB]">
          <div className="inline-block mb-3">
            <div className="relative flex items-center justify-center">
              <AppIcon src={resolveUrl(app.icon_url)} alt={app.name} className="relative h-24 w-24 rounded-[22px] object-cover shadow-lg border border-[#E5E7EB]" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-black text-[#111111] uppercase tracking-wide">{app.name} 👑</h1>
          <p className="mt-1 text-sm font-medium text-[#555555]">Play 100+ Games • Win Upto ₹5 Crores Daily 💰</p>
          <p className="text-xs text-[#777777] mt-0.5">Play on India's Best Gaming App 🇮🇳</p>

          {/* MAIN ANIMATED DOWNLOAD CTA */}
          <div className="mt-5 max-w-sm mx-auto">
            <RippleButton 
              onClick={() => handleDownload(app)} 
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#FFC107] py-4 text-base font-black text-[#111111] shadow-[0_0_25px_rgba(255,193,7,0.7)] animate-pulse hover:bg-[#FFB300] transition-all"
            >
              <Download className="h-5 w-5 text-[#111111]" />
              <span>Download APK ({app.size || "45 MB"}) 📥</span>
            </RippleButton>
            <p className="mt-2 text-center text-xs font-semibold text-[#D97706]">🔥 Get 5% Bonus on every Add Cash up to ₹100,000 🎁</p>
          </div>
        </div>

        {/* COMPACT & SLEEK IMPS / UPI TRUST BADGES SECTION */}
        <div className="rounded-[20px] bg-[#007A48] text-white p-3.5 shadow-xl border border-white/20 space-y-2">
          <p className="text-center text-[11px] font-bold text-white">Withdraw winnings directly to your account 💸</p>
          <div className="grid grid-cols-2 gap-2 items-center justify-center border-t border-b border-white/15 py-2">
            <div className="text-center border-r border-white/15">
              <span className="font-display font-black text-sm tracking-tighter text-white">IMPS 🏦</span>
              <p className="text-[9px] text-white/70">Bank Transfer ⚡</p>
            </div>
            <div className="text-center">
              <span className="font-display font-black text-sm tracking-tighter text-yellow-300">UPI ⚡</span>
              <p className="text-[9px] text-white/70">UPI Transfer 🚀</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-white/90">Truly Best India Game Platform • 24x7 Support 🛡️</p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777]" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search other games... 🔍"
              className="h-11 rounded-full border-[#E5E7EB] bg-white pl-10 pr-10 text-base text-[#111111] placeholder:text-[#777777] shadow-md focus-visible:ring-[#FFC107]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-gray-200 text-[#777777] hover:bg-gray-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {/* Live Suggestions Dropdown */}
          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-60 overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl p-2 space-y-1 text-[#111111]">
              {(() => {
                const q = searchQuery.toLowerCase();
                const sourceList = allStoreApps.length > 0 ? allStoreApps : (parsedCache?.apps || similarApps);
                const matched = sourceList.filter(a => a.name.toLowerCase().includes(q)).slice(0, 6);
                if (matched.length === 0) {
                  return <div className="p-3 text-center text-xs text-[#777777]">No games found ❌</div>;
                }
                return matched.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSearchQuery("");
                      navigate(`/${item.slug || item.id}`, { state: { app: item } });
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <AppIcon src={resolveUrl(item.icon_url)} alt={item.name} className="h-12 w-12 rounded-xl object-cover shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold text-[#111111] truncate">{item.name} 🎮</p>
                      <p className="text-xs text-[#777777]">⭐ {item.rating?.toFixed(1) || "4.8"} • {item.size || "45 MB"} 📦</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* PEOPLE ALSO LIKE SECTION WITH ANIMATED DOWNLOAD BUTTONS */}
        {similarApps.length > 0 && (
          <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF8E1] text-[#B45309]">
                <Sparkles className="h-4 w-4 fill-[#B45309]" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-[#111111]">People also like 🔥</h2>
                <p className="text-xs text-[#777777]">Top trending gaming apps for you ⭐</p>
              </div>
            </div>
            <div className="space-y-3 pt-1">
              {similarApps.map((simApp, idx) => (
                <div key={simApp.id} onClick={() => navigate(`/${simApp.slug || simApp.id}`, { state: { app: simApp } })} className="flex items-center gap-3.5 rounded-2xl bg-[#FAFAFA] p-3.5 border border-[#E5E7EB] hover:bg-gray-50 cursor-pointer transition-all shadow-sm">
                  <AppIcon src={resolveUrl(simApp.icon_url)} alt={simApp.name} className="h-16 w-16 rounded-2xl object-cover shadow-md shrink-0 border border-[#E5E7EB]" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm font-extrabold text-[#111111] truncate">{simApp.name} 🎮</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-[#B45309]">⭐ {simApp.rating?.toFixed(1) || "4.8"}</span>
                      <span className="text-xs text-[#777777]">• {simApp.size || "45 MB"} 📦</span>
                    </div>
                    {simApp.signup_bonus && (
                      <span className="inline-block mt-1 rounded-full bg-[#FFF8E1] px-2 py-0.5 text-[10px] font-bold text-[#B45309] border border-[#FFE082]">
                        🎁 {simApp.signup_bonus} 🎉
                      </span>
                    )}
                  </div>
                  <RippleButton onClick={(e) => { e.stopPropagation(); handleDownload(simApp); }} className="rounded-full bg-[#FFC107] px-4 py-2 text-xs font-black text-[#111111] shadow-[0_0_15px_rgba(255,193,7,0.6)] animate-pulse hover:bg-[#FFB300] shrink-0">
                    Download 📥
                  </RippleButton>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STRONG GAME-SPECIFIC SEO DESCRIPTION */}
        <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-xl space-y-3 text-[#111111]">
          <h2 className="font-display text-base font-bold text-[#B45309] flex items-center gap-2">
            <Zap className="h-4 w-4 fill-[#B45309]" /> About {app.name} on newyono.games 🚀
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-[#555555]">
            Welcome to the official download page for <strong>{app.name}</strong> on newyono.games — India's premier Yono Games, Rummy Games &amp; Slots Games platform 🎮. Experience the thrill of real cash gaming with a massive <strong>₹501 sign-up bonus</strong>, instant UPI withdrawals, and buttery-smooth 60 FPS performance in 2026 💰. Discover why millions of players trust {app.name} for secure card games, slots, and daily rewards 👑.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1 text-xs font-medium text-[#555555]">#{app.name} APK Download 📥</span>
            <span className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1 text-xs font-medium text-[#555555]">#{app.name} ₹501 Bonus 🎁</span>
            <span className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1 text-xs font-medium text-[#555555]">Yono Rummy &amp; Slots 🎰</span>
          </div>
        </div>

        {/* KEYWORDS CLOUD */}
        <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-xl space-y-3 text-[#111111]">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FFF8E1] text-[#FFC107]">
              <Flame className="h-4 w-4 fill-[#FFC107]" />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-[#111111]">Top Yono Search Keywords 🔥</h3>
              <p className="text-xs text-[#777777]">Click any keyword to search and explore 🔍</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {LANDING_100_KEYWORDS.slice(0, 20).map((kw, i) => (
              <button
                key={i}
                onClick={() => handleKeywordClick(kw)}
                className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1 text-xs font-medium text-[#555555] hover:bg-[#FFC107] hover:text-[#111111] transition-colors text-left cursor-pointer"
              >
                #{kw} ✨
              </button>
            ))}
          </div>
        </div>

        <FaqSection />
      </main>

      <SiteFooter />
    </div>
  );
}
