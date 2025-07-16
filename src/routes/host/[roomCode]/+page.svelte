<script>
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import { supabase, GAME_STATES, getGuessesForReveal, calculateAndUpdateScores, updateGameState } from '$lib/supabase'
	import { gameData, celebrityImages } from '$lib/gameData'

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
		currentGuesses.forEach(guess => {
			const coupleName = guess.couple_name
			if (!groups[coupleName]) {
				groups[coupleName] = []
			}
			groups[coupleName].push(guess.players?.name || 'Unknown Player')
		})
		const result = Object.entries(groups).map(([couple, players]) => ({
			couple,
			players
		}))
		return result
	})

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

		room = roomData
		gameState = room.game_state
		currentRevealIndex = room.current_reveal_index
		
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
						currentRevealIndex = payload.new.current_reveal_index
						room = { ...room, ...payload.new }
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
			players = data
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
		if (currentRevealIndex >= gameData.length) {
			// All babies revealed, go to results
			await updateGameState(room.id, GAME_STATES.RESULTS)
			return
		}

		currentBabyData = gameData[currentRevealIndex]
		currentGuesses = await getGuessesForReveal(room.id, currentRevealIndex)
		showingAnswer = false
	}

	async function revealAnswer() {
		revealLoading = true
		showingAnswer = true

		const correctAnswer = correctAnswers[currentRevealIndex]
		await calculateAndUpdateScores(room.id, currentRevealIndex, correctAnswer)

		// Reload players to get updated scores
		await loadPlayers()

		revealLoading = false
	}

	async function nextBaby() {
		const nextIndex = currentRevealIndex + 1
		await updateGameState(room.id, GAME_STATES.REVEAL, nextIndex)
	}

	// Effect to handle reveal state changes
	$effect(() => {
		if (gameState === GAME_STATES.REVEAL && room) {
			loadCurrentReveal()
		}
	})
</script>

