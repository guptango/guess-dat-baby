<script lang="ts">
	import PlayerCard from '../shared/PlayerCard.svelte'
	import type { Player, Room } from '$lib/test/mockData'

	interface Props {
		room: Room
		players: Player[]
		loading?: boolean
		onStartGame: () => void
		onKickPlayer: (playerId: string, playerName: string) => void
	}

	let { room, players, loading = false, onStartGame, onKickPlayer }: Props = $props()

	function handleStartGame() {
		onStartGame()
	}

	function handleKickPlayer(playerId: string, playerName: string) {
		onKickPlayer(playerId, playerName)
	}
</script>

<div class="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-baby-blue-100">
	<div class="text-center mb-8">
		<h2 class="text-3xl font-party text-baby-pink-700 mb-4">🏠 Room Code</h2>
		<div class="text-7xl font-party text-baby-blue-600 bg-baby-blue-50 rounded-xl py-6 px-10 inline-block border-2 border-baby-blue-200">
			{room.code}
		</div>
		<p class="text-gray-600 font-friendly mt-4">
			Players can join at: <strong class="text-baby-pink-600">http://{typeof window !== 'undefined' ? window.location.hostname : 'localhost'}/{room.code}</strong>
		</p>
	</div>

	<div class="mb-8">
		<h3 class="text-2xl font-friendly font-semibold text-baby-blue-700 mb-6">👥 Players in Lobby ({players.length})</h3>
		{#if players.length === 0}
			<p class="text-gray-500 italic font-friendly">No players have joined yet... 🕰️</p>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each players as player (player.id)}
					<PlayerCard 
						{player} 
						theme="mint"
						showKickButton={true}
						onKick={(playerId, playerName) => handleKickPlayer(playerId, playerName)}
					/>
				{/each}
			</div>
		{/if}
	</div>

	<div class="text-center">
		<button 
			class="bg-baby-pink-500 hover:bg-baby-pink-600 text-white font-friendly font-bold py-4 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
			disabled={players.length === 0 || loading}
			onclick={handleStartGame}
		>
			{loading ? '✨ Starting...' : '🚀 Start Game'}
		</button>
	</div>
</div>