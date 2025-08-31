import { customAlphabet } from 'nanoid';
export const makeToken = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 24);
export const normalizeEmail = (e: string) => e.trim().toLowerCase();
export const normalizeUsername = (u: string) => u.trim().toLowerCase();
