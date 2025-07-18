<script lang="ts">
	import PlayerCard from '../shared/PlayerCard.svelte'
	import type { Player } from '$lib/test/mockData'

	interface Props {
		players: Player[]
		loading?: boolean
		onStartReveal: () => void
		onKickPlayer: (playerId: string, playerName: string) => void
	}

	let { players, loading = false, onStartReveal, onKickPlayer }: Props = $props()

	function handleStartReveal() {
		onStartReveal()
	}

	function handleKickPlayer(playerId: string, playerName: string) {
		onKickPlayer(playerId, playerName)
	}

	let submittedCount = $derived(players.filter(p => p.submitted_guesses).length)
	let allSubmitted = $derived(submittedCount === players.length && players.length > 0)
</script>

<div class="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-sunshine-200">
	<div class="mb-6 text-center">
		<h3 class="text-2xl font-party text-sunshine-700 mb-3">🤔 Game in Progress</h3>
		<p class="text-gray-600 font-friendly">Players are making their guesses... 🍼</p>
		
		<div class="mt-4">
			<p class="text-sm text-gray-500">
				{submittedCount} / {players.length} players have submitted
			</p>
		</div>
	</div>

	<!-- Player Status During Guessing -->
	{#if players.length > 0}
		<div class="mb-8">
			<h4 class="text-lg font-friendly font-semibold text-sunshine-700 mb-4 text-center">👥 Player Status</h4>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each players as player (player.id)}
					<PlayerCard 
						{player} 
						theme="sunshine"
						showKickButton={true}
						onKick={(playerId, playerName) => handleKickPlayer(playerId, playerName)}
					/>
				{/each}
			</div>
		</div>
	{/if}
	
	<div class="text-center">
		<button 
			class="bg-sunshine-500 hover:bg-sunshine-600 text-white font-friendly font-bold py-4 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
			disabled={!allSubmitted || loading}
			onclick={handleStartReveal}
		>
			{loading ? '✨ Starting Reveal...' : '🎉 Start Reveal'}
		</button>
	</div>
</div>