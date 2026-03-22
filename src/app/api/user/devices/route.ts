import { NextResponse } from "next/server";

const devices = [
  {
    id: "android",
    name: "Android",
    icon: "🤖",
    platform: "android",
    downloadUrl: "#",
    instructions: [
      "Скачайте приложение из Google Play",
      "Откройте приложение и вставьте ваш VPN-ключ",
      "Нажмите «Подключиться»",
    ],
  },
  {
    id: "ios",
    name: "iPhone / iPad",
    icon: "🍎",
    platform: "ios",
    downloadUrl: "#",
    instructions: [
      "Скачайте приложение из App Store",
      "Откройте приложение и вставьте ваш VPN-ключ",
      "Нажмите «Подключиться»",
    ],
  },
  {
    id: "windows",
    name: "Windows",
    icon: "🪟",
    platform: "windows",
    downloadUrl: "#",
    instructions: [
      "Скачайте клиент для Windows",
      "Установите и запустите программу",
      "Вставьте VPN-ключ и подключитесь",
    ],
  },
  {
    id: "macos",
    name: "macOS",
    icon: "🍏",
    platform: "macos",
    downloadUrl: "#",
    instructions: [
      "Скачайте клиент для macOS",
      "Установите и откройте приложение",
      "Вставьте VPN-ключ и подключитесь",
    ],
  },
  {
    id: "tv",
    name: "Android/Google TV",
    icon: "📺",
    platform: "tv",
    downloadUrl: "#",
    instructions: [
      "Установите приложение на TV из Google Play",
      "Откройте и введите VPN-ключ",
      "Подключитесь",
    ],
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: devices,
  });
}
