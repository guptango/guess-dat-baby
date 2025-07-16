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

<div class="bg-white rounded-lg shadow-lg p-6 text-center">
	<h2 class="text-2xl font-semibold text-rose-700 mb-4">Welcome, {player.name}!</h2>
	
	<div class="mb-6">
		<p class="text-gray-600 mb-2">You're in room:</p>
		<div class="text-4xl font-bold text-rose-500 bg-rose-50 rounded-lg py-3 px-6 inline-block">
			{room.code}
		</div>
	</div>

	<div class="mb-6">
		<h3 class="text-lg font-semibold text-rose-700 mb-4">Players in Lobby ({players.length})</h3>
		{#if players.length === 0}
			<p class="text-gray-500 italic">Loading players...</p>
		{:else}
			<div class="space-y-2">
				{#each players as p}
					<div class="bg-rose-50 rounded-lg p-3 {p.id === player.id ? 'ring-2 ring-rose-300' : ''}">
						<p class="font-semibold text-rose-700">
							{p.name} {p.id === player.id ? '(You)' : ''}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	
	<div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
		<p class="text-yellow-800">Waiting for the host to start the game...</p>
	</div>
</div>