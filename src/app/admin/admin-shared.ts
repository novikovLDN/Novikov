/** Общие для админки типы, подписи и форматирование. */

export interface UserInfo {
  id: string;
  email: string;
  createdAt: string;
  subscriptionEnd: string;
  subscriptionPlan: string;
  telegramLinked: boolean;
  registrationIp: string | null;
  accountsOnIp: number;
  referrals: number;
  paidReferrals: number;
  isActive: boolean;
  publicId: string | null;
  panelId: string | null;
  panelUsername: string | null;
  remnawaveUserUuid: string | null;
  subscriptionUrl: string | null;
  happCryptoLink: string | null;
}

export const PLAN_LABELS: Record<string, string> = {
  trial: "Пробный",
  basic: "Basic",
  plus: "Plus",
  expired: "Истёк",
};

/** Тон метки тарифа: Basic — кобальт, Plus — чернила, истёк — красный. */
export function planTone(planKey: string): "ink" | "off" | "mute" | undefined {
  if (planKey === "plus") return "ink";
  if (planKey === "expired") return "off";
  if (planKey === "basic") return undefined;
  return "mute";
}

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
