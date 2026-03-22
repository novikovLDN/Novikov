interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  iconBg?: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
  className = "",
  iconBg = "bg-card-hover",
}: FeatureCardProps) {
  return (
    <div
      className={`bg-card border border-border/50 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 transition-colors hover:bg-card-hover ${className}`}
    >
      <div
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted mt-0.5 leading-snug">{description}</p>
      </div>
    </div>
  );
}
