module.exports = app => {
	require("./city")(app);
	require("./competition")(app);
	require("./country")(app);
	require("./games")(app);
	require("./ground")(app);
	require("./neutralGames")(app);
	require("./people")(app);
	require("./team")(app);
};
