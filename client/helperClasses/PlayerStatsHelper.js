import _ from "lodash";
import playerStatTypes from "../../constants/playerStatTypes";

export default class PlayerStatsHelper {
	static processStats(stats) {
		const { T, CN, PK, DG, MG, TK, MI, M, C } = stats;
		//Average Gain
		if (M + C > 0) stats.AG = Number((M / C).toFixed(2));

		//Tackle Success
		if (TK + MI > 0) stats.TS = Number(((TK / (TK + MI)) * 100).toFixed(2));

		//Goals
		const G = PK + CN;
		stats.G = G;

		//Kicking Success
		if (G + MG > 0) stats.KS = Number(((G / (G + MG)) * 100).toFixed(2));

		//Points
		stats.PT = T * 4 + CN * 2 + PK * 2 + DG;
		return stats;
	}

	static processNestedStats(stats) {
		const processedStats = this.processStats(_.mapValues(stats, stat => stat.total));
		return _.mapValues(stats, (stat, key) => {
			const total = processedStats[key];
			return { ...stat, total };
		});
	}

	static sumStats(stats) {
		const summedStats = _.chain(stats)
			.map(PlayerStatsHelper.processStats)
			.map(statGroup => _.keys(statGroup))
			.flatten()
			.uniq()
			.filter(key => playerStatTypes[key] !== undefined)
			.map(key => {
				const statType = playerStatTypes[key];
				const gameCount = _.sumBy(stats, obj => {
					return obj.hasOwnProperty(key) && obj[key] != null ? 1 : 0;
				});
				let total, average, best;
				if (gameCount) {
					total = _.sumBy(stats, key);
					average = total / gameCount;
					if (statType.moreIsBetter) {
						best = _.maxBy(stats, key)[key];
					} else {
						best = _.minBy(stats, key)[key];
					}
				}
				const result = {
					total,
					best,
					gameCount,
					average
				};
				return [key, result];
			})
			.fromPairs()
			.value();

		const processedStats = this.processNestedStats(summedStats);

		//The "average" stats (Kicking Rate, Average Gain, etc) are
		//incorrectly handled, and are an average of the averages.
		//To remedy this, we loop through and set the average to equal
		//the totals, which is already the correct value
		return _.mapValues(processedStats, (values, key) => {
			const stat = playerStatTypes[key];
			if (stat.isAverage) {
				return {
					...values,
					average: values.total
				};
			} else {
				return values;
			}
		});
	}

	static toString(key, value, maxDecimals = 2) {
		if (value == null) {
			return "-";
		}

		const unit = playerStatTypes[key].unit || "";
		const decimalMultiplier = Math.pow(10, maxDecimals);

		return `${Math.round(value * decimalMultiplier) / decimalMultiplier}${unit}`;
	}
}
