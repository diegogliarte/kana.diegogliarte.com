import { similarKana, type Kana } from './kana';

export function shuffle<T>(items: T[]): T[] {
	const result = [...items];
	for (let index = result.length - 1; index > 0; index--) {
		const other = Math.floor(Math.random() * (index + 1));
		[result[index], result[other]] = [result[other], result[index]];
	}
	return result;
}

export function createChoices(target: Kana, pool: Kana[]): Kana[] {
	const candidates = pool.filter((item) => item.character !== target.character && item.script === target.script);
	const lookAlikeCharacters = new Set(similarKana.find((group) => group.includes(target.character)) ?? []);
	const lookAlikes = shuffle(candidates.filter((item) => lookAlikeCharacters.has(item.character)));
	const sameReading = target.hint
		? shuffle(candidates.filter((item) => item.romaji === target.romaji && !lookAlikeCharacters.has(item.character)))
		: [];
	const preferredCharacters = new Set([...lookAlikes, ...sameReading].map((item) => item.character));
	const sameGroup = shuffle(
		candidates.filter(
			(item) => item.group === target.group && item.romaji !== target.romaji && !preferredCharacters.has(item.character)
		)
	);
	const remaining = shuffle(
		candidates.filter(
			(item) => item.romaji !== target.romaji && !preferredCharacters.has(item.character) && item.group !== target.group
		)
	);

	return shuffle([target, ...lookAlikes, ...sameReading, ...sameGroup, ...remaining].slice(0, 8));
}

export function normalizeAnswer(answer: string): string {
	return answer.trim().toLowerCase();
}
