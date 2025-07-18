<script lang="ts">
	import { mockGameStates } from '$lib/test/mockData'
	import HostLobby from '$lib/components/host/HostLobby.svelte'
	import HostGuessing from '$lib/components/host/HostGuessing.svelte'
	import HostReveal from '$lib/components/host/HostReveal.svelte'
	import HostResults from '$lib/components/host/HostResults.svelte'

	let currentScenario = $state('lobby')
	let loading = $state(false)
	let revealLoading = $state(false)

	// Mock correct answers for testing
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

	function handleStartGame() {
		loading = true
		setTimeout(() => {
			currentScenario = 'guessing'
			loading = false
		}, 1000)
	}

	function handleStartReveal() {
		loading = true
		setTimeout(() => {
			currentScenario = 'revealStart'
			loading = false
		}, 1000)
	}

	function handleRevealAnswer() {
		revealLoading = true
		setTimeout(() => {
			currentScenario = 'revealMidway'
			revealLoading = false
		}, 1000)
	}

	function handleNextBaby() {
		// Just cycle through different reveal states for demo
		currentScenario = currentScenario === 'revealStart' ? 'revealMidway' : 'revealStart'
	}

	function handleShowFinalResults() {
		currentScenario = 'results'
	}

	function handleKickPlayer(playerId: string, playerName: string) {
		alert(`Kicked ${playerName} (ID: ${playerId})`)
	}

	function setScenario(scenario: string) {
		currentScenario = scenario
		loading = false
		revealLoading = false
	}
</script>

<div class="max-w-6xl mx-auto p-6">
	<h1 class="text-4xl font-party text-center mb-8 text-baby-blue-700">🧪 Component Testing Dashboard</h1>
	
	<!-- Scenario Controls -->
	<div class="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-baby-blue-100">
		<h2 class="text-2xl font-friendly font-semibold text-baby-blue-700 mb-4">📋 Test Scenarios</h2>
		<div class="flex flex-wrap gap-3">
			<button 
				class="bg-mint-500 hover:bg-mint-600 text-white font-friendly font-medium py-2 px-4 rounded-lg transition-colors"
				onclick={() => setScenario('emptyLobby')}
			>
				Empty Lobby
			</button>
			<button 
				class="bg-mint-500 hover:bg-mint-600 text-white font-friendly font-medium py-2 px-4 rounded-lg transition-colors"
				onclick={() => setScenario('lobby')}
			>
				Lobby (3 players)
			</button>
			<button 
				class="bg-mint-500 hover:bg-mint-600 text-white font-friendly font-medium py-2 px-4 rounded-lg transition-colors"
				onclick={() => setScenario('fullLobby')}
			>
				Full Lobby (5 players)
			</button>
			<button 
				class="bg-sunshine-500 hover:bg-sunshine-600 text-white font-friendly font-medium py-2 px-4 rounded-lg transition-colors"
				onclick={() => setScenario('guessing')}
			>
				Guessing (None submitted)
			</button>
			<button 
				class="bg-sunshine-500 hover:bg-sunshine-600 text-white font-friendly font-medium py-2 px-4 rounded-lg transition-colors"
				onclick={() => setScenario('guessingPartial')}
			>
				Guessing (Partial)
			</button>
			<button 
				class="bg-sunshine-500 hover:bg-sunshine-600 text-white font-friendly font-medium py-2 px-4 rounded-lg transition-colors"
				onclick={() => setScenario('guessingComplete')}
			>
				Guessing (All submitted)
			</button>
			<button 
				class="bg-baby-pink-500 hover:bg-baby-pink-600 text-white font-friendly font-medium py-2 px-4 rounded-lg transition-colors"
				onclick={() => setScenario('revealStart')}
			>
				Reveal Start
			</button>
			<button 
				class="bg-baby-pink-500 hover:bg-baby-pink-600 text-white font-friendly font-medium py-2 px-4 rounded-lg transition-colors"
				onclick={() => setScenario('revealMidway')}
			>
				Reveal (Answer shown)
			</button>
			<button 
				class="bg-baby-blue-500 hover:bg-baby-blue-600 text-white font-friendly font-medium py-2 px-4 rounded-lg transition-colors"
				onclick={() => setScenario('results')}
			>
				Final Results
			</button>
		</div>
	</div>

	<!-- Component Preview -->
	<div class="bg-gray-50 rounded-xl shadow-lg p-6 border-2 border-gray-200">
		<h2 class="text-2xl font-friendly font-semibold text-gray-700 mb-4">🎭 Component Preview</h2>
		<p class="text-gray-600 font-friendly mb-6">Current scenario: <strong>{currentScenario}</strong></p>
		
		{#if currentScenario.includes('Lobby') || currentScenario === 'emptyLobby'}
			<HostLobby 
				room={mockGameStates[currentScenario].room}
				players={mockGameStates[currentScenario].players}
				{loading}
				onStartGame={handleStartGame}
				onKickPlayer={handleKickPlayer}
			/>
		{:else if currentScenario.includes('guessing')}
			<HostGuessing 
				players={mockGameStates[currentScenario].players}
				{loading}
				onStartReveal={handleStartReveal}
				onKickPlayer={handleKickPlayer}
			/>
		{:else if currentScenario.includes('reveal')}
			<HostReveal 
				currentRevealIndex={mockGameStates[currentScenario].currentRevealIndex}
				currentGuesses={mockGameStates[currentScenario].currentGuesses || []}
				players={mockGameStates[currentScenario].players}
				showingAnswer={mockGameStates[currentScenario].showingAnswer || false}
				{correctAnswers}
				{revealLoading}
				onRevealAnswer={handleRevealAnswer}
				onNextBaby={handleNextBaby}
				onShowFinalResults={handleShowFinalResults}
			/>
		{:else if currentScenario === 'results'}
			<HostResults 
				players={mockGameStates[currentScenario].players}
			/>
		{:else}
			<div class="text-center py-12">
				<p class="text-gray-500 font-friendly">Component for scenario "{currentScenario}" not implemented yet.</p>
			</div>
		{/if}
	</div>
</div>