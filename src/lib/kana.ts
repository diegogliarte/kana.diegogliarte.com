export type KanaScript = 'hiragana' | 'katakana';
export type KanaGroup = 'basic' | 'marks' | 'yoon';
export type KanaSelection = `${KanaScript}:${KanaGroup}`;

export type Kana = {
	character: string;
	romaji: string;
	answers: string[];
	script: KanaScript;
	group: KanaGroup;
	hint?: string;
};

type KanaRow = [string, string, string];

const basic: KanaRow[] = [
	['あ', 'ア', 'a'],
	['い', 'イ', 'i'],
	['う', 'ウ', 'u'],
	['え', 'エ', 'e'],
	['お', 'オ', 'o'],
	['か', 'カ', 'ka'],
	['き', 'キ', 'ki'],
	['く', 'ク', 'ku'],
	['け', 'ケ', 'ke'],
	['こ', 'コ', 'ko'],
	['さ', 'サ', 'sa'],
	['し', 'シ', 'shi'],
	['す', 'ス', 'su'],
	['せ', 'セ', 'se'],
	['そ', 'ソ', 'so'],
	['た', 'タ', 'ta'],
	['ち', 'チ', 'chi'],
	['つ', 'ツ', 'tsu'],
	['て', 'テ', 'te'],
	['と', 'ト', 'to'],
	['な', 'ナ', 'na'],
	['に', 'ニ', 'ni'],
	['ぬ', 'ヌ', 'nu'],
	['ね', 'ネ', 'ne'],
	['の', 'ノ', 'no'],
	['は', 'ハ', 'ha'],
	['ひ', 'ヒ', 'hi'],
	['ふ', 'フ', 'fu'],
	['へ', 'ヘ', 'he'],
	['ほ', 'ホ', 'ho'],
	['ま', 'マ', 'ma'],
	['み', 'ミ', 'mi'],
	['む', 'ム', 'mu'],
	['め', 'メ', 'me'],
	['も', 'モ', 'mo'],
	['や', 'ヤ', 'ya'],
	['ゆ', 'ユ', 'yu'],
	['よ', 'ヨ', 'yo'],
	['ら', 'ラ', 'ra'],
	['り', 'リ', 'ri'],
	['る', 'ル', 'ru'],
	['れ', 'レ', 're'],
	['ろ', 'ロ', 'ro'],
	['わ', 'ワ', 'wa'],
	['を', 'ヲ', 'wo'],
	['ん', 'ン', 'n']
];

const marks: KanaRow[] = [
	['が', 'ガ', 'ga'],
	['ぎ', 'ギ', 'gi'],
	['ぐ', 'グ', 'gu'],
	['げ', 'ゲ', 'ge'],
	['ご', 'ゴ', 'go'],
	['ざ', 'ザ', 'za'],
	['じ', 'ジ', 'ji'],
	['ず', 'ズ', 'zu'],
	['ぜ', 'ゼ', 'ze'],
	['ぞ', 'ゾ', 'zo'],
	['だ', 'ダ', 'da'],
	['ぢ', 'ヂ', 'ji'],
	['づ', 'ヅ', 'zu'],
	['で', 'デ', 'de'],
	['ど', 'ド', 'do'],
	['ば', 'バ', 'ba'],
	['び', 'ビ', 'bi'],
	['ぶ', 'ブ', 'bu'],
	['べ', 'ベ', 'be'],
	['ぼ', 'ボ', 'bo'],
	['ぱ', 'パ', 'pa'],
	['ぴ', 'ピ', 'pi'],
	['ぷ', 'プ', 'pu'],
	['ぺ', 'ペ', 'pe'],
	['ぽ', 'ポ', 'po']
];