<div class="max-w-4xl mx-auto p-6">
	<div class="flex justify-between items-center mb-8">
		<h1 class="text-3xl font-bold text-rose-700">Host Dashboard - Room {roomCode.toUpperCase()}</h1>
		<div class="flex gap-2">
			<a href="/host" class="text-gray-600 hover:text-gray-800 text-sm font-medium py-2 px-3 rounded border">
				← Back to Dashboard
			</a>
			<button 
				class="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded"
				onclick={deleteRoom}
				title="Delete Room"
			>
				🗑️ Delete Room
			</button>
		</div>
	</div>

	{#if loading}
		<div class="text-center">
			<p class="text-lg">Loading room...</p>
		</div>
	{:else if room}
		{#if gameState === GAME_STATES.LOBBY}
			<div class="bg-white rounded-lg shadow-lg p-6 mb-6">
				<div class="text-center mb-6">
					<h2 class="text-2xl font-semibold text-rose-700 mb-2">Room Code</h2>
					<div class="text-6xl font-bold text-rose-500 bg-rose-50 rounded-lg py-4 px-8 inline-block">
						{room.code}
					</div>
					<p class="text-gray-600 mt-2">Players can join at: <strong>/{room.code}</strong></p>
				</div>

				<div class="mb-6">
					<h3 class="text-xl font-semibold text-rose-700 mb-4">Players in Lobby ({players.length})</h3>
					{#if players.length === 0}
						<p class="text-gray-500 italic">No players have joined yet...</p>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each players as player}
								<div class="bg-rose-50 rounded-lg p-4 text-center">
									<p class="font-semibold text-rose-700">{player.name}</p>
									<p class="text-sm text-gray-600">
										{player.submitted_guesses ? 'Submitted' : 'Waiting...'}
									</p>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="text-center">
					<button 
						class="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={players.length === 0}
						onclick={startGame}
					>
						Start Game
					</button>
				</div>
			</div>
		{:else if gameState === GAME_STATES.GUESSING}
			<div class="bg-white rounded-lg shadow-lg p-6 mb-6">
				<div class="mb-4 text-center">
					<h3 class="text-xl font-semibold text-rose-700 mb-2">Game in Progress</h3>
					<p class="text-gray-600">Players are making their guesses...</p>
					
					<div class="mt-4">
						<p class="text-sm text-gray-500">
							{players.filter(p => p.submitted_guesses).length} / {players.length} players have submitted
						</p>
					</div>
				</div>
				
				<div class="text-center">
					<button 
						class="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={players.filter(p => p.submitted_guesses).length !== players.length}
						onclick={startReveal}
					>
						Start Reveal
					</button>
				</div>
			</div>
		{:else if gameState === GAME_STATES.REVEAL}
			<div class="max-w-6xl mx-auto">
				<h2 class="text-2xl font-bold text-center mb-8 text-rose-700">Reveal Phase</h2>
				
				{#if currentBabyData}
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
						<!-- Baby Image -->
						<div class="bg-white rounded-lg shadow-lg p-6 text-center">
							<h3 class="text-2xl font-semibold text-rose-700 mb-4">
								Baby {currentRevealIndex + 1} of {gameData.length}
							</h3>
							<img 
								src={currentBabyData.babyImage} 
								alt={`Baby ${currentRevealIndex + 1}`} 
								class="max-w-full h-auto mx-auto rounded-lg border-4 border-rose-200"
							/>
						</div>

						<!-- Player Guesses -->
						<div class="bg-white rounded-lg shadow-lg p-6">
							<h4 class="text-xl font-semibold text-rose-700 mb-4">Player Guesses</h4>
							{#if currentGuesses.length === 0}
								<p class="text-gray-500 italic">No guesses submitted for this baby...</p>
							{:else}
						
								{#if groupedGuesses.length > 0}
									<div class="space-y-4">
										{#each groupedGuesses as group}
											<div class="bg-rose-50 rounded-lg p-4">
												<div class="flex items-center gap-4 mb-3">
													<!-- Couple Pictures -->
													<div class="flex gap-2">
														{#each group.couple.split(' & ') as person}
															{#if celebrityImages[person]}
																<img src={celebrityImages[person]} alt={person} class="w-10 h-10 rounded-full object-cover border-2 border-rose-300">
															{/if}
														{/each}
													</div>
													<!-- Couple Name -->
													<div class="font-semibold text-rose-700 text-lg">{group.couple}</div>
												</div>
												<!-- Players who voted -->
												<div class="flex flex-wrap gap-2">
													{#each group.players as player}
														<span class="bg-white text-rose-600 px-3 py-1 rounded-full text-sm font-medium">{player}</span>
													{/each}
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<!-- Fallback to original display -->
									<div class="space-y-3">
										{#each currentGuesses as guess}
											<div class="bg-rose-50 rounded-lg p-3 flex justify-between items-center">
												<span class="font-medium text-rose-700">{guess.players?.name}</span>
												<span class="text-gray-600">{guess.couple_name}</span>
											</div>
										{/each}
									</div>
								{/if}
							{/if}
						</div>
					</div>

					<!-- Answer Reveal -->
					{#if showingAnswer}
						<div class="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8 text-center">
							<h4 class="text-2xl font-semibold text-green-700 mb-4">Correct Answer</h4>
							<div class="text-3xl font-bold text-green-600 mb-4">
								{correctAnswers[currentRevealIndex]}
							</div>
							<div class="flex justify-center gap-4">
								{#each correctAnswers[currentRevealIndex].split(' & ') as parent}
									<div class="text-center">
										<img 
											src={celebrityImages[parent]} 
											alt={parent} 
											class="w-20 h-20 rounded-full border-4 border-green-300 mx-auto mb-2"
										/>
										<p class="font-medium text-green-700">{parent}</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Current Scores -->
					<div class="bg-white rounded-lg shadow-lg p-6 mb-8">
						<h4 class="text-xl font-semibold text-rose-700 mb-4">Current Scores</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each players.sort((a, b) => b.score - a.score) as player}
								<div class="bg-rose-50 rounded-lg p-4 text-center">
									<p class="font-semibold text-rose-700">{player.name}</p>
									<p class="text-2xl font-bold text-rose-600">{player.score}</p>
								</div>
							{/each}
						</div>
					</div>

					<!-- Controls -->
					<div class="text-center">
						{#if !showingAnswer}
							<button 
								class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
								disabled={revealLoading}
								onclick={revealAnswer}
							>
								{revealLoading ? 'Revealing...' : 'Reveal Answer'}
							</button>
						{:else if currentRevealIndex < gameData.length - 1}
							<button 
								class="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-lg"
								onclick={nextBaby}
							>
								Next Baby
							</button>
						{:else}
							<button 
								class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg"
								onclick={showFinalResults}
							>
								Show Final Results
							</button>
						{/if}
					</div>
				{:else}
					<div class="text-center">
						<p class="text-lg text-gray-600">Loading reveal data...</p>
					</div>
				{/if}
			</div>
		{:else if gameState === GAME_STATES.RESULTS}
			<div class="max-w-4xl mx-auto">
				<h2 class="text-3xl font-bold text-center mb-8 text-rose-700">🎉 Final Results! 🎉</h2>
				
				<div class="bg-white rounded-lg shadow-lg p-8">
					<div class="space-y-6">
						{#each players.sort((a, b) => b.score - a.score) as player, index}
							<div class="flex items-center justify-between p-4 rounded-lg {index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' : index === 1 ? 'bg-gray-100 border-2 border-gray-400' : index === 2 ? 'bg-orange-100 border-2 border-orange-400' : 'bg-rose-50 border border-rose-200'}">
								<div class="flex items-center gap-4">
									<div class="text-2xl font-bold {index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : index === 2 ? 'text-orange-600' : 'text-rose-600'}">
										{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
									</div>
									<div>
										<p class="text-xl font-semibold {index === 0 ? 'text-yellow-700' : 'text-gray-700'}">{player.name}</p>
										{#if index === 0}
											<p class="text-sm text-yellow-600">Winner!</p>
										{/if}
									</div>
								</div>
								<div class="text-right">
									<p class="text-2xl font-bold {index === 0 ? 'text-yellow-600' : 'text-gray-600'}">{player.score}</p>
									<p class="text-sm text-gray-500">points</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
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