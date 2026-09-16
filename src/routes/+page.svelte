<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import {
		getKanaForSelection,
		groupOptions,
		scriptOptions,
		type KanaGroup,
		type KanaScript,
		type KanaSelection
	} from '$lib/kana';
	import {
		clearHistory,
		loadHistory,
		loadSettings,
		saveSettings,
		type PracticeMode,
		type SessionResult
	} from '$lib/history';

	type View = 'setup' | 'history';
	let view = $state<View>('setup');
	let selections = $state<KanaSelection[]>(['hiragana:basic']);
	let mode = $state<PracticeMode>('write');
	let history = $state<SessionResult[]>([]);
	const modePaths: Record<PracticeMode, '/quiz/write' | '/quiz/choose' | '/quiz/draw'> = {
		write: '/quiz/write',
		choose: '/quiz/choose',
		draw: '/quiz/draw'
	};

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
		goto(resolve(modePaths[mode]));
	}

	function eraseHistory() {
		if (!confirm('Clear all practice history?')) return;
		clearHistory();
		history = [];
	}

	function formatDuration(seconds: number) {
		return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
	}

	function formatDate(date: string) {
		return new Date(date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
	}

	function modeLabel(result: SessionResult) {
		if (result.mode === 'write') return 'Kana → romaji';
		if (result.mode === 'choose') return 'Romaji → kana';
		return 'Draw kana';
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
</script>

<svelte:head>
	<title>Kana</title>
	<meta name="description" content="Practise hiragana and katakana." />
</svelte:head>

<div class="h-dvh overflow-hidden bg-paper text-stone-900 antialiased">
	<header class="h-12 border-b border-stone-300/80">
		<div class="mx-auto flex h-full max-w-4xl items-center justify-between px-4 sm:px-6">
			<button class="brand" type="button" onclick={() => (view = 'setup')}>
				<span class="size-3 rounded-full bg-kana" aria-hidden="true"></span>
				Kana <span class="font-normal text-stone-400" lang="ja">かな</span>
			</button>
			<button class="quiet-button" type="button" onclick={() => (view = view === 'history' ? 'setup' : 'history')}>
				{view === 'history' ? 'Back' : 'History'}
			</button>
		</div>
	</header>

	<main class="mx-auto h-[calc(100dvh-3rem)] max-w-4xl overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
		{#if view === 'setup'}
			<section>
				<div class="mb-3 section-heading">
					<h1 class="text-2xl font-bold tracking-tight">Practice</h1>
					<span class="text-sm text-stone-500 tabular-nums">{pool.length} kana</span>
				</div>

				<fieldset>
					<legend class="mb-2 kicker">Study set</legend>
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
					<div class="grid gap-2 sm:grid-cols-3">
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
						<label class="select-card">
							<input
								type="radio"
								name="mode"
								class="check-control"
								checked={mode === 'draw'}
								onchange={() => (mode = 'draw')}
							/>
							<span
								><strong class="block text-base">Draw kana</strong><small class="text-[11px] text-stone-500"
									>Draw, then reveal</small
								></span
							>
						</label>
					</div>
				</fieldset>

				<button class="mt-3 primary-action" type="button" onclick={startPractice}>
					Start <span class="ml-1 font-normal opacity-70">始める</span>
				</button>
			</section>
		{:else}
			<section class="flex min-h-full flex-col">
				<div class="mb-4 section-heading">
					<h1 class="text-2xl font-bold tracking-tight">History</h1>
					{#if history.length > 0}<button class="quiet-button" type="button" onclick={eraseHistory}>Clear</button>{/if}
				</div>

				{#if history.length === 0}
					<p class="my-auto text-center text-sm text-stone-400">No sessions yet.</p>
				{:else}
					<ul class="border-t border-stone-300">
						{#each history as result (result.id)}
							<li
								class="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-stone-300 py-3 text-sm sm:grid-cols-[1fr_auto_9rem]"
							>
								<div>
									<strong>{modeLabel(result)}</strong>
									<p class="mt-0.5 text-[11px] text-stone-500">{selectionLabel(result)}</p>
								</div>
								<div class="text-right tabular-nums">
									{#if result.mode === 'draw'}
										<strong>{result.attempts} drawn</strong>
										<p class="mt-0.5 text-[11px] text-stone-500">{formatDuration(result.durationSeconds)}</p>
									{:else}
										<strong>{Math.round((result.correct / result.attempts) * 100)}%</strong>
										<p class="mt-0.5 text-[11px] text-stone-500">
											{result.correct}/{result.attempts} · {formatDuration(result.durationSeconds)}
										</p>
									{/if}
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