const yoon: KanaRow[] = [
	['きゃ', 'キャ', 'kya'],
	['きゅ', 'キュ', 'kyu'],
	['きょ', 'キョ', 'kyo'],
	['しゃ', 'シャ', 'sha'],
	['しゅ', 'シュ', 'shu'],
	['しょ', 'ショ', 'sho'],
	['ちゃ', 'チャ', 'cha'],
	['ちゅ', 'チュ', 'chu'],
	['ちょ', 'チョ', 'cho'],
	['にゃ', 'ニャ', 'nya'],
	['にゅ', 'ニュ', 'nyu'],
	['にょ', 'ニョ', 'nyo'],
	['ひゃ', 'ヒャ', 'hya'],
	['ひゅ', 'ヒュ', 'hyu'],
	['ひょ', 'ヒョ', 'hyo'],
	['みゃ', 'ミャ', 'mya'],
	['みゅ', 'ミュ', 'myu'],
	['みょ', 'ミョ', 'myo'],
	['りゃ', 'リャ', 'rya'],
	['りゅ', 'リュ', 'ryu'],
	['りょ', 'リョ', 'ryo'],
	['ぎゃ', 'ギャ', 'gya'],
	['ぎゅ', 'ギュ', 'gyu'],
	['ぎょ', 'ギョ', 'gyo'],
	['じゃ', 'ジャ', 'ja'],
	['じゅ', 'ジュ', 'ju'],
	['じょ', 'ジョ', 'jo'],
	['びゃ', 'ビャ', 'bya'],
	['びゅ', 'ビュ', 'byu'],
	['びょ', 'ビョ', 'byo'],
	['ぴゃ', 'ピャ', 'pya'],
	['ぴゅ', 'ピュ', 'pyu'],
	['ぴょ', 'ピョ', 'pyo']
];

const alternatives: Record<string, string[]> = {
	shi: ['si'],
	chi: ['ti'],
	tsu: ['tu'],
	fu: ['hu'],
	ji: ['zi'],
	sha: ['sya'],
	shu: ['syu'],
	sho: ['syo'],
	cha: ['tya', 'cya'],
	chu: ['tyu', 'cyu'],
	cho: ['tyo', 'cyo'],
	ja: ['jya', 'zya'],
	ju: ['jyu', 'zyu'],
	jo: ['jyo', 'zyo']
};

const hints: Record<string, string> = {
	じ: 'usual ji',
	ジ: 'usual ji',
	ぢ: 'as in hanaji',
	ヂ: 'as in hanaji',
	ず: 'usual zu',
	ズ: 'usual zu',
	づ: 'as in tsuzuku',
	ヅ: 'as in tsuzuku'
};

function expand(rows: KanaRow[], group: KanaGroup): Kana[] {
	return rows.flatMap(([hiragana, katakana, romaji]) => {
		const answers = [romaji, ...(alternatives[romaji] ?? [])];
		if (romaji === 'wo') answers.push('o');
		return [
			{
				character: hiragana,
				romaji,
				answers,
				script: 'hiragana' as const,
				group,
				hint: hints[hiragana]
			},
			{
				character: katakana,
				romaji,
				answers,
				script: 'katakana' as const,
				group,
				hint: hints[katakana]
			}
		];
	});
}

export const kana = [...expand(basic, 'basic'), ...expand(marks, 'marks'), ...expand(yoon, 'yoon')];

export const similarKana: string[][] = [
	['あ', 'お'],
	['い', 'り'],
	['う', 'ら'],
	['き', 'さ'],
	['け', 'せ'],
	['こ', 'に'],
	['し', 'つ'],
	['ぬ', 'め'],
	['ね', 'れ', 'わ'],
	['は', 'ほ'],
	['ま', 'も'],
	['る', 'ろ'],
	['ウ', 'ワ', 'フ'],
	['カ', 'ヤ'],
	['ク', 'ケ'],
	['コ', 'ユ'],
	['シ', 'ツ'],
	['ソ', 'ン'],
	['ス', 'ヌ'],
	['チ', 'テ'],
	['ナ', 'メ'],
	['マ', 'ム'],
	['ル', 'レ']
];

export const scriptOptions: { id: KanaScript; name: string; japanese: string }[] = [
	{ id: 'hiragana', name: 'Hiragana', japanese: 'ひらがな' },
	{ id: 'katakana', name: 'Katakana', japanese: 'カタカナ' }
];

export const groupOptions: { id: KanaGroup; name: string; japanese: string }[] = [
	{ id: 'basic', name: 'Gojūon', japanese: '五十音' },
	{ id: 'marks', name: 'Dakuon & handakuon', japanese: '濁音・半濁音' },
	{ id: 'yoon', name: 'Yōon', japanese: '拗音' }
];

export function getKanaForSelection(selections: KanaSelection[]): Kana[] {
	return kana.filter((item) => selections.includes(`${item.script}:${item.group}`));
}
