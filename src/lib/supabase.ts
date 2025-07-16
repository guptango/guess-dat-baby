import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          code: string
          game_state: 'LOBBY' | 'GUESSING' | 'REVEAL' | 'RESULTS'
          current_reveal_index: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          game_state?: 'LOBBY' | 'GUESSING' | 'REVEAL' | 'RESULTS'
          current_reveal_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          game_state?: 'LOBBY' | 'GUESSING' | 'REVEAL' | 'RESULTS'
          current_reveal_index?: number
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          room_id: string
          name: string
          score: number
          submitted_guesses: boolean
        }
        Insert: {
          id?: string
          room_id: string
          name: string
          score?: number
          submitted_guesses?: boolean
        }
        Update: {
          id?: string
          room_id?: string
          name?: string
          score?: number
          submitted_guesses?: boolean
        }
      }
      guesses: {
        Row: {
          id: string
          player_id: string
          baby_index: number
          couple_name: string
        }
        Insert: {
          id?: string
          player_id: string
          baby_index: number
          couple_name: string
        }
        Update: {
          id?: string
          player_id?: string
          baby_index?: number
          couple_name?: string
        }
      }
    }
  }
}

export const GAME_STATES = {
  LOBBY: 'LOBBY' as const,
  GUESSING: 'GUESSING' as const,
  REVEAL: 'REVEAL' as const,
  RESULTS: 'RESULTS' as const
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function createRoom() {
  const code = generateRoomCode()
  const { data, error } = await supabase
    .from('rooms')
    .insert([
      { 
        code,
        game_state: GAME_STATES.LOBBY,
        current_reveal_index: 0
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating room:', error)
    return null
  }

  return data
}

export async function joinRoom(roomCode: string, playerName: string) {
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id')
    .eq('code', roomCode.toUpperCase())
    .single()

  if (roomError || !room) {
    console.error('Room not found:', roomError)
    return null
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert([
      {
        room_id: room.id,
        name: playerName,
        score: 0,
        submitted_guesses: false
      }
    ])
    .select()
    .single()

  if (playerError) {
    console.error('Error joining room:', playerError)
    return null
  }

  return { room, player }
}

export async function submitGuesses(playerId: string, guesses: Array<{babyIndex: number, coupleName: string}>) {
  const guessInserts = guesses.map(guess => ({
    player_id: playerId,
    baby_index: guess.babyIndex,
    couple_name: guess.coupleName
  }))

  const { error: guessError } = await supabase
    .from('guesses')
    .insert(guessInserts)

  if (guessError) {
    console.error('Error submitting guesses:', guessError)
    return false
  }

  const { error: playerError } = await supabase
    .from('players')
    .update({ submitted_guesses: true })
    .eq('id', playerId)

  if (playerError) {
    console.error('Error updating player:', playerError)
    return false
  }

  return true
}

export async function updateGameState(roomId: string, gameState: string, revealIndex: number | null = null) {
  const updateData: any = { game_state: gameState }
  if (revealIndex !== null) {
    updateData.current_reveal_index = revealIndex
  }

  const { error } = await supabase
    .from('rooms')
    .update(updateData)
    .eq('id', roomId)

  if (error) {
    console.error('Error updating game state:', error)
    return false
  }

  return true
}

export async function getPlayersInRoom(roomId: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId)

  if (error) {
    console.error('Error getting players:', error)
    return []
  }

  return data
}

export async function getGuessesForReveal(roomId: string, babyIndex: number) {
  // First get the player IDs for this room
  const { data: playerIds, error: playerError } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', roomId)

  if (playerError) {
    console.error('Error getting player IDs:', playerError)
    return []
  }

  if (!playerIds || playerIds.length === 0) {
    return []
  }

  // Then get the guesses for these players and this baby
  const { data, error } = await supabase
    .from('guesses')
    .select(`
      *,
      players (name)
    `)
    .eq('baby_index', babyIndex)
    .in('player_id', playerIds.map(p => p.id))

  if (error) {
    console.error('Error getting guesses:', error)
    return []
  }

  return data || []
}

export async function calculateAndUpdateScores(roomId: string, babyIndex: number, correctAnswer: string) {
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, score')
    .eq('room_id', roomId)

  if (playersError) {
    console.error('Error getting players for scoring:', playersError)
    return false
  }

  const { data: guesses, error: guessesError } = await supabase
    .from('guesses')
    .select('player_id, couple_name')
    .eq('baby_index', babyIndex)
    .in('player_id', players.map(p => p.id))

  if (guessesError) {
    console.error('Error getting guesses for scoring:', guessesError)
    return false
  }

  const scoreUpdates = []
  for (const player of players) {
    const guess = guesses.find(g => g.player_id === player.id)
    if (guess && guess.couple_name === correctAnswer) {
      scoreUpdates.push({
        id: player.id,
        score: player.score + 1
      })
    }
  }

  if (scoreUpdates.length > 0) {
    const { error: updateError } = await supabase
      .from('players')
      .upsert(scoreUpdates)

    if (updateError) {
      console.error('Error updating scores:', updateError)
      return false
    }
  }

  return true
}