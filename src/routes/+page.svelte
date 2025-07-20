<script>
    let roomCode = $state('')
</script>

<div class="game-container">
    <h1 class="text-4xl font-party text-baby-blue-700 mb-4">🍼 Guess Dat Baby! 👶</h1>
    <p class="text-baby-pink-600 font-friendly mb-8">Welcome to the cutest guessing game!</p>
    
    <div class="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div class="bg-baby-blue-50 rounded-xl p-6 border-2 border-baby-blue-200">
            <h2 class="text-2xl font-party text-baby-blue-700 mb-4">🎮 Join a Game</h2>
            <p class="text-gray-600 font-friendly mb-4">Enter the room code to join</p>
            <input
                type="text"
                bind:value={roomCode}
                placeholder="Enter room code"
                class="w-full px-4 py-3 border-2 border-baby-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-baby-pink-400 focus:border-baby-pink-400 font-friendly uppercase text-center mb-4"
                maxlength="4"
            />
            <a 
                href={roomCode ? `/${roomCode}` : '#'}
                class="block bg-baby-pink-500 hover:bg-baby-pink-600 text-white font-friendly font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg {!roomCode ? 'opacity-50 cursor-not-allowed' : ''}"
                onclick={(e) => !roomCode && e.preventDefault()}
            >
                Join Game
            </a>
        </div>
        
        <div class="bg-sunshine-50 rounded-xl p-6 border-2 border-sunshine-200">
            <h2 class="text-2xl font-party text-sunshine-700 mb-4">🎭 Host a Game</h2>
            <p class="text-gray-600 font-friendly mb-4">Create a new game room</p>
            <a href="/host" class="block bg-baby-blue-500 hover:bg-baby-blue-600 text-white font-friendly font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg mt-auto">
                Create New Game
            </a>
        </div>
    </div>
</div>

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
</style>

