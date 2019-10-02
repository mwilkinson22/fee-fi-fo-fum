import competitionRoutes from "./competitionRoutes";
import gamesRoutes from "./gamesRoutes";
import groundRoutes from "./groundRoutes";
import locationRoutes from "./locationRoutes";
import neutralGamesRoutes from "./neutralGamesRoutes";
import peopleRoutes from "./peopleRoutes";
import sponsorRoutes from "./sponsorRoutes";
import teamsRoutes from "./teamsRoutes";

export default app => {
	competitionRoutes(app);
	gamesRoutes(app);
	groundRoutes(app);
	locationRoutes(app);
	neutralGamesRoutes(app);
	peopleRoutes(app);
	sponsorRoutes(app);
	teamsRoutes(app);
};
