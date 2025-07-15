Project Plan: Baby Shower "Guess Dat Baby" Game


This document outlines the plan for creating a real-time, interactive web game for a baby shower, inspired by Jackbox Games.
1. Core Concept & Game Flow

The game allows players to guess which celebrity/friend couple corresponds to a series of AI-generated baby pictures. The game is managed by a host on a main screen, while players participate on their personal devices.

Game Flow:

    Setup (Host-Only): The host prepares the game by defining the list of couples and the correct baby-to-couple answers. The 10 baby images are also prepared.

    Game Creation (Host): The host navigates to the game's host URL. A new game room is automatically created with a unique, shareable code (e.g., ABCD).

    Player Join: Players navigate to the game's player URL on their phones, enter their name and the room code provided by the host. The host's screen updates in real-time to show who has joined the lobby.

    Guessing Phase: The host starts the game. The player's interface displays the 10 baby pictures, each with a dropdown list of the candidate couples. Players make their selections and submit their guesses. The host's screen shows which players have completed their submissions.

    Reveal Phase: Once all players are done, the host initiates the reveal. The host screen will cycle through each baby picture, one by one.

        For each baby, it will first show all the player guesses.

        Then, the host will click a "Reveal Answer" button to show the correct couple.

        Points are awarded automatically for correct guesses.

    Final Results: After all 10 babies have been revealed, a final leaderboard is displayed on the host's screen, declaring the winner(s).

2. Technology Stack

    Frontend Framework: Svelte 5 (via SvelteKit) for a modern, reactive, and high-performance user interface.

    Backend & Database: Supabase

        Database: Supabase's built-in Postgres database will store all game data.

        Realtime: Supabase Realtime will be used for instant communication between the host and players, eliminating the need for manual refreshing.

        Hosting: The final application will be deployed to Vercel, which offers a seamless deployment experience for SvelteKit projects.

3. Supabase Data Structure

We will need the following tables in your Supabase project. You will need to create these manually in the Supabase Table Editor.

Table: rooms

    id (uuid, primary key)

    code (text, unique) - The short, human-friendly room code.

    game_state (text) - Can be LOBBY, GUESSING, REVEAL, RESULTS.

    current_reveal_index (int4) - Tracks which baby is being revealed (0-9).

    created_at (timestamptz)

Table: players

    id (uuid, primary key)

    room_id (uuid, foreign key to rooms.id)

    name (text)

    score (int4, default: 0)

    submitted_guesses (bool, default: false)

Table: guesses

    id (uuid, primary key)

    player_id (uuid, foreign key to players.id)

    baby_index (int4) - The number of the baby (0-9).

    couple_name (text) - The name of the couple they guessed.

Important Note on Answers: For simplicity and security, the "correct answers" will not be stored in the database. They will be held in the host's browser-side code. This prevents tech-savvy players from querying the database to find the answers.
4. Image Hosting

You will need to host your 10 AI-generated baby pictures. The easiest way to do this is using Supabase Storage.

    Go to your Supabase project.

    Click on the "Storage" icon in the left sidebar.

    Create a new public bucket named baby-images.

    Inside this bucket, upload your 10 images. Name them sequentially: baby-0.png, baby-1.png, baby-2.png, and so on, up to baby-9.png.

This naming convention will make it very easy to reference them in the code.
