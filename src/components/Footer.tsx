export default function Footer() {
  return (
    <footer className="mt-auto px-4 sm:px-6 py-6 sm:py-8 text-center max-w-2xl mx-auto w-full safe-bottom">
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-3 text-xs sm:text-sm">
        <a href="#" className="text-muted hover:text-foreground transition-colors">
          Вид услуги и тарифы
        </a>
        <a href="#" className="text-muted hover:text-foreground transition-colors">
          Условия предоставления услуг
        </a>
      </div>
      <a href="#" className="text-xs sm:text-sm text-muted hover:text-foreground transition-colors">
        Политика конфиденциальности
      </a>
      <p className="text-[11px] sm:text-xs text-muted/50 mt-4">
        Atlas Secure VPN Service
      </p>
    </footer>
  );
}
