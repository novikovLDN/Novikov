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
  iconBg = "bg-[color:var(--px-accent-dim)]",
}: FeatureCardProps) {
  return (
    <div
      /* Фиолетовое свечение при наведении убрано: в системе один
         акцент, и это оранжевый. */
      className={`px-card p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 ${className}`}
    >
      <div
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="font-bold text-sm sm:text-base text-[color:var(--px-text)] leading-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[color:var(--px-text-3)] mt-0.5 leading-snug">{description}</p>
      </div>
    </div>
  );
}
