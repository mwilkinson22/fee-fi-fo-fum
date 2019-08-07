module.exports = app => {
	require("./competitionRoutes")(app);
	require("./gamesRoutes")(app);
	require("./groundRoutes")(app);
	require("./locationRoutes")(app);
	require("./neutralGamesRoutes")(app);
	require("./peopleRoutes")(app);
	require("./seasonRoutes")(app);
	require("./sponsorRoutes")(app);
	require("./teamsRoutes")(app);
};
