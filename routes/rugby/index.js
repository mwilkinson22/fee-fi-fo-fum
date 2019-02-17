module.exports = app => {
	require("./gamesRoutes")(app);
	require("./peopleRoutes")(app);
	require("./seasonRoutes")(app);
	require("./teamsRoutes")(app);
};
