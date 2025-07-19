<script lang="ts">
	import { onMount } from 'svelte'
	import { supabase, submitGuesses } from '$lib/supabase'
	import { gameData, celebrityImages, maleCelebrities, femaleCelebrities, mommy, daddy, getCoupleFromString, getCoupleString} from '$lib/gameData'
	import type { Player, Room } from '$lib/test/mockData'

	// Component props with proper typing
	interface Props {
		room: Room
		player: Player
	}

	let { room, player }: Props = $props()
	
	// Type definitions for better code understanding
	interface ParentCombination {
		id: string
		mom: string
		dad: string
	}

	interface CurrentMatches {
		[babyId: string]: ParentCombination
	}

	interface ModalState {
		show: boolean
		title: string
		message: string
	}

	interface GameData {
		babyId: string
		babyImage: string
		correctParents: { mom: string, dad: string }
	}

	interface GuessSubmission {
		babyId: string
		coupleName: string
	}

	// Reactive state variables with proper typing
	let currentMatches: CurrentMatches = $state({})
	let gameSubmitted: boolean = $state(false)
	let submissionStatus: string = $state('')
	let activeDropdownBabyId: string | null = $state(null)

	// Modal state with proper typing
	let modalState: ModalState = $state({
		show: false,
		title: '',
		message: ''
	})

	// Parent combinations with proper typing
	let allPossibleParentCombinations: ParentCombination[] = $state([])
	let combinationIdCounter: number = 0

	maleCelebrities.forEach(male => {
		allPossibleParentCombinations.push({ id: getCoupleString(mommy, male), mom: mommy, dad: male })
	})
	femaleCelebrities.forEach(female => {
		allPossibleParentCombinations.push({ id: getCoupleString(daddy, female), mom: daddy, dad: female })
	})

	// Game data: baby images and their *actual* correct parents.
	let shuffledGameData: GameData[] = $state([...gameData])

	// --- Modal Functions ---
	/**
	 * Shows a modal dialog with the specified title and message
	 */
	function showModal(title: string, message: string): void {
		modalState = { show: true, title, message }
	}

	/**
	 * Hides the modal dialog
	 */
	function hideModal(): void {
		modalState = { show: false, title: '', message: '' }
	}

	// --- Utility Function ---
	/**
	 * Shuffles an array using Fisher-Yates algorithm
	 */
	function shuffleArray<T>(array: T[]): T[] {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			const temp = array[i]
			array[i] = array[j]
			array[j] = temp
		}
		return array
	}

	/**
	 * Opens the dropdown for selecting a couple for a specific baby
	 */
	function openDropdown(babyId: string): void {
		if (gameSubmitted) return
		activeDropdownBabyId = babyId
		
		// On mobile, scroll the baby card to the top for better visibility
		if (window.innerWidth < 768) {
			setTimeout(() => {
				const babyCard = document.querySelector(`[data-baby-id="${babyId}"]`)
				if (babyCard) {
					const rect = babyCard.getBoundingClientRect()
					const scrollTop = window.pageYOffset || document.documentElement.scrollTop
					const targetScroll = rect.top + scrollTop - 20 // 20px padding from top
					
					window.scrollTo({
						top: targetScroll,
						behavior: 'smooth'
					})
				}
			}, 50) // Small delay to ensure dropdown is rendered
		}
	}

	/**
	 * Closes the active dropdown
	 */
	function closeDropdown(): void {
		activeDropdownBabyId = null
	}

	/**
	 * Selects a parent combination for a baby
	 */
	function selectParentCombo(babyId: string, combo: ParentCombination): void {
		if (gameSubmitted) return
		currentMatches = { ...currentMatches, [babyId]: combo }
		closeDropdown()
	}

	/**
	 * Removes a match between a baby and parent combination
	 */
	function removeMatch(babyId: string): void {
		if (gameSubmitted) return
		const newMatches = { ...currentMatches }
		delete newMatches[babyId]
		currentMatches = newMatches
	}

	/**
	 * Checks if a parent combination is already used
	 */
	function isComboUsed(combo: ParentCombination): boolean {
		return Object.values(currentMatches).some(match => match.id === combo.id)
	}

	/**
	 * Gets available combinations (not already used)
	 */
	let availableCombinations = $derived(() => {
		return allPossibleParentCombinations.filter(combo => !isComboUsed(combo))
	})

	// Handle clicks outside dropdown to close it
	function handleClickOutside(event: MouseEvent): void {
		const target = event.target as HTMLElement
		if (!target.closest('.dropdown-container')) {
			closeDropdown()
		}
	}

	// Initial setup on component mount
	onMount(() => {
		// Shuffle game data and parent combinations for variety
		shuffledGameData = shuffleArray([...gameData])
		allPossibleParentCombinations = shuffleArray([...allPossibleParentCombinations])
		
		// Check if player has already submitted guesses
		if (player.submitted_guesses) {
			gameSubmitted = true
			submissionStatus = 'You have already submitted your guesses!'
			loadPreviousGuesses()
		}

		// Add click listener for closing dropdown
		document.addEventListener('click', handleClickOutside)
		
		return () => {
			document.removeEventListener('click', handleClickOutside)
		}
	})

	/**
	 * Loads previously submitted guesses if player has already played
	 */
	async function loadPreviousGuesses(): Promise<void> {
		if (!player.submitted_guesses) return

		const { data: guesses, error } = await supabase
			.from('guesses')
			.select('*')
			.eq('player_id', player.id)

		if (!error && guesses) {
			// Reconstruct matches from saved guesses
			const reconstructedMatches: CurrentMatches = {}
			
			guesses.forEach(guess => {
				// Find matching parent combination from couple name
				const combo = allPossibleParentCombinations.find(c => 
					getCoupleString(c.mom, c.dad) === guess.couple_name
				)
				if (combo) {
					reconstructedMatches[guess.baby_id] = combo
				}
			})
			
			currentMatches = reconstructedMatches
		}
	}

	// --- Submission Logic ---
	/**
	 * Handles submission of all player guesses
	 */
	async function handleSubmit(): Promise<void> {
		if (gameSubmitted) return

		gameSubmitted = true
		submissionStatus = 'Submitting...'

		// Prepare guess data for submission
		const guesses: GuessSubmission[] = Object.keys(currentMatches).map(babyId => ({
			babyId: babyId,
			coupleName: getCoupleString(currentMatches[babyId].mom, currentMatches[babyId].dad)
		}))

		// Submit guesses to database
		const success = await submitGuesses(player.id, guesses)

		if (success) {
			submissionStatus = 'Submitted successfully!'
			showModal('🎉 Answers Submitted!', 'Thank you for playing! Wait for the host to start the reveal. 🍼')
		} else {
			submissionStatus = 'Submission failed. Please try again.'
			gameSubmitted = false
		}
	}
