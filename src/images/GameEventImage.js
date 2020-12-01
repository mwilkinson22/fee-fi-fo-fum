import _ from "lodash";
import Canvas from "./Canvas";
import mongoose from "mongoose";
const Team = mongoose.model("teams");
const Settings = mongoose.model("settings");
import { localTeam } from "~/config/keys";

export default class GameEventImage extends Canvas {
	constructor(game, event) {
		//Set Dimensions
		const cWidth = 1200;
		const cHeight = cWidth * 0.5;

		//Load In Fonts
		const fonts = [
			{ file: "Montserrat-Bold.ttf", family: "Montserrat" },
			{ file: "Monstro.ttf", family: "Monstro" }
		];

		//Create Canvas
		super(cWidth, cHeight, { fonts });

		//Constants
		const textStyles = {
			event: {
				size: Math.round(cHeight * 0.23),
				family: "Monstro"
			},
			score: {
				size: Math.round(cHeight * 0.15),
				family: "Montserrat"
			},
			hashtag: {
				size: Math.round(cHeight * 0.05),
				family: "Montserrat"
			}
		};
		this.setTextStyles(textStyles);
		this.colours.lightClaret = "#a53552";

		//Variables
		this.game = JSON.parse(JSON.stringify(game));
		this.event = event;
	}

	async getBranding() {
		const settings = await Settings.findOne({
			name: "site_logo"
		}).lean();
		this.branding = { site_logo: settings.value };
	}

	async drawBackground() {
		const { ctx, cWidth, cHeight } = this;
		const backgroundImage = await this.googleToCanvas(
			"images/layout/canvas/blank-claret-banner.jpg"
		);
		ctx.drawImage(backgroundImage, 0, 0, cWidth, cHeight);
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
		const bannerHeight = Math.round(cHeight * 0.25);
		const bannerTop = Math.round((cHeight - bannerHeight) * 0.7);
		const scoreOffset = Math.round(cHeight * 0.05);
		const badgeOffset = Math.round(cWidth * 0.12);
		const badgeWidth = Math.round(cWidth * 0.3);
		const badgeHeight = Math.round(cHeight * 0.4);

		//Draw Shadow Banner
		ctx.shadowColor = "black";
		ctx.shadowBlur = cHeight * 0.03;
		ctx.fillRect(0, bannerTop, cWidth, bannerHeight);
		this.resetShadow();

		teams.map((team, i) => {
			//Draw Banner
			ctx.fillStyle = team.colours.main;
			ctx.fillRect(i === 0 ? 0 : cWidth * 0.5, bannerTop, cWidth * 0.5, bannerHeight);

			//Add Score
			ctx.textAlign = i === 0 ? "right" : "left";
			ctx.fillStyle = team.colours.text;
			ctx.font = textStyles.score.string;
			ctx.fillText(
				game.score[team._id],
				cWidth * 0.5 + (i === 0 ? 0 - scoreOffset : scoreOffset),
				bannerTop + bannerHeight / 2 + textStyles.score.size * 0.35
			);

			//Add Badges
			this.contain(
				team.badge,
				cWidth * 0.5 + (i === 0 ? 0 - badgeOffset - badgeWidth : badgeOffset),
				bannerTop + bannerHeight / 2 - badgeHeight / 2,
				badgeWidth,
				badgeHeight
			);
		});
	}

	async drawGameInfo() {
		const { branding, ctx, game, cWidth, cHeight, event, textStyles, colours } = this;

		//Add Event
		let text;
		switch (event) {
			case "kickOff":
				text = ["KICK", " OFF"];
				break;
			case "halfTime":
				text = ["HALF", " TIME"];
				break;
			case "fullTime":
				text = ["FULL", " TIME"];
				break;
			case "extraTime":
				text = ["EXTRA", " TIME"];
				break;
			case "breakdown-intro":
				text = ["THE", " BREAKDOWN"];
				break;
		}
		ctx.font = textStyles.event.string;
		ctx.shadowOffsetX = ctx.shadowOffsetY = Math.round(cHeight * 0.005);
		ctx.shadowColor = "black";
		this.textBuilder(
			[
				[
					{ text: text[0], colour: colours.gold },
					{ text: text[1], colour: "#FFF" }
				]
			],
			cWidth / 2,
			cHeight * 0.28
		);

		//Add hashtag
		const hashtagAndLogoY = cHeight * 0.865;
		if (game.hashtags && game.hashtags.length) {
			const [hashtag] = game.hashtags;
			ctx.font = textStyles.hashtag.string;
			ctx.textAlign = "center";
			ctx.shadowOffsetX = ctx.shadowOffsetY = Math.round(cHeight * 0.002);
			const rows = [
				[
					{ text: "#", colour: colours.gold },
					{ text: hashtag, colour: colours.white }
				]
			];
			this.textBuilder(rows, cWidth * 0.5, hashtagAndLogoY, { padding: 0.3 });
		}
		this.resetShadow();

		//Add Logos
		const logoWidth = Math.round(cWidth * 0.07);
		const logoHeight = Math.round(cHeight * 0.1);
		const logoX = cWidth * 0.015;
		const gameLogoUrl = game.images.logo;
		if (gameLogoUrl) {
			const gameLogo = await this.googleToCanvas(gameLogoUrl);
			this.contain(gameLogo, logoX, hashtagAndLogoY - logoHeight / 2, logoWidth, logoHeight, {
				xAlign: "left"
			});
		}
		const brandLogoUrl = `images/layout/branding/${branding.site_logo}`;
		const brandLogo = await this.googleToCanvas(brandLogoUrl);
		this.contain(
			brandLogo,
			cWidth - logoX - logoWidth,
			hashtagAndLogoY - logoHeight / 2,
			logoWidth,
			logoHeight,
			{
				xAlign: "right"
			}
		);
	}

	async render(forTwitter = false) {
		await this.getBranding();
		await this.getTeamInfo();
		await this.drawBackground();
		await this.drawTeamBanners();
		await this.drawGameInfo();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
