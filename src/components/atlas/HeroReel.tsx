import Reel from "./Reel";

/**
 * Фон первого экрана — анимация объёмных форм, отрендеренная в Blender.
 *
 * Запрос владельца 11.09.2026: «прям 3D объёмные элементы по типу Yandex
 * Tech, плавно, красиво и технологично». Кобальтовое кольцо-канал,
 * сквозь которое пролетают металлические капсулы, керамические и
 * стеклянная сферы, ступенчатая шайба. Петля 8 с без шва; исходник —
 * Blender, сцена «AtlasObjects» (прежний рельеф — сцена «AtlasRelief»).
 *
 * Жизнь сохранена: видео идёт за рукой (PointerDrift пишет --px/--py на
 * .a-cover) и «ныряет» при уходе первого экрана (atlas.css, 6.6).
 * На телефоне кадр 16:9 вписан полосой между заголовком и лидом
 * (atlas.css, @media max-width 720px), чтобы не ложиться под текст.
 *
 * Загрузка и постер — общий проигрыватель Reel.
 */
export const POSTER = "/media/hero-objects.jpg";

export default function HeroReel() {
  return (
    <Reel
      className="a-reel"
      webm="/media/hero-objects.webm"
      mp4="/media/hero-objects.mp4"
      poster={POSTER}
      eager
    />
  );
}
