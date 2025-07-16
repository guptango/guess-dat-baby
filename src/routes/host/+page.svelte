<script>
	import { onMount } from 'svelte'
	import { createRoom, supabase, GAME_STATES } from '$lib/supabase'

	let existingRooms = $state([])
	let loading = $state(false)
	let creatingRoom = $state(false)

	onMount(async () => {
		await loadExistingRooms()
	})

	async function loadExistingRooms() {
		loading = true
		const { data, error } = await supabase
			.from('rooms')
			.select(`
				*,
				players(count)
			`)
			.order('created_at', { ascending: false })

		if (!error && data) {
			existingRooms = data
		}
		loading = false
	}

	async function createNewRoom() {
		creatingRoom = true
		const room = await createRoom()
		if (room) {
			window.location.href = `/host/${room.code}`
		}
		creatingRoom = false
	}

	async function deleteRoom(roomId, roomCode) {
		if (!confirm(`Are you sure you want to delete room ${roomCode}? This action cannot be undone.`)) {
			return
		}

		const { error } = await supabase
			.from('rooms')
			.delete()
			.eq('id', roomId)

		if (!error) {
			await loadExistingRooms()
		} else {
			console.error('Error deleting room:', error)
			alert('Failed to delete room. Please try again.')
		}
	}

	function getGameStateDisplay(state) {
		switch (state) {
			case GAME_STATES.LOBBY: return '🚪 Lobby'
			case GAME_STATES.GUESSING: return '🤔 Guessing'
			case GAME_STATES.REVEAL: return '🎉 Reveal'
			case GAME_STATES.RESULTS: return '🏆 Results'
			default: return state
		}
	}

	function getTimeAgo(dateString) {
		const date = new Date(dateString)
		const now = new Date()
		const diffMs = now - date
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
		const diffMins = Math.floor(diffMs / (1000 * 60))
		
		if (diffHours > 0) {
			return `${diffHours}h ago`
		} else if (diffMins > 0) {
			return `${diffMins}m ago`
		} else {
			return 'Just now'
		}
	}
</script>

<div class="max-w-4xl mx-auto p-6">
	<h1 class="text-3xl font-bold text-center mb-8 text-rose-700">Host Dashboard</h1>

	<!-- Create New Room Button -->
	<div class="text-center mb-8">
		<button 
			class="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={creatingRoom}
			onclick={createNewRoom}
		>
			{creatingRoom ? 'Creating Room...' : '+ Create New Room'}
		</button>
	</div>

	<!-- Existing Rooms -->
	<div class="bg-white rounded-lg shadow-lg p-6">
		<div class="flex justify-between items-center mb-6">
			<h2 class="text-2xl font-semibold text-rose-700">Your Rooms</h2>
			<button 
				class="text-rose-600 hover:text-rose-700 text-sm font-medium"
				onclick={loadExistingRooms}
				disabled={loading}
			>
				{loading ? 'Refreshing...' : '🔄 Refresh'}
			</button>
		</div>

		{#if loading}
			<div class="text-center py-8">
				<p class="text-gray-500">Loading rooms...</p>
			</div>
		{:else if existingRooms.length === 0}
			<div class="text-center py-8">
				<p class="text-gray-500 mb-4">No rooms found</p>
				<p class="text-sm text-gray-400">Create your first room to get started!</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each existingRooms as room}
					<div class="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<span class="text-2xl font-bold text-rose-600">{room.code}</span>
									<span class="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded">
										{getGameStateDisplay(room.game_state)}
									</span>
									<span class="text-xs text-gray-500">
										{getTimeAgo(room.created_at)}
									</span>
								</div>
								
								<div class="flex items-center gap-4 text-sm text-gray-600">
									<span>👥 {room.players?.[0]?.count || 0} players</span>
									{#if room.game_state === GAME_STATES.REVEAL}
										<span>🔍 Revealing baby {room.current_reveal_index + 1}/9</span>
									{/if}
								</div>
							</div>
							
							<div class="flex gap-2">
								<a 
									href="/host/{room.code}"
									class="bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium py-2 px-4 rounded"
								>
									Manage
								</a>
								<button 
									class="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded"
									onclick={() => deleteRoom(room.id, room.code)}
									title="Delete Room"
								>
									🗑️
								</button>
							</div>
						</div>
						
						<div class="mt-3 text-xs text-gray-400">
							Players can join at: <code class="bg-gray-100 px-1 rounded">/{room.code}</code>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Instructions -->
	<div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
		<h3 class="text-lg font-semibold text-blue-800 mb-2">How it works:</h3>
		<ul class="text-sm text-blue-700 space-y-1">
			<li>• <strong>Create a room</strong> to get a unique 4-letter code</li>
			<li>• <strong>Share the room URL</strong> (/{'{room-code}'}) with players</li>
			<li>• <strong>Manage your room</strong> through the host dashboard</li>
			<li>• <strong>Delete rooms</strong> when the game is over</li>
		</ul>
	</div>
</div>