const { localTeam } = require("../config/keys");
const { imagePath } = require("../client/extPaths");
const { createCanvas, loadImage, registerFont } = require("canvas");
const colours = {
	claret: "#751432",
	gold: "#FFCC00"
};

module.exports = async function(game, options) {
	//Register Fonts
	registerFont("./assets/fonts/Montserrat-Bold.ttf", { family: "Montserrat" });

	//Create Canvas
	const canvas = createCanvas(1400, 700);

	//Variables
	const positions = {
		bannerTop: 73,
		bannerHeight: 35
	};
	let teams = [game.teams[localTeam], game.teams[game._opposition]];
	if (game.isAway) {
		teams = teams.reverse();
	}

	const ctx = canvas.getContext("2d");

	//Set Background
	ctx.fillStyle = "#EEE";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	//Set Header Banner
	ctx.fillStyle = colours.claret;
	ctx.fillRect(0, positions.bannerTop, canvas.width, positions.bannerHeight);

	//Set Header
	const header = `${teams[0].name.short.toUpperCase()} vs ${teams[1].name.short.toUpperCase()}`;
	ctx.font = "52px Montserrat";
	ctx.textAlign = "center";
	ctx.fillText(header, canvas.width * 0.5, positions.bannerTop);

	//Set Corner Icons
	if (game._competition.instance.image) {
		//
	}

	//Return image
	return canvas.toDataURL();
};
