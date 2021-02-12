import schedule from "node-schedule";
import axios from "axios";
import { authGuid, apiUrl } from "~/config/keys";

//Helper Function
async function apiCall(path, successMessage) {
	let error;
	try {
		await axios.get(`${apiUrl}${path}?authGuid=${authGuid}`);
	} catch (e) {
		error = e;
	}

	if (error) {
		console.error("Error", error);
	} else {
		console.info(successMessage);
	}
}

/*
 * Games
 */
//Sync Neutral Games every 15 minutes
schedule.scheduleJob("*/15 * * * *", async function() {
	await apiCall("neutralGames/crawl/update", "Neutral Games Updated");
});

//Update gamelist images every night
schedule.scheduleJob("0 0 * * *", async function() {
	await apiCall("games/gameListSocialCards", "Game List Social Cards Updated");
});
