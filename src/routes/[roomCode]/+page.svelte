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
	let loading = $state(false)
	let error = $state('')

	onMount(() => {
		const savedPlayer = localStorage.getItem(`gamePlayer_${roomCode}`)
		
		if (savedPlayer) {
			player = JSON.parse(savedPlayer)
			loadRoomData()
		}
	})

	async function handleJoin() {
		if (!playerName.trim()) {
			error = 'Please enter your name'
			return
		}

		loading = true
		error = ''

		const result = await joinRoom(roomCode, playerName)
		
		if (result) {
			room = result.room
			player = result.player
			
			localStorage.setItem(`gamePlayer_${roomCode}`, JSON.stringify(player))
			localStorage.setItem(`gameRoom_${roomCode}`, JSON.stringify(room))
			
			subscribeToRoom()
		} else {
			error = 'Room not found. Please check the code and try again.'
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

<div class="max-w-md mx-auto p-6">
	<h1 class="text-3xl font-bold text-center mb-8 text-rose-700">Room: {roomCode.toUpperCase()}</h1>

	{#if !player}
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

			{#if error}
				<div class="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
					<p class="text-red-600 text-sm">{error}</p>
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
</div>