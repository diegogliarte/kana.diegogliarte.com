import { browser } from '$app/environment';
import type { KanaSelection } from './kana';

export type PracticeMode = 'write' | 'choose';

export type SessionResult = {
	id: string;
	date: string;
	mode: PracticeMode;
	selections: KanaSelection[];
	correct: number;
	attempts: number;
	durationSeconds: number;
};

export type Settings = Pick<SessionResult, 'mode' | 'selections'>;

const HISTORY_KEY = 'kana-history-v4';
const SETTINGS_KEY = 'kana-settings-v4';
const selections = new Set<KanaSelection>([
	'hiragana:basic',
	'hiragana:marks',
	'hiragana:yoon',
	'katakana:basic',
	'katakana:marks',
	'katakana:yoon'
]);

function read(key: string): unknown {
	try {
		return JSON.parse(localStorage.getItem(key) ?? 'null');
	} catch {
		return null;
	}
}

function write(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		return;
	}
}

function isSettings(value: unknown): value is Settings {
	if (!value || typeof value !== 'object') return false;
	const settings = value as Partial<Settings>;
	return (
		(settings.mode === 'write' || settings.mode === 'choose') &&
		Array.isArray(settings.selections) &&
		settings.selections.length > 0 &&
		settings.selections.every((selection) => selections.has(selection))
	);
}

function isResult(value: unknown): value is SessionResult {
	if (!isSettings(value)) return false;
	const result = value as Partial<SessionResult>;
	return (
		typeof result.id === 'string' &&
		typeof result.date === 'string' &&
		typeof result.correct === 'number' &&
		typeof result.attempts === 'number' &&
		typeof result.durationSeconds === 'number'
	);
}

export function loadHistory(): SessionResult[] {
	if (!browser) return [];
	const history = read(HISTORY_KEY);
	return Array.isArray(history) ? history.filter(isResult) : [];
}

export function saveResult(result: SessionResult): SessionResult[] {
	const history = [result, ...loadHistory()].slice(0, 30);
	write(HISTORY_KEY, history);
	return history;
}

export function clearHistory(): void {
	if (!browser) return;
	try {
		localStorage.removeItem(HISTORY_KEY);
	} catch {
		return;
	}
}

export function loadSettings(): Settings | null {
	if (!browser) return null;
	const settings = read(SETTINGS_KEY);
	return isSettings(settings) ? settings : null;
}

export function saveSettings(settings: Settings): void {
	if (browser) write(SETTINGS_KEY, settings);
}
