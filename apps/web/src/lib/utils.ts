import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale = 'es-DO'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string, locale = 'es-DO'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num: number, locale = 'es-DO'): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function formatCurrency(amount: number, currency = 'DOP', locale = 'es-DO'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, locale = 'es-DO'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function generateId(prefix = ''): string {
  return `${prefix}${Math.random().toString(36).substring(2, 11)}`;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    DIRECTOR: 'bg-primary-100 text-primary-700',
    COORDINADOR: 'bg-blue-100 text-blue-700',
    DOCENTE: 'bg-green-100 text-green-700',
    ORIENTADOR: 'bg-purple-100 text-purple-700',
    DISTRITAL: 'bg-orange-100 text-orange-700',
    REGIONAL: 'bg-red-100 text-red-700',
    NACIONAL: 'bg-gray-100 text-gray-700',
  };
  return colors[role] || 'bg-gray-100 text-gray-700';
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    DIRECTOR: 'Director',
    COORDINADOR: 'Coordinador',
    DOCENTE: 'Docente',
    ORIENTADOR: 'Orientador',
    DISTRITAL: 'Distrital',
    REGIONAL: 'Regional',
    NACIONAL: 'Nacional',
  };
  return labels[role] || role;
}

export function getRoleIcon(role: string): string {
  const icons: Record<string, string> = {
    DIRECTOR: 'Crown',
    COORDINADOR: 'Users',
    DOCENTE: 'GraduationCap',
    ORIENTADOR: 'Compass',
    DISTRITAL: 'MapPin',
    REGIONAL: 'Map',
    NACIONAL: 'Globe',
  };
  return icons[role] || 'User';
}