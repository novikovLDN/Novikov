export default function Footer() {
  return (
    <footer className="mt-auto px-4 py-6 text-center text-sm text-muted max-w-lg mx-auto w-full">
      <div className="flex flex-wrap justify-center gap-4 mb-3">
        <a href="#" className="hover:text-foreground transition-colors">
          Вид услуги и тарифы
        </a>
        <a href="#" className="hover:text-foreground transition-colors">
          Условия предоставления услуг
        </a>
      </div>
      <p className="mb-1">
        Политика конфиденциальности
      </p>
      <p className="text-xs text-muted/60 mt-3">
        Atlas Secure VPN Service
      </p>
    </footer>
  );
}
