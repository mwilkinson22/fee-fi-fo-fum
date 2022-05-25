import Canvas from "./Canvas";
import mongoose from "mongoose";
import { getExtraGameInfo, getFullGames } from "~/controllers/rugby/gamesController";
import { localTeam } from "~/config/keys";
const Team = mongoose.model("teams");

export default class GameListSocialCard extends Canvas {
	constructor(isFixtures, teamType) {
		//Set Dimensions
		const cWidth = 1200;
		const cHeight = 630;

		//Load In Fonts
		const fonts = [
			{ file: "Montserrat-Bold.ttf", family: "Montserrat" },
			{ file: "TitilliumWeb-SemiBold.ttf", family: "Titillium" },
			{ file: "TitilliumWeb-Bold.ttf", family: "Titillium-Bold" }
		];

		//Create Canvas
		super(cWidth, cHeight, { fonts });

		//Constants
		const textStyles = {
			header: {
				size: Math.round(cHeight * 0.08),
				family: "Montserrat"
			},
			gameOpponent: {
				size: Math.round(cHeight * 0.04),
				family: "Montserrat"
			},
			gameDate: {
				size: Math.round(cHeight * 0.025),
				family: "Titillium-Bold"
			},
			gameDetails: {
				size: Math.round(cHeight * 0.025),
				family: "Titillium"
			}
		};
		this.setTextStyles(textStyles);
		this.colours.lightClaret = "#a53552";

		this.positions = {
			fixtureBoxY: Math.round(cHeight * 0.28),
			fixtureBoxH: Math.round(cHeight * 0.18),
			fixtureBoxW: Math.round(cWidth * 0.9)
		};

		//Variables
		this.isFixtures = isFixtures;
		this.teamType = teamType;
	}

	async drawBackground() {
		const { cWidth, cHeight } = this;

		const backgroundImage = await this.googleToCanvas("images/layout/canvas/gamelist-social-card-template.jpg");
		this.cover(backgroundImage, 0, 0, cWidth, cHeight);
	}

	async getGames() {
		const { isFixtures, teamType } = this;

		const query = { hideGame: { $in: [false, null] }, _teamType: teamType._id };
		let sort = {};
		if (isFixtures) {
			query.date = { $gt: new Date() };
			sort.date = 1;
		} else {
			query.date = { $lt: new Date() };
			sort.date = -1;
		}

		//First, load games
		this.games = await getFullGames(query, true, false, { limit: 4, sort });

		if (this.games.length) {
			//Get extra info
			this.games = await getExtraGameInfo(this.games, true, false);

			//Load team images
			for (let i = 0; i < this.games.length; i++) {
				const imageName = this.games[i]._opposition.images.main;
				this.games[i]._opposition.image = await this.googleToCanvas(`images/teams/${imageName}`);
			}
		}
	}

	drawHeader() {
		const { cWidth, cHeight, colours, ctx, isFixtures, localTeam, textStyles, teamType } = this;
		const textArray = [localTeam.name.short];

		if (teamType.sortOrder > 1) {
			textArray.push(teamType.name);
		}

		textArray.push(isFixtures ? "Fixtures" : "Results");

		ctx.font = textStyles.header.string;
		ctx.textAlign = "center";
		ctx.fillStyle = colours.gold;
		ctx.fillText(textArray.join(" ").toUpperCase(), cWidth / 2, cHeight * 0.14, cWidth);
	}

	drawGames() {
		const { ctx, cHeight, cWidth, games, localTeam, positions, textStyles } = this;

		//Get x value for card
		const cardX = (cWidth - positions.fixtureBoxW) / 2;

		//Set an initial y value
		let y = positions.fixtureBoxY;

		for (let i = 0; i < 4; i++) {
			const game = games[i];

			let colours;
			if (game) {
				colours = games[i]._opposition.colours;
			} else {
				colours = {
					main: "#CCC",
					trim1: "#BBB"
				};
			}

			//Create main card
			const shadowPx = cHeight * 0.007;
			ctx.shadowOffsetX = shadowPx;
			ctx.shadowOffsetY = shadowPx;
			ctx.shadowBlur = shadowPx;
			ctx.shadowColor = "#00000088";
			ctx.fillStyle = colours.main;
			ctx.fillRect(cardX, y, positions.fixtureBoxW, positions.fixtureBoxH);
			this.resetShadow();

			//Add border
			const borderWidth = positions.fixtureBoxH * 0.1;
			ctx.fillStyle = colours.trim1;
			ctx.fillRect(cardX, y, borderWidth, positions.fixtureBoxH);

			//Add info
			const badgeX = cardX + borderWidth;
			const badgeZoom = 0.6;
			const infoX = badgeX + positions.fixtureBoxH;
			if (game) {
				//Add badge
				this.contain(game._opposition.image, badgeX, y, positions.fixtureBoxH, positions.fixtureBoxH, {
					zoom: badgeZoom
				});

				//Get Header Text
				let oppositionText;
				if (games[i].status > 1) {
					const titleArray = [
						localTeam.nickname,
						" ",
						game.score[localTeam._id],
						"-",
						game.score[game._opposition._id],
						" ",
						game._opposition.name.short
					];
					if (game.isAway) {
						titleArray.reverse();
					}
					oppositionText = titleArray.join("");
				} else {
					oppositionText = `${game._opposition.name.short}`;
					if (!game.isNeutralGround) {
						oppositionText += ` (${game.isAway ? "A" : "H"})`;
					}
				}

				//Draw text
				ctx.fillStyle = colours.text;
				const textRows = [
					//Opposition
					[{ text: oppositionText.toUpperCase(), font: textStyles.gameOpponent.string }],
					[
						{
							text: new Date(game.date).toString("dddd dS MMMM HH:mm"),
							font: textStyles.gameDate.string
						}
					],
					[
						{
							text: game._ground
								? `${game._ground.name}, ${game._ground.address._city.name}`
								: "Venue TBD",
							font: textStyles.gameDetails.string
						}
					],
					[{ text: game.title }]
				];
				this.textBuilder(textRows, infoX, y + positions.fixtureBoxH / 2, {
					xAlign: "left",
					lineHeight: 1.5
				});
			} else {
				//Circle in lieu of badge
				ctx.arc(
					badgeX + positions.fixtureBoxH / 2,
					y + positions.fixtureBoxH / 2,
					positions.fixtureBoxH * (badgeZoom / 2),
					0,
					Math.PI * 2
				);
				ctx.fill();

				//Blocks in lieu of text
				ctx.fillRect(
					infoX,
					y + positions.fixtureBoxH * 0.1,
					positions.fixtureBoxW * 0.7,
					positions.fixtureBoxH * 0.3
				);
				ctx.fillRect(
					infoX,
					y + positions.fixtureBoxH * 0.45,
					positions.fixtureBoxW * 0.3,
					positions.fixtureBoxH * 0.2
				);
				ctx.fillRect(
					infoX,
					y + positions.fixtureBoxH * 0.7,
					positions.fixtureBoxW * 0.2,
					positions.fixtureBoxH * 0.2
				);
			}

			//Update y value
			y += positions.fixtureBoxH * 1.15;
		}
	}

	async render() {
		//Get the data we need
		await this.getGames();
		this.localTeam = await Team.findById(localTeam, "name nickname").lean();

		//Draw
		await this.drawBackground();
		this.drawHeader();
		this.drawGames();

		return this.outputFile("base64");
	}
}
