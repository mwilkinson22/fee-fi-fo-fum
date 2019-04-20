const _ = require("lodash");
const { localTeam } = require("../config/keys");
const { imagePath } = require("../client/extPaths");
const { createCanvas, loadImage, registerFont } = require("canvas");
const Colour = require("color");
const colours = {
	claret: "#751432",
	gold: "#FFCC00"
};

module.exports = async function(game, options) {
	//Register Fonts
	registerFont("./assets/fonts/Montserrat-Bold.ttf", { family: "Montserrat" });
	registerFont("./assets/fonts/TitilliumWeb-Bold.ttf", { family: "Titillium" });

	//Create Canvas
	const canvas = createCanvas(1400, 700);

	//Variables
	const positions = {
		bannerTop: 73,
		bannerHeight: 35,
		blockTop: 155,
		blockHeight: 500
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

	//Set Header Banner Text
	const ground = `${game._ground.name}, ${game._ground.address._city.name}`;
	const date = new Date(game.date).toString("ddd dS MMM - HH:mm");
	let hashtag = "#";
	if (game.hashtags && game.hashtags.length) {
		hashtag += game.hashtags[0];
	} else {
		hashtag +=
			game._competition.hashtagPrefix + teams[0].hashtagPrefix + teams[1].hashtagPrefix;
	}
	ctx.font = "20px Titillium";
	ctx.fillStyle = "#FFF";
	ctx.fillText(ground, canvas.width * 0.25, positions.bannerTop + positions.bannerHeight * 0.7);
	ctx.fillText(date, canvas.width * 0.5, positions.bannerTop + positions.bannerHeight * 0.7);
	ctx.fillText(hashtag, canvas.width * 0.75, positions.bannerTop + positions.bannerHeight * 0.7);

	//Team Blocks
	ctx.font = "22px Montserrat";
	_.each(teams, (team, i) => {
		//Background
		colours.main = Colour(team.colours.main).hex();
		colours.name = Colour(team.colours.text).hex();
		colours.number = Colour(team.colours.trim1).hex();
		ctx.fillStyle = colours.main;
		ctx.fillRect(
			i === 0 ? 0 : canvas.width / 2,
			positions.blockTop,
			canvas.width * 0.5,
			positions.blockHeight
		);

		//List
		let nameX, numX, nameAlign, numAlign;
		let y = 192;
		if (i === 0) {
			numAlign = "left";
			numX = 410;
			nameAlign = "right";
			nameX = 400;
		} else {
			numAlign = "right";
			numX = 990;
			nameAlign = "left";
			nameX = 1000;
		}
		ctx.fillStyle = ctx.fillStyle = Colour(team.colours.text).hex();
		const { squad } = _.find(game.pregameSquads, s => s._team == team._id);
		const numbers = _.find(
			team.squads,
			s => s.year == new Date(game.date).getFullYear() && s._teamType == game._teamType
		).players;

		_.chain(squad)
			.map(player => {
				let number;
				const squadEntry = _.find(numbers, p => p._player == player._id);
				if (squadEntry) {
					number = squadEntry.number;
				}
				return {
					...player,
					number
				};
			})
			.sortBy(p => p.number || 999)
			.each(({ name, number }) => {
				//Number
				ctx.fillStyle = colours.number;
				ctx.textAlign = numAlign;
				ctx.fillText(number, numX, y);
				//Name
				ctx.fillStyle = colours.name;
				ctx.textAlign = nameAlign;
				ctx.fillText(`${name.first} ${name.last}`.toUpperCase(), nameX, y);
				y += 24;
			})
			.value();
	});

	//Return image
	return canvas.toDataURL();
};
