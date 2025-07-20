<script lang="ts">
	import type { Player } from '$lib/test/mockData'

	interface Props {
		players: Player[]
	}

	interface RankGroup {
		rank: number
		score: number
		players: Player[]
	}

	let { players }: Props = $props()

	// Group players by rank
	let rankGroups = $derived.by(() => {
		const sorted = [...players].sort((a, b) => b.score - a.score)
		const groups: RankGroup[] = []
		
		let currentRank = 1
		let i = 0
		
		while (i < sorted.length) {
			const currentScore = sorted[i].score
			const playersWithScore: Player[] = []
			
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

	// Get podium styles based on ranking
	function getPodiumStyles(rank: number) {
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
	}
</script>

<div class="max-w-4xl mx-auto">
	<h2 class="text-4xl font-party text-center mb-8 text-sunshine-700">🎊 Final Results! 🏆</h2>
	
	<div class="bg-white rounded-xl shadow-lg p-8 border-2 border-sunshine-200">
		<div class="space-y-6">
			{#each rankGroups as group}
				{@const styles = getPodiumStyles(group.rank)}
				<div class="p-6 rounded-xl {styles.background}">
					<div class="flex items-start justify-between gap-6">
						<div class="flex items-start gap-6 flex-1">
							<div class="text-3xl font-party {styles.textColor} flex-shrink-0">
								{styles.medal}
							</div>
							<div class="flex-1">
								<div class="flex flex-wrap gap-3 mb-2">
									{#each group.players as player}
										<span class="px-4 py-2 rounded-full text-base font-friendly font-semibold border-2 {styles.badgeColor} shadow-sm">
											{player.name}
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
			<h3 class="text-2xl font-party text-sunshine-700 mb-4">🎉 Congratulations to all players! 🎉</h3>
			<p class="text-lg font-friendly text-sunshine-600">
				Thank you for playing Guess Dat Baby! 👶✨
			</p>
		</div>
	{/if}
</div>