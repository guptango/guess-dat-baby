<script lang="ts">
	import PlayerGame from '../../[roomCode]/PlayerGame.svelte'
	import PlayerGame2 from './PlayerGame2.svelte'
	import type { Player, Room } from '$lib/test/mockData'
	import { GAME_STATES } from '$lib/test/mockData'

	// Mock player and room data for testing
	interface TestScenario {
		name: string
		description: string
		player: Player
		room: Room
	}
	
	// Component selection
	let selectedComponent: 'PlayerGame' | 'PlayerGame2' = $state('PlayerGame')

	// Test scenarios with different player states
	const testScenarios: TestScenario[] = [
		{
			name: 'Fresh Player',
			description: 'New player who hasn\'t submitted guesses yet',
			player: {
				id: 'test-player-1',
				name: 'Test Player',
				score: 0,
				submitted_guesses: false,
				room_id: 'test-room'
			},
			room: {
				id: 'test-room',
				code: 'TEST',
				game_state: GAME_STATES.GUESSING,
				current_reveal_index: 0,
				created_at: new Date().toISOString()
			}
		},
		{
			name: 'Already Submitted',
			description: 'Player who has already submitted their guesses',
			player: {
				id: 'test-player-2',
				name: 'Submitted Player',
				score: 7,
				submitted_guesses: true,
				room_id: 'test-room'
			},
			room: {
				id: 'test-room',
				code: 'TEST',
				game_state: GAME_STATES.GUESSING,
				current_reveal_index: 0,
				created_at: new Date().toISOString()
			}
		},
		{
			name: 'Game in Reveal',
			description: 'Player in a game that\'s moved to reveal phase',
			player: {
				id: 'test-player-3',
				name: 'Reveal Player',
				score: 5,
				submitted_guesses: true,
				room_id: 'test-room'
			},
			room: {
				id: 'test-room',
				code: 'TEST',
				game_state: GAME_STATES.REVEAL,
				current_reveal_index: 3,
				created_at: new Date().toISOString()
			}
		},
		{
			name: 'Game Finished',
			description: 'Player in a completed game showing results',
			player: {
				id: 'test-player-4',
				name: 'Results Player',
				score: 8,
				submitted_guesses: true,
				room_id: 'test-room'
			},
			room: {
				id: 'test-room',
				code: 'TEST',
				game_state: GAME_STATES.RESULTS,
				current_reveal_index: 9,
				created_at: new Date().toISOString()
			}
		}
	]

	let currentScenario: TestScenario = $state(testScenarios[0])
	let selectedScenarioIndex: number = $state(0)

	function setScenario(index: number): void {
		selectedScenarioIndex = index
		currentScenario = testScenarios[index]
	}
</script>

