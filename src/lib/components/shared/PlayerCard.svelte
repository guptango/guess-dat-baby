<script lang="ts">
	import type { Player } from '$lib/test/mockData'

	interface Props {
		player: Player
		theme?: 'mint' | 'sunshine' | 'baby-pink' | 'baby-blue'
		showKickButton?: boolean
		showScore?: boolean
		onKick?: (playerId: string, playerName: string) => void
	}

	let { player, theme = 'mint', showKickButton = false, showScore = false, onKick }: Props = $props()

	function handleKick() {
		onKick?.(player.id, player.name)
	}

	// Theme-based styling
	const themeClasses = {
		mint: 'bg-mint-50 border-mint-200 hover:bg-mint-100',
		sunshine: 'bg-sunshine-50 border-sunshine-200 hover:bg-sunshine-100',
		'baby-pink': 'bg-baby-pink-50 border-baby-pink-200 hover:bg-baby-pink-100',
		'baby-blue': 'bg-baby-blue-50 border-baby-blue-200 hover:bg-baby-blue-100'
	}

	const textClasses = {
		mint: 'text-mint-700',
		sunshine: 'text-sunshine-700',
		'baby-pink': 'text-baby-pink-700',
		'baby-blue': 'text-baby-blue-700'
	}
</script>

<div class="rounded-xl p-5 text-center border-2 transition-colors relative {themeClasses[theme]}">
	{#if showKickButton}
		<button 
			class="absolute top-2 right-2 bg-red-400 hover:bg-red-500 text-white text-xs font-friendly font-medium py-1 px-2 rounded-full transition-colors"
			onclick={handleKick}
			title="Kick Player"
		>
			✕
		</button>
	{/if}
	
	<p class="font-friendly font-semibold {textClasses[theme]}">👤 {player.name}</p>
	
	{#if showScore}
		<p class="text-2xl font-party text-sunshine-600 mt-2">{player.score}</p>
	{:else}
		<p class="text-sm text-gray-600 font-friendly mt-2">
			{player.submitted_guesses ? '✅ Submitted' : '⏳ Waiting...'}
		</p>
	{/if}
</div>