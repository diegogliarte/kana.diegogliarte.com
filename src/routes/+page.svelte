<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		getKanaForSelection,
		groupOptions,
		scriptOptions,
		type Kana,
		type KanaGroup,
		type KanaScript,
		type KanaSelection
	} from '$lib/kana';
	import {
		clearHistory,
		loadHistory,
		loadSettings,
		saveResult,
		saveSettings,
		type PracticeMode,
		type SessionResult
	} from '$lib/history';
	import { createChoices, normalizeAnswer, shuffle } from '$lib/quiz';

	type View = 'setup' | 'practice' | 'history';
	let view = $state<View>('setup');
	let selections = $state<KanaSelection[]>(['hiragana:basic']);
	let mode = $state<PracticeMode>('write');
	let history = $state<SessionResult[]>([]);
	let deck = $state<Kana[]>([]);
	let current = $state<Kana | null>(null);
	let choices = $state<Kana[]>([]);
	let answer = $state('');
	let wrong = $state(false);
	let wrongChoices = $state<string[]>([]);
	let questionMissed = $state(false);
	let lastGuess = $state('');
	let correct = $state(0);
	let attempts = $state(0);
	let startedAt = $state(0);
	let input = $state<HTMLInputElement>();

	let pool = $derived(getKanaForSelection(selections));

	onMount(() => {
		const settings = loadSettings();
		if (settings) {
			selections = settings.selections;
			mode = settings.mode;
		}
		history = loadHistory();
	});

	function toggle<T>(items: T[], item: T): T[] {
		if (!items.includes(item)) return [...items, item];
		return items.length === 1 ? items : items.filter((value) => value !== item);
	}

	function selectionId(script: KanaScript, group: KanaGroup): KanaSelection {
		return `${script}:${group}`;
	}

	function startPractice() {
		saveSettings({ selections, mode });
		deck = shuffle(pool);
		correct = 0;
		attempts = 0;
		lastGuess = '';
		startedAt = Date.now();
		view = 'practice';
		nextQuestion();
	}

	async function nextQuestion() {
		if (deck.length === 0) deck = shuffle(pool);
		const [next, ...remaining] = deck;
		deck = remaining;
		current = next;
		choices = createChoices(next, pool);
		answer = '';
		wrong = false;
		wrongChoices = [];
		questionMissed = false;
		await tick();
		if (mode === 'write') input?.focus();
	}

	function repeatLater(item: Kana) {
		const position = Math.min(deck.length, 3 + Math.floor(Math.random() * 3));
		deck = [...deck.slice(0, position), item, ...deck.slice(position)];
	}

	function finishCorrect() {
		if (!current) return;
		attempts += 1;
		correct += 1;
		if (questionMissed) repeatLater(current);
		lastGuess = `✓ ${current.character} · ${current.romaji}`;
		nextQuestion();
	}

	function tryAgain() {
		attempts += 1;
		wrong = true;
		questionMissed = true;
	}

	async function submitWritten(event: SubmitEvent) {
		event.preventDefault();
		if (!current || !answer.trim()) return;
		if (current.answers.includes(normalizeAnswer(answer))) {
			finishCorrect();
			return;
		}
		tryAgain();
		await tick();
		input?.select();
	}

	function choose(item: Kana) {
		if (!current || wrongChoices.includes(item.character)) return;
		if (item.character === current.character) {
			finishCorrect();
			return;
		}
		wrongChoices = [...wrongChoices, item.character];
		tryAgain();
	}

	function endPractice() {
		if (attempts > 0) {
			history = saveResult({
				id: crypto.randomUUID(),
				date: new Date().toISOString(),
				mode,
				selections,
				correct,
				attempts,
				durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000))
			});
		}
		view = 'setup';
	}

	function eraseHistory() {
		if (!confirm('Clear all practice history?')) return;
		clearHistory();
		history = [];
	}

	function handleKeydown(event: KeyboardEvent) {
		if (view !== 'practice' || mode !== 'choose') return;
		const index = Number(event.key) - 1;
		if (index >= 0 && index < choices.length) choose(choices[index]);
	}

	function formatDuration(seconds: number) {
		return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
	}

	function formatDate(date: string) {
		return new Date(date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
	}

	function selectionLabel(result: SessionResult) {
		const groupNames: Record<KanaGroup, string> = {
			basic: 'gojūon',
			marks: 'dakuon',
			yoon: 'yōon'
		};
		return result.selections
			.map((selection) => {
				const [script, group] = selection.split(':') as [KanaScript, KanaGroup];
				return `${script === 'hiragana' ? 'Hira' : 'Kata'} ${groupNames[group]}`;
			})
			.join(' · ');
	}

	function choiceClass(item: Kana) {
		return wrongChoices.includes(item.character)
			? 'border-kana bg-kana-soft text-kana-dark opacity-60'
			: 'border-stone-300 bg-white/45 hover:border-kana hover:bg-kana-pale';
	}
</script>

<svelte:head>
	<title>Kana</title>
	<meta name="description" content="Practise hiragana and katakana." />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="h-dvh overflow-hidden bg-paper text-stone-900 antialiased">
	<header class="h-12 border-b border-stone-300/80">
		<div class="mx-auto flex h-full max-w-4xl items-center justify-between px-4 sm:px-6">
			<button class="brand" type="button" onclick={() => (view === 'practice' ? endPractice() : (view = 'setup'))}>
				<span class="size-3 rounded-full bg-kana" aria-hidden="true"></span>
				Kana <span class="font-normal text-stone-400" lang="ja">かな</span>
			</button>
			{#if view === 'practice'}
				<button class="quiet-button" type="button" onclick={endPractice}>終了</button>
			{:else}
				<button class="quiet-button" type="button" onclick={() => (view = view === 'history' ? 'setup' : 'history')}>
					{view === 'history' ? 'Back' : 'History'}
				</button>
			{/if}
		</div>
	</header>

	<main class="mx-auto h-[calc(100dvh-3rem)] max-w-4xl overflow-hidden px-4 py-3 sm:px-6 sm:py-4">
		{#if view === 'setup'}
			<section>
				<div class="mb-3 section-heading">
					<h1 class="text-2xl font-bold tracking-tight">Practice</h1>
					<span class="text-sm text-stone-500 tabular-nums">{pool.length} kana</span>
				</div>

				<fieldset>
					<legend class="mb-2 kicker"> Study set </legend>
					<div class="grid grid-cols-2 gap-2">
						{#each scriptOptions as script (script.id)}
							<div class="border border-stone-300 bg-white/25">
								<div class="border-b border-stone-300 px-3 py-1.5">
									<strong class="text-base">{script.name}</strong>
									<span class="ml-2 text-xs text-stone-400" lang="ja">{script.japanese}</span>
								</div>
								<div class="divide-y divide-stone-300">
									{#each groupOptions as group (group.id)}
										{@const id = selectionId(script.id, group.id)}
										<label class="select-row">
											<input
												type="checkbox"
												class="size-3.5 shrink-0 check-control"
												checked={selections.includes(id)}
												onchange={() => (selections = toggle(selections, id))}
											/>
											<span class="min-w-0 leading-tight">
												<strong class="block text-xs whitespace-nowrap">{group.name}</strong>
												<small class="text-[10px] text-stone-400" lang="ja">{group.japanese}</small>
											</span>
										</label>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</fieldset>

				<fieldset class="mt-3">
					<legend class="mb-2 kicker">Mode</legend>
					<div class="grid grid-cols-2 gap-2">
						<label class="select-card">
							<input
								type="radio"
								name="mode"
								class="check-control"
								checked={mode === 'write'}
								onchange={() => (mode = 'write')}
							/>
							<span
								><strong class="block text-base">Kana → romaji</strong><small class="text-[11px] text-stone-500"
									>Type the reading</small
								></span
							>
						</label>
						<label class="select-card">
							<input
								type="radio"
								name="mode"
								class="check-control"
								checked={mode === 'choose'}
								onchange={() => (mode = 'choose')}
							/>
							<span
								><strong class="block text-base">Romaji → kana</strong><small class="text-[11px] text-stone-500"
									>Choose the character</small
								></span
							>
						</label>
					</div>
				</fieldset>

				<button class="mt-3 primary-action" type="button" onclick={startPractice}>
					Start <span class="ml-1 font-normal opacity-70">始める</span>
				</button>
			</section>
		{:else if view === 'practice' && current}
			<section class="flex h-full flex-col">
				<div class="flex h-6 items-center justify-between text-xs text-stone-400 tabular-nums">
					<span aria-live="polite">{lastGuess}</span>
					<span>{correct} / {attempts}</span>
				</div>

				<div class="flex flex-1 flex-col items-center justify-center pb-8 text-center">
					<p class="mb-3 text-[11px] font-bold tracking-[.16em] text-stone-400 uppercase">
						{current.script} · {mode === 'write' ? 'write the reading' : 'choose the kana'}
					</p>

					{#if mode === 'write'}
						<p class="mb-6 font-sans text-[clamp(7rem,28vh,12rem)] leading-none font-normal" lang="ja">
							{current.character}
						</p>
						<form class="w-full max-w-sm" onsubmit={submitWritten}>
							<label class="sr-only" for="answer">Romaji</label>
							<div class="flex">
								<input
									id="answer"
									bind:this={input}
									bind:value={answer}
									class="answer-input"
									autocomplete="off"
									autocapitalize="off"
									spellcheck="false"
									placeholder="romaji"
								/>
								<button class="submit-action" type="submit">Enter</button>
							</div>
							<p class="mt-2 feedback" aria-live="polite">
								{wrong ? 'No — try again' : ''}
							</p>
						</form>
					{:else}
						<p class="text-5xl leading-none font-bold tracking-tight sm:text-6xl">
							{current.romaji}
						</p>
						<p class="mt-2 h-4 text-[11px] tracking-wide text-stone-400">{current.hint ?? ''}</p>
						<div class="mt-6 grid w-full max-w-lg grid-cols-4 gap-2">
							{#each choices as choice, index (choice.character)}
								<button
									class="kana-choice {choiceClass(choice)}"
									type="button"
									disabled={wrongChoices.includes(choice.character)}
									onclick={() => choose(choice)}
								>
									<span class="absolute top-2 left-2 text-[10px] text-stone-400">{index + 1}</span>
									<span lang="ja">{choice.character}</span>
								</button>
							{/each}
						</div>
						<p class="mt-3 feedback" aria-live="polite">
							{wrong ? 'No — try again' : ''}
						</p>
					{/if}
				</div>
			</section>
		{:else if view === 'history'}
			<section class="flex h-full flex-col">
				<div class="mb-4 section-heading">
					<h1 class="text-2xl font-bold tracking-tight">History</h1>
					{#if history.length > 0}
						<button class="quiet-button" type="button" onclick={eraseHistory}>Clear</button>
					{/if}
				</div>

				{#if history.length === 0}
					<p class="my-auto text-center text-sm text-stone-400">No sessions yet.</p>
				{:else}
					<ul class="min-h-0 flex-1 overflow-y-auto border-t border-stone-300">
						{#each history as result (result.id)}
							<li
								class="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-stone-300 py-3 text-sm sm:grid-cols-[1fr_auto_9rem]"
							>
								<div>
									<strong>{result.mode === 'write' ? 'Kana → romaji' : 'Romaji → kana'}</strong>
									<p class="mt-0.5 text-[11px] text-stone-500">{selectionLabel(result)}</p>
								</div>
								<div class="text-right tabular-nums">
									<strong>{Math.round((result.correct / result.attempts) * 100)}%</strong>
									<p class="mt-0.5 text-[11px] text-stone-500">
										{result.correct}/{result.attempts} · {formatDuration(result.durationSeconds)}
									</p>
								</div>
								<time class="col-span-2 text-[11px] text-stone-400 sm:col-span-1 sm:text-right" datetime={result.date}
									>{formatDate(result.date)}</time
								>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}
	</main>
</div>
