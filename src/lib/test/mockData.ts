// Mock data for testing components

export const GAME_STATES = {
	LOBBY: 'LOBBY',
	GUESSING: 'GUESSING', 
	REVEAL: 'REVEAL',
	RESULTS: 'RESULTS'
} as const

export type GameState = typeof GAME_STATES[keyof typeof GAME_STATES]

// Types
export interface Player {
	id: string
	name: string
	score: number
	submitted_guesses: boolean
	room_id: string
}

export interface Room {
	id: string
	code: string
	game_state: GameState
	current_reveal_index: number
	created_at: string
}

export interface Guess {
	id: string
	player_id: string
	baby_index: number
	couple_name: string
	players: { name: string }
}

export interface GameStateData {
	room: Room
	players: Player[]
	gameState: GameState
	currentRevealIndex: number
	currentGuesses?: Guess[]
	showingAnswer?: boolean
}

export interface CurrentMatch {
	id: string
	mom: string
	dad: string
}

// Mock players with different states
export const mockPlayers: Player[] = [
	{ 
		id: '1', 
		name: 'Alice Johnson', 
		score: 8, 
		submitted_guesses: true,
		room_id: 'test-room'
	},
	{ 
		id: '2', 
		name: 'Bob Smith', 
		score: 6, 
		submitted_guesses: true,
		room_id: 'test-room'
	},
	{ 
		id: '3', 
		name: 'Charlie Brown', 
		score: 4, 
		submitted_guesses: false,
		room_id: 'test-room'
	},
	{ 
		id: '4', 
		name: 'Diana Ross', 
		score: 9, 
		submitted_guesses: true,
		room_id: 'test-room'
	},
	{ 
		id: '5', 
		name: 'Eddie Murphy', 
		score: 2, 
		submitted_guesses: false,
		room_id: 'test-room'
	}
]

// Mock room data
export const mockRoom: Room = {
	id: 'test-room-id',
	code: 'TEST',
	game_state: GAME_STATES.LOBBY,
	current_reveal_index: 0,
	created_at: new Date().toISOString()
}

// Mock guesses for reveal phase
export const mockGuesses: Guess[] = [
	// Baby 0 guesses
	{
		id: '1',
		player_id: '1',
		baby_index: 0,
		couple_name: 'Mommy & Benedict Cumberbatch',
		players: { name: 'Alice Johnson' }
	},
	{
		id: '2', 
		player_id: '2',
		baby_index: 0,
		couple_name: 'Daddy & Zendaya',
		players: { name: 'Bob Smith' }
	},
	{
		id: '3',
		player_id: '4',
		baby_index: 0,
		couple_name: 'Mommy & Benedict Cumberbatch',
		players: { name: 'Diana Ross' }
	},
	{
		id: '4',
		player_id: '3',
		baby_index: 0,
		couple_name: 'Daddy & Halle Berry',
		players: { name: 'Charlie Brown' }
	},
	
	// Baby 4 guesses (for revealMidway scenario)
	{
		id: '5',
		player_id: '1',
		baby_index: 4,
		couple_name: 'Mommy & Benedict Cumberbatch', // Correct answer
		players: { name: 'Alice Johnson' }
	},
	{
		id: '6',
		player_id: '2',
		baby_index: 4,
		couple_name: 'Daddy & Zendaya', // Wrong answer
		players: { name: 'Bob Smith' }
	},
	{
		id: '7',
		player_id: '3',
		baby_index: 4,
		couple_name: 'Mommy & Owen Wilson', // Wrong answer
		players: { name: 'Charlie Brown' }
	},
	{
		id: '8',
		player_id: '4',
		baby_index: 4,
		couple_name: 'Mommy & Benedict Cumberbatch', // Correct answer
		players: { name: 'Diana Ross' }
	},
	{
		id: '9',
		player_id: '5',
		baby_index: 4,
		couple_name: 'Daddy & Halle Berry', // Wrong answer
		players: { name: 'Eddie Murphy' }
	}
]

