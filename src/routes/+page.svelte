<script>
    import { onMount } from 'svelte';

    // Reactive state variables
    let currentMatches = $state({}); // Stores the selected parent combination for each baby: { babyId: { comboId, mom, dad } }
    let gameSubmitted = $state(false); // Flag to prevent further changes after submission

    // Modal state
    let modalState = $state({
        show: false,
        title: '',
        message: ''
    });

    // Game data definitions
    const mommy = 'Mommy';
    const daddy = 'Daddy';
    const maleCelebrities = [
        'Owen Wilson', 'Benedict Cumberbatch', 'Rupert Grint', 'Timothee Chalamet'
    ];
    const femaleCelebrities = [
        'Priyanka Chopra', 'Halle Berry', 'Zendaya', 'Mindy Kaling', 'Mommy'
    ];

    // Generate all possible parent combinations
    let allPossibleParentCombinations = $state([]);
    let combinationIdCounter = 0;

    maleCelebrities.forEach(male => {
        allPossibleParentCombinations.push({ id: `combo-${combinationIdCounter++}`, mom: mommy, dad: male });
    });
    femaleCelebrities.forEach(female => {
        allPossibleParentCombinations.push({ id: `combo-${combinationIdCounter++}`, mom: daddy, dad: female });
    });

    // Game data: baby images and their *actual* correct parents.
    let gameData = $state([
        {
            babyId: 'baby1',
            babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/dad_halle.jpeg',
            correctParents: { mom: daddy, dad: 'Halle Berry' }
        },
        {
            babyId: 'baby2',
            babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/dad_mindy.jpeg',
            correctParents: { mom: daddy, dad: 'Mindy Kaling' }
        },
        {
            babyId: 'baby3',
            babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/dad_priyanka.jpeg',
            correctParents: { mom: daddy, dad: 'Priyanka Chopra' }
        },
        {
            babyId: 'baby4',
            babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/dad_zendaya.jpeg',
            correctParents: { mom: daddy, dad: 'Zendaya' }
        },
        {
            babyId: 'baby5',
            babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/mom_benedict.jpeg',
            correctParents: { mom: mommy, dad: 'Benedict Cumberbatch' }
        },
        {
            babyId: 'baby6',
            babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/mom_owen.jpeg',
            correctParents: { mom: mommy, dad: 'Owen Wilson' }
        },
        {
            babyId: 'baby7',
            babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/mom_rupert.jpeg',
            correctParents: { mom: mommy, dad: 'Rupert Grint' }
        },
        {
            babyId: 'baby8',
            babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/mom_timothee.jpeg',
            correctParents: { mom: mommy, dad: 'Timothee Chalamet' }
        },
        {
            babyId: 'baby9',
            babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/dad_mom.jpeg',
            correctParents: { mom: mommy, dad: daddy }
        }
    ]);

    // Celebrity image mapping. Replace these with actual image URLs!
    const celebrityImages = {
        'Mommy': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_parents_for_app/mom_main.jpeg',
        'Daddy': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_parents_for_app/dad_main.jpg',
        'Owen Wilson': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/owen.png',
        'Benedict Cumberbatch': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/benedict.png',
        'Rupert Grint': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/rupert.png',
        'Priyanka Chopra': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/priyanka.jpg',
        'Halle Berry': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/halle.png',
        'Mindy Kaling': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/mindy.jpg',
        'Zendaya': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/zendaya.jpeg',
        'Timothee Chalamet': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/timothee.png'
    };

    // --- Modal Functions ---
    function showModal(title, message) {
        modalState = { show: true, title, message };
    }

    function hideModal() {
        modalState = { show: false, title: '', message: '' };
    }

    // --- Utility Function ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    // --- Drag and Drop Logic ---
    let draggedItem = null; // Stores the currently dragged parent card element (original)
    let draggedClone = null; // Stores the clone element for touch dragging
    let dragSourceParent = null; // Reference to the original parent container for mouse drag
    let currentDropTarget = null; // The baby card currently being hovered/touched over
    let startX = 0;
    let startY = 0;
    const dragThreshold = 10; // Pixels to move before a drag is initiated

    function createDragClone(originalElement) {
        const clone = originalElement.cloneNode(true);
        clone.classList.add('touch-dragging-clone');
        clone.style.position = 'fixed';
        clone.style.left = '0px';
        clone.style.top = '0px';
        document.body.appendChild(clone);
        return clone;
    }

    function getElementUnderPoint(x, y) {
        if (draggedClone) draggedClone.style.display = 'none';
        const element = document.elementFromPoint(x, y);
        if (draggedClone) draggedClone.style.display = 'block';
        return element;
    }

    function handleDragStart(event) {
        if (gameSubmitted) return;
        draggedItem = event.target;
        dragSourceParent = draggedItem.parentNode;
        event.dataTransfer.setData('text/plain', draggedItem.dataset.comboId);
        event.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            draggedItem.classList.add('dragging');
        }, 0);
    }

    function handleDragEnd(event) {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
        document.querySelectorAll('.baby-card').forEach(card => card.classList.remove('drag-over'));
        currentDropTarget = null;
    }

    function handleDragOver(event) {
        event.preventDefault();
        if (gameSubmitted) return;
        const targetBabyCard = event.target.closest('.baby-card');
        if (currentDropTarget && currentDropTarget !== targetBabyCard) {
            currentDropTarget.classList.remove('drag-over');
        }
        if (targetBabyCard && !currentMatches[targetBabyCard.dataset.babyId]) {
            targetBabyCard.classList.add('drag-over');
            currentDropTarget = targetBabyCard;
        } else {
            currentDropTarget = null;
        }
        event.dataTransfer.dropEffect = 'move';
    }

    function handleDragLeave(event) {
        if (gameSubmitted) return;
        const targetBabyCard = event.target.closest('.baby-card');
        if (targetBabyCard) {
            targetBabyCard.classList.remove('drag-over');
        }
        if (currentDropTarget === targetBabyCard) {
            currentDropTarget = null;
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        if (gameSubmitted) return;
        const comboId = event.dataTransfer.getData('text/plain');
        const targetBabyCard = event.target.closest('.baby-card');

        document.querySelectorAll('.baby-card').forEach(card => card.classList.remove('drag-over'));
        currentDropTarget = null;

        if (!targetBabyCard || !comboId) {
            return;
        }
        const babyId = targetBabyCard.dataset.babyId;
        if (currentMatches[babyId]) {
            showModal('Oops!', 'This baby already has a match. Please undo the current match first if you want to change it.');
            return;
        }
        performDropLogic(babyId, comboId, targetBabyCard);
    }

    function handleTouchStart(event) {
        if (gameSubmitted) return;
        if (event.touches.length !== 1) return;

        const touch = event.touches[0];
        const target = event.target.closest('.parent-card');

        if (target) {
            startX = touch.clientX;
            startY = touch.clientY;
            draggedItem = target;
            dragSourceParent = draggedItem.parentNode;
            // Do NOT preventDefault here initially, let it scroll.
        }
    }

    function handleTouchMove(event) {
        if (!draggedItem || gameSubmitted) return;
        if (event.touches.length !== 1) return;

        const touch = event.touches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;

        const dx = Math.abs(currentX - startX);
        const dy = Math.abs(currentY - startY);

        if (!draggedClone) {
            if (dx > dragThreshold || dy > dragThreshold) {
                if (dx > dy) { // Primarily horizontal movement, initiate drag
                    event.preventDefault(); // Prevent default scrolling only when drag is confirmed
                    draggedClone = createDragClone(draggedItem);
                    draggedItem.classList.add('dragging'); // Hide original
                } else { // Primarily vertical movement, it's a scroll.
                    draggedItem = null; // Reset draggedItem so no drag is initiated.
                    return;
                }
            } else {
                return; // Movement within threshold, still not a drag. Allow default scrolling.
            }
        } else {
            event.preventDefault(); // Drag is already initiated, prevent default to ensure smooth dragging
        }

        draggedClone.style.left = `${currentX}px`;
        draggedClone.style.top = `${currentY}px`;

        const elementUnderFinger = getElementUnderPoint(currentX, currentY);
        const potentialTarget = elementUnderFinger ? elementUnderFinger.closest('.baby-card') : null;

        if (currentDropTarget && currentDropTarget !== potentialTarget) {
            currentDropTarget.classList.remove('drag-over');
        }

        if (potentialTarget && !currentMatches[potentialTarget.dataset.babyId]) {
            potentialTarget.classList.add('drag-over');
            currentDropTarget = potentialTarget;
        } else {
            currentDropTarget = null;
        }
    }

    function handleTouchEnd(event) {
        if (!draggedItem || gameSubmitted) return;

        document.querySelectorAll('.baby-card').forEach(card => card.classList.remove('drag-over'));

        if (draggedClone) {
            draggedClone.remove();
            draggedClone = null;
        }

        draggedItem.classList.remove('dragging');

        if (currentDropTarget) {
            const babyId = currentDropTarget.dataset.babyId;
            const comboId = draggedItem.dataset.comboId;
            if (currentMatches[babyId]) {
                showModal('Oops!', 'This baby already has a match. Please undo the current match first if you want to change it.');
            } else {
                performDropLogic(babyId, comboId, currentDropTarget);
            }
        }
        draggedItem = null;
        currentDropTarget = null;
        startX = 0;
        startY = 0;
    }

    function performDropLogic(babyId, comboId, targetBabyCardElement) {
        const comboData = allPossibleParentCombinations.find(combo => combo.id === comboId);
        if (!comboData) {
            console.error('Dropped combo data not found:', comboId);
            return;
        }

        // Update reactive state directly
        currentMatches = { ...currentMatches, [babyId]: comboData };

        // Hide the original draggable card from the parents list
        const originalParentCard = document.getElementById(comboId);
        if (originalParentCard) {
            originalParentCard.classList.add('hidden');
        }
        checkSubmissionReadiness();
    }

    function undoMatch(babyId, comboId) {
        if (gameSubmitted) return;

        // Remove the match from currentMatches
        const newMatches = { ...currentMatches };
        delete newMatches[babyId];
        currentMatches = newMatches; // Trigger reactivity

        // Show the original parent card back in the parents list
        const originalParentCard = document.getElementById(comboId);
        if (originalParentCard) {
            originalParentCard.classList.remove('hidden');
        }
        checkSubmissionReadiness();
    }

    // Check if all babies have a match and enable/disable submit button
    $effect(() => {
        const allMatched = Object.keys(currentMatches).length === gameData.length;
        // The submit button's disabled state is bound directly in the HTML
        // No explicit DOM manipulation needed here.
    });


    // Initial setup on component mount
    onMount(() => {
        gameData = shuffleArray([...gameData]); // Shuffle game data for variety
        allPossibleParentCombinations = shuffleArray([...allPossibleParentCombinations]); // Shuffle parent options
    });

    // --- Submission Logic ---
    async function handleSubmit() {
        if (gameSubmitted) return;

        gameSubmitted = true;

        // Disable all drag-and-drop interactions
        document.querySelectorAll('.parent-card').forEach(card => {
            card.setAttribute('draggable', 'false');
            card.removeEventListener('touchstart', handleTouchStart);
            card.removeEventListener('touchmove', handleTouchMove);
            card.removeEventListener('touchend', handleTouchEnd);
        });
        document.querySelectorAll('.baby-card').forEach(card => {
            card.removeEventListener('dragover', handleDragOver);
            card.removeEventListener('dragleave', handleDragLeave);
            card.removeEventListener('drop', handleDrop);
            const undoBtn = card.querySelector('.undo-button');
            if (undoBtn) undoBtn.style.display = 'none';
        });

        // Prepare data for submission (if backend were connected)
        const submissionsData = Object.keys(currentMatches).map(babyId => ({
            babyId: babyId,
            guessedParents: currentMatches[babyId]
        }));

        console.log("Player's Submissions:", submissionsData);

        // Show a confirmation modal to the player
        showModal('Answers Submitted!', 'Thank you for playing! The answers will be revealed live!');
    }
</script>

<div class="game-container">
    <h1 class="text-3xl font-bold text-rose-800 mb-4">Guess Dat Baby!</h1>
    <p class="text-pink-700 mb-6">Drag a parent combination card onto the baby picture you think it matches!</p>

    <div class="game-content">
        <div class="babies-section">
            <h2 class="text-xl font-semibold text-rose-700 mb-6">Baby Pictures</h2>
            <div id="babies-container" class="babies-grid">
                {#each gameData as baby (baby.babyId)}
                    <div
                        class="baby-card"
                        data-baby-id={baby.babyId}
                        on:dragover={handleDragOver}
                        on:dragleave={handleDragLeave}
                        on:drop={handleDrop}
                    >
                        <h3 class="text-lg font-semibold text-rose-700 mb-2">Baby {gameData.indexOf(baby) + 1}</h3>
                        <img src={baby.babyImage} alt={`Baby ${gameData.indexOf(baby) + 1}`} class="baby-image">

                        {#if currentMatches[baby.babyId]}
                            <div class="dropped-parent-card rounded-lg p-3 flex flex-col items-center justify-center" data-combo-id={currentMatches[baby.babyId].id}>
                                <div class="celebrity-images-wrapper">
                                    <img src={celebrityImages[currentMatches[baby.babyId].mom]} alt={currentMatches[baby.babyId].mom} class="celebrity-image">
                                    <img src={celebrityImages[currentMatches[baby.babyId].dad]} alt={currentMatches[baby.babyId].dad} class="celebrity-image">
                                </div>
                                <span class="names-span">{currentMatches[baby.babyId].mom} & {currentMatches[baby.babyId].dad}</span>
                                <button class="undo-button" on:click|stopPropagation={() => undoMatch(baby.babyId, currentMatches[baby.babyId].id)}>X</button>
                            </div>
                        {:else}
                            <p class="placeholder-text">Drag parent card here</p>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        <div class="parents-section">
            <h2 class="text-xl font-semibold text-rose-700 mb-6">Parent Combinations</h2>
            <div id="parents-container" class="parents-list">
                {#each allPossibleParentCombinations as combo (combo.id)}
                    <div
                        class="parent-card"
                        draggable={!gameSubmitted}
                        id={combo.id}
                        data-combo-id={combo.id}
                        on:dragstart={handleDragStart}
                        on:dragend={handleDragEnd}
                        on:touchstart={handleTouchStart}
                        on:touchmove={handleTouchMove}
                        on:touchend={handleTouchEnd}
                        class:hidden={currentMatches[gameData.find(baby => currentMatches[baby.babyId] === combo)?.babyId]}
                    >
                        <div class="celebrity-images-wrapper">
                            <img src={celebrityImages[combo.mom]} alt={combo.mom} class="celebrity-image">
                            <img src={celebrityImages[combo.dad]} alt={combo.dad} class="celebrity-image">
                        </div>
                        <span class="names-span">{combo.mom} & {combo.dad}</span>
                    </div>
                {/each}
            </div>
        </div>
    </div>

    <button id="submit-button" class="action-button mt-8" disabled={Object.keys(currentMatches).length !== gameData.length || gameSubmitted} on:click={handleSubmit}>
        Submit All Answers
    </button>
</div>

<!-- Custom Modal for messages (instead of alert()) -->
{#if modalState.show}
    <div class="modal">
        <div class="modal-content">
            <h2 id="modal-title">{modalState.title}</h2>
            <p id="modal-message">{modalState.message}</p>
            <button id="modal-close-button" class="modal-close-button" on:click={hideModal}>Close</button>
        </div>
    </div>
{/if}

<style>
    /* Custom styles for the drag-and-drop layout and elements */
    body {
        font-family: 'Inter', sans-serif;
        background-color: #fdf2f8; /* Softer very light pink background */
        display: flex;
        justify-content: center;
        align-items: flex-start; /* Align items to the top for better scrolling */
        min-height: 100vh;
        margin: 0;
        padding: 10px; /* Reduced padding for very small screens */
        box-sizing: border-box;
    }
    .game-container {
        background-color: #ffffff;
        border-radius: 20px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        padding: 15px; /* Adjusted padding */
        max-width: 1200px;
        width: 100%;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 15px; /* Adjusted gap */
        border: 2px solid #fce8f0; /* Softer light pink border */
    }
    @media (min-width: 768px) {
        .game-container {
            padding: 30px; /* Original padding for larger screens */
            gap: 20px; /* Original gap */
        }
    }

    .game-content {
        display: flex; /* Always flex */
        flex-direction: row; /* Always row for two columns */
        justify-content: space-around; /* Distribute space */
        align-items: flex-start; /* Align items to the top */
        gap: 15px; /* Adjusted gap for smaller screens */
    }
    @media (min-width: 768px) {
        .game-content {
            gap: 30px; /* Original gap for larger screens */
        }
    }

    /* Baby Pictures Section */
    .babies-section {
        flex: 1; /* Changed to equal width */
        padding: 10px; /* Adjusted padding */
        border-radius: 15px;
        background-color: #fefefe; /* Very light, almost white pink background for sections */
        border: 1px solid #fdeff4; /* Softer lighter pink border */
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 140px; /* Ensure a minimum width for columns */
        height: 800px; /* Fixed height for both columns */
    }
    .parents-section {
        flex: 1; /* Changed to equal width */
        padding: 10px; /* Adjusted padding */
        border-radius: 15px;
        background-color: #fefefe; /* Very light, almost white pink background for sections */
        border: 1px solid #fdeff4; /* Softer lighter pink border */
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 140px; /* Ensure a minimum width for columns */
        height: 800px; /* Fixed height for both columns */
    }
    @media (min-width: 768px) {
        .babies-section, .parents-section {
            padding: 15px; /* Original padding */
            height: 900px; /* Taller on larger screens */
        }
    }

    .babies-grid {
        display: flex;
        flex-direction: column;
        gap: 10px; /* Adjusted vertical gap between baby cards */
        width: 100%;
        align-items: center;
        overflow-y: auto; /* Enable scrolling if content exceeds height */
        flex-grow: 1; /* Allow grid to take available height */
        padding-right: 5px; /* Space for scrollbar */
        overscroll-behavior: contain; /* Prevents scrolling propagation to parent */
    }
    .babies-grid::-webkit-scrollbar {
        width: 8px;
    }
    .babies-grid::-webkit-scrollbar-track {
        background: #fdf2f8; /* Softer light pink scrollbar track */
        border-radius: 10px;
    }
    .babies-grid::-webkit-scrollbar-thumb {
        background: #f9d8e5; /* Softer pink scrollbar thumb */
        border-radius: 10px;
    }
    .babies-grid::-webkit-scrollbar-thumb:hover {
        background: #f29ecf; /* Softer darker pink on hover */
    }
    @media (min-width: 768px) {
        .babies-grid {
            gap: 15px; /* Original gap */
        }
    }

    .baby-card {
        background-color: #ffffff;
        border-radius: 12px;
        padding: 8px; /* Adjusted padding */
        border: 2px dashed #f9d8e5; /* Softer pink dashed border */
        text-align: center;
        min-height: 350px; /* Increased min-height to accommodate larger images in dropped card */
        display: flex; /* Make it a flex container */
        flex-direction: column; /* Stack contents vertically */
        align-items: center;
        justify-content: space-around; /* Distribute space vertically */
        transition: background-color 0.2s ease, border-color 0.2s ease;
        position: relative;
        width: 100%; /* Take full width of its flex container */
        max-width: 220px; /* Wider max width for individual baby cards */
    }
    .baby-card.drag-over {
        background-color: #fbe0ec; /* Softer highlight on drag over */
        border-color: #d9669e; /* Softer darker pink border */
    }
    @media (min-width: 768px) {
        .baby-card {
            padding: 15px;
            min-height: 450px; /* Increased min-height for desktop to fit larger images */
            max-width: 350px; /* Allow wider cards on larger screens */
        }
    }
    .baby-image {
        width: 100%;
        max-width: 140px; /* Adjusted max width for wider cards */
        height: auto;
        border-radius: 8px;
        object-fit: cover;
        margin-bottom: 5px; /* Adjusted margin */
        border: 2px solid #eeb4d2; /* Softer medium pink border */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        flex-shrink: 0; /* Prevent image from shrinking too much */
    }
    @media (min-width: 768px) {
        .baby-image {
            max-width: 200px; /* Wider on larger screens */
            margin-bottom: 10px;
        }
    }
    .baby-card .placeholder-text {
        color: #a6959b; /* Softer gray-pink */
        font-style: italic;
        font-size: 0.75em; /* Adjusted font size */
    }
    @media (min-width: 768px) {
        .baby-card .placeholder-text {
            font-size: 0.85em;
        }
    }

    /* Parent Combinations Section */
    .parents-list {
        display: flex;
        flex-direction: column;
        gap: 8px; /* Adjusted vertical gap between parent cards */
        width: 100%;
        align-items: center;
        height: 100%; /* Take full height of parent section */
        overflow-y: auto; /* Enable scrolling if content exceeds height */
        padding: 10px;
        border-radius: 8px;
        background-color: #ffffff;
        border: 1px solid #fdeff4; /* Softer lighter pink border */
        box-sizing: border-box; /* Include padding in height calculation */
        overscroll-behavior: contain; /* Prevents scrolling propagation to parent */
    }
    .parents-list::-webkit-scrollbar {
        width: 8px;
    }
    .parents-list::-webkit-scrollbar-track {
        background: #fdf2f8; /* Softer light pink scrollbar track */
        border-radius: 10px;
    }
    .parents-list::-webkit-scrollbar-thumb {
        background: #f9d8e5; /* Softer pink scrollbar thumb */
        border-radius: 10px;
    }
    .parents-list::-webkit-scrollbar-thumb:hover {
        background: #f29ecf; /* Softer darker pink on hover */
    }
    @media (min-width: 768px) {
        .parents-list {
            gap: 15px;
        }
    }
    .parent-card {
        background-color: #fdf6fa; /* Softer lighter pink for draggable cards */
        color: #7a4d64; /* Softer darker pink text */
        padding: 8px; /* Adjusted padding */
        border-radius: 12px;
        border: 2px solid #f9d8e5; /* Softer pink border */
        font-size: 0.75rem; /* Smaller font size for names */
        font-weight: 600;
        cursor: grab;
        transition: all 0.2s ease;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px; /* Adjusted gap */
        width: 100%; /* Take full width of its flex container */
        max-width: 200px; /* Increased max width for individual parent cards */
        flex-shrink: 0;
        /* Removed touch-action: none; to allow native scrolling, handled by JS now */
    }
    @media (min-width: 768px) {
        .parent-card {
            padding: 15px;
            font-size: 0.85rem; /* Slightly larger on desktop */
            gap: 8px;
            max-width: 320px; /* Increased max width for desktop */
        }
    }
    .parent-card:hover {
        background-color: #fbe0ec; /* Softer even lighter pink on hover */
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

    /* Dropped Parent Card Styling within Baby Card */
    .baby-card .dropped-parent-card {
        position: static;
        transform: none;
        width: calc(100% - 16px); /* Take full width of parent, minus padding */
        height: auto; /* Height determined by content */
        margin-top: 10px; /* Space below baby image */
        background-color: #f29ecf; /* Softer medium pink when dropped */
        color: white;
        border-color: #d9669e; /* Softer darker pink border */
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
        display: flex; /* Ensure images are side-by-side */
        gap: 8px; /* More space between parent images */
    }
    .baby-card .dropped-parent-card .celebrity-image {
        width: 70px; /* Larger size for reference images on mobile */
        height: 70px;
        border-radius: 50%; /* Keep them circular */
        border: 2px solid rgba(255, 255, 255, 0.8);
    }
    @media (min-width: 768px) {
        .baby-card .dropped-parent-card .celebrity-image {
            width: 90px; /* Even larger on desktop */
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
        background-color: #f56565; /* Red for undo, provides good contrast */
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
        gap: 5px; /* Increased gap between images in parent card */
    }
    .celebrity-image {
        width: 50px; /* Larger size for parent card images on mobile */
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.5);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    @media (min-width: 768px) {
        .celebrity-image {
            width: 60px; /* Even larger on desktop */
            height: 60px;
            gap: 8px; /* More gap on desktop */
        }
    }
    .names-span {
        font-size: 0.75rem; /* Smaller font size for names */
        color: #7a4d64; /* Softer darker pink text */
        text-align: center;
    }
    @media (min-width: 768px) {
        .names-span {
            font-size: 0.85rem; /* Slightly larger on desktop */
        }
    }
    .action-button {
        background-color: #d9669e; /* Softer darker pink for action buttons */
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
        background-color: #c45a8e; /* Softer even darker pink on hover */
        transform: translateY(-1px);
    }
    .action-button:disabled {
        background-color: #cbd5e0; /* Gray when disabled */
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
        color: #7a4d64; /* Softer darker pink for modal title */
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
        color: #947e88; /* Softer pink-friendly gray for modal text */
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
        background-color: #d9669e; /* Softer darker pink for modal button */
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
        background-color: #c45a8e; /* Softer even darker pink on hover */
    }

    /* Styles for the touch-dragged clone */
    .touch-dragging-clone {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.8;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
        transform: translate(-50%, -50%);
        background-color: #fdf6fa; /* Match parent-card background */
        color: #7a4d64; /* Match parent-card text */
        padding: 8px;
        border-radius: 12px;
        border: 2px solid #f9d8e5; /* Match parent-card border */
        font-size: 0.75rem; /* Match parent-card font size */
        font-weight: 600;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        width: 140px;
    }
    .touch-dragging-clone .celebrity-image {
        width: 50px; /* Match parent-card image size */
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.5);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    .touch-dragging-clone .names-span {
        font-size: 0.75rem; /* Match parent-card font size */
        color: #7a4d64;
        text-align: center;
    }
</style>

