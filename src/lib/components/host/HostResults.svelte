<script lang="ts">
	import type { Player } from '$lib/test/mockData'

	interface Props {
		players: Player[]
	}

	let { players }: Props = $props()

	// Sort players by score
	let sortedPlayers = $derived([...players].sort((a, b) => b.score - a.score))

	// Get podium styles based on ranking
	function getPodiumStyles(index: number) {
		switch (index) {
			case 0:
				return {
					background: 'bg-sunshine-100 border-2 border-sunshine-400',
					medal: '🥇',
					textColor: 'text-sunshine-600',
					nameColor: 'text-sunshine-700'
				}
			case 1:
				return {
					background: 'bg-gray-100 border-2 border-gray-400',
					medal: '🥈',
					textColor: 'text-gray-600',
					nameColor: 'text-gray-700'
				}
			case 2:
				return {
					background: 'bg-orange-100 border-2 border-orange-400',
					medal: '🥉',
					textColor: 'text-orange-600',
					nameColor: 'text-gray-700'
				}
			default:
				return {
					background: 'bg-baby-pink-50 border-2 border-baby-pink-200',
					medal: `${index + 1}.`,
					textColor: 'text-baby-pink-600',
					nameColor: 'text-gray-700'
				}
		}
	}
</script>

<div class="max-w-4xl mx-auto">
	<h2 class="text-4xl font-party text-center mb-8 text-sunshine-700">🎊 Final Results! 🏆</h2>
	
	<div class="bg-white rounded-xl shadow-lg p-8 border-2 border-sunshine-200">
		<div class="space-y-6">
			{#each sortedPlayers as player, index}
				{@const styles = getPodiumStyles(index)}
				<div class="flex items-center justify-between p-6 rounded-xl {styles.background}">
					<div class="flex items-center gap-6">
						<div class="text-3xl font-party {styles.textColor}">
							{styles.medal}
						</div>
						<div>
							<p class="text-xl font-friendly font-semibold {styles.nameColor}">{player.name}</p>
							{#if index === 0}
								<p class="text-sm font-friendly text-sunshine-600">🎉 Winner!</p>
							{/if}
						</div>
					</div>
					<div class="text-right">
						<p class="text-3xl font-party {styles.textColor}">{player.score}</p>
						<p class="text-sm font-friendly text-gray-500">points</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Celebration Message -->
	{#if sortedPlayers.length > 0}
		<div class="text-center mt-8 bg-sunshine-50 border-2 border-sunshine-300 rounded-xl p-6">
			<h3 class="text-2xl font-party text-sunshine-700 mb-4">🎉 Congratulations to all players! 🎉</h3>
			<p class="text-lg font-friendly text-sunshine-600">
				Thank you for playing Guess Dat Baby! 👶✨
			</p>
		</div>
	{/if}
</div>