// Mock game state scenarios
export const mockGameStates: Record<string, GameStateData> = {
	emptyLobby: {
		room: { ...mockRoom, game_state: GAME_STATES.LOBBY },
		players: [],
		gameState: GAME_STATES.LOBBY,
		currentRevealIndex: 0
	},
	
	lobby: {
		room: { ...mockRoom, game_state: GAME_STATES.LOBBY },
		players: mockPlayers.slice(0, 3),
		gameState: GAME_STATES.LOBBY,
		currentRevealIndex: 0
	},
	
	fullLobby: {
		room: { ...mockRoom, game_state: GAME_STATES.LOBBY },
		players: mockPlayers,
		gameState: GAME_STATES.LOBBY,
		currentRevealIndex: 0
	},
	
	guessing: {
		room: { ...mockRoom, game_state: GAME_STATES.GUESSING },
		players: mockPlayers.map(p => ({ ...p, submitted_guesses: false })),
		gameState: GAME_STATES.GUESSING,
		currentRevealIndex: 0
	},
	
	guessingPartial: {
		room: { ...mockRoom, game_state: GAME_STATES.GUESSING },
		players: mockPlayers,
		gameState: GAME_STATES.GUESSING,
		currentRevealIndex: 0
	},
	
	guessingComplete: {
		room: { ...mockRoom, game_state: GAME_STATES.GUESSING },
		players: mockPlayers.map(p => ({ ...p, submitted_guesses: true })),
		gameState: GAME_STATES.GUESSING,
		currentRevealIndex: 0
	},
	
	revealStart: {
		room: { ...mockRoom, game_state: GAME_STATES.REVEAL, current_reveal_index: 0 },
		players: mockPlayers.map(p => ({ ...p, submitted_guesses: true })),
		gameState: GAME_STATES.REVEAL,
		currentRevealIndex: 0,
		currentGuesses: mockGuesses.filter(g => g.baby_index === 0),
		showingAnswer: false
	},
	
	revealMidway: {
		room: { ...mockRoom, game_state: GAME_STATES.REVEAL, current_reveal_index: 4 },
		players: mockPlayers.map(p => ({ ...p, submitted_guesses: true })),
		gameState: GAME_STATES.REVEAL,
		currentRevealIndex: 4,
		currentGuesses: mockGuesses.filter(g => g.baby_index === 4),
		showingAnswer: true
	},
	
	results: {
		room: { ...mockRoom, game_state: GAME_STATES.RESULTS },
		players: mockPlayers.map(p => ({ ...p, submitted_guesses: true })).sort((a, b) => b.score - a.score),
		gameState: GAME_STATES.RESULTS,
		currentRevealIndex: 9
	}
}

// Mock current matches for player testing
export const mockCurrentMatches: Record<string, CurrentMatch> = {
	'baby-1': {
		id: 'combo-1',
		mom: 'Mommy',
		dad: 'Benedict Cumberbatch'
	},
	'baby-3': {
		id: 'combo-8',
		mom: 'Daddy', 
		dad: 'Zendaya'
	}
}

// Utility functions for testing
export const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
	id: `player-${Date.now()}`,
	name: 'Test Player',
	score: 0,
	submitted_guesses: false,
	room_id: 'test-room',
	...overrides
})

export const createMockRoom = (overrides: Partial<Room> = {}): Room => ({
	id: 'test-room-id',
	code: 'TEST',
	game_state: GAME_STATES.LOBBY,
	current_reveal_index: 0,
	created_at: new Date().toISOString(),
	...overrides
})

export const createMockGuess = (overrides: Partial<Guess> = {}): Guess => ({
	id: `guess-${Date.now()}`,
	player_id: '1',
	baby_index: 0,
	couple_name: 'Mommy & Benedict Cumberbatch',
	players: { name: 'Test Player' },
	...overrides
})
