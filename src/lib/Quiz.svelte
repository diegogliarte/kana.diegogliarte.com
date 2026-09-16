<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onDestroy, onMount, tick } from 'svelte';
	import { getKanaForSelection, type Kana, type KanaSelection } from '$lib/kana';
	import { loadSettings, saveResult, saveSettings, type PracticeMode } from '$lib/history';
	import { createChoices, normalizeAnswer, shuffle } from '$lib/quiz';

	type Point = { x: number; y: number };

	let { mode }: { mode: PracticeMode } = $props();

	let selections = $state<KanaSelection[]>(['hiragana:basic']);
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
	let revealed = $state(false);
	let input = $state<HTMLInputElement>();
	let canvas = $state<HTMLCanvasElement>();
	let drawing = false;
	let strokes: Point[][] = [];
	let saved = false;

	let pool = $derived(getKanaForSelection(selections));

	onMount(() => {
		const settings = loadSettings();
		if (settings) selections = settings.selections;
		saveSettings({ selections, mode });
		deck = shuffle(pool);
		startedAt = Date.now();
		nextQuestion();

		const viewport = window.visualViewport;
		const fitViewport = () => {
			const height = viewport?.height ?? window.innerHeight;
			document.documentElement.style.setProperty('--app-height', `${height}px`);
		};
		fitViewport();
		viewport?.addEventListener('resize', fitViewport);
		window.addEventListener('resize', fitViewport);

		return () => {
			viewport?.removeEventListener('resize', fitViewport);
			window.removeEventListener('resize', fitViewport);
			document.documentElement.style.removeProperty('--app-height');
		};
	});

	onDestroy(saveSession);

	async function nextQuestion() {
		if (mode === 'draw') {
			revealed = false;
			await tick();
		}
		if (deck.length === 0) deck = shuffle(pool);
		const [next, ...remaining] = deck;
		deck = remaining;
		current = next;
		choices = createChoices(next, pool);
		answer = '';
		wrong = false;
		wrongChoices = [];
		questionMissed = false;
		strokes = [];
		await tick();
		if (mode === 'write') input?.focus();
		if (mode === 'draw') prepareCanvas();
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

	function nextDrawing() {
		if (!current) return;
		attempts += 1;
		correct += 1;
		lastGuess = `${current.character} · ${current.romaji}`;
		nextQuestion();
	}

	function prepareCanvas() {
		if (!canvas) return;
		const bounds = canvas.getBoundingClientRect();
		const scale = window.devicePixelRatio || 1;
		canvas.width = Math.round(bounds.width * scale);
		canvas.height = Math.round(bounds.height * scale);
		const context = canvas.getContext('2d');
		if (!context) return;
		context.setTransform(scale, 0, 0, scale, 0, 0);
		context.lineCap = 'round';
		context.lineJoin = 'round';
		context.lineWidth = 8;
		context.strokeStyle = '#292524';
		redrawCanvas();
	}

	function redrawCanvas() {
		if (!canvas) return;
		const context = canvas.getContext('2d');
		if (!context) return;
		const scale = window.devicePixelRatio || 1;
		context.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
		for (const stroke of strokes) {
			if (stroke.length === 0) continue;
			context.beginPath();
			context.moveTo(stroke[0].x, stroke[0].y);
			for (const point of stroke.slice(1)) context.lineTo(point.x, point.y);
			context.stroke();
		}
	}

	function canvasPoint(event: PointerEvent) {
		const bounds = canvas!.getBoundingClientRect();
		return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
	}

	function startDrawing(event: PointerEvent) {
		if (!canvas) return;
		drawing = true;
		canvas.setPointerCapture(event.pointerId);
		const point = canvasPoint(event);
		strokes.push([point]);
		const context = canvas.getContext('2d');
		context?.beginPath();
		context?.moveTo(point.x, point.y);
	}

	function continueDrawing(event: PointerEvent) {
		if (!drawing || !canvas) return;
		const point = canvasPoint(event);
		strokes.at(-1)?.push(point);
		const context = canvas.getContext('2d');
		context?.lineTo(point.x, point.y);
		context?.stroke();
	}

	function stopDrawing() {
		drawing = false;
	}

	function clearDrawing() {
		strokes = [];
		redrawCanvas();
	}

	function undoDrawing() {
		strokes.pop();
		redrawCanvas();
	}

	function saveSession() {
		if (saved || attempts === 0) return;
		saved = true;
		saveResult({
			id: crypto.randomUUID(),
			date: new Date().toISOString(),
			mode,
			selections,
			correct,
			attempts,
			durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000))
		});
	}

	function endPractice() {
		saveSession();
		goto(resolve('/'), { replaceState: true });
	}

	function handleKeydown(event: KeyboardEvent) {
		if (mode === 'draw' && !event.shiftKey && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
			event.preventDefault();
			undoDrawing();
			return;
		}
		if (mode !== 'choose') return;
		const index = Number(event.key) - 1;
		if (index >= 0 && index < choices.length) choose(choices[index]);
	}

	function choiceClass(item: Kana) {
		return wrongChoices.includes(item.character)
			? 'border-kana bg-kana-soft text-kana-dark opacity-60'
			: 'border-stone-300 bg-white/45 hover:border-kana hover:bg-kana-pale';
	}
