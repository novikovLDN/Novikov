interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export default function FeatureCard({ icon, title, description, className = "" }: FeatureCardProps) {
  return (
    <div className={`bg-card rounded-2xl p-4 flex items-center gap-4 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-card-hover flex items-center justify-center shrink-0 text-2xl">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}
