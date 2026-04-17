
export function parseDate(s: string) {
    const n = Number(s);
    return isNaN(n) ? new Date(String(s)) : new Date(n);
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 7) return `il y a ${days}j`;
  return date.toLocaleDateString('fr-FR');
}

import type { Notification } from '@/types';

export function getNotificationText(notification: Notification): string {
  const actor = notification.author?.username || 'Quelqu’un';
  switch (notification.type) {
    case 'NEW_COMMENT':
      return `${actor} a commenté votre message`;
    case 'NEW_LIKE':
      return `${actor} a aimé votre message`;
    case 'NEW_POST':
      return `${actor} a publié un nouveau message`;
    default:
      return notification.type ? String(notification.type).replace(/_/g, ' ').toLowerCase() : 'Nouvelle notification';
  }
}
