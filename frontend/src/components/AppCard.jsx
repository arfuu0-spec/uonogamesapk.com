import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star, BadgeCheck, Download, Gift } from "lucide-react";
import AppIcon from "@/components/AppIcon";
import RippleButton from "@/components/RippleButton";
import { resolveUrl } from "@/lib/api";
import { getBadge } from "@/lib/badge";

export const AppCard = ({ app, index = 0, onDownload }) => {
  const navigate = useNavigate();
  const badge = getBadge(app);
  
  const rankNumber = index + 1;

  const handleClick = (e) => {
    if (window._adCooldown) return;
    window._adCooldown = true;
    setTimeout(() => { window._adCooldown = false; }, 2000);

    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/${app.slug || `app/${app.id}`}`, { state: { app } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      data-testid={`app-card-${app.id}`}
      className="group relative flex cursor-pointer items-center gap-2.5 rounded-[16px] border border-[#E5E7EB] bg-white px-3 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] overflow-visible"
    >
      {/* RANKING NUMBER BADGE */}
      <div className="absolute -left-1.5 -top-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-white shadow-sm border-2 border-white"
           style={{
             backgroundColor: rankNumber === 1 ? "#FFC107" : rankNumber === 2 ? "#9E9E9E" : rankNumber === 3 ? "#CD7F32" : "#333333"
           }}
      >
        <span>{rankNumber}</span>
      </div>

      {/* ULTRA COMPACT APP ICON (h-12 w-12) */}
      <div className="relative shrink-0">
        <AppIcon
          src={resolveUrl(app.icon_url)}
          alt={app.name}
          className="h-12 w-12 rounded-[12px] ring-1 ring-black/5 object-cover shadow-sm"
        />
        {badge && (
          <span
            data-testid={`app-badge-${app.id}`}
            className="absolute -right-1 -top-1 rounded-full px-1 py-0.5 text-[7px] font-extrabold leading-none shadow-sm"
            style={{ color: badge.color, backgroundColor: badge.bg }}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <h3
            className="line-clamp-1 font-display text-xs font-bold leading-tight text-[#111111]"
            data-testid={`app-name-${app.id}`}
          >
            {app.name}
          </h3>
          <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#FFF8E1] px-1.5 py-0.2">
            <Star className="h-2.5 w-2.5 fill-[#FFC107] text-[#FFC107]" />
            <span className="text-[10px] font-bold text-[#111111]">{app.rating?.toFixed(1) || "4.8"}</span>
          </div>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-[#777777]">
          <span>{app.size || "45 MB"}</span>
          {app.verified && (
            <span className="inline-flex items-center gap-0.5 text-[#22C55E]">
              <BadgeCheck className="h-3 w-3" />
              <span className="font-medium">Verified</span>
            </span>
          )}
          <span>👥 {(app.downloads ? (app.downloads * 8).toLocaleString() : "350K")}</span>
        </div>

        {(app.signup_bonus || app.min_withdraw) && (
          <div className="mt-1 flex flex-wrap items-center gap-1" data-testid={`app-rewards-${app.id}`}>
            {app.signup_bonus && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-[#FFC107] to-[#FF9800] px-2 py-0.2 text-[9px] font-extrabold text-white shadow-sm">
                <Gift className="h-2.5 w-2.5" /> Bonus {app.signup_bonus}
              </span>
            )}
            {app.min_withdraw && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#F0FDF4] px-1.5 py-0.2 text-[9px] font-bold text-[#16A34A]">
                W/D {app.min_withdraw}
              </span>
            )}
          </div>
        )}
      </div>

      <RippleButton
        onClick={(e) => { 
          e.stopPropagation(); 
          if (window._adCooldown) return;
          window._adCooldown = true;
          setTimeout(() => { window._adCooldown = false; }, 2000);
          onDownload(app); 
        }}
        data-testid={`download-btn-${app.id}`}
        className="flex shrink-0 items-center gap-1 rounded-full bg-[#FFC107] px-2.5 py-1.5 text-[11px] font-bold text-[#111111] shadow-[0_2px_8px_rgba(255,193,7,0.3)] hover:bg-[#FFB300]"
      >
        <Download className="h-3 w-3" />
        <span className="hidden xs:inline">Get</span>
      </RippleButton>
    </motion.div>
  );
};

export default AppCard;