</script>

<svelte:head>
	<title>{mode === 'write' ? 'Kana → romaji' : mode === 'choose' ? 'Romaji → kana' : 'Draw kana'} · Kana</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="app-shell overflow-hidden bg-paper text-stone-900 antialiased">
	<header class="h-12 border-b border-stone-300/80">
		<div class="mx-auto flex h-full max-w-4xl items-center justify-between px-4 sm:px-6">
			<button class="brand" type="button" onclick={endPractice}>
				<span class="size-3 rounded-full bg-kana" aria-hidden="true"></span>
				Kana <span class="font-normal text-stone-400" lang="ja">かな</span>
			</button>
			<button class="quiet-button" type="button" onclick={endPractice}>終了</button>
		</div>
	</header>

	<main class="mx-auto h-[calc(100%-3rem)] max-w-4xl overflow-hidden px-4 py-3 sm:px-6 sm:py-4">
		{#if current}
			<section class="flex h-full flex-col">
				<div class="flex h-6 shrink-0 items-center justify-between text-xs text-stone-400 tabular-nums">
					<span aria-live="polite">{lastGuess}</span>
					<span>{mode === 'draw' ? `${attempts} drawn` : `${correct} / ${attempts}`}</span>
				</div>

				{#if mode === 'write'}
					<div class="flex min-h-0 flex-1 flex-col items-center pt-3 text-center sm:justify-center sm:pb-8">
						<p class="mb-2 text-[11px] font-bold tracking-[.16em] text-stone-400 uppercase sm:mb-3">
							{current.script} · write the reading
						</p>
						<p class="mb-3 font-sans text-[clamp(5rem,22dvh,10rem)] leading-none font-normal sm:mb-6" lang="ja">
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
							<p class="mt-2 feedback" aria-live="polite">{wrong ? 'No — try again' : ''}</p>
						</form>
					</div>
				{:else if mode === 'choose'}
					<div class="flex min-h-0 flex-1 flex-col items-center justify-center pb-8 text-center">
						<p class="mb-3 text-[11px] font-bold tracking-[.16em] text-stone-400 uppercase">
							{current.script} · choose the kana
						</p>
						<p class="text-5xl leading-none font-bold tracking-tight sm:text-6xl">{current.romaji}</p>
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
						<p class="mt-3 feedback" aria-live="polite">{wrong ? 'No — try again' : ''}</p>
					</div>
				{:else}
					<div class="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
						<p class="text-[11px] font-bold tracking-[.16em] text-stone-400 uppercase">
							{current.script} · draw the kana
						</p>
						<p class="mt-1 text-3xl leading-none font-bold tracking-tight sm:text-4xl">{current.romaji}</p>
						<p class="mt-1 h-4 text-[11px] tracking-wide text-stone-400">{current.hint ?? ''}</p>
						<div class="draw-board relative mt-3 overflow-hidden border border-stone-400 bg-white/45">
							<span
								class="pointer-events-none absolute inset-0 flex items-center justify-center font-sans leading-none text-kana {current
									.character.length > 1
									? 'text-[min(36vw,9rem)]'
									: 'text-[min(58vw,14rem)]'}"
								class:opacity-20={revealed}
								class:opacity-0={!revealed}
								lang="ja">{current.character}</span
							>
							<canvas
								bind:this={canvas}
								class="absolute inset-0 size-full touch-none"
								aria-label="Drawing area"
								onpointerdown={startDrawing}
								onpointermove={continueDrawing}
								onpointerup={stopDrawing}
								onpointercancel={stopDrawing}
							></canvas>
						</div>
						<div class="mt-3 flex w-full max-w-sm gap-2">
							<button
								class="flex-1 border border-stone-400 px-3 py-2 text-sm font-bold hover:border-kana"
								type="button"
								onclick={clearDrawing}>Clear</button
							>
							{#if revealed}
								<button
									class="flex-[2] bg-kana px-3 py-2 text-sm font-bold text-white hover:bg-kana-dark"
									type="button"
									onclick={nextDrawing}>Next</button
								>
							{:else}
								<button
									class="flex-[2] bg-stone-900 px-3 py-2 text-sm font-bold text-white hover:bg-kana"
									type="button"
									onclick={() => (revealed = true)}>Reveal</button
								>
							{/if}
						</div>
					</div>
				{/if}
			</section>
		{/if}
	</main>
</div>
