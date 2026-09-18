import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Star, BadgeCheck, Download, Gift, ArrowLeft, ShieldCheck, Zap, Wifi, Sparkles, CheckCircle2, Search, X, Flame } from "lucide-react";
import { toast } from "sonner";
import api, { API, resolveUrl } from "@/lib/api";
import SEOHead from "@/components/SEOHead";
import AppIcon from "@/components/AppIcon";
import RippleButton from "@/components/RippleButton";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import FaqSection from "@/components/FaqSection";
import AppCard from "@/components/AppCard";
import { Input } from "@/components/ui/input";

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "");
}

const GAME_KEYWORDS = [
  "Yono Games", "Yono Rummy", "Rummy Games", "Slots Games", "Casino Games", "Teen Patti Real Cash",
  "New Yono Apps 2026", "Best Rummy App India", "Sign Up Bonus 501", "Instant UPI Withdrawal",
  "Mod APK Download", "Yono VIP Program", "Daily Jackpot Win", "Safe APK Store", "Online Card Games",
  "Yono All Games List", "Winning Strategies", "Fastest Withdrawal App", "Trusted Rummy Platform",
  "Android Gaming Hub", "Free Bonus Apps", "Real Money Games", "Latest Version Update", "Ind Rummy APK",
  "Gold Rummy Download", "Yono Ludo App", "Teen Patti Gold", "Dragon Tiger Game", "Andar Bahar Online"
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

    toast.success(`Opening: ${currentApp.name}`, { description: `${currentApp.size || "45 MB"} • v${currentApp.version || "1.0"}` });
    
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
      <div className="app-shell flex min-h-screen items-center justify-center bg-[#093527]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FFC107] border-t-transparent"></div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center bg-[#093527] p-4 text-center text-white">
        <p className="text-base font-bold mb-2">App not found</p>
        <RippleButton onClick={() => navigate("/")} className="rounded-full bg-[#FFC107] px-6 py-2.5 text-xs font-semibold text-[#111111]">
          Go to Home
        </RippleButton>
      </div>
    );
  }

  return (
    <div className="app-shell pb-10 bg-gradient-to-b from-[#0F4C3A] via-[#093527] to-[#051F17] text-white min-h-screen relative">
      <SEOHead
        title={`${app.name} APK Download 2026 - 501 Bonus Latest Version`}
        description={`Download ${app.name} APK latest version. Play best Yono Games, Rummy Games & Slots Games with ₹501 sign-up bonus and instant UPI withdrawal on newyono.games.`}
        canonical={`https://newyono.games/${app.slug || `app/${app.id}`}`}
        image={app.icon_url || "/logo-v2.png"}
      />

      {/* FLOATING SOCIAL SIDEBAR (Casino Reference Style) */}
      <div className="fixed right-2 top-1/3 z-50 flex flex-col gap-2.5">
        <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl hover:scale-110 transition-transform">
          💬
        </a>
        <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#229ED9] text-white shadow-xl hover:scale-110 transition-transform">
          ✈️
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-xl hover:scale-110 transition-transform">
          📘
        </a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF0000] text-white shadow-xl hover:scale-110 transition-transform">
          ▶️
        </a>
      </div>

      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 bg-[#093527]/95 px-4 py-3 backdrop-blur-md border-b border-white/10">
        <button onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white shadow-sm hover:bg-white/20">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="truncate font-display text-sm font-bold text-[#FFC107]">{app.name} - Official Download</span>
      </div>

      <main className="space-y-5 px-4 pt-4">
        {/* CASINO HERO BANNER SECTION */}
        <div className="relative rounded-[24px] border border-[#FFC107]/40 bg-gradient-to-b from-[#0D5C45] to-[#072E22] p-5 text-center shadow-2xl overflow-hidden">
          <div className="absolute top-2 right-2 rounded-full bg-[#FFC107] px-3 py-0.5 text-[10px] font-black text-[#093527]">
            100% SECURED
          </div>
          <div className="flex justify-center mb-3">
            <AppIcon src={resolveUrl(app.icon_url)} alt={app.name} className="h-24 w-24 rounded-[22px] object-cover shadow-2xl ring-2 ring-[#FFC107]" />
          </div>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-wider">{app.name}</h1>
          <p className="mt-1 text-xs text-[#A7F3D0] font-medium">Play over 60+ Games and Win Cash Daily</p>

          <div className="mt-4 grid grid-cols-3 gap-2 bg-black/20 rounded-xl p-3 border border-white/10 text-center">
            <div>
              <p className="text-[10px] text-gray-300">Downloads</p>
              <p className="font-bold text-sm text-[#FFC107]">500K+</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-300">Version</p>
              <p className="font-bold text-sm text-white">v{app.version || "1.0"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-300">Rating</p>
              <p className="font-bold text-sm text-yellow-400">⭐ {app.rating?.toFixed(1) || "4.8"}</p>
            </div>
          </div>

          {/* Bonuses Box */}
          <div className="mt-4 flex gap-2 justify-center">
            {app.signup_bonus && (
              <span className="rounded-full bg-[#FFC107] px-3 py-1 text-xs font-black text-[#093527] shadow-md">
                🎁 Bonus {app.signup_bonus}
              </span>
            )}
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white shadow-md">
              ⚡ Instant UPI Withdrawal
            </span>
          </div>

          {/* GRAND DOWNLOAD BUTTON (Casino Style) */}
          <div className="mt-5">
            <div className="mb-1 text-center text-xs font-bold text-red-400 animate-pulse">🔥 Get {app.signup_bonus || "₹501"} Bonus on Sign Up</div>
            <RippleButton onClick={() => handleDownload(app)} className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00E676] to-[#00C853] py-4 text-base font-black text-[#093527] shadow-[0_8px_25px_rgba(0,230,118,0.5)] hover:scale-[1.02] transition-transform">
              <Download className="h-5 w-5" />
              <span>DOWNLOAD APP ({app.size || "45 MB"})</span>
            </RippleButton>
            <p className="mt-2 text-center text-[10px] text-gray-300">🔒 Safe & virus-scanned • Direct APK Server</p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search other games..."
              className="h-11 rounded-full border-white/20 bg-[#072E22] pl-10 pr-10 text-sm text-white shadow-md focus-visible:ring-[#FFC107]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {/* Live Suggestions Dropdown */}
          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-[#072E22] shadow-2xl p-2 space-y-1 text-white">
              {(() => {
                const q = searchQuery.toLowerCase();
                const sourceList = allStoreApps.length > 0 ? allStoreApps : (parsedCache?.apps || similarApps);
                const matched = sourceList.filter(a => a.name.toLowerCase().includes(q)).slice(0, 6);
                if (matched.length === 0) {
                  return <div className="p-3 text-center text-xs text-gray-400">No games found</div>;
                }
                return matched.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSearchQuery("");
                      navigate(`/${item.slug || item.id}`, { state: { app: item } });
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <AppIcon src={resolveUrl(item.icon_url)} alt={item.name} className="h-10 w-10 rounded-xl object-cover shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-300">⭐ {item.rating?.toFixed(1) || "4.8"} • {item.size || "45 MB"}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* PEOPLE ALSO LIKE SECTION */}
        {similarApps.length > 0 && (
          <div className="rounded-[22px] border border-white/10 bg-[#072E22] p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FFC107] text-[#093527]">
                <Sparkles className="h-4 w-4 fill-[#093527]" />
              </span>
              <div>
                <h2 className="font-display text-sm font-bold text-white">Top Games On {app.name}</h2>
                <p className="text-[10px] text-gray-300">Play over 60+ Games and Win Cash</p>
              </div>
            </div>
            <div className="space-y-2.5 pt-1">
              {similarApps.map((simApp, idx) => (
                <div key={simApp.id} onClick={() => navigate(`/${simApp.slug || simApp.id}`, { state: { app: simApp } })} className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all">
                  <AppIcon src={resolveUrl(simApp.icon_url)} alt={simApp.name} className="h-12 w-12 rounded-xl object-cover shadow-md shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xs font-bold text-white truncate">{simApp.name}</h3>
                    <p className="text-[10px] text-yellow-400">⭐ {simApp.rating?.toFixed(1) || "4.8"} • {simApp.size || "45 MB"}</p>
                  </div>
                  <RippleButton onClick={(e) => { e.stopPropagation(); handleDownload(simApp); }} className="rounded-full bg-[#FFC107] px-3 py-1.5 text-xs font-bold text-[#093527]">
                    Download
                  </RippleButton>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STRONG GAME-SPECIFIC SEO DESCRIPTION */}
        <div className="rounded-[22px] border border-white/10 bg-[#072E22] p-4 shadow-xl space-y-3 text-white">
          <h2 className="font-display text-sm font-bold text-[#FFC107] flex items-center gap-2">
            <Zap className="h-4 w-4 fill-[#FFC107]" /> About {app.name} on newyono.games
          </h2>
          <p className="text-xs leading-relaxed text-gray-300">
            Welcome to the official download page for <strong>{app.name}</strong> on newyono.games — India's premier Yono Games, Rummy Games &amp; Slots Games platform. Experience the thrill of real cash gaming with a massive <strong>₹501 sign-up bonus</strong>, instant UPI withdrawals, and buttery-smooth 60 FPS performance in 2026. Discover why millions of players trust {app.name} for secure card games, slots, and daily rewards.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-gray-300">#{app.name} APK Download</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-gray-300">#{app.name} ₹501 Bonus</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-gray-300">Yono Rummy & Slots</span>
          </div>
        </div>

        {/* KEYWORDS CLOUD */}
        <div className="rounded-[20px] border border-white/10 bg-[#072E22] p-4 shadow-xl space-y-2.5 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-[#FFC107] text-[#093527]">
              <Flame className="h-3.5 w-3.5 fill-[#093527]" />
            </span>
            <div>
              <h3 className="font-display text-xs font-bold text-white">Top Yono &amp; Rummy Game Keywords</h3>
              <p className="text-[9px] text-gray-300">Click any keyword to search and explore</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {GAME_KEYWORDS.map((kw, i) => (
              <button
                key={i}
                onClick={() => handleKeywordClick(kw)}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-gray-300 hover:bg-[#FFC107] hover:text-[#093527] transition-colors text-left cursor-pointer"
              >
                #{kw}
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
