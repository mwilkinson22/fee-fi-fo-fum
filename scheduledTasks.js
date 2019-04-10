import schedule from "node-schedule";
import axios from "axios";

/*
 * Games
 */
//Sync Neutral Games every 10 minutes
schedule.scheduleJob("* /10 * * * *", function() {
	axios.get("/api/games/crawlAndUpdate/neutral");
});
