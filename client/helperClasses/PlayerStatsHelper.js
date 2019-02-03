import _ from "lodash";
// import { reduxStore } from "../";

export default class PlayerStatsHelper {
	static getPlayerStatType(key) {
		if (!this.playerStatTypes) {
			// this.playerStatTypes = reduxStore.getState().stats.playerStatTypes;
		}

		return this.playerStatTypes[key];
	}
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
		const summedStats = {};

		_.chain(stats)
			.map(statGroup => _.keys(statGroup))
			.flatten()
			.uniq()
			.filter(key => key !== "_id")
			.forEach(key => {
				const total = _.sumBy(stats, key);
				const statType = this.getPlayerStatType(key);
				const gameCount = _.sumBy(stats, obj => {
					return obj.hasOwnProperty(key) ? 1 : 0;
				});
				const average = total / gameCount;
				let best = {};

				if (statType.moreIsBetter) {
					best = _.maxBy(stats, key)[key];
				} else {
					best = _.minBy(stats, key)[key];
				}

				summedStats[key] = {
					total,
					best,
					gameCount,
					average
				};
			})
			.value();

		const processedStats = this.processNestedStats(summedStats);

		return processedStats;
	}
}
