<script lang="ts">
	interface Props {
		players: any[]
		currentPlayer: any
	}

	interface RankGroup {
		rank: number
		score: number
		players: any[]
	}

	let { players, currentPlayer }: Props = $props()

	// Group players by rank
	let rankGroups = $derived.by(() => {
		const sorted = [...players].sort((a, b) => b.score - a.score)
		const groups: RankGroup[] = []
		
		let currentRank = 1
		let i = 0
		
		while (i < sorted.length) {
			const currentScore = sorted[i].score
			const playersWithScore: any[] = []
			
			// Collect all players with the same score
			while (i < sorted.length && sorted[i].score === currentScore) {
				playersWithScore.push(sorted[i])
				i++
			}
			
			groups.push({
				rank: currentRank,
				score: currentScore,
				players: playersWithScore
			})
			
			// Next rank should account for all players in this group
			currentRank += playersWithScore.length
		}
		
		return groups
	})

	// Find current player's rank group
	let currentPlayerRank = $derived(
		rankGroups.find(group => 
			group.players.some(player => player.id === currentPlayer.id)
		)?.rank || 0
	)

	// Get celebration message for current player
	let celebrationMessage = $derived(
		currentPlayerRank === 1 ? "🎉 You won! Amazing job! 🏆" :
		currentPlayerRank === 2 ? "🥈 Great job! Second place! 🎊" :
		currentPlayerRank === 3 ? "🥉 Awesome! Third place! 🎉" :
		"🎉 Thanks for playing! Great effort! 👶"
	)

	// Get rank suffix
	function getRankSuffix(rank: number): string {
		if (rank === 1) return '1st'
		if (rank === 2) return '2nd'
		if (rank === 3) return '3rd'
		return `${rank}th`
	}

	// Get podium styles based on ranking
	function getPodiumStyles(rank: number, isCurrentPlayer: boolean = false) {
		const baseStyles = (() => {
			switch (rank) {
				case 1:
					return {
						background: 'bg-sunshine-100 border-2 border-sunshine-400',
						medal: '🥇',
						textColor: 'text-sunshine-600',
						nameColor: 'text-sunshine-700',
						badgeColor: 'bg-sunshine-200 text-sunshine-800 border-sunshine-400'
					}
				case 2:
					return {
						background: 'bg-gray-100 border-2 border-gray-400',
						medal: '🥈',
						textColor: 'text-gray-600',
						nameColor: 'text-gray-700',
						badgeColor: 'bg-gray-200 text-gray-800 border-gray-400'
					}
				case 3:
					return {
						background: 'bg-orange-100 border-2 border-orange-400',
						medal: '🥉',
						textColor: 'text-orange-600',
						nameColor: 'text-gray-700',
						badgeColor: 'bg-orange-200 text-orange-800 border-orange-400'
					}
				default:
					return {
						background: 'bg-baby-pink-50 border-2 border-baby-pink-200',
						medal: `${rank}.`,
						textColor: 'text-baby-pink-600',
						nameColor: 'text-gray-700',
						badgeColor: 'bg-baby-pink-100 text-baby-pink-800 border-baby-pink-300'
					}
			}
		})()

		// Highlight current player's row
		if (isCurrentPlayer) {
			baseStyles.background = baseStyles.background.replace('border-2', 'border-4 ring-4 ring-blue-300')
		}

		return baseStyles
	}
</script>

<div class="max-w-4xl mx-auto">
	<h2 class="text-4xl font-party text-center mb-8 text-sunshine-700">🎊 Final Results! 🏆</h2>
	
	<!-- Current Player's Result Highlight -->
	<div class="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-8 text-center">
		<h3 class="text-2xl font-party text-blue-700 mb-2">Your Result</h3>
		<p class="text-xl font-friendly text-blue-600 mb-2">
			You finished in {getRankSuffix(currentPlayerRank)} place!
		</p>
		<p class="text-lg font-friendly text-blue-500">
			{celebrationMessage}
		</p>
		<div class="mt-4">
			<span class="text-3xl font-party text-blue-700">Your Score: {currentPlayer.score}</span>
		</div>
	</div>

	<div class="bg-white rounded-xl shadow-lg p-8 border-2 border-sunshine-200">
		<div class="space-y-6">
			{#each rankGroups as group}
				{@const isCurrentPlayerGroup = group.players.some(player => player.id === currentPlayer.id)}
				{@const styles = getPodiumStyles(group.rank, isCurrentPlayerGroup)}
				<div class="p-6 rounded-xl {styles.background}">
					<div class="flex items-start justify-between gap-6">
						<div class="flex items-start gap-6 flex-1">
							<div class="text-3xl font-party {styles.textColor} flex-shrink-0">
								{styles.medal}
							</div>
							<div class="flex-1">
								<div class="flex flex-wrap gap-3 mb-2">
									{#each group.players as player}
										<span class="px-4 py-2 rounded-full text-base font-friendly font-semibold border-2 {styles.badgeColor} shadow-sm {player.id === currentPlayer.id ? 'ring-2 ring-blue-400' : ''}">
											{player.id === currentPlayer.id ? '👤 ' : ''}{player.name}
										</span>
									{/each}
								</div>
								{#if group.rank === 1}
									<p class="text-sm font-friendly {styles.textColor} mt-2">
										🎉 {group.players.length > 1 ? 'Winners!' : 'Winner!'}
									</p>
								{/if}
							</div>
						</div>
						<div class="text-right flex-shrink-0">
							<p class="text-3xl font-party {styles.textColor}">{group.score}</p>
							<p class="text-sm font-friendly text-gray-500">points</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Celebration Message -->
	{#if rankGroups.length > 0}
		<div class="text-center mt-8 bg-sunshine-50 border-2 border-sunshine-300 rounded-xl p-6">
			<h3 class="text-2xl font-party text-sunshine-700 mb-4">🎉 Thanks for playing! 🎉</h3>
			<p class="text-lg font-friendly text-sunshine-600">
				Guess Dat Baby was a blast! 👶✨
			</p>
		</div>
	{/if}
</div>