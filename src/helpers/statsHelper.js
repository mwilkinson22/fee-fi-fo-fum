import _ from "lodash";
import playerStatTypes from "~/constants/playerStatTypes";
import { calculatePoints } from "~/helpers/gameHelper";

/**
 * Adds the "dynamic" additional stats that we don't store in the DB,
 * i.e. Average Gain, Tackle Success, Goals, Kicking Success and total Points
 *
 * @param { object } stats - A stat collection
 * @param { Number } year - The year of the game
 * @returns { object } stat collection with extra stats added
 */
export function calculateAdditionalStats(stats, year) {
	const { T, CN, PK, DG, MG, TK, MI, M, C } = stats;

	//Average Gain
	if (M + C > 0) stats.AG = Number((M / C).toFixed(2));

	//Tackle Success
	if (TK + MI > 0) stats.TS = Number(((TK / (TK + MI)) * 100).toFixed(2));

	//Goals
	let G = null;
	if (PK != null || CN != null) {
		G = PK + CN;
		stats.G = G;
	}

	//Kicking Success
	if (G + MG > 0) stats.KS = Number(((G / (G + MG)) * 100).toFixed(2));

	//Points
	stats.PT = calculatePoints(year, T, CN, PK, DG);
	return stats;
}

/**
 * Outputs the stats in a user-friendly format
 *
 * @param { string | object } keyOrObject - The stat key or a stat object
 * @param { number } value - The stat value
 * @param { number } maxDecimals - How many decimal places to show
 * @returns { string }
 */
export function statToString(keyOrObject, value, maxDecimals = 2) {
	if (value == null) {
		return "-";
	}

	const statObject = resolveStatObject(keyOrObject);
	const unit = statObject && statObject.unit ? statObject.unit : "";
	const decimalMultiplier = Math.pow(10, maxDecimals);

	return `${Math.round(value * decimalMultiplier) / decimalMultiplier}${unit}`;
}

/**
 * Allows us to pass in either a stat key or an object
 * that represents a custom stat type, and returns the key, a statObject
 * and an isCustomStat bool
 * @param { string | object } keyOrStatObject
 * @param { Array } customStatTypes
 */
export function resolveStatObject(keyOrStatObject, customStatTypes = []) {
	//Set defaults
	const statObject = {
		moreIsBetter: true,
		unit: null,
		isAverage: false
	};

	if (typeof keyOrStatObject === "string") {
		//If the param is a string, then we first look for customStatTypes
		let statType = customStatTypes.find(({ key }) => key == keyOrStatObject);

		//Otherwise, we check the constants file
		if (!statType) {
			statType = playerStatTypes[keyOrStatObject];
		}

		//If nothing is found, quit
		if (!statType) {
			return null;
		}

		Object.assign(statObject, playerStatTypes[keyOrStatObject]);
		statObject.key = keyOrStatObject;
	} else {
		//Otherwise the param should be an object, so we just use that
		Object.assign(statObject, keyOrStatObject);
	}

	return statObject;
}

/**
 * Takes an array of stat collections and returns the total, best, and average for each one.
 * We also return the game count for each stat, since it can vary (i.e. we may have tries)
 * for every game passed in, but be missing metres and tackles for cup games
 *
 * @param { Array } arrayOfStats - An array of stat collection objects
 * @param { Number } year - The year to calculate the points totals.
 * @param { Array } customStatTypes
 */
export function getTotalsAndAverages(arrayOfStats, year, customStatTypes = []) {
	//First, calculate which stats we need,
	//creating an array of stat keys
	const allFoundStatKeys = _.flatten(
		arrayOfStats.map(statCollection => {
			//For each stat object, ensure we have average gain, tackle success, etc
			const fullStatCollection = calculateAdditionalStats(statCollection, year);
			//Return the stat keys
			return Object.keys(fullStatCollection);
		})
	);
	const statKeysToProcess = _.uniq(allFoundStatKeys).filter(key => resolveStatObject(key, customStatTypes));

	//Loop through these keys and get the aggregate values for each one
	//Return as a pair
	const summedStatsArray = statKeysToProcess.map(keyOrStatObject => {
		//Get the stat type
		const { key, ...statObject } = resolveStatObject(keyOrStatObject, customStatTypes);

		//Work out how many games have a value for this type
		const gameCount = _.sumBy(arrayOfStats, obj => {
			return obj.hasOwnProperty(key) && obj[key] != null ? 1 : 0;
		});

		//Work out the total, average and best across the collection
		let total, average, best;
		if (gameCount) {
			total = _.sumBy(arrayOfStats, key);
			average = total / gameCount;
			if (statObject.moreIsBetter) {
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
	const summedStatsWithFixedTotals = calculateAdditionalStats(summedStatTotals, year);
	for (const key in summedStats) {
		const statObject = resolveStatObject(key, customStatTypes);
		if (statObject && statObject.isAverage) {
			summedStats[key].total = summedStatsWithFixedTotals[key];
			summedStats[key].average = summedStatsWithFixedTotals[key];
		}
	}

	return summedStats;
}
