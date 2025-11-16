import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getQuadrantColor(effort: number, value: number): string {
  if (value > 5 && effort <= 5) return '#22c55e'; // Quick Wins - Green
  if (value > 5 && effort > 5) return '#3b82f6'; // Major Projects - Blue
  if (value <= 5 && effort <= 5) return '#facc15'; // Fill-ins - Yellow
  return '#ef4444'; // Time Sinks - Red
}

export function getQuadrantName(effort: number, value: number): string {
  if (value > 5 && effort <= 5) return 'Quick Wins';
  if (value > 5 && effort > 5) return 'Major Projects';
  if (value <= 5 && effort <= 5) return 'Fill-ins';
  return 'Time Sinks';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return '#3b82f6'; // Blue
    case 'completed':
      return '#22c55e'; // Green
    case 'abandoned':
      return '#6b7280'; // Gray
    case 'paused':
      return '#f59e0b'; // Orange
    default:
      return '#8b5cf6'; // Purple
  }
}

export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}