<div class="max-w-6xl mx-auto p-6">
	<h1 class="text-4xl font-party text-center mb-8 text-baby-blue-700">🧪 Player Game Testing Dashboard</h1>
	
	<!-- Component Selector -->
	<div class="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-baby-pink-100">
		<h2 class="text-2xl font-friendly font-semibold text-baby-pink-700 mb-4">🎮 Select Component to Test</h2>
		<div class="flex gap-4 mb-4">
			<button 
				class="px-6 py-3 rounded-lg font-friendly font-semibold transition-all duration-200 {selectedComponent === 'PlayerGame' ? 'bg-baby-pink-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				onclick={() => selectedComponent = 'PlayerGame'}
			>
				PlayerGame (Drag & Drop)
			</button>
			<button 
				class="px-6 py-3 rounded-lg font-friendly font-semibold transition-all duration-200 {selectedComponent === 'PlayerGame2' ? 'bg-baby-pink-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				onclick={() => selectedComponent = 'PlayerGame2'}
			>
				PlayerGame2 (Click to Select)
			</button>
		</div>
		<p class="text-sm text-gray-600 font-friendly">
			{#if selectedComponent === 'PlayerGame'}
				Testing the original drag-and-drop interface with side-by-side layout.
			{:else}
				Testing the new click-to-select interface with dropdown selection.
			{/if}
		</p>
	</div>
	
	<!-- Scenario Controls -->
	<div class="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-baby-blue-100">
		<h2 class="text-2xl font-friendly font-semibold text-baby-blue-700 mb-4">📋 Test Scenarios</h2>
		<p class="text-gray-600 font-friendly mb-4">Test the {selectedComponent} component with different player states and game phases:</p>
		
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
			{#each testScenarios as scenario, index}
				<button 
					class="p-4 rounded-lg border-2 transition-all duration-200 font-friendly text-left {selectedScenarioIndex === index ? 'bg-baby-blue-100 border-baby-blue-400 shadow-md' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'}"
					onclick={() => setScenario(index)}
				>
					<h3 class="font-semibold text-baby-blue-700 mb-2">{scenario.name}</h3>
					<p class="text-sm text-gray-600">{scenario.description}</p>
					<div class="mt-3 space-y-1">
						<div class="text-xs text-gray-500">
							<span class="font-medium">Player:</span> {scenario.player.name}
						</div>
						<div class="text-xs text-gray-500">
							<span class="font-medium">Submitted:</span> {scenario.player.submitted_guesses ? 'Yes' : 'No'}
						</div>
						<div class="text-xs text-gray-500">
							<span class="font-medium">Game State:</span> {scenario.room.game_state}
						</div>
					</div>
				</button>
			{/each}
		</div>

		<!-- Current Scenario Info -->
		<div class="bg-baby-blue-50 border-2 border-baby-blue-200 rounded-lg p-4">
			<h3 class="font-friendly font-semibold text-baby-blue-700 mb-2">Current Test Scenario</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
				<div>
					<span class="font-medium text-baby-blue-600">Player:</span>
					<div class="text-gray-700">
						Name: {currentScenario.player.name}<br>
						ID: {currentScenario.player.id}<br>
						Score: {currentScenario.player.score}<br>
						Submitted: {currentScenario.player.submitted_guesses ? 'Yes' : 'No'}
					</div>
				</div>
				<div>
					<span class="font-medium text-baby-blue-600">Room:</span>
					<div class="text-gray-700">
						Code: {currentScenario.room.code}<br>
						State: {currentScenario.room.game_state}<br>
						Reveal Index: {currentScenario.room.current_reveal_index}
					</div>
				</div>
				<div>
					<span class="font-medium text-baby-blue-600">Testing:</span>
					<div class="text-gray-700">
						{currentScenario.description}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Game State Message -->
	{#if currentScenario.room.game_state !== GAME_STATES.GUESSING}
		<div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8 text-center">
			<h3 class="text-xl font-friendly font-semibold text-yellow-700 mb-2">⚠️ Game Not in Guessing Phase</h3>
			{#if currentScenario.room.game_state === GAME_STATES.LOBBY}
				<p class="text-yellow-600 font-friendly">The game is still in the lobby. Players would see a waiting screen.</p>
			{:else if currentScenario.room.game_state === GAME_STATES.REVEAL}
				<p class="text-yellow-600 font-friendly">The game is in reveal phase. Players would see the reveal screen showing baby {currentScenario.room.current_reveal_index + 1}.</p>
			{:else if currentScenario.room.game_state === GAME_STATES.RESULTS}
				<p class="text-yellow-600 font-friendly">The game is finished. Players would see the final results screen.</p>
			{/if}
			<p class="text-yellow-500 text-sm mt-2">The PlayerGame component is designed to work during the GUESSING phase.</p>
		</div>
	{/if}

	<!-- Component Preview -->
	<div class="bg-gray-50 rounded-xl shadow-lg border-2 border-gray-200">
		<div class="bg-white rounded-t-xl p-4 border-b-2 border-gray-200">
			<h2 class="text-2xl font-friendly font-semibold text-gray-700">🎭 {selectedComponent} Component Preview</h2>
			<p class="text-gray-600 font-friendly">Testing scenario: <strong>{currentScenario.name}</strong> | Interface: <strong>{selectedComponent === 'PlayerGame' ? 'Drag & Drop' : 'Click to Select'}</strong></p>
		</div>
		
		<div class="p-6">
			{#if currentScenario.room.game_state === GAME_STATES.GUESSING}
				{#if selectedComponent === 'PlayerGame'}
					<PlayerGame 
						room={currentScenario.room}
						player={currentScenario.player}
					/>
				{:else}
					<PlayerGame2 
						room={currentScenario.room}
						player={currentScenario.player}
					/>
				{/if}
			{:else}
				<div class="text-center py-12">
					<div class="text-6xl mb-4">🎮</div>
					<p class="text-xl font-friendly text-gray-600 mb-2">{selectedComponent} Component</p>
					<p class="text-gray-500 font-friendly">This component is active during the guessing phase.</p>
					<p class="text-gray-400 text-sm mt-4">Switch to "Fresh Player" scenario to see the interactive game.</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Testing Instructions -->
	<div class="bg-white rounded-xl shadow-lg p-6 mt-8 border-2 border-mint-100">
		<h3 class="text-xl font-friendly font-semibold text-mint-700 mb-4">🧪 Testing Instructions</h3>
		<div class="space-y-4 text-gray-700 font-friendly">
			<div>
				<h4 class="font-semibold text-mint-600 mb-2">Fresh Player Scenario:</h4>
				{#if selectedComponent === 'PlayerGame'}
					<ul class="list-disc list-inside space-y-1 text-sm ml-4">
						<li>Test drag and drop functionality (both desktop and mobile)</li>
						<li>Try matching babies with parent combinations</li>
						<li>Test the undo functionality</li>
						<li>Verify the submit button enables when all babies are matched</li>
						<li>Test submission (will show success modal)</li>
					</ul>
				{:else}
					<ul class="list-disc list-inside space-y-1 text-sm ml-4">
						<li>Click on empty baby slots to open the dropdown</li>
						<li>Test the search functionality in the dropdown</li>
						<li>Select parent combinations from the dropdown</li>
						<li>Test removing selections with the X button</li>
						<li>Verify the submit button enables when all babies are matched</li>
						<li>Test submission (will show success modal)</li>
					</ul>
				{/if}
			</div>
			<div>
				<h4 class="font-semibold text-mint-600 mb-2">Already Submitted Scenario:</h4>
				<ul class="list-disc list-inside space-y-1 text-sm ml-4">
					<li>Verify that previous guesses are loaded and displayed</li>
					<li>Confirm that all interactions are disabled</li>
					<li>Check that the submission status shows already submitted</li>
				</ul>
			</div>
			<div>
				<h4 class="font-semibold text-mint-600 mb-2">Other Scenarios:</h4>
				<ul class="list-disc list-inside space-y-1 text-sm ml-4">
					<li>Test how the component behaves in different game states</li>
					<li>Verify proper messaging for non-guessing phases</li>
				</ul>
			</div>
		</div>
		
		<div class="mt-6 p-4 bg-mint-50 rounded-lg border border-mint-200">
			<h4 class="font-semibold text-mint-700 mb-2">💡 Pro Tips:</h4>
			<ul class="list-disc list-inside space-y-1 text-sm text-mint-600">
				<li>Use browser dev tools to simulate mobile touch events</li>
				<li>Test on actual mobile devices for full touch experience</li>
				<li>Check console for any TypeScript errors or warnings</li>
				<li>Verify responsive design at different screen sizes</li>
			</ul>
		</div>
	</div>
</div>