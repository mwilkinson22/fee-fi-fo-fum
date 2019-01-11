module.exports = app => {
	require("./gamesRoutes")(app);
	require("./peopleRoutes")(app);
	require("./statsRoutes")(app);
	require("./teamsRoutes")(app);
};
