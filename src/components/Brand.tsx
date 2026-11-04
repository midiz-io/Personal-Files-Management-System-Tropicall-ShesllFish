import localLogo from "@/assets/employee-files-logo.webp";

export const BRAND_LOGO_CDN =
  "https://storetec.net/wp-content/uploads/2025/03/What-Should-be-in-an-Employee-Personnel-File.webp";

export const BrandLogo = ({
  size = 48,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <img
    src={BRAND_LOGO_CDN}
    crossOrigin="anonymous"
    onError={(e) => {
      // Fallback to local copy if offline or CDN is unreachable
      e.currentTarget.onerror = null;
      e.currentTarget.src = localLogo;
    }}
    alt="Employee Personal Files — Employee File's"
    width={size}
    height={size}
    className={`rounded-xl object-cover border-2 border-primary/20 shadow-sm ${className}`}
    style={{ width: size, height: size }}
  />
);

export const BrandHeader = () => (
  <div className="flex items-center gap-3">
    <BrandLogo size={38} className="sm:!w-11 sm:!h-11" />
    <div className="leading-tight">
      <div className="font-bold text-foreground tracking-wide text-sm sm:text-base">
        Employee Personal Files
      </div>
      <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">
        Employee File's
      </div>
    </div>
  </div>
);