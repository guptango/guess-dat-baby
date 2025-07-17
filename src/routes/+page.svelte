<script>
    import { onMount } from 'svelte'
    
    onMount(() => {
        // Redirect to host page for now
        window.location.href = '/host'
    })
</script>

<div class="game-container">
    <h1 class="text-4xl font-party text-baby-blue-700 mb-4">🍼 Guess Dat Baby! 👶</h1>
    <p class="text-baby-pink-600 font-friendly mb-6">Redirecting to host page...</p>
    
    <div class="text-center">
        <a href="/host" class="bg-baby-blue-500 hover:bg-baby-blue-600 text-white font-friendly font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
            Go to Host Page
        </a>
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

