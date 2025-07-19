<script lang="ts">
	import { gameData, celebrityImages, getCoupleFromString, getCoupleString } from '$lib/gameData'
	import PlayerCard from '../shared/PlayerCard.svelte'
	import type { Player, Guess } from '$lib/test/mockData'

	interface GroupedGuess {
		couple: string
		players: string[]
	}

	interface Props {
		currentRevealIndex: number
		currentGuesses: Guess[]
		players: Player[]
		showingAnswer: boolean
		correctAnswers: {[babyId: string]: string}
		revealLoading?: boolean
		onRevealAnswer: () => void
		onNextBaby: () => void
		onShowFinalResults: () => void
	}

	let { 
		currentRevealIndex, 
		currentGuesses, 
		players, 
		showingAnswer, 
		correctAnswers,
		revealLoading = false,
		onRevealAnswer,
		onNextBaby,
		onShowFinalResults
	}: Props = $props()

	// Get current baby data
	let currentBabyData = $derived(gameData[currentRevealIndex])
	
	// Sort players by score
	let sortedPlayers = $derived([...players].sort((a, b) => b.score - a.score))

	// Group guesses by couple with correct/incorrect status
	let groupedGuesses = $derived.by((): (GroupedGuess & { isCorrect: boolean })[] => {
		const groups: Record<string, string[]> = {}
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
		
		const currentCorrectAnswer = correctAnswers[currentBabyData?.babyId]
		return Object.entries(groups).map(([couple, players]) => ({
			couple,
			players,
			isCorrect: showingAnswer && currentCorrectAnswer ? couple === currentCorrectAnswer : false
		}))
	})

	let isLastBaby = $derived(currentRevealIndex >= gameData.length - 1)
</script>

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
				{:else if groupedGuesses.length > 0}
					<div class="space-y-4">
						{#each groupedGuesses as group}
							<div class="rounded-xl p-5 border-2 {showingAnswer ? (group.isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300') : 'bg-mint-50 border-mint-200'}">
								<div class="flex items-center gap-4 mb-4">
									<!-- Correct/Incorrect Indicator -->
									{#if showingAnswer}
										<div class="text-2xl">
											{group.isCorrect ? '✅' : '❌'}
										</div>
									{/if}
									<!-- Couple Pictures -->
									<div class="flex gap-2">
										{#if group.couple}
											{#each Object.values(getCoupleFromString(group.couple)) as person}
												{#if celebrityImages[person]}
													<img 
														src={celebrityImages[person]} 
														alt={person} 
														class="w-12 h-12 rounded-full object-cover border-2 border-baby-pink-300 shadow-md"
													/>
												{/if}
											{/each}
										{/if}
									</div>
									<!-- Couple Name -->
									<div class="font-friendly font-semibold text-lg {showingAnswer ? (group.isCorrect ? 'text-green-700' : 'text-red-700') : 'text-baby-blue-700'}">{group.couple}</div>
								</div>
								<!-- Players who voted -->
								<div class="flex flex-wrap gap-2">
									{#each group.players as player}
										<span class="px-3 py-2 rounded-full text-sm font-friendly font-medium border shadow-sm {showingAnswer ? (group.isCorrect ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300') : 'bg-white text-baby-pink-600 border-baby-pink-200'}">
											{player}
										</span>
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
			</div>
		</div>

		<!-- Answer Reveal -->
		{#if showingAnswer}
			<div class="bg-sunshine-50 border-2 border-sunshine-300 rounded-xl p-8 mb-8 text-center">
				<h4 class="text-3xl font-party text-sunshine-700 mb-6">🎯 Correct Answer!</h4>
				<div class="text-3xl font-friendly font-bold text-sunshine-600 mb-6">
					{correctAnswers[currentBabyData?.babyId] || 'Loading...'}
				</div>
				<div class="flex justify-center gap-6">
					{#if correctAnswers[currentBabyData?.babyId]}
						{#each Object.values(getCoupleFromString(correctAnswers[currentBabyData?.babyId])) as parent}
							<div class="text-center">
								<img 
									src={celebrityImages[parent]} 
									alt={parent} 
									class="w-24 h-24 rounded-full border-4 border-sunshine-400 mx-auto mb-3 shadow-lg"
								/>
								<p class="font-friendly font-medium text-sunshine-700">{parent}</p>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Highlight correct players -->
			{#if groupedGuesses.length > 0}
				{@const correctGroup = groupedGuesses.find(g => g.isCorrect)}
				{#if correctGroup && correctGroup.players.length > 0}
					<div class="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-8 text-center">
						<h4 class="text-2xl font-party text-green-700 mb-4">✅ Players who got it right!</h4>
						<div class="flex flex-wrap justify-center gap-3">
							{#each correctGroup.players as player}
								<span class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-lg font-friendly font-semibold border-2 border-green-400 shadow-md">
									🎉 {player}
								</span>
							{/each}
						</div>
					</div>
				{:else}
					<div class="bg-gray-50 border-2 border-gray-300 rounded-xl p-6 mb-8 text-center">
						<h4 class="text-2xl font-party text-gray-700 mb-4">😅 No one got this one right!</h4>
						<p class="text-gray-600 font-friendly">Better luck on the next baby!</p>
					</div>
				{/if}
			{/if}
		{/if}

		<!-- Note: Scores are hidden during reveal to prevent spoilers -->

		<!-- Controls -->
		<div class="text-center">
			{#if !showingAnswer}
				<button 
					class="bg-sunshine-500 hover:bg-sunshine-600 text-white font-friendly font-bold py-4 px-8 rounded-xl disabled:opacity-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
					disabled={revealLoading}
					onclick={onRevealAnswer}
				>
					{revealLoading ? '✨ Revealing...' : '🎯 Reveal Answer'}
				</button>
			{:else if !isLastBaby}
				<button 
					class="bg-baby-pink-500 hover:bg-baby-pink-600 text-white font-friendly font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
					onclick={onNextBaby}
				>
					➡️ Next Baby
				</button>
			{:else}
				<button 
					class="bg-baby-blue-500 hover:bg-baby-blue-600 text-white font-friendly font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
					onclick={onShowFinalResults}
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