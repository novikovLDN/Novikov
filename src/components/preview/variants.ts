/**
 * Список направлений — в отдельном модуле без "use client".
 *
 * Серверная страница маршрута берёт его для generateStaticParams, а
 * импорт значения из клиентского модуля в серверный на сборке валил
 * сбор данных страницы.
 */
export const VARIANTS = ["a", "b", "c"] as const;
export type Variant = (typeof VARIANTS)[number];
