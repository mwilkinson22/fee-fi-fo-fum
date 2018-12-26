module.exports = app => {
	require("./gamesRoutes")(app);
	require("./peopleRoutes")(app);
	require("./teamsRoutes")(app);
};
