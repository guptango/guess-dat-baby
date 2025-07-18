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

	async function kickPlayer(playerId, playerName) {
		if (!confirm(`Are you sure you want to kick ${playerName} from the game?`)) {
			return
		}

		const { error } = await supabase
			.from('players')
			.delete()
			.eq('id', playerId)

		if (!error) {
			await loadPlayers()
		} else {
			console.error('Error kicking player:', error)
			alert('Failed to kick player. Please try again.')
		}
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
			<div class="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-baby-blue-100">
				<div class="text-center mb-8">
					<h2 class="text-3xl font-party text-baby-pink-700 mb-4">🏠 Room Code</h2>
					<div class="text-7xl font-party text-baby-blue-600 bg-baby-blue-50 rounded-xl py-6 px-10 inline-block border-2 border-baby-blue-200">
						{room.code}
					</div>
					<p class="text-gray-600 font-friendly mt-4">Players can join at: <strong class="text-baby-pink-600"> http://{window.location.hostname}/{room.code}</strong></p>
				</div>

				<div class="mb-8">
					<h3 class="text-2xl font-friendly font-semibold text-baby-blue-700 mb-6">👥 Players in Lobby ({players.length})</h3>
					{#if players.length === 0}
						<p class="text-gray-500 italic font-friendly">No players have joined yet... 🕰️</p>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each players as player}
								<div class="bg-mint-50 rounded-xl p-5 text-center border-2 border-mint-200 hover:bg-mint-100 transition-colors relative">
									<button 
										class="absolute top-2 right-2 bg-red-400 hover:bg-red-500 text-white text-xs font-friendly font-medium py-1 px-2 rounded-full transition-colors"
										onclick={() => kickPlayer(player.id, player.name)}
										title="Kick Player"
									>
										✕
									</button>
									<p class="font-friendly font-semibold text-baby-blue-700">👤 {player.name}</p>
									<p class="text-sm text-gray-600 font-friendly mt-2">
										{player.submitted_guesses ? '✅ Submitted' : '⏳ Waiting...'}
									</p>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="text-center">
					<button 
						class="bg-baby-pink-500 hover:bg-baby-pink-600 text-white font-friendly font-bold py-4 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
						disabled={players.length === 0}
						onclick={startGame}
					>
						🚀 Start Game
					</button>
				</div>
			</div>
		{:else if gameState === GAME_STATES.GUESSING}
			<div class="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-sunshine-200">
				<div class="mb-6 text-center">
					<h3 class="text-2xl font-party text-sunshine-700 mb-3">🤔 Game in Progress</h3>
					<p class="text-gray-600 font-friendly">Players are making their guesses... 🍼</p>
					
					<div class="mt-4">
						<p class="text-sm text-gray-500">
							{players.filter(p => p.submitted_guesses).length} / {players.length} players have submitted
						</p>
					</div>
				</div>

				<!-- Player Status During Guessing -->
				{#if players.length > 0}
					<div class="mb-8">
						<h4 class="text-lg font-friendly font-semibold text-sunshine-700 mb-4 text-center">👥 Player Status</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
							{#each players as player}
								<div class="bg-sunshine-50 rounded-lg p-4 text-center border-2 border-sunshine-200 hover:bg-sunshine-100 transition-colors relative">
									<button 
										class="absolute top-2 right-2 bg-red-400 hover:bg-red-500 text-white text-xs font-friendly font-medium py-1 px-2 rounded-full transition-colors"
										onclick={() => kickPlayer(player.id, player.name)}
										title="Kick Player"
									>
										✕
									</button>
									<p class="font-friendly font-semibold text-sunshine-700">👤 {player.name}</p>
									<p class="text-sm text-gray-600 font-friendly mt-2">
										{player.submitted_guesses ? '✅ Submitted' : '⏳ Guessing...'}
									</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				
				<div class="text-center">
					<button 
						class="bg-sunshine-500 hover:bg-sunshine-600 text-white font-friendly font-bold py-4 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
						disabled={players.filter(p => p.submitted_guesses).length !== players.length}
						onclick={startReveal}
					>
						🎉 Start Reveal
					</button>
				</div>
			</div>
		{:else if gameState === GAME_STATES.REVEAL}
			<div class="max-w-6xl mx-auto">
				<h2 class="text-3xl font-party text-center mb-8 text-sunshine-700">🎉 Reveal Phase 👶</h2>
				
				{#if currentBabyData}
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
						<!-- Baby Image -->
						<div class="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-baby-blue-100">
							<h3 class="text-2xl font-friendly font-semibold text-baby-blue-700 mb-6">
								🍼 Baby {currentRevealIndex + 1} of {gameData.length}
							</h3>
							<img 
								src={currentBabyData.babyImage} 
								alt={`Baby ${currentRevealIndex + 1}`} 
								class="max-w-full h-auto mx-auto rounded-xl border-4 border-baby-pink-200 shadow-lg"
							/>
						</div>

						<!-- Player Guesses -->
						<div class="bg-white rounded-xl shadow-lg p-8 border-2 border-mint-100">
							<h4 class="text-xl font-friendly font-semibold text-mint-700 mb-6">👥 Player Guesses</h4>
							{#if currentGuesses.length === 0}
								<p class="text-gray-500 italic font-friendly">No guesses submitted for this baby... 🤷‍♀️</p>
							{:else}
						
								{#if groupedGuesses.length > 0}
									<div class="space-y-4">
										{#each groupedGuesses as group}
											<div class="bg-mint-50 rounded-xl p-5 border-2 border-mint-200">
												<div class="flex items-center gap-4 mb-4">
													<!-- Couple Pictures -->
													<div class="flex gap-2">
														{#each group.couple.split(' & ') as person}
															{#if celebrityImages[person]}
																<img src={celebrityImages[person]} alt={person} class="w-12 h-12 rounded-full object-cover border-2 border-baby-pink-300 shadow-md">
															{/if}
														{/each}
													</div>
													<!-- Couple Name -->
													<div class="font-friendly font-semibold text-baby-blue-700 text-lg">{group.couple}</div>
												</div>
												<!-- Players who voted -->
												<div class="flex flex-wrap gap-2">
													{#each group.players as player}
														<span class="bg-white text-baby-pink-600 px-3 py-2 rounded-full text-sm font-friendly font-medium border border-baby-pink-200 shadow-sm">{player}</span>
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
						<div class="bg-sunshine-50 border-2 border-sunshine-300 rounded-xl p-8 mb-8 text-center">
							<h4 class="text-3xl font-party text-sunshine-700 mb-6">🎯 Correct Answer!</h4>
							<div class="text-3xl font-friendly font-bold text-sunshine-600 mb-6">
								{correctAnswers[currentRevealIndex]}
							</div>
							<div class="flex justify-center gap-6">
								{#each correctAnswers[currentRevealIndex].split(' & ') as parent}
									<div class="text-center">
										<img 
											src={celebrityImages[parent]} 
											alt={parent} 
											class="w-24 h-24 rounded-full border-4 border-sunshine-400 mx-auto mb-3 shadow-lg"
										/>
										<p class="font-friendly font-medium text-sunshine-700">{parent}</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Current Scores -->
					<div class="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-baby-blue-100">
						<h4 class="text-2xl font-friendly font-semibold text-baby-blue-700 mb-6">🏆 Current Scores</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each sortedPlayers as player}
								<div class="bg-baby-pink-50 rounded-xl p-5 text-center border-2 border-baby-pink-200">
									<p class="font-friendly font-semibold text-baby-blue-700">👤 {player.name}</p>
									<p class="text-2xl font-party text-sunshine-600">{player.score}</p>
								</div>
							{/each}
						</div>
					</div>

					<!-- Controls -->
					<div class="text-center">
						{#if !showingAnswer}
							<button 
								class="bg-sunshine-500 hover:bg-sunshine-600 text-white font-friendly font-bold py-4 px-8 rounded-xl disabled:opacity-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
								disabled={revealLoading}
								onclick={revealAnswer}
							>
								{revealLoading ? '✨ Revealing...' : '🎯 Reveal Answer'}
							</button>
						{:else if currentRevealIndex < gameData.length - 1}
							<button 
								class="bg-baby-pink-500 hover:bg-baby-pink-600 text-white font-friendly font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
								onclick={nextBaby}
							>
								➡️ Next Baby
							</button>
						{:else}
							<button 
								class="bg-baby-blue-500 hover:bg-baby-blue-600 text-white font-friendly font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
								onclick={showFinalResults}
							>
								🏆 Show Final Results
							</button>
						{/if}
					</div>
				{:else}
					<div class="text-center">
						<p class="text-lg font-friendly text-gray-600">✨ Loading reveal data...</p>
					</div>
				{/if}
			</div>
		{:else if gameState === GAME_STATES.RESULTS}
			<div class="max-w-4xl mx-auto">
				<h2 class="text-4xl font-party text-center mb-8 text-sunshine-700">🎊 Final Results! 🏆</h2>
				
				<div class="bg-white rounded-xl shadow-lg p-8 border-2 border-sunshine-200">
					<div class="space-y-6">
						{#each sortedPlayers as player, index}
							<div class="flex items-center justify-between p-6 rounded-xl {index === 0 ? 'bg-sunshine-100 border-2 border-sunshine-400' : index === 1 ? 'bg-gray-100 border-2 border-gray-400' : index === 2 ? 'bg-orange-100 border-2 border-orange-400' : 'bg-baby-pink-50 border-2 border-baby-pink-200'}">
								<div class="flex items-center gap-6">
									<div class="text-3xl font-party {index === 0 ? 'text-sunshine-600' : index === 1 ? 'text-gray-600' : index === 2 ? 'text-orange-600' : 'text-baby-pink-600'}">
										{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
									</div>
									<div>
										<p class="text-xl font-friendly font-semibold {index === 0 ? 'text-sunshine-700' : 'text-gray-700'}">{player.name}</p>
										{#if index === 0}
											<p class="text-sm font-friendly text-sunshine-600">🎉 Winner!</p>
										{/if}
									</div>
								</div>
								<div class="text-right">
									<p class="text-3xl font-party {index === 0 ? 'text-sunshine-600' : 'text-gray-600'}">{player.score}</p>
									<p class="text-sm font-friendly text-gray-500">points</p>
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