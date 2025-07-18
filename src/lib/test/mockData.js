// Mock data for testing components

export const GAME_STATES = {
	LOBBY: 'LOBBY',
	GUESSING: 'GUESSING', 
	REVEAL: 'REVEAL',
	RESULTS: 'RESULTS'
}

// Mock players with different states
export const mockPlayers = [
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
export const mockRoom = {
	id: 'test-room-id',
	code: 'TEST',
	game_state: GAME_STATES.LOBBY,
	current_reveal_index: 0,
	created_at: new Date().toISOString()
}

// Mock guesses for reveal phase
export const mockGuesses = [
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
		player_id: '1',
		baby_index: 1,
		couple_name: 'Daddy & Halle Berry',
		players: { name: 'Alice Johnson' }
	}
]

// Mock game state scenarios
export const mockGameStates = {
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
export const mockCurrentMatches = {
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
export const createMockPlayer = (overrides = {}) => ({
	id: `player-${Date.now()}`,
	name: 'Test Player',
	score: 0,
	submitted_guesses: false,
	room_id: 'test-room',
	...overrides
})

export const createMockRoom = (overrides = {}) => ({
	id: 'test-room-id',
	code: 'TEST',
	game_state: GAME_STATES.LOBBY,
	current_reveal_index: 0,
	created_at: new Date().toISOString(),
	...overrides
})

export const createMockGuess = (overrides = {}) => ({
	id: `guess-${Date.now()}`,
	player_id: '1',
	baby_index: 0,
	couple_name: 'Mommy & Benedict Cumberbatch',
	players: { name: 'Test Player' },
	...overrides
})