<script>
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import { joinRoom, supabase, GAME_STATES } from '$lib/supabase'
	import PlayerLobby from './PlayerLobby.svelte'
	import PlayerGame from './PlayerGame.svelte'

	let roomCode = $page.params.roomCode
	let playerName = $state('')
	let room = $state(null)
	let player = $state(null)
	let gameState = $state(GAME_STATES.LOBBY)
	let loading = $state(true) // Start with loading true
	let errorMessage = $state('')

	onMount(() => {
		checkExistingSession()
	})

	async function checkExistingSession() {
		loading = true
		const savedPlayer = localStorage.getItem(`gamePlayer_${roomCode}`)
		
		if (savedPlayer) {
			const parsedPlayer = JSON.parse(savedPlayer)
			
			// Verify the player still exists in the database
			const { data: existingPlayer, error } = await supabase
				.from('players')
				.select('*')
				.eq('id', parsedPlayer.id)
				.single()

			if (!error && existingPlayer) {
				player = existingPlayer
				await loadRoomData()
				
				// Load the saved room data too
				const savedRoom = localStorage.getItem(`gameRoom_${roomCode}`)
				if (savedRoom) {
					const parsedRoom = JSON.parse(savedRoom)
					// Update with current room state but keep the reference
					room = { ...parsedRoom, ...room }
				}
				
				console.log('Player reconnected:', player.name, 'Game state:', gameState)
			} else {
				// Player no longer exists, clear localStorage
				localStorage.removeItem(`gamePlayer_${roomCode}`)
				localStorage.removeItem(`gameRoom_${roomCode}`)
				await loadRoomData() // Still load room data to check if room exists
			}
		} else {
			// No saved session, just load room data to check if room exists
			await loadRoomData()
		}
		
		loading = false
	}

	async function handleJoin() {
		if (!playerName.trim()) {
			errorMessage = 'Please enter your name'
			return
		}

		loading = true
		errorMessage = ''

		const result = await joinRoom(roomCode, playerName)
		
		if (result) {
			room = result.room
			player = result.player
			
			localStorage.setItem(`gamePlayer_${roomCode}`, JSON.stringify(player))
			localStorage.setItem(`gameRoom_${roomCode}`, JSON.stringify(room))
			
			subscribeToRoom()
		} else {
			errorMessage = 'Room not found. Please check the code and try again.'
		}

		loading = false
	}

	async function loadRoomData() {
		const { data, error } = await supabase
			.from('rooms')
			.select('*')
			.eq('code', roomCode.toUpperCase())
			.single()

		if (!error && data) {
			room = data
			gameState = data.game_state
			subscribeToRoom()
		} else {
			errorMessage = 'Room not found. The room may have ended or the code is incorrect.'
		}
	}

	function subscribeToRoom() {
		if (!room) return

		supabase
			.channel('room-changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'rooms',
					filter: `id=eq.${room.id}`
				},
				(payload) => {
					if (payload.new) {
						gameState = payload.new.game_state
						room = { ...room, ...payload.new }
					}
				}
			)
			.subscribe()
	}
</script>

<div class="max-w-7xl mx-auto p-6">
	<h1 class="text-3xl font-bold text-center mb-8 text-rose-700">Room: {roomCode.toUpperCase()}</h1>
	
	{#if loading}
		<div class="bg-white rounded-lg shadow-lg p-6 text-center">
			<p class="text-lg text-gray-600">Loading...</p>
		</div>
	{:else}
		{#if player && localStorage.getItem(`gamePlayer_${roomCode}`)}
			<div class="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-center">
				<p class="text-blue-800">👋 Welcome back, {player.name}!</p>
			</div>
		{/if}

		{#if !player && room}
		<div class="bg-white rounded-lg shadow-lg p-6">
			<div class="mb-6">
				<label for="playerName" class="block text-sm font-medium text-gray-700 mb-2">
					Your Name
				</label>
				<input
					id="playerName"
					type="text"
					bind:value={playerName}
					placeholder="Enter your name"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
				/>
			</div>

			{#if errorMessage}
				<div class="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
					<p class="text-red-600 text-sm">{errorMessage}</p>
				</div>
			{/if}

			<button
				class="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={loading}
				onclick={handleJoin}
			>
				{loading ? 'Joining...' : 'Join Game'}
			</button>
		</div>
	{:else if gameState === GAME_STATES.LOBBY}
		<PlayerLobby {room} {player} />
	{:else if gameState === GAME_STATES.GUESSING}
		<PlayerGame {room} {player} />
	{:else if gameState === GAME_STATES.REVEAL}
		<div class="bg-white rounded-lg shadow-lg p-6 text-center">
			<h2 class="text-2xl font-semibold text-rose-700 mb-4">Reveal Phase</h2>
			<p class="text-gray-600">Watch the host screen for the reveal!</p>
		</div>
	{:else if gameState === GAME_STATES.RESULTS}
		<div class="bg-white rounded-lg shadow-lg p-6 text-center">
			<h2 class="text-2xl font-semibold text-rose-700 mb-4">Results</h2>
			<p class="text-gray-600">Check the host screen for final results!</p>
		</div>
	{/if}
	
		{#if errorMessage && !room}
			<div class="bg-white rounded-lg shadow-lg p-6 text-center">
				<h2 class="text-2xl font-semibold text-red-700 mb-4">Oops!</h2>
				<p class="text-red-600 mb-4">{errorMessage}</p>
				<a href="/host" class="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded">
					Create New Room
				</a>
			</div>
		{/if}
	{/if}
</div>