<script lang="ts">
	import { gameData, celebrityImages, getCoupleFromString } from '$lib/gameData'
	import { supabase } from '$lib/supabase'
	import { onMount } from 'svelte'

	interface Props {
		room: any
		player: any
	}

	let { room, player }: Props = $props()

	let playerGuess = $state(null)
	let currentBabyData = $state(null)
	let loading = $state(true)

	// Derived values
	let currentRevealIndex = $derived(room?.current_reveal_index || 0)
	let answerRevealed = $derived(room?.answer_revealed || false)
	let correctAnswer = $derived(room?.current_correct_answer || '')
	let isCorrect = $derived(answerRevealed && playerGuess && correctAnswer && playerGuess.couple_name === correctAnswer)

	onMount(() => {
		loadPlayerGuessForCurrentBaby()
		subscribeToRevealChanges()
	})

	async function loadPlayerGuessForCurrentBaby() {
		if (!player || currentRevealIndex < 0) return
		
		loading = true
		
		// Get the current baby data
		currentBabyData = gameData[currentRevealIndex]
		
		if (currentBabyData) {
			// Get the player's guess for this baby using baby_id
			const { data: guess, error } = await supabase
				.from('guesses')
				.select('*')
				.eq('player_id', player.id)
				.eq('baby_id', currentBabyData.babyId)
				.single()

			if (!error && guess) {
				playerGuess = guess
			} else {
				playerGuess = null
			}
		}
		
		loading = false
	}

	function subscribeToRevealChanges() {
		supabase
			.channel('reveal-updates')
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'rooms',
					filter: `id=eq.${room.id}`
				},
				(payload) => {
					if (payload.new) {
						// Update room data and load new baby data when reveal index changes
						room = payload.new
						loadPlayerGuessForCurrentBaby()
					}
				}
			)
			.subscribe()
	}

</script>

<div class="max-w-4xl mx-auto">
	<h2 class="text-3xl font-party text-center mb-8 text-sunshine-700">🎉 Reveal Phase 👶</h2>
	
	{#if loading}
		<div class="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-baby-blue-100">
			<p class="text-lg text-gray-600 font-friendly">✨ Loading reveal data...</p>
		</div>
	{:else if currentBabyData}
		<!-- Current Baby Display -->
		<div class="bg-white rounded-xl shadow-lg p-8 mb-6 border-2 border-baby-blue-100">
			<div class="text-center mb-6">
				<h3 class="text-2xl font-friendly font-semibold text-baby-blue-700 mb-4">
					🍼 Baby {currentRevealIndex + 1} of {gameData.length}
				</h3>
				<img 
					src={currentBabyData.babyImage} 
					alt={`Baby ${currentRevealIndex + 1}`} 
					class="max-w-full h-auto mx-auto rounded-xl border-4 border-baby-pink-200 shadow-lg"
					style="max-height: 300px;"
				/>
			</div>
			
			<!-- Your Guess Section -->
			<div class="bg-mint-50 border-2 border-mint-200 rounded-xl p-6 mb-6">
				<h4 class="text-xl font-friendly font-semibold text-mint-700 mb-4">👤 Your Guess</h4>
				{#if playerGuess}
					<div class="flex items-center gap-4 {answerRevealed ? (isCorrect ? 'text-green-700' : 'text-red-700') : 'text-mint-700'}">
						{#if answerRevealed}
							<div class="text-2xl">
								{isCorrect ? '✅' : '❌'}
							</div>
						{/if}
						<div class="flex gap-2">
							{#each Object.values(getCoupleFromString(playerGuess.couple_name)) as person}
								{#if celebrityImages[person]}
									<img 
										src={celebrityImages[person]} 
										alt={person} 
										class="w-12 h-12 rounded-full object-cover border-2 border-baby-pink-300 shadow-md"
									/>
								{/if}
							{/each}
						</div>
						<div class="font-friendly font-semibold text-lg">{playerGuess.couple_name}</div>
					</div>
				{:else}
					<p class="text-gray-500 italic font-friendly">You didn't submit a guess for this baby... 🤷‍♀️</p>
				{/if}
			</div>
			
			<!-- Answer Reveal Section -->
			{#if answerRevealed && correctAnswer}
				<div class="bg-sunshine-50 border-2 border-sunshine-300 rounded-xl p-6 mb-6">
					<h4 class="text-2xl font-party text-sunshine-700 mb-4 text-center">🎯 Correct Answer!</h4>
					<div class="text-center">
						<div class="text-2xl font-friendly font-bold text-sunshine-600 mb-4">
							{correctAnswer}
						</div>
						<div class="flex justify-center gap-4">
							{#each Object.values(getCoupleFromString(correctAnswer)) as parent}
								<div class="text-center">
									<img 
										src={celebrityImages[parent]} 
										alt={parent} 
										class="w-20 h-20 rounded-full border-4 border-sunshine-400 mx-auto mb-2 shadow-lg"
									/>
									<p class="font-friendly font-medium text-sunshine-700 text-sm">{parent}</p>
								</div>
							{/each}
						</div>
					</div>
				</div>
				
				<!-- Result -->
				{#if isCorrect}
					<div class="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-6 text-center">
						<h4 class="text-2xl font-party text-green-700 mb-2">🎉 Correct!</h4>
						<p class="text-green-600 font-friendly text-lg">You got this one right! Great job! 🎊</p>
					</div>
				{:else if playerGuess}
					<div class="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6 text-center">
						<h4 class="text-2xl font-party text-red-700 mb-2">😅 Not quite!</h4>
						<p class="text-red-600 font-friendly">Better luck on the next baby!</p>
					</div>
				{/if}
			{:else}
				<!-- Watch Host Screen -->
				<div class="bg-sunshine-50 border-2 border-sunshine-200 rounded-xl p-6 mb-6 text-center">
					<h4 class="text-2xl font-party text-sunshine-700 mb-4">👀 Watch the Host Screen!</h4>
					<p class="text-sunshine-600 font-friendly text-lg mb-2">Waiting for the host to reveal the answer...</p>
					<p class="text-gray-600 font-friendly text-sm">The answer will automatically appear here when revealed!</p>
				</div>
			{/if}
		</div>
		
		<!-- Current Score Display -->
		<div class="bg-baby-pink-50 border-2 border-baby-pink-200 rounded-xl p-4 text-center">
			<p class="text-baby-pink-700 font-friendly font-semibold">
				🏆 Your Current Score: {player.score}
			</p>
		</div>
	{:else}
		<div class="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-gray-200">
			<p class="text-gray-600 font-friendly text-lg">No baby data available for reveal... 🤔</p>
		</div>
	{/if}
</div>