<script>
	import { onMount } from 'svelte'
	import { supabase } from '$lib/supabase'

	let { room, player } = $props()
	let players = $state([])

	onMount(() => {
		loadPlayers()
		subscribeToPlayers()
	})

	async function loadPlayers() {
		const { data, error } = await supabase
			.from('players')
			.select('*')
			.eq('room_id', room.id)

		if (!error) {
			players = data
		}
	}

	function subscribeToPlayers() {
		supabase
			.channel('lobby-players')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'players',
					filter: `room_id=eq.${room.id}`
				},
				() => {
					loadPlayers()
				}
			)
			.subscribe()
	}
</script>

<div class="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-baby-blue-100">
	<h2 class="text-3xl font-party text-baby-blue-700 mb-6">🎉 Welcome, {player.name}! 👋</h2>
	
	<div class="mb-8">
		<p class="text-gray-600 font-friendly mb-3">You're in room:</p>
		<div class="text-5xl font-party text-baby-pink-600 bg-baby-pink-50 rounded-xl py-4 px-8 inline-block border-2 border-baby-pink-200">
			{room.code}
		</div>
	</div>

	<div class="mb-8">
		<h3 class="text-xl font-friendly font-semibold text-baby-blue-700 mb-6">👥 Players in Lobby ({players.length})</h3>
		{#if players.length === 0}
			<p class="text-gray-500 italic font-friendly">Loading players...</p>
		{:else}
			<div class="space-y-3">
				{#each players as p}
					<div class="bg-mint-50 rounded-xl p-4 transition-all duration-200 {p.id === player.id ? 'ring-2 ring-baby-pink-400 bg-baby-pink-50' : 'hover:bg-mint-100'}">
						<p class="font-friendly font-semibold text-baby-blue-700">
							{p.id === player.id ? '⭐' : '👤'} {p.name} {p.id === player.id ? '(You)' : ''}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	
	<div class="bg-sunshine-50 border-2 border-sunshine-200 rounded-xl p-6">
		<p class="text-sunshine-800 font-friendly font-medium">⏳ Waiting for the host to start the game...</p>
		<p class="text-sunshine-600 text-sm font-friendly mt-2">Get ready to guess some adorable babies! 🍼</p>
	</div>
</div>