</script>

<div class="mb-6 text-center">
	<h2 class="text-3xl font-party text-baby-blue-700">🍼 Make Your Guesses! 👶</h2>
	<p class="text-gray-600 font-friendly">Click on a baby picture to select the parent combination</p>
</div>

{#if submissionStatus}
	<div class="bg-baby-blue-50 border-2 border-baby-blue-200 rounded-xl p-4 mb-6 text-center">
		<p class="text-baby-blue-800 font-friendly font-medium">✨ {submissionStatus}</p>
	</div>
{/if}

<div class="game-container">
	<div class="babies-grid">
		{#each shuffledGameData as baby, index (baby.babyId)}
			<div class="baby-card" class:has-match={currentMatches[baby.babyId]} data-baby-id={baby.babyId}>
				<h4 class="text-lg font-semibold text-rose-700 mb-2">Baby {index + 1}</h4>
				<img src={baby.babyImage} alt={`Baby ${index + 1}`} class="baby-image">
				
				{#if currentMatches[baby.babyId]}
					<div class="selected-parent">
						<div class="celebrity-images-wrapper">
							<img src={celebrityImages[currentMatches[baby.babyId].mom]} alt={currentMatches[baby.babyId].mom} class="celebrity-image">
							<img src={celebrityImages[currentMatches[baby.babyId].dad]} alt={currentMatches[baby.babyId].dad} class="celebrity-image">
						</div>
						<span class="couple-name">{getCoupleString(currentMatches[baby.babyId].mom, currentMatches[baby.babyId].dad)}</span>
						{#if !gameSubmitted}
							<button class="remove-button" onclick={(e) => { e.stopPropagation(); removeMatch(baby.babyId); }}>✕</button>
						{/if}
					</div>
				{:else}
					<div class="select-dropdown-container" onclick={(e) => e.stopPropagation()}>
						<button 
							class="select-button {activeDropdownBabyId === baby.babyId ? 'expanded' : ''}" 
							onclick={(e) => { e.stopPropagation(); activeDropdownBabyId === baby.babyId ? closeDropdown() : openDropdown(baby.babyId); }}
							disabled={gameSubmitted}
						>
							<span>Click to Select Parents</span>
							<span class="dropdown-arrow {activeDropdownBabyId === baby.babyId ? 'rotated' : ''}">▼</span>
						</button>
						
						{#if activeDropdownBabyId === baby.babyId}
							<div class="dropdown-list">
								{#if availableCombinations().length === 0}
									<div class="no-results">No available couples found</div>
								{:else}
									{#each availableCombinations() as combo (combo.id)}
										<button 
											class="dropdown-item"
											onclick={() => selectParentCombo(baby.babyId, combo)}
										>
											<div class="celebrity-images-wrapper">
												<img src={celebrityImages[combo.mom]} alt={combo.mom} class="dropdown-celebrity-image">
												<img src={celebrityImages[combo.dad]} alt={combo.dad} class="dropdown-celebrity-image">
											</div>
											<span class="dropdown-couple-name">{getCoupleString(combo.mom, combo.dad)}</span>
										</button>
									{/each}
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<div class="mt-8 text-center">
	<button 
		class="submit-button font-friendly" 
		disabled={Object.keys(currentMatches).length !== shuffledGameData.length || gameSubmitted} 
		onclick={handleSubmit}
	>
		🚀 Submit All Answers
	</button>
</div>

<!-- Custom Modal for messages -->
{#if modalState.show}
	<div class="modal" class:show={modalState.show}>
		<div class="modal-content">
			<h2>{modalState.title}</h2>
			<p>{modalState.message}</p>
			<button class="modal-close-button" onclick={hideModal}>Close</button>
		</div>
	</div>
{/if}

<style>
	.game-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 10px;
	}

	.babies-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 12px;
		width: 100%;
	}
	@media (max-width: 640px) {
		.babies-grid {
			grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
			gap: 8px;
		}
	}

	.baby-card {
		background-color: #ffffff;
		border-radius: 12px;
		padding: 15px;
		border: 2px dashed #f9d8e5;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		transition: all 0.2s ease;
		position: relative;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}
	.baby-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	.baby-card.has-match {
		border-style: solid;
		border-color: #d9669e;
		background-color: #fdf6fa;
	}

	.baby-image {
		width: 100%;
		max-width: 200px;
		height: auto;
		border-radius: 8px;
		object-fit: cover;
		border: 2px solid #eeb4d2;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.select-dropdown-container {
		width: 100%;
		max-width: 220px;
		position: relative;
	}

	.select-button {
		background-color: #f29ecf;
		color: white;
		padding: 10px 20px;
		border-radius: 8px 8px 8px 8px;
		border: none;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}
	.select-button.expanded {
		border-radius: 8px 8px 0 0;
		background-color: #d9669e;
	}
	.select-button:hover:not(:disabled) {
		background-color: #d9669e;
		transform: translateY(-1px);
	}
	.select-button.expanded:hover {
		transform: none;
	}
	.select-button:disabled {
		background-color: #cbd5e0;
		cursor: not-allowed;
	}

	.dropdown-arrow {
		font-size: 0.7rem;
		transition: transform 0.2s ease;
	}
	.dropdown-arrow.rotated {
		transform: rotate(180deg);
	}

	.selected-parent {
		background-color: #f29ecf;
		color: white;
		padding: 12px;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		position: relative;
		width: 100%;
		max-width: 220px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.celebrity-images-wrapper {
		display: flex;
		justify-content: center;
		gap: 10px;
	}

	.celebrity-image {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgba(255, 255, 255, 0.8);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	.couple-name {
		font-size: 1rem;
		font-weight: 600;
		text-align: center;
	}

	.remove-button {
		position: absolute;
		top: -8px;
		right: -8px;
		background-color: #f56565;
		color: white;
		border: none;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		font-size: 0.8rem;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: all 0.2s ease;
	}
	.remove-button:hover {
		background-color: #e53e3e;
		transform: scale(1.1);
	}

	.dropdown-list {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #fdf2f8;
		border: 2px solid #f9d8e5;
		border-top: none;
		border-radius: 0 0 8px 8px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		z-index: 100;
		max-height: 400px;
		overflow-y: auto;
		padding: 8px;
		opacity: 0;
		transform: translateY(-10px);
		animation: slideDown 0.3s ease-out forwards;
	}
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@media (max-width: 767px) {
		.dropdown-list {
			max-height: calc(100vh - 350px); /* Ensure dropdown fits in viewport with baby image visible */
		}
	}
	.dropdown-list::-webkit-scrollbar {
		width: 8px;
	}
	.dropdown-list::-webkit-scrollbar-track {
		background: #fce7f3;
		border-radius: 10px;
	}
	.dropdown-list::-webkit-scrollbar-thumb {
		background: #f9a8d4;
		border-radius: 10px;
	}
	.dropdown-list::-webkit-scrollbar-thumb:hover {
		background: #f472b6;
	}

	.dropdown-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 12px;
		margin-bottom: 6px;
		background-color: #fdf6fa;
		border: 1px solid #f9d8e5;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
		text-align: center;
	}
	.dropdown-item:hover {
		background-color: #fbe0ec;
		border-color: #d9669e;
		transform: scale(1.02);
	}

	.dropdown-celebrity-image {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgba(255, 255, 255, 0.5);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.dropdown-couple-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: #7a4d64;
		flex: 1;
	}

	.no-results {
		text-align: center;
		padding: 20px;
		color: #a6959b;
		font-style: italic;
	}

	.submit-button {
		background-color: #d9669e;
		color: white;
		padding: 12px 30px;
		border-radius: 10px;
		border: none;
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
	.submit-button:hover:not(:disabled) {
		background-color: #c45a8e;
		transform: translateY(-2px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
	}
	.submit-button:disabled {
		background-color: #cbd5e0;
		cursor: not-allowed;
		box-shadow: none;
	}

	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.6);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		opacity: 0;
		visibility: hidden;
		transition: opacity 0.3s ease, visibility 0.3s ease;
	}
	.modal.show {
		opacity: 1;
		visibility: visible;
	}

	.modal-content {
		background-color: #ffffff;
		padding: 30px;
		border-radius: 15px;
		text-align: center;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		max-width: 400px;
		width: 90%;
		transform: translateY(-20px);
		transition: transform 0.3s ease;
	}
	.modal.show .modal-content {
		transform: translateY(0);
	}

	.modal-content h2 {
		color: #7a4d64;
		margin-bottom: 15px;
		font-size: 1.8rem;
	}

	.modal-content p {
		color: #947e88;
		margin-bottom: 25px;
		font-size: 1.1rem;
	}

	.modal-close-button {
		background-color: #d9669e;
		color: white;
		padding: 10px 20px;
		border-radius: 8px;
		border: none;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}
	.modal-close-button:hover {
		background-color: #c45a8e;
	}
</style>