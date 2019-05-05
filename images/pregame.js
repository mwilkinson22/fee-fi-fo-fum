const _ = require("lodash");
const { localTeam } = require("../config/keys");
const { createCanvas, registerFont } = require("canvas");
const { contain, googleToCanvas } = require("~/helpers/imageHelper");
const Colour = require("color");
const colours = {
	claret: "#751432",
	gold: "#FFCC00"
};

module.exports = async function(game, { playerForImage, playersForHighlight } = {}) {
	//Register Fonts
	registerFont("./assets/fonts/Montserrat-Bold.ttf", { family: "Montserrat" });
	registerFont("./assets/fonts/TitilliumWeb-Bold.ttf", { family: "Titillium" });

	//Create Canvas
	const canvasWidth = 1400;
	const canvas = createCanvas(canvasWidth, canvasWidth * 0.5);

	//Variables
	const positions = {
		bannerTop: Math.round(canvas.height * 0.11),
		bannerHeight: Math.round(canvas.height * 0.05),
		bannerText: Math.round(canvas.height * 0.144),
		blockTop: Math.round(canvas.height * 0.22),
		blockHeight: Math.round(canvas.height * 0.71),
		badgeWidth: Math.round(canvas.width * 0.2),
		badgeHeight: Math.round(canvas.height * 0.4),
		badgeCutoff: 0.15
	};
	const fonts = {
		header: `${Math.round(canvas.height * 0.07)}px Montserrat`,
		banner: `${Math.round(canvas.height * 0.025)}px Titillium`,
		players: `${Math.round(canvas.height * 0.035)}px Montserrat`
	};
	let teams = [game.teams[localTeam], game.teams[game._opposition]];
	if (game.isAway) {
		teams = teams.reverse();
	}

	//Get Badges
	for (const i in teams) {
		if (teams[i].image) {
			teams[i].badge = await googleToCanvas("images/teams/" + teams[i].image);
		}
	}

	const ctx = canvas.getContext("2d");

	ctx.patternQuality = "best";
	ctx.quality = "best";
	ctx.antialias = "subpixel";

	//Set Background
	ctx.fillStyle = "#EEE";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	//Set Header Banner
	ctx.fillStyle = colours.claret;
	ctx.fillRect(0, positions.bannerTop, canvas.width, positions.bannerHeight);

	//Set Header
	const header = `${teams[0].name.short.toUpperCase()} vs ${teams[1].name.short.toUpperCase()}`;
	ctx.font = fonts.header;
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
	ctx.font = fonts.banner;
	ctx.fillStyle = "#FFF";
	ctx.fillText(ground, canvas.width * 0.25, positions.bannerText);
	ctx.fillText(date, canvas.width * 0.5, positions.bannerText);
	ctx.fillText(hashtag, canvas.width * 0.75, positions.bannerText);

	//Get Team Images

	//Team Blocks
	ctx.font = fonts.players;
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

		//Badges
		if (team.badge) {
			ctx.globalAlpha = 0.5;

			const sx = i === 0 ? 0 : team.badge.width * positions.badgeCutoff;
			const sy = 0;
			const sWidth = team.badge.width * (1 - positions.badgeCutoff);
			const sHeight = team.badge.height;

			const { width, height, offsetX } = contain(
				positions.badgeWidth,
				positions.badgeHeight,
				sWidth,
				sHeight
			);

			const dx = i === 0 ? canvasWidth * 0.5 - width : canvas.width * 0.5;
			const dy = canvas.height * 0.25;
			const dWidth = width;
			const dHeight = height;

			ctx.drawImage(team.badge, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
			ctx.globalAlpha = 1;
		}

		//Players
		let nameX, numX, nameAlign, numAlign;
		let y = Math.round(canvas.height * 0.28);
		if (i === 0) {
			numAlign = "left";
			numX = Math.round(canvas.width * 0.29);
			nameAlign = "right";
			nameX = Math.round(canvas.width * 0.28);
		} else {
			numAlign = "right";
			numX = Math.round(canvas.width * 0.71);
			nameAlign = "left";
			nameX = Math.round(canvas.width * 0.72);
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
			.each(({ name, number, _id }) => {
				//Number
				ctx.fillStyle = colours.number;
				ctx.textAlign = numAlign;
				ctx.fillText(number || "", numX, y);

				//Name
				ctx.fillStyle =
					playersForHighlight.indexOf(_id) > -1 ? colours.number : colours.name;
				ctx.textAlign = nameAlign;
				ctx.fillText(`${name.first} ${name.last}`.toUpperCase(), nameX, y);
				y += Math.round(canvas.height * 0.034);
			})
			.value();

		//Get Player Image
		if (team._id == localTeam) {
			const { squad } = _.find(game.pregameSquads, s => s._team == localTeam);
			const squadWithImages = _.filter(squad, s => s.image);
			playerForImage =
				_.find(squadWithImages, p => p._id == playerForImage) || _.sample(squadWithImages);
		}
	});

	//Add Player Image
	if (playerForImage) {
		const playerImage = await googleToCanvas("images/people/full/" + playerForImage.image);
		const { width, height } = contain(
			canvas.width * 0.4,
			canvas.height * 0.82,
			playerImage.width,
			playerImage.height
		);
		ctx.drawImage(
			playerImage,
			canvas.width * 0.5 - width * 0.5,
			canvas.height - height,
			width,
			height
		);
	}

	// const client = require("~/services/twitter");
	// const upload = await client.post("media/upload", {
	// 	media_data: canvas.toDataURL().split("base64,")[1]
	// });
	// const { media_id_string } = upload.data;
	// const a = await client.post("statuses/update", {
	// 	status: `Width: ${canvasWidth}`,
	// 	media_ids: [media_id_string]
	// });

	//Return image
	return canvas.toDataURL();
};
