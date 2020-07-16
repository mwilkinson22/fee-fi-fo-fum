import Canvas from "./Canvas";
import mongoose from "mongoose";
import _ from "lodash";
import { localTeam } from "~/config/keys";
import sharp from "sharp";
const Team = mongoose.model("teams");

export default class GameSocialCardImage extends Canvas {
	constructor(game) {
		//Set Dimensions
		const cWidth = 1400;
		const cHeight = cWidth / 2;

		//Load In Fonts
		const fonts = [{ file: "Montserrat-Bold.ttf", family: "Montserrat" }];

		//Create Canvas
		super(cWidth, cHeight, { fonts });

		//Variables
		this.game = JSON.parse(JSON.stringify(game));

		//Constants
		const textStyles = {
			details: {
				size: Math.round(cHeight * 0.05),
				family: "Montserrat"
			},
			score: {
				size: Math.round(cHeight * 0.1),
				family: "Montserrat"
			}
		};
		this.setTextStyles(textStyles);
		this.colours.lightClaret = "#a53552";
	}

	async drawBackground() {
		const { cWidth, cHeight, game } = this;

		let src = "images/grounds/";
		if (game._ground && game._ground.image) {
			src += game._ground.image;
		} else {
			src += "pitch.jpg";
		}
		const sharpFiltering = img => sharp(img).blur(3);

		const backgroundImage = await this.googleToCanvas(src, sharpFiltering);

		this.cover(backgroundImage, 0, 0, cWidth, cHeight);
	}

	async getTeamInfo() {
		const { game } = this;
		const teams = await Team.find(
			{ _id: { $in: [localTeam, this.game._opposition._id] } },
			"images colours"
		);
		for (const team of teams) {
			team.badge = await this.googleToCanvas(
				`images/teams/${team.images.light || team.images.main}`
			);
		}
		const awayTeam = game.isAway ? localTeam : game._opposition._id;
		this.teams = _.sortBy(teams, t => t._id == awayTeam);
	}

	async drawTeamBanners() {
		const { ctx, game, teams, cHeight, cWidth, textStyles } = this;
		const bannerHeight = Math.round(cHeight * 0.2);
		const bannerTop = Math.round(cHeight * 0.2);
		const bannerTrimHeight = Math.round(bannerHeight * 0.15);
		const badgeWidth = Math.round(cWidth * 0.3);
		const gameLogoWidth = badgeWidth * 0.7;

		//Determine whether to show the score
		const showScores = game.status >= 2;
		let badgeOffset, scoreOffset, badgeHeight;
		if (showScores) {
			badgeHeight = Math.round(cHeight * 0.25);
			badgeOffset = Math.round(cWidth * 0.2);
			scoreOffset = Math.round(cWidth * 0.17);
		} else {
			badgeHeight = Math.round(cHeight * 0.35);
			badgeOffset = Math.round(cWidth * 0.15);
		}

		//Draw Shadow Banner
		ctx.shadowColor = "black";
		ctx.shadowBlur = cHeight * 0.03;
		ctx.fillRect(0, bannerTop, cWidth, bannerHeight);
		this.resetShadow();

		teams.map((team, i) => {
			//Draw Banner
			ctx.fillStyle = team.colours.main;
			ctx.fillRect(i === 0 ? 0 : cWidth * 0.5, bannerTop, cWidth * 0.5, bannerHeight);

			//Draw Trim
			ctx.fillStyle = team.colours.trim1;
			ctx.fillRect(
				i === 0 ? 0 : cWidth * 0.5,
				bannerTop + bannerHeight - bannerTrimHeight,
				cWidth * 0.5,
				bannerTrimHeight
			);

			//Add Score
			if (showScores) {
				ctx.textAlign = i === 0 ? "right" : "left";
				ctx.fillStyle = team.colours.text;
				ctx.font = textStyles.score.string;
				ctx.fillText(
					game.score[team._id],
					cWidth * 0.5 + (i === 0 ? 0 - scoreOffset : scoreOffset),
					(bannerHeight - bannerTrimHeight) / 2 + bannerTop + textStyles.score.size * 0.35
				);
			}

			//Add Badges
			ctx.shadowColor = "black";
			ctx.shadowBlur = cHeight * 0.03;
			this.contain(
				team.badge,
				cWidth * 0.5 + (i === 0 ? 0 - badgeOffset - badgeWidth : badgeOffset),
				bannerTop + bannerHeight / 2 - badgeHeight / 2,
				badgeWidth,
				badgeHeight
			);
			this.resetShadow();
		});

		//Add Game Logo
		let gameLogoSrc;
		if (game.images.customLogo) {
			gameLogoSrc = "images/games/logo/" + game.images.customLogo;
		} else if (game._competition.instance.image) {
			gameLogoSrc = "images/competitions/" + game._competition.instance.image;
		}
		if (gameLogoSrc) {
			const gameLogo = await this.googleToCanvas(gameLogoSrc);
			this.contain(
				gameLogo,
				cWidth * 0.5 - gameLogoWidth / 2,
				bannerTop + bannerHeight / 2 - badgeHeight / 2,
				gameLogoWidth,
				badgeHeight
			);
		}
	}

	async drawGameInfo() {
		const { ctx, game, cWidth, cHeight, textStyles } = this;

		const bannerTop = Math.round(cHeight * 0.6);
		const bannerHeight = Math.round(cHeight * 0.3);

		//Add Banner
		ctx.fillStyle = "#000000BB";
		ctx.fillRect(0, bannerTop, cWidth, bannerHeight);

		//Add Text
		ctx.fillStyle = "#EEEEEE";
		ctx.font = textStyles.details.string;

		//Work out whether or not to show the time
		const dateStringFormat = `${game.hasTime ? "HH:mm " : ""}dddd dS MMM yyyy`;
		const details = [new Date(game.date).toString(dateStringFormat), game.title];
		if (game._ground) {
			details.push(`${game._ground.name}, ${game._ground.address._city.name}`);
		} else {
			details.push("Venue TBD");
		}

		this.textBuilder(
			details.map(t => [{ text: t.toUpperCase() }]),
			cWidth / 2,
			bannerTop + bannerHeight / 2,
			{ lineHeight: 2.2 }
		);
	}

	async render() {
		await this.getTeamInfo();
		await this.drawBackground();
		await this.drawTeamBanners();
		await this.drawGameInfo();

		return this.outputFile("base64");
	}
}
