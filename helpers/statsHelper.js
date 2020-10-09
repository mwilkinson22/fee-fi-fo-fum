import _ from "lodash";
import playerStatTypes from "~/constants/playerStatTypes";

/**
 * Adds the "dynamic" additional stats that we don't store in the DB,
 * i.e. Average Gain, Tackle Success, Goals, Kicking Succcess and total Points
 *
 * @param { object } stats - A stat collection
 * @returns { object } stat collection with extra stats added
 */
export function calculateAdditionalStats(stats) {
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

/**
 * Outputs the stats in a user-friendly format
 *
 * @param { string } key - The stat key
 * @param { number } value - The stat value
 * @param { number } maxDecimals - How many decimal places to show
 * @returns { string }
 */
export function statToString(key, value, maxDecimals = 2) {
	if (value == null) {
		return "-";
	}

	const unit = playerStatTypes[key].unit || "";
	const decimalMultiplier = Math.pow(10, maxDecimals);

	return `${Math.round(value * decimalMultiplier) / decimalMultiplier}${unit}`;
}

/**
 * Takes an array of stat collections and returns the total, best, and average for each one.
 * We also return the game count for each stat, since it can vary (i.e. we may have tries)
 * for every game passed in, but be missing metres and tackles for cup games
 *
 * @param { Array } arrayOfStats - An array of stat collection objects
 */
export function getTotalsAndAverages(arrayOfStats) {
	//First, calculate which stats we need,
	//creating an array of stat keys
	const allFoundStatKeys = arrayOfStats
		.map(statCollection => {
			//For each stat object, ensure we have average gain, tackle success, etc
			const fullStatCollection = calculateAdditionalStats(statCollection);
			//Return the stat keys
			return Object.keys(fullStatCollection);
		})
		.flat();
	const statKeysToProcess = _.uniq(allFoundStatKeys).filter(key => playerStatTypes[key]);

	//Loop through these keys and get the aggregate values for each one
	//Return as a pair
	const summedStatsArray = statKeysToProcess.map(key => {
		//Get the stat type
		const statType = playerStatTypes[key];

		//Work out how many games have a value for this type
		const gameCount = _.sumBy(arrayOfStats, obj => {
			return obj.hasOwnProperty(key) && obj[key] != null ? 1 : 0;
		});

		//Work out the total, average and best across the collection
		let total, average, best;
		if (gameCount) {
			total = _.sumBy(arrayOfStats, key);
			average = total / gameCount;
			if (statType.moreIsBetter) {
				best = _.maxBy(arrayOfStats, key)[key];
			} else {
				best = _.minBy(arrayOfStats, key)[key];
			}
		}
		const result = {
			total,
			best,
			gameCount,
			average
		};
		return [key, result];
	});
	const summedStats = _.fromPairs(summedStatsArray);

	//At this stage, the "average" stats, (Kicking Rate, Average Gain, etc)
	//will be incorrect (they'll be averages of averages), so we recalculate them
	//and update both the average and total properties accordingly
	const summedStatTotals = _.mapValues(summedStats, stat => stat.total);
	const summedStatsWithFixedTotals = calculateAdditionalStats(summedStatTotals);
	for (const key in summedStats) {
		if (playerStatTypes[key].isAverage) {
			summedStats[key].total = summedStatsWithFixedTotals[key];
			summedStats[key].average = summedStatsWithFixedTotals[key];
		}
	}

	return summedStats;
}
