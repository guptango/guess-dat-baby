<script>
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import { supabase, GAME_STATES, getGuessesForReveal, precomputeAllScores, updateGameState } from '$lib/supabase'
	import { gameData, celebrityImages } from '$lib/gameData'
	import HostLobby from '$lib/components/host/HostLobby.svelte'
	import HostGuessing from '$lib/components/host/HostGuessing.svelte'
	import HostReveal from '$lib/components/host/HostReveal.svelte'
	import HostResults from '$lib/components/host/HostResults.svelte'

	let roomCode = $page.params.roomCode
	let room = $state(null)
	let players = $state([])
	let gameState = $state(GAME_STATES.LOBBY)
	let currentRevealIndex = $state(0)
	let loading = $state(false)
	
	// Reveal phase state
	let currentBabyData = $state(null)
	let currentGuesses = $state([])
	let showingAnswer = $state(false)
	let revealLoading = $state(false)

	// Computed value to group guesses by couple
	let groupedGuesses = $derived.by(() => {
		const groups = {}
		// Ensure we're working with a safe copy of the data
		const safeGuesses = [...currentGuesses]
		safeGuesses.forEach(guess => {
			const coupleName = guess?.couple_name || 'Unknown Couple'
			const playerName = guess?.players?.name || 'Unknown Player'
			if (!groups[coupleName]) {
				groups[coupleName] = [playerName]
			} else {
				groups[coupleName] = [...groups[coupleName], playerName]
			}
		})
		return Object.entries(groups).map(([couple, players]) => ({
			couple,
			players
		}))
	})

	// Sorted players for display
	let sortedPlayers = $derived([...players].sort((a, b) => b.score - a.score))

	// Correct answers mapping - stays in host browser only
	const correctAnswers = [
		'Daddy & Halle Berry',
		'Daddy & Mindy Kaling', 
		'Daddy & Priyanka Chopra',
		'Daddy & Zendaya',
		'Mommy & Benedict Cumberbatch',
		'Mommy & Owen Wilson',
		'Mommy & Rupert Grint',
		'Mommy & Timothee Chalamet',
		'Mommy & Daddy'
	]

	onMount(async () => {
		await loadRoom()
	})

	async function loadRoom() {
		loading = true
		
		// Find room by code
		const { data: roomData, error: roomError } = await supabase
			.from('rooms')
			.select('*')
			.eq('code', roomCode.toUpperCase())
			.single()

		if (roomError || !roomData) {
			console.error('Room not found:', roomError)
			loading = false
			return
		}

		room = { ...roomData }
		gameState = room.game_state
		currentRevealIndex = room.current_reveal_index || 0
		
		subscribeToRoom()
		await loadPlayers()
		
		loading = false
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
					table: 'players',
					filter: `room_id=eq.${room.id}`
				},
				(payload) => {
					loadPlayers()
				}
			)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'rooms',
					filter: `id=eq.${room.id}`
				},
				(payload) => {
					console.log('Room change:', payload)
					if (payload.new) {
						gameState = payload.new.game_state
						currentRevealIndex = payload.new.current_reveal_index || 0
						// Create a completely new room object to avoid mutation
						room = { ...payload.new }
					}
				}
			)
			.subscribe()
	}

	async function loadPlayers() {
		if (!room) return

		const { data, error } = await supabase
			.from('players')
			.select('*')
			.eq('room_id', room.id)

		if (!error) {
			// Deep copy to avoid mutation issues with Supabase data
			players = JSON.parse(JSON.stringify(data || []))
		}
	}

	async function startGame() {
		if (!room) return

		const { error } = await supabase
			.from('rooms')
			.update({ game_state: GAME_STATES.GUESSING })
			.eq('id', room.id)

		if (error) {
			console.error('Error starting game:', error)
		}
	}

	async function startReveal() {
		if (!room) return

		// Precompute all scores before starting reveal
		const success = await precomputeAllScores(room.id, correctAnswers)
		if (!success) {
			console.error('Failed to precompute scores')
			return
		}

		const { error } = await supabase
			.from('rooms')
			.update({ 
				game_state: GAME_STATES.REVEAL,
				current_reveal_index: 0
			})
			.eq('id', room.id)

		if (error) {
			console.error('Error starting reveal:', error)
		}
	}

	async function showFinalResults() {
		if (!room) return

		const { error } = await supabase
			.from('rooms')
			.update({ game_state: GAME_STATES.RESULTS })
			.eq('id', room.id)

		if (error) {
			console.error('Error showing results:', error)
		}
	}

	async function deleteRoom() {
		if (!room) return
		
		if (!confirm(`Are you sure you want to delete room ${room.code}? This will end the game for all players and cannot be undone.`)) {
			return
		}

		const { error } = await supabase
			.from('rooms')
			.delete()
			.eq('id', room.id)

		if (!error) {
			// Redirect back to host dashboard
			window.location.href = '/host'
		} else {
			console.error('Error deleting room:', error)
			alert('Failed to delete room. Please try again.')
		}
	}

	async function loadCurrentReveal() {
		try {
			if (!room || typeof currentRevealIndex !== 'number') {
				console.warn('Invalid state for loadCurrentReveal:', { room, currentRevealIndex })
				return
			}

			if (currentRevealIndex >= gameData.length) {
				// All babies revealed, go to results
				await updateGameState(room.id, GAME_STATES.RESULTS)
				return
			}

			// Hide answer immediately when loading new baby
			showingAnswer = false
			currentBabyData = gameData[currentRevealIndex]
			const guesses = await getGuessesForReveal(room.id, currentRevealIndex)
			// Deep copy to avoid mutation issues with Supabase data
			currentGuesses = JSON.parse(JSON.stringify(guesses || []))
		} catch (error) {
			console.error('Error in loadCurrentReveal:', error)
		}
	}

	async function revealAnswer() {
		revealLoading = true
		showingAnswer = true
		revealLoading = false
	}

	async function nextBaby() {
		const nextIndex = currentRevealIndex + 1
		await updateGameState(room.id, GAME_STATES.REVEAL, nextIndex)
	}

	function kickPlayer(playerId, playerName) {
		if (!confirm(`Are you sure you want to kick ${playerName} from the game?`)) {
			return
		}

		supabase
			.from('players')
			.delete()
			.eq('id', playerId)
			.then(({ error }) => {
				if (!error) {
					loadPlayers()
				} else {
					console.error('Error kicking player:', error)
					alert('Failed to kick player. Please try again.')
				}
			})
	}

	// Effect to handle reveal state changes
	$effect(() => {
		if (gameState === GAME_STATES.REVEAL && room && typeof currentRevealIndex === 'number') {
			// Add a small delay to ensure all state updates have been processed
			setTimeout(() => {
				loadCurrentReveal()
			}, 100)
		}
	})
