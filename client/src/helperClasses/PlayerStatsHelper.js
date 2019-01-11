import _ from "lodash";

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
		stats.PT = T * 4 + G * 2 + DG;
		return stats;
	}

	static sumStats(stats) {
		const summedStats = {};
		_.chain(stats)
			.map(statGroup => _.keys(statGroup))
			.flatten()
			.uniq()
			.filter(key => key !== "_id")
			.forEach(key => {
				summedStats[key] = _.sumBy(stats, key);
			})
			.value();

		return this.processStats(summedStats);
	}
}
