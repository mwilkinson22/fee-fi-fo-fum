module.exports = app => {
	require("./games")(app);
	require("./people")(app);
	require("./teams")(app);
};
