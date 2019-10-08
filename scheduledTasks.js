import schedule from "node-schedule";
import axios from "axios";
import { authGuid } from "~/config/keys";
//Helper Function
async function apiCall(path, successMessage) {
	const baseUrl =
		process.env.NODE_ENV == "development"
			? "http://localhost:3000/api/"
			: "https://www.feefifofum.co.uk/api/";
	let error;
	try {
		await axios.get(`${baseUrl}${path}?authGuid=${authGuid}`);
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
	await apiCall("neutralGames/crawlAndUpdate", "Neutral Games Updated");
});
