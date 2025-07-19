<script lang="ts">
	import { onMount } from 'svelte'
	import { supabase, submitGuesses } from '$lib/supabase'
	import { gameData, celebrityImages, maleCelebrities, femaleCelebrities, mommy, daddy , getCoupleFromString, getCoupleString} from '$lib/gameData'
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

	// --- Drag and Drop Logic ---
	// Drag and drop state with proper typing
	let draggedItem: HTMLElement | null = null
	let draggedClone: HTMLElement | null = null
	let dragSourceParent: HTMLElement | null = null
	let currentDropTarget: HTMLElement | null = null
	let startX: number = 0
	let startY: number = 0
	let savedScrollPosition: number = 0
	const dragThreshold: number = 10

	/**
	 * Prevents page scrolling during drag operations
	 */
	function preventScroll(event: Event): boolean | void {
		// Only prevent scrolling if we're currently dragging
		if (draggedClone) {
			event.preventDefault()
			event.stopPropagation()
			return false
		}
	}

	/**
	 * Creates a visual clone of the dragged element for touch interactions
	 */
	function createDragClone(originalElement: HTMLElement): HTMLElement {
		const clone = originalElement.cloneNode(true) as HTMLElement
		clone.classList.add('touch-dragging-clone')
		clone.style.position = 'fixed'
		clone.style.left = '0px'
		clone.style.top = '0px'
		clone.style.transform = 'translate(-50%, -50%)'
		clone.style.pointerEvents = 'none'
		clone.style.zIndex = '9999'
		document.body.appendChild(clone)
		return clone
	}

	/**
	 * Gets the element under a specific point, temporarily hiding drag clone
	 */
	function getElementUnderPoint(x: number, y: number): Element | null {
		if (draggedClone) draggedClone.style.display = 'none'
		const element = document.elementFromPoint(x, y)
		if (draggedClone) draggedClone.style.display = 'block'
		return element
	}

	/**
	 * Handles the start of a drag operation (desktop)
	 */
	function handleDragStart(event: DragEvent): void {
		if (gameSubmitted) return
		
		const target = event.target as HTMLElement
		draggedItem = target
		dragSourceParent = draggedItem.parentNode as HTMLElement
		
		if (event.dataTransfer && draggedItem.dataset.comboId) {
			event.dataTransfer.setData('text/plain', draggedItem.dataset.comboId)
			event.dataTransfer.effectAllowed = 'move'
		}
		
		setTimeout(() => {
			if (draggedItem) {
				draggedItem.classList.add('dragging')
			}
		}, 0)
	}

	/**
	 * Handles the end of a drag operation (desktop)
	 */
	function handleDragEnd(event: DragEvent): void {
		if (draggedItem) {
			draggedItem.classList.remove('dragging')
			draggedItem = null
		}
		
		// Clean up drag state and restore normal scrolling
		cleanupDragState()
	}

	/**
	 * Cleans up drag state and restores normal page behavior
	 */
	function cleanupDragState(): void {
		// Remove all scroll prevention listeners
		document.removeEventListener('wheel', preventScroll, { capture: true })
		document.removeEventListener('scroll', preventScroll, { capture: true })
		window.removeEventListener('scroll', preventScroll, { capture: true })
		
		// Restore body scrolling and scroll position
		document.body.style.overflow = ''
		document.body.style.position = ''
		document.body.style.top = ''
		document.body.style.width = ''
		
		// Restore overscroll behavior (re-enable pull-to-refresh)
		document.body.style.overscrollBehavior = ''
		document.documentElement.style.overscrollBehavior = ''
		
		if (savedScrollPosition > 0) {
			window.scrollTo(0, savedScrollPosition)
			savedScrollPosition = 0
		}
		
		document.querySelectorAll('.baby-card').forEach(card => card.classList.remove('drag-over'))
		currentDropTarget = null
	}

	/**
	 * Handles drag over events for drop targets
	 */
	function handleDragOver(event: DragEvent): void {
		event.preventDefault()
		if (gameSubmitted) return
		
		const target = event.target as HTMLElement
		const targetBabyCard = target.closest('.baby-card') as HTMLElement
		
		if (currentDropTarget && currentDropTarget !== targetBabyCard) {
			currentDropTarget.classList.remove('drag-over')
		}
		
		if (targetBabyCard && targetBabyCard.dataset.babyId && !currentMatches[targetBabyCard.dataset.babyId]) {
			targetBabyCard.classList.add('drag-over')
			currentDropTarget = targetBabyCard
		} else {
			currentDropTarget = null
		}
		
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move'
		}
	}

	/**
	 * Handles drag leave events for drop targets
	 */
	function handleDragLeave(event: DragEvent): void {
		if (gameSubmitted) return
		
		const target = event.target as HTMLElement
		const targetBabyCard = target.closest('.baby-card') as HTMLElement
		
		if (targetBabyCard) {
			targetBabyCard.classList.remove('drag-over')
		}
		
		if (currentDropTarget === targetBabyCard) {
			currentDropTarget = null
		}
	}

	/**
	 * Handles drop events when a parent combination is dropped on a baby
	 */
	function handleDrop(event: DragEvent): void {
		event.preventDefault()
		if (gameSubmitted) return
		
		const comboId = event.dataTransfer?.getData('text/plain')
		const target = event.target as HTMLElement
		const targetBabyCard = target.closest('.baby-card') as HTMLElement

		// Clean up visual indicators
		document.querySelectorAll('.baby-card').forEach(card => card.classList.remove('drag-over'))
		currentDropTarget = null

		if (!targetBabyCard || !comboId || !targetBabyCard.dataset.babyId) {
			return
		}
		
		const babyId = targetBabyCard.dataset.babyId
		
		if (currentMatches[babyId]) {
			showModal('Oops!', 'This baby already has a match. Please undo the current match first if you want to change it.')
			return
		}
		
		performDropLogic(babyId, comboId, targetBabyCard)
	}

	/**
	 * Handles touch start events for mobile drag operations
	 */
	function handleTouchStart(event: TouchEvent): void {
		if (gameSubmitted) return
		if (event.touches.length !== 1) return

		const touch = event.touches[0]
		const target = (event.target as HTMLElement).closest('.parent-card') as HTMLElement

		if (target) {
			startX = touch.clientX
			startY = touch.clientY
			draggedItem = target
			dragSourceParent = draggedItem.parentNode as HTMLElement
		}
	}

	/**
	 * Handles touch move events for mobile drag operations
	 */
	function handleTouchMove(event: TouchEvent): void {
		if (!draggedItem || gameSubmitted) return
		if (event.touches.length !== 1) return

		const touch = event.touches[0]
		const currentX = touch.clientX
		const currentY = touch.clientY

		const dx = Math.abs(currentX - startX)
		const dy = Math.abs(currentY - startY)

		// Initialize drag if threshold exceeded
		if (!draggedClone) {
			if (dx > dragThreshold || dy > dragThreshold) {
				event.preventDefault()
				initializeTouchDrag(currentX, currentY)
			} else {
				return
			}
		} else {
			// Only prevent default when we're actively dragging
			event.preventDefault()
		}

		// Update clone position
		updateClonePosition(currentX, currentY)

		// Handle drop target highlighting
		updateDropTargetHighlight(currentX, currentY)
	}

	/**
	 * Initializes touch drag operation
	 */
	function initializeTouchDrag(x: number, y: number): void {
		if (!draggedItem) return
		
		draggedClone = createDragClone(draggedItem)
		draggedClone.style.left = `${x}px`
		draggedClone.style.top = `${y}px`
		draggedClone.style.transform = 'translate(-50%, -50%)'
		draggedItem.classList.add('dragging')
		
		// Save scroll position and prevent body scrolling
		savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop
		
		document.body.style.overflow = 'hidden'
		document.body.style.position = 'fixed'
		document.body.style.top = `-${savedScrollPosition}px`
		document.body.style.width = '100%'
		
		// Disable pull-to-refresh
		document.body.style.overscrollBehavior = 'none'
		document.documentElement.style.overscrollBehavior = 'none'
		
		// Add scroll prevention listeners
		document.addEventListener('wheel', preventScroll, { passive: false, capture: true })
		document.addEventListener('scroll', preventScroll, { passive: false, capture: true })
		window.addEventListener('scroll', preventScroll, { passive: false, capture: true })
	}

	/**
	 * Updates drag clone position
	 */
	function updateClonePosition(x: number, y: number): void {
		if (!draggedClone) return
		
		draggedClone.style.left = `${x}px`
		draggedClone.style.top = `${y}px`
		draggedClone.style.transform = 'translate(-50%, -50%)'
	}

	/**
	 * Updates drop target highlighting during drag
	 */
	function updateDropTargetHighlight(x: number, y: number): void {
		const elementUnderFinger = getElementUnderPoint(x, y)
		const potentialTarget = elementUnderFinger?.closest('.baby-card') as HTMLElement | null

		if (currentDropTarget && currentDropTarget !== potentialTarget) {
			currentDropTarget.classList.remove('drag-over')
		}

		const potentialBabyId = potentialTarget?.getAttribute('data-baby-id')
		if (potentialBabyId && !currentMatches[potentialBabyId]) {
			potentialTarget.classList.add('drag-over')
			currentDropTarget = potentialTarget
		} else {
			currentDropTarget = null
		}
	}

	/**
	 * Handles touch end events for mobile drag operations
	 */
	function handleTouchEnd(event: TouchEvent): void {
		if (!draggedItem || gameSubmitted) return

		// Capture values BEFORE any cleanup that might reset them
		const savedDropTarget = currentDropTarget
		const comboId = draggedItem.dataset.comboId
		const babyId = savedDropTarget?.getAttribute('data-baby-id')

		// Clean up visual indicators
		document.querySelectorAll('.baby-card').forEach(card => card.classList.remove('drag-over'))

		// Remove drag clone
		if (draggedClone) {
			draggedClone.remove()
			draggedClone = null
		}

		// Restore normal page behavior
		cleanupDragState()

		// Remove dragging style
		draggedItem.classList.remove('dragging')

		// Handle drop using captured values
		if (savedDropTarget && babyId && comboId) {
			if (currentMatches[babyId]) {
				showModal('Oops!', 'This baby already has a match. Please undo the current match first if you want to change it.')
			} else {
				performDropLogic(babyId, comboId, savedDropTarget)
			}
		}
		
		// Reset drag state
		resetDragState()
	}

	/**
	 * Resets all drag-related state variables
	 */
	function resetDragState(): void {
		draggedItem = null
		currentDropTarget = null
		startX = 0
		startY = 0
	}

	/**
	 * Performs the core logic when a parent combination is dropped on a baby
	 */
	function performDropLogic(babyId: string, comboId: string, targetBabyCardElement: HTMLElement): void {
		const comboData = allPossibleParentCombinations.find(combo => combo.id === comboId)
		if (!comboData) {
			console.error('Dropped combo data not found:', comboId)
			return
		}

		// Update the current matches state
		currentMatches = { ...currentMatches, [babyId]: comboData }
		
		// Hide the original parent card from the available list
		const originalParentCard = document.getElementById(comboId)
		if (originalParentCard) {
			originalParentCard.classList.add('hidden')
		}
	}

	/**
	 * Undoes a match between a baby and parent combination
	 */
	function undoMatch(babyId: string, comboId: string): void {
		if (gameSubmitted) return

		// Remove the match from current matches
		const newMatches = { ...currentMatches }
		delete newMatches[babyId]
		currentMatches = newMatches
		
		// Show the parent card back in the available list
		const originalParentCard = document.getElementById(comboId)
		if (originalParentCard) {
			originalParentCard.classList.remove('hidden')
		}
	}

	/**
	 * Checks if a parent combination is already used
	 */
	function isComboUsed(combo: ParentCombination): boolean {
		return Object.values(currentMatches).some(match => match.id === combo.id)
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

		// Disable all interactive elements
		disableGameInteractions()

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

	/**
	 * Disables all game interactions after submission
	 */
	function disableGameInteractions(): void {
		// Disable drag and drop on parent cards
		document.querySelectorAll('.parent-card').forEach(card => {
			const element = card as HTMLElement
			element.setAttribute('draggable', 'false')
			element.removeEventListener('touchstart', handleTouchStart)
			element.removeEventListener('touchmove', handleTouchMove)
			element.removeEventListener('touchend', handleTouchEnd)
		})
		
		// Disable drop zones and hide undo buttons
		document.querySelectorAll('.baby-card').forEach(card => {
			const element = card as HTMLElement
			element.removeEventListener('dragover', handleDragOver)
			element.removeEventListener('dragleave', handleDragLeave)
			element.removeEventListener('drop', handleDrop)
			
			const undoBtn = element.querySelector('.undo-button') as HTMLElement
			if (undoBtn) undoBtn.style.display = 'none'
		})
	}
</script>

<div class="mb-6 text-center">
	<h2 class="text-3xl font-party text-baby-blue-700">🍼 Make Your Guesses! 👶</h2>
	<p class="text-gray-600 font-friendly">Drag parent combinations to match with baby pictures</p>
</div>

{#if submissionStatus}
	<div class="bg-baby-blue-50 border-2 border-baby-blue-200 rounded-xl p-4 mb-6 text-center">
		<p class="text-baby-blue-800 font-friendly font-medium">✨ {submissionStatus}</p>
	</div>
{/if}

<div class="game-content">
	<div class="babies-section">
		<h3 class="text-xl font-friendly font-semibold text-baby-pink-700 mb-6">👶 Baby Pictures</h3>
		<div id="babies-container" class="babies-grid">
			{#each shuffledGameData as baby (baby.babyId)}
				<div
					class="baby-card"
					data-baby-id={baby.babyId}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
				>
					<h4 class="text-lg font-semibold text-rose-700 mb-2">Baby {shuffledGameData.indexOf(baby) + 1}</h4>
					<img src={baby.babyImage} alt={`Baby ${shuffledGameData.indexOf(baby) + 1}`} class="baby-image">

			
					{#if currentMatches[baby.babyId]}
						<div class="dropped-parent-card rounded-lg p-3 flex flex-col items-center justify-center" data-combo-id={currentMatches[baby.babyId].id}>
							<div class="celebrity-images-wrapper">
								<img src={celebrityImages[currentMatches[baby.babyId].mom]} alt={currentMatches[baby.babyId].mom} class="celebrity-image" draggable="false">
								<img src={celebrityImages[currentMatches[baby.babyId].dad]} alt={currentMatches[baby.babyId].dad} class="celebrity-image" draggable="false">
							</div>
							<span class="names-span">{getCoupleString(currentMatches[baby.babyId].mom, currentMatches[baby.babyId].dad)}</span>
							<button class="undo-button" onclick={(e) => { e.stopPropagation(); undoMatch(baby.babyId, currentMatches[baby.babyId].id); }}>X</button>
						</div>
					{:else}
						<p class="placeholder-text">Drag parent card here</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<div class="parents-section">
		<h3 class="text-xl font-friendly font-semibold text-baby-blue-700 mb-6">👨‍👩‍👧‍👦 Parent Combinations</h3>
		<div id="parents-container" class="parents-list">
			{#each allPossibleParentCombinations as combo (combo.id)}
				<div
					class="parent-card"
					draggable={!gameSubmitted}
					id={combo.id}
					data-combo-id={combo.id}
					ondragstart={handleDragStart}
					ondragend={handleDragEnd}
					ontouchstart={handleTouchStart}
					ontouchmove={handleTouchMove}
					ontouchend={handleTouchEnd}
					class:hidden={currentMatches[shuffledGameData.find(baby => currentMatches[baby.babyId] === combo)?.babyId]}
				>
					<div class="celebrity-images-wrapper">
						<img src={celebrityImages[combo.mom]} alt={combo.mom} class="celebrity-image" draggable="false">
						<img src={celebrityImages[combo.dad]} alt={combo.dad} class="celebrity-image" draggable="false">
					</div>
					<span class="names-span">{getCoupleString(combo.mom, combo.dad)}</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<button 
	id="submit-button" 
	class="action-button mt-8 font-friendly" 
	disabled={Object.keys(currentMatches).length !== shuffledGameData.length || gameSubmitted} 
	onclick={handleSubmit}
>
	🚀 Submit All Answers
</button>

<!-- Custom Modal for messages -->
{#if modalState.show}
	<div class="modal" class:show={modalState.show}>
		<div class="modal-content">
			<h2 id="modal-title">{modalState.title}</h2>
			<p id="modal-message">{modalState.message}</p>
			<button id="modal-close-button" class="modal-close-button" onclick={hideModal}>Close</button>
		</div>
	</div>
{/if}

<style>
	/* Custom styles for the drag-and-drop layout and elements */
	.game-content {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: flex-start;
		gap: 15px;
	}
	@media (min-width: 768px) {
		.game-content {
			gap: 30px;
		}
	}

	.babies-section {
		flex: 1;
		padding: 10px;
		border-radius: 15px;
		background-color: #fefefe;
		border: 1px solid #fdeff4;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 140px;
		height: 800px;
	}
	.parents-section {
		flex: 1;
		padding: 10px;
		border-radius: 15px;
		background-color: #fefefe;
		border: 1px solid #fdeff4;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 140px;
		height: 800px;
	}
	@media (min-width: 768px) {
		.babies-section, .parents-section {
			padding: 15px;
			height: 900px;
		}
	}

	.babies-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: 100%;
		align-items: center;
		overflow-y: auto;
		flex-grow: 1;
		padding-right: 5px;
		overscroll-behavior: contain;
	}
	.babies-grid::-webkit-scrollbar {
		width: 8px;
	}
	.babies-grid::-webkit-scrollbar-track {
		background: #fdf2f8;
		border-radius: 10px;
	}
	.babies-grid::-webkit-scrollbar-thumb {
		background: #f9d8e5;
		border-radius: 10px;
	}
	.babies-grid::-webkit-scrollbar-thumb:hover {
		background: #f29ecf;
	}
	@media (min-width: 768px) {
		.babies-grid {
			gap: 15px;
		}
	}

	.baby-card {
		background-color: #ffffff;
		border-radius: 12px;
		padding: 8px;
		border: 2px dashed #f9d8e5;
		text-align: center;
		min-height: 350px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-around;
		transition: background-color 0.2s ease, border-color 0.2s ease;
		position: relative;
		width: 100%;
		max-width: 220px;
	}
	.baby-card.drag-over {
		background-color: #fbe0ec;
		border-color: #d9669e;
	}
	@media (min-width: 768px) {
		.baby-card {
			padding: 15px;
			min-height: 450px;
			max-width: 350px;
		}
	}
	.baby-image {
		width: 100%;
		max-width: 140px;
		height: auto;
		border-radius: 8px;
		object-fit: cover;
		margin-bottom: 5px;
		border: 2px solid #eeb4d2;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		flex-shrink: 0;
	}
	@media (min-width: 768px) {
		.baby-image {
			max-width: 200px;
			margin-bottom: 10px;
		}
	}
	.baby-card .placeholder-text {
		color: #a6959b;
		font-style: italic;
		font-size: 0.75em;
	}
	@media (min-width: 768px) {
		.baby-card .placeholder-text {
			font-size: 0.85em;
		}
	}

	.parents-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		align-items: center;
		height: 100%;
		overflow-y: scroll; /* Always show scrollbar */
		padding: 10px 20px 10px 10px; /* Extra padding on right for scrollbar */
		border-radius: 8px;
		background-color: #ffffff;
		border: 1px solid #fdeff4;
		box-sizing: border-box;
		overscroll-behavior: contain;
		scrollbar-gutter: stable; /* Reserve space for scrollbar */
		
		/* Firefox scrollbar styling */
		scrollbar-width: thick;
		scrollbar-color: rgb(242, 158, 207) rgb(253, 242, 248);
	}
	.parents-list::-webkit-scrollbar {
		width: 12px;
		-webkit-appearance: none; /* Override default appearance */
	}
	.parents-list::-webkit-scrollbar-track {
		background: #fdf2f8;
		border-radius: 15px;
		border: 2px solid #f9d8e5;
		margin: 8px 0;
	}
	.parents-list::-webkit-scrollbar-thumb {
		background: linear-gradient(180deg, #f29ecf 0%, #d9669e 100%);
		border-radius: 15px;
		border: 2px solid #fdf2f8;
		box-shadow: 0 2px 4px rgba(217, 102, 158, 0.3);
	}
	.parents-list::-webkit-scrollbar-thumb:hover {
		background: linear-gradient(180deg, #d9669e 0%, #c45a8e 100%);
		box-shadow: 0 3px 6px rgba(217, 102, 158, 0.4);
	}
	.parents-list::-webkit-scrollbar-thumb:active {
		background: linear-gradient(180deg, #c45a8e 0%, #b84d7e 100%);
	}
	@media (min-width: 768px) {
		.parents-list {
			gap: 15px;
		}
	}
	
	/* Mobile specific - force scrollbar visibility */
	@media (max-width: 767px) {
		.parents-list {
			-webkit-overflow-scrolling: touch;
		}
		.parents-list::-webkit-scrollbar {
			width: 14px; /* Slightly wider on mobile */
			display: block !important;
		}
		.parents-list::-webkit-scrollbar-thumb {
			background: #f29ecf !important;
			border: 1px solid #fdf2f8 !important;
		}
	}
	.parent-card {
		background-color: #fdf6fa;
		color: #7a4d64;
		padding: 8px;
		border-radius: 12px;
		border: 2px solid #f9d8e5;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: grab;
		transition: all 0.2s ease;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		width: 100%;
		max-width: 200px;
		flex-shrink: 0;
	}
	@media (min-width: 768px) {
		.parent-card {
			padding: 15px;
			font-size: 0.85rem;
			gap: 8px;
			max-width: 320px;
		}
	}
	.parent-card:hover {
		background-color: #fbe0ec;
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}
	.parent-card.dragging {
		opacity: 0.6;
		border-style: dashed;
	}
	.parent-card.hidden {
		display: none;
	}

	.baby-card .dropped-parent-card {
		position: static;
		transform: none;
		width: calc(100% - 16px);
		height: auto;
		margin-top: 10px;
		background-color: #f29ecf;
		color: white;
		border-color: #d9669e;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
		cursor: default;
		padding: 6px;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 3px;
		z-index: 10;
		flex-shrink: 0;
	}
	@media (min-width: 768px) {
		.baby-card .dropped-parent-card {
			padding: 8px;
			width: calc(100% - 30px);
			gap: 4px;
		}
	}
	.baby-card .dropped-parent-card .celebrity-images-wrapper {
		margin-bottom: 3px;
		display: flex;
		gap: 8px;
	}
	.baby-card .dropped-parent-card .celebrity-image {
		width: 70px;
		height: 70px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.8);
	}
	@media (min-width: 768px) {
		.baby-card .dropped-parent-card .celebrity-image {
			width: 90px;
			height: 90px;
			gap: 10px;
		}
	}
	.baby-card .dropped-parent-card .names-span {
		font-weight: 700;
		color: white;
		font-size: 0.85rem;
	}
	@media (min-width: 768px) {
		.baby-card .dropped-parent-card .names-span {
			font-size: 0.95rem;
		}
	}
	.baby-card .undo-button {
		position: absolute;
		bottom: 5px;
		right: 5px;
		background-color: #f56565;
		color: white;
		border: none;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		font-size: 0.6em;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		z-index: 11;
	}
	@media (min-width: 768px) {
		.baby-card .undo-button {
			bottom: 8px;
			right: 8px;
			width: 22px;
			height: 22px;
			font-size: 0.7em;
		}
	}

	.celebrity-images-wrapper {
		display: flex;
		justify-content: center;
		gap: 5px;
	}
	.celebrity-image {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgba(255, 255, 255, 0.5);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}
	@media (min-width: 768px) {
		.celebrity-image {
			width: 60px;
			height: 60px;
			gap: 8px;
		}
	}
	.names-span {
		font-size: 0.75rem;
		color: #7a4d64;
		text-align: center;
	}
	@media (min-width: 768px) {
		.names-span {
			font-size: 0.85rem;
		}
	}
	.action-button {
		background-color: #d9669e;
		color: white;
		padding: 8px 18px;
		border-radius: 10px;
		border: none;
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
		transition: background-color 0.3s ease, transform 0.2s ease;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
	@media (min-width: 768px) {
		.action-button {
			padding: 12px 25px;
			font-size: 1.1rem;
		}
	}
	.action-button:hover:not(:disabled) {
		background-color: #c45a8e;
		transform: translateY(-1px);
	}
	.action-button:disabled {
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
		padding: 20px;
		border-radius: 15px;
		text-align: center;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		max-width: 300px;
		width: 90%;
		transform: translateY(-20px);
		transition: transform 0.3s ease;
	}
	@media (min-width: 768px) {
		.modal-content {
			padding: 30px;
			max-width: 400px;
		}
	}
	.modal.show .modal-content {
		transform: translateY(0);
	}
	.modal-content h2 {
		color: #7a4d64;
		margin-bottom: 10px;
		font-size: 1.4rem;
	}
	@media (min-width: 768px) {
		.modal-content h2 {
			margin-bottom: 15px;
			font-size: 1.8rem;
		}
	}
	.modal-content p {
		color: #947e88;
		margin-bottom: 15px;
		font-size: 0.95rem;
	}
	@media (min-width: 768px) {
		.modal-content p {
			margin-bottom: 25px;
			font-size: 1.1rem;
		}
	}
	.modal-close-button {
		background-color: #d9669e;
		color: white;
		padding: 6px 15px;
		border-radius: 8px;
		border: none;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}
	@media (min-width: 768px) {
		.modal-close-button {
			padding: 10px 20px;
			font-size: 1rem;
		}
	}
	.modal-close-button:hover {
		background-color: #c45a8e;
	}

	.touch-dragging-clone {
		position: fixed !important;
		pointer-events: none !important;
		z-index: 9999 !important;
		opacity: 0.8;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
		transform: translate(-50%, -50%) !important;
		background-color: #fdf6fa;
		color: #7a4d64;
		padding: 8px;
		border-radius: 12px;
		border: 2px solid #f9d8e5;
		font-size: 0.75rem;
		font-weight: 600;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		width: 140px;
		max-width: 140px;
	}
	.touch-dragging-clone .celebrity-image {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgba(255, 255, 255, 0.5);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}
	.touch-dragging-clone .names-span {
		font-size: 0.75rem;
		color: #7a4d64;
		text-align: center;
	}
</style>