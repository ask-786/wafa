import {
  CloudSunIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
  SunriseIcon,
  SunsetIcon,
  type LucideIcon,
} from 'lucide-react-native';
import type { Madhab, Prayer } from './types';

/**
 * How each prayer looks. Each prayer wears the colour of its hour. Class names
 * are spelled out in full (never built from strings) so Tailwind can see them.
 */
export interface PrayerMeta {
  name: string;
  arabic: string;
  /** When in the day it falls, in a few friendly words. */
  hint: string;
  icon: LucideIcon;
  /** CSS variable of the main colour, for SVG and other non-class consumers. */
  colorVar: `--color-${Prayer}`;
  cls: {
    bg: string;
    soft: string;
    edge: string;
    text: string;
    border: string;
    /** Text/icon colour that reads on the main colour. */
    on: string;
  };
}

export const PRAYER_META: Record<Prayer, PrayerMeta> = {
  fajr: {
    name: 'Fajr',
    arabic: 'الفجر',
    hint: 'Dawn',
    icon: SunriseIcon,
    colorVar: '--color-fajr',
    cls: {
      bg: 'bg-fajr',
      soft: 'bg-fajr-soft',
      edge: 'bg-fajr-edge',
      text: 'text-fajr',
      border: 'border-fajr',
      on: 'text-white dark:text-[#12131f]',
    },
  },
  dhuhr: {
    name: 'Dhuhr',
    arabic: 'الظهر',
    hint: 'Midday',
    icon: SunIcon,
    colorVar: '--color-dhuhr',
    cls: {
      bg: 'bg-dhuhr',
      soft: 'bg-dhuhr-soft',
      edge: 'bg-dhuhr-edge',
      text: 'text-dhuhr',
      border: 'border-dhuhr',
      on: 'text-[#5a3d00]',
    },
  },
  asr: {
    name: 'Asr',
    arabic: 'العصر',
    hint: 'Afternoon',
    icon: CloudSunIcon,
    colorVar: '--color-asr',
    cls: {
      bg: 'bg-asr',
      soft: 'bg-asr-soft',
      edge: 'bg-asr-edge',
      text: 'text-asr',
      border: 'border-asr',
      on: 'text-white dark:text-[#12131f]',
    },
  },
  maghrib: {
    name: 'Maghrib',
    arabic: 'المغرب',
    hint: 'Sunset',
    icon: SunsetIcon,
    colorVar: '--color-maghrib',
    cls: {
      bg: 'bg-maghrib',
      soft: 'bg-maghrib-soft',
      edge: 'bg-maghrib-edge',
      text: 'text-maghrib',
      border: 'border-maghrib',
      on: 'text-white dark:text-[#12131f]',
    },
  },
  isha: {
    name: 'Isha',
    arabic: 'العشاء',
    hint: 'Night',
    icon: MoonIcon,
    colorVar: '--color-isha',
    cls: {
      bg: 'bg-isha',
      soft: 'bg-isha-soft',
      edge: 'bg-isha-edge',
      text: 'text-isha',
      border: 'border-isha',
      on: 'text-white dark:text-[#12131f]',
    },
  },
  witr: {
    name: 'Witr',
    arabic: 'الوتر',
    hint: 'Before sleep',
    icon: SparklesIcon,
    colorVar: '--color-witr',
    cls: {
      bg: 'bg-witr',
      soft: 'bg-witr-soft',
      edge: 'bg-witr-edge',
      text: 'text-witr',
      border: 'border-witr',
      on: 'text-white dark:text-[#12131f]',
    },
  },
};

export const MADHAB_META: Record<Madhab, { name: string; witr: string }> = {
  shafii: { name: "Shafi'i", witr: 'Witr is sunnah' },
  hanafi: { name: 'Hanafi', witr: 'Witr is wajib' },
  maliki: { name: 'Maliki', witr: 'Witr is sunnah' },
  hanbali: { name: 'Hanbali', witr: 'Witr is sunnah' },
};
