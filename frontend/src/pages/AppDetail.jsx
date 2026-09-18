import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Star, BadgeCheck, Download, Gift, ArrowLeft, ShieldCheck, Zap, Wifi, Sparkles, CheckCircle2, Search, X } from "lucide-react";
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

export default function AppDetail() {
  const { id, slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Robust identifier extraction (Checks params first, then falls back to URL path)
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const identifier = slug || id || pathSegments[pathSegments.length - 1];

  // Immediate safeguard if identifier is invalid
  if (!identifier || identifier === "undefined" || identifier === "null" || identifier === "app") {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center">
        <p className="text-base font-bold text-[#111111] mb-2">Invalid Game Link</p>
        <RippleButton onClick={() => navigate("/")} className="rounded-full bg-[#FFC107] px-6 py-2.5 text-xs font-semibold text-[#111111]">
          Go to Home
        </RippleButton>
      </div>
    );
  }

  const cachedData = typeof window !== "undefined" ? localStorage.getItem("yono_apps_perm_cache") : null;
  const parsedCache = useMemo(() => {
    try {
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (e) {
      return null;
    }
  }, [cachedData]);

  const initialApp = useMemo(() => {
    if (location.state?.app) return location.state.app;
    if (parsedCache && parsedCache.apps) {
      return parsedCache.apps.find(a => String(a.id) === String(identifier) || a.slug === identifier);
    }
    return null;
  }, [location.state, parsedCache, identifier]);

  const [app, setApp] = useState(initialApp);
  const [similarApps, setSimilarApps] = useState(() => {
    if (parsedCache && parsedCache.apps && initialApp) {
      return parsedCache.apps.filter(a => String(a.id) !== String(initialApp.id) && a.slug !== initialApp.slug).slice(0, 20);
    }
    return parsedCache?.apps ? parsedCache.apps.slice(0, 20) : [];
  });
  const [loading, setLoading] = useState(!initialApp);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;
    setLoading(true);

    const fetchAppData = async () => {
      try {
        const res = await api.get(`/apps/${identifier}`);
        if (res.data && isMounted) {
          const fetchedApp = res.data.app || res.data;
          setApp(fetchedApp);
          
          const allApps = res.data.similar || (parsedCache ? parsedCache.apps : []);
          const filteredSimilar = allApps.filter(a => String(a.id) !== String(fetchedApp.id) && a.slug !== fetchedApp.slug);
          setSimilarApps(filteredSimilar.slice(0, 20));
        }
      } catch (e) {
        try {
          const listRes = await api.get("/apps?limit=100");
          const all = [...(listRes.data.featured || []), ...(listRes.data.apps || []), ...(listRes.data.trending || [])];
          const found = all.find(a => String(a.id) === String(identifier) || a.slug === identifier);
          if (found && isMounted) {
            setApp(found);
            setSimilarApps(all.filter(a => String(a.id) !== String(found.id) && a.slug !== identifier).slice(0, 20));
          }
        } catch (err) {
          if (!app && isMounted) {
            toast.error("Failed to load app details");
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAppData();
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

  if (loading && !app) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FFC107] border-t-transparent"></div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center">
        <p className="text-base font-bold text-[#111111] mb-2">App not found</p>
        <RippleButton onClick={() => navigate("/")} className="rounded-full bg-[#FFC107] px-6 py-2.5 text-xs font-semibold text-[#111111]">
          Go to Home
        </RippleButton>
      </div>
    );
  }

  return (
    <div className="app-shell pb-10 bg-[#FAFAFA]">
      <SEOHead
        title={`${app.name} Apk Download Latest Version 2026 New Yono`}
        description={app.description || `Download ${app.name} APK latest version for Android free.`}
        canonical={`https://newyono.games/${app.slug || `app/${app.id}`}`}
        image={app.icon_url || "/logo-v2.png"}
      />

      <Header />

      {/* Sticky Top Bar with Back Button & Title */}
      <div className="sticky top-[57px] z-30 flex items-center gap-3 bg-white/90 px-4 py-2.5 backdrop-blur-md border-b border-[#E5E7EB]">
        <button onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[#E5E7EB] text-[#111111] shadow-sm hover:bg-[#F1F1F1]">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="truncate font-display text-xs font-bold text-[#111111]">{app.name}</span>
      </div>

      <main className="space-y-4 px-4 pt-4">
        {/* SEARCH BAR ABOVE GAME ON EVERY PAGE */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777]" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps & games..."
            className="h-11 rounded-full border-[#E5E7EB] bg-white pl-10 pr-10 text-base shadow-[0_4px_14px_rgba(0,0,0,0.03)] focus-visible:ring-[#FFC107] sm:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#F1F1F1] text-[#777777] hover:bg-[#E5E7EB]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {/* App Hero Section */}
        <div className="flex items-start gap-4 rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="relative shrink-0">
            <AppIcon src={resolveUrl(app.icon_url)} alt={app.name} className="h-24 w-24 rounded-[22px] ring-1 ring-black/5 object-cover shadow-md" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-extrabold leading-tight text-[#111111]">{app.name}</h1>
            <p className="mt-0.5 text-xs font-medium text-[#777777]">newyono.games</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5 rounded-full bg-[#FFF8E1] px-2 py-0.5">
                <Star className="h-3.5 w-3.5 fill-[#FFC107] text-[#FFC107]" />
                <span className="text-xs font-bold text-[#111111]">{app.rating?.toFixed(1) || "4.8"}</span>
              </div>
              {app.verified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#22C55E]"><BadgeCheck className="h-4 w-4" /> Verified</span>}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <p className="text-[10px] text-[#777777]">Downloads</p>
            <p className="mt-0.5 font-display text-xs font-bold text-[#111111]">{app.downloads ? `${(app.downloads / 1000).toFixed(1)}K+` : "500K+"}</p>
          </div>
          <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <p className="text-[10px] text-[#777777]">Size</p>
            <p className="mt-0.5 font-display text-xs font-bold text-[#111111]">{app.size || "45 MB"}</p>
          </div>
          <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <p className="text-[10px] text-[#777777]">Version</p>
            <p className="mt-0.5 font-display text-xs font-bold text-[#111111]">v{app.version || "1.0.0"}</p>
          </div>
          <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <p className="text-[10px] text-[#777777]">Requires</p>
            <p className="mt-0.5 font-display text-xs font-bold text-[#111111]">5.0+</p>
          </div>
        </div>

        {/* Bonuses Box */}
        {(app.signup_bonus || app.min_withdraw) && (
          <div className="grid grid-cols-2 gap-3">
            {app.signup_bonus && (
              <div className="flex items-center gap-2.5 rounded-[20px] bg-gradient-to-r from-[#FFF8E1] to-[#FFF3E0] p-3.5 border border-[#FFE082]">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFC107] text-white"><Gift className="h-4 w-4" /></div>
                <div>
                  <p className="text-[10px] font-semibold text-[#B45309]">SIGN-UP BONUS</p>
                  <p className="font-display text-sm font-extrabold text-[#111111]">{app.signup_bonus}</p>
                </div>
              </div>
            )}
            {app.min_withdraw && (
              <div className="flex items-center gap-2.5 rounded-[20px] bg-[#F0FDF4] p-3.5 border border-[#DCFCE7]">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22C55E] text-white"><ShieldCheck className="h-4 w-4" /></div>
                <div>
                  <p className="text-[10px] font-semibold text-[#166534]">MIN. WITHDRAW</p>
                  <p className="font-display text-sm font-extrabold text-[#111111]">{app.min_withdraw}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Download Button */}
        <div className="pt-1">
          <RippleButton onClick={() => handleDownload(app)} className="w-full flex items-center justify-center gap-2 rounded-[22px] bg-[#FFC107] py-4 text-base font-extrabold text-[#111111] shadow-[0_8px_24px_rgba(255,193,7,0.4)] hover:bg-[#FFB300]">
            <Download className="h-5 w-5" />
            <span>Download APK ({app.size || "45 MB"})</span>
          </RippleButton>
          <p className="mt-2 text-center text-[11px] text-[#777777]">🔒 Safe & virus-scanned • 500,013 downloads</p>
        </div>

        {/* PEOPLE ALSO LIKE SECTION (20 GAMES) */}
        {similarApps.length > 0 && (
          <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF8E1] text-[#FFC107]">
                <Sparkles className="h-4 w-4 fill-[#FFC107]" />
              </span>
              <div>
                <h2 className="font-display text-sm font-bold text-[#111111]">People also like</h2>
                <p className="text-[10px] text-[#888888]">Top trending gaming apps for you</p>
              </div>
            </div>
            <div className="space-y-3 pt-1">
              {similarApps.map((simApp, idx) => (
                <AppCard key={simApp.id} app={simApp} index={idx} onDownload={handleDownload} />
              ))}
            </div>
          </div>
        )}

        {/* GAME-SPECIFIC SEO SECTION */}
        <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-display text-base font-bold text-[#111111] flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#FFC107] fill-[#FFC107]" /> About {app.name} on newyono.games
          </h2>
          <p className="text-xs leading-relaxed text-[#555555]">
            Download {app.name} v{app.version || "1.0.0"} safely from newyono.games. Experience fast withdrawals, a massive ₹501 welcome bonus, and secure gaming in 2026. Get the latest updated APK version with optimized performance.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1 text-[11px] font-medium text-[#555555]">#{app.name} APK Download</span>
            <span className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1 text-[11px] font-medium text-[#555555]">#{app.name} ₹501 Bonus</span>
            <span className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1 text-[11px] font-medium text-[#555555]">#{app.name} 2026 Latest Version</span>
            <span className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1 text-[11px] font-medium text-[#555555]">Real Cash {app.name} App</span>
          </div>
        </div>

        {/* ABOUT THE GAME */}
        <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-display text-base font-bold text-[#111111] flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#FFC107] fill-[#FFC107]" /> About the Game
          </h2>
          <p className="text-xs leading-relaxed text-[#555555]">
            {app.description || `${app.name} is a premium gaming experience built for smooth, lag-free play on Android. Enjoy stunning visuals, responsive controls, and hours of engaging gameplay — all in a lightweight package that installs in seconds.`}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-2.5 rounded-xl bg-[#F8F9FA] p-3">
              <Zap className="h-4 w-4 text-[#FFC107] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#111111]">Smooth 60 FPS</p>
                <p className="text-[10px] text-[#777777]">Optimized for buttery gameplay.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-[#F8F9FA] p-3">
              <Wifi className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#111111]">Online & Offline</p>
                <p className="text-[10px] text-[#777777]">Play anytime anywhere.</p>
              </div>
            </div>
          </div>
        </div>

        {/* What's New */}
        <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-display text-sm font-bold text-[#111111] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FFC107]" /> What's New
          </h2>
          <p className="text-xs leading-relaxed text-[#555555]">
            Performance improvements, new tournaments and a smoother, faster gaming experience.
          </p>
        </div>

        {/* Additional Information */}
        <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-display text-sm font-bold text-[#111111]">Additional Information</h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-[#F1F1F1] pb-2"><span className="text-[#777777]">Version</span><span className="font-medium text-[#111111]">{app.version || "1.0.0"}</span></div>
            <div className="flex justify-between border-b border-[#F1F1F1] pb-2"><span className="text-[#777777]">Size</span><span className="font-medium text-[#111111]">{app.size || "45 MB"}</span></div>
            <div className="flex justify-between border-b border-[#F1F1F1] pb-2"><span className="text-[#777777]">Category</span><span className="font-medium text-[#111111]">{app.category || "Games"}</span></div>
            <div className="flex justify-between border-b border-[#F1F1F1] pb-2"><span className="text-[#777777]">Requires</span><span className="font-medium text-[#111111]">Android 5.0+</span></div>
            <div className="flex justify-between pb-1"><span className="text-[#777777]">Developer</span><span className="font-medium text-[#111111]">newyono.games</span></div>
          </div>
        </div>

        {/* Features & Permissions */}
        <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="font-display text-sm font-bold text-[#111111] mb-3">Features</h2>
            <div className="flex flex-wrap gap-2">
              {["Real Cash Games", "Instant Withdrawal", "24/7 Support", "100% Safe & Secure", "Daily Bonus", "Refer & Earn"].map((feat, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1.5 text-[11px] font-medium text-[#555555]">
                  <CheckCircle2 className="h-3 w-3 text-[#22C55E]" /> {feat}
                </span>
              ))}
            </div>
          </div>
          <div className="border-t border-[#E5E7EB] pt-4">
            <h2 className="font-display text-sm font-bold text-[#111111] mb-3">Permissions</h2>
            <ul className="space-y-2 text-[11px] text-[#555555]">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#FFC107]"></span> Storage</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#FFC107]"></span> Network access</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#FFC107]"></span> Phone state</li>
            </ul>
          </div>
        </div>

        <FaqSection />
      </main>

      <SiteFooter />
    </div>
  );
}