</script>

<div class="max-w-4xl mx-auto p-6">
	<div class="flex justify-between items-center mb-8">
		<h1 class="text-3xl font-party text-baby-blue-700">🎮 Host Dashboard - Room {roomCode.toUpperCase()}</h1>
		<div class="flex gap-3">
			<a href="/host" class="text-gray-600 hover:text-baby-blue-600 text-sm font-friendly font-medium py-2 px-4 rounded-lg border-2 border-gray-300 hover:border-baby-blue-300 transition-colors">
				← Back to Dashboard
			</a>
			<button 
				class="bg-red-400 hover:bg-red-500 text-white text-sm font-friendly font-medium py-2 px-3 rounded-lg transition-colors"
				onclick={deleteRoom}
				title="Delete Room"
			>
				🗑️ Delete Room
			</button>
		</div>
	</div>

	{#if loading}
		<div class="text-center">
			<p class="text-lg font-friendly text-gray-600">✨ Loading room...</p>
		</div>
	{:else if room}
		{#if gameState === GAME_STATES.LOBBY}
			<HostLobby 
				{room}
				{players}
				loading={loading}
				onStartGame={startGame}
				onKickPlayer={kickPlayer}
			/>
		{:else if gameState === GAME_STATES.GUESSING}
			<HostGuessing 
				{players}
				loading={loading}
				onStartReveal={startReveal}
				onKickPlayer={kickPlayer}
			/>
		{:else if gameState === GAME_STATES.REVEAL}
			<HostReveal 
				{currentRevealIndex}
				{currentGuesses}
				{players}
				{showingAnswer}
				{correctAnswers}
				{revealLoading}
				onRevealAnswer={revealAnswer}
				onNextBaby={nextBaby}
				onShowFinalResults={showFinalResults}
			/>
		{:else if gameState === GAME_STATES.RESULTS}
			<HostResults {players} />
		{/if}
	{:else}
		<div class="text-center">
			<p class="text-red-600">Room not found. Please check the room code.</p>
			<a href="/host" class="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded mt-4 inline-block">
				Create New Room
			</a>
		</div>
	{/if}
</div>