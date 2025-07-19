<script>
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import { joinRoom, supabase, GAME_STATES } from '$lib/supabase'
	import PlayerLobby from './PlayerLobby.svelte'
	import PlayerGame from './PlayerGame.svelte'
    import PlayerGame2 from '$lib/components/player/PlayerGame2.svelte'

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
	<h1 class="text-4xl font-party text-center mb-8 text-baby-blue-700">🏠 Room: {roomCode.toUpperCase()}</h1>
	
	{#if loading}
		<div class="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-baby-blue-100">
			<p class="text-lg text-gray-600 font-friendly">✨ Loading...</p>
		</div>
	{:else}
		{#if player && localStorage.getItem(`gamePlayer_${roomCode}`)}
			<div class="bg-baby-blue-50 border-2 border-baby-blue-200 rounded-xl p-4 mb-6 text-center">
				<p class="text-baby-blue-800 font-friendly font-medium">👋 Welcome back, {player.name}!</p>
			</div>
		{/if}

		{#if !player && room}
		<div class="bg-white rounded-xl shadow-lg p-8 border-2 border-baby-pink-100">
			<div class="text-center mb-8">
				<h2 class="text-2xl font-party text-baby-pink-600 mb-3">🎮 Join the Fun!</h2>
				<p class="text-gray-600 font-friendly">Enter your name to start guessing babies!</p>
			</div>
			
			<div class="mb-6">
				<label for="playerName" class="block text-sm font-friendly font-medium text-baby-blue-700 mb-3">
					👤 Your Name
				</label>
				<input
					id="playerName"
					type="text"
					bind:value={playerName}
					placeholder="Enter your name"
					class="w-full px-4 py-3 border-2 border-baby-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-baby-pink-400 focus:border-baby-pink-400 font-friendly"
				/>
			</div>

			{#if errorMessage}
				<div class="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
					<p class="text-red-600 text-sm font-friendly">❌ {errorMessage}</p>
				</div>
			{/if}

			<button
				class="w-full bg-baby-pink-500 hover:bg-baby-pink-600 text-white font-friendly font-bold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
				disabled={loading}
				onclick={handleJoin}
			>
				{loading ? '⏳ Joining...' : '🚀 Join Game'}
			</button>
		</div>
	{:else if gameState === GAME_STATES.LOBBY}
		<PlayerLobby {room} {player} />
	{:else if gameState === GAME_STATES.GUESSING}
		<PlayerGame2 {room} {player} />
	{:else if gameState === GAME_STATES.REVEAL}
		<div class="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-sunshine-200">
			<h2 class="text-3xl font-party text-sunshine-700 mb-6">🎉 Reveal Phase</h2>
			<p class="text-gray-600 font-friendly text-lg">Watch the host screen for the big reveal! 👀</p>
			<p class="text-sunshine-600 font-friendly text-sm mt-4">Find out how well you guessed those adorable babies! 🍼</p>
		</div>
	{:else if gameState === GAME_STATES.RESULTS}
		<div class="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-baby-blue-200">
			<h2 class="text-3xl font-party text-baby-blue-700 mb-6">🏆 Final Results</h2>
			<p class="text-gray-600 font-friendly text-lg">Check the host screen for final results! 📊</p>
			<p class="text-baby-blue-600 font-friendly text-sm mt-4">Great job playing! Hope you had fun! 🎊</p>
		</div>
	{/if}
	
		{#if errorMessage && !room}
			<div class="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-red-200">
				<h2 class="text-2xl font-party text-red-600 mb-6">😵 Oops!</h2>
				<p class="text-red-600 mb-6 font-friendly">{errorMessage}</p>
				<a href="/host" class="bg-baby-pink-500 hover:bg-baby-pink-600 text-white font-friendly font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
					🎉 Create New Room
				</a>
			</div>
		{/if}
	{/if}
</div>