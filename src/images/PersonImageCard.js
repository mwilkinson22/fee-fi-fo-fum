//Modules
import _ from "lodash";
import mongoose from "mongoose";
const Person = mongoose.model("people");
const Team = mongoose.model("teams");
const Settings = mongoose.model("settings");

//Canvas
import Canvas from "./Canvas";

//Constants
import { localTeam } from "~/config/keys";

//Helpers
import { formatPlayerStatsForImage } from "~/helpers/gameHelper";

export default class PersonImageCard extends Canvas {
	constructor(_id, options = {}) {
		//Set Dimensions
		const cWidth = 1200;
		const cHeight = cWidth * 0.5;

		//Load In Fonts
		const fonts = [
			{ file: "Montserrat-SemiBold.ttf", family: "Montserrat Semibold" },
			{ file: "Montserrat-Bold.ttf", family: "Montserrat Bold" },
			{ file: "Monstro.ttf", family: "Monstro" }
		];

		//Create Canvas
		super(cWidth, cHeight, { fonts });

		//Constants
		const textStyles = {
			squadNumber: {
				size: Math.round(cHeight * 0.075),
				family: "Montserrat Bold"
			},
			playerName: {
				size: Math.round(cHeight * 0.1),
				family: "Montserrat Bold"
			},
			score: {
				size: Math.round(cHeight * 0.07),
				family: "Montserrat Bold"
			},
			hashtag: {
				size: Math.round(cHeight * 0.075),
				family: "Montserrat Bold"
			},
			statsLabel: {
				size: Math.round(cHeight * 0.065),
				family: "Montserrat Semibold"
			},
			statsValue: {
				size: Math.round(cHeight * 0.065),
				family: "Montserrat Bold"
			}
		};
		this.setTextStyles(textStyles);
		this.colours.fans = this.colours.lightClaret;

		this.positions = {
			leftPanelWidth: Math.round(cWidth * 0.44),
			rightPanelWidth: Math.round(cWidth * 0.5)
		};

		//Variables
		this._id = _id;
		this.backgroundRendered = false;
		this.personDataRendered = false;
		this.options = {
			includeName: true,
			...options
		};
	}

	async loadTeamBadges() {
		if (!this.teamBadges) {
			const teams = await Team.find(
				{ _id: { $in: [localTeam, this.options.game._opposition._id] } },
				"images"
			);
			this.teamBadges = {};
			for (const team of teams) {
				const { _id, images } = team;
				this.teamBadges[_id] = await this.googleToCanvas(`images/teams/${images.main}`);
			}
		}
	}

	async getBranding() {
		const settings = await Settings.findOne({
			name: "site_logo"
		}).lean();
		this.branding = { site_logo: settings.value };
	}

	async drawBackground() {
		const { ctx, cWidth, cHeight } = this;
		const backgroundImage = await this.googleToCanvas("images/layout/canvas/player-event.jpg");
		ctx.drawImage(backgroundImage, 0, 0, cWidth, cHeight);
		this.backgroundRendered = true;
	}

	async drawGameData(includeGameLogo) {
		if (!this.backgroundRendered) {
			await this.drawBackground();
		}
		await this.getBranding();
		await this.loadTeamBadges();
		const { branding, ctx, positions, options, cWidth, cHeight, textStyles } = this;

		//Add Team Objects
		let teams = [
			{ id: localTeam, colours: { main: this.colours.lightClaret, text: "#FFFFFF" } },
			{ id: options.game._opposition._id, colours: options.game._opposition.colours }
		];
		if (options.game.isAway) {
			teams = teams.reverse();
		}

		//Draw Bar
		const barTop = Math.round(cHeight * 0.625);
		const barHeight = Math.round(cHeight * 0.11);
		const barWidth = Math.round(positions.rightPanelWidth * 0.5);
		const badgeHeight = Math.round(barHeight * 1.6);
		const badgeOffset = Math.round(positions.rightPanelWidth * 0.17);
		const badgeWidth = Math.round(positions.rightPanelWidth * 0.25);
		const textOffset = Math.round(positions.rightPanelWidth * 0.02);
		const logoWidth = Math.round(positions.rightPanelWidth * 0.5);
		const logoHeight = Math.round(cHeight * 0.12);
		teams.map(({ id, colours }, i) => {
			//Position Variables
			let relativeBadgeOffset;
			let relativeTextOffset;

			//Draw Banner
			ctx.fillStyle = colours.main;
			if (i === 0) {
				ctx.beginPath();
				ctx.moveTo(cWidth - barWidth * 2.11, barTop);
				ctx.lineTo(cWidth - barWidth, barTop);
				ctx.lineTo(cWidth - barWidth, barTop + barHeight);
				ctx.lineTo(cWidth - barWidth * 2.145, barTop + barHeight);
				ctx.closePath();
				ctx.fill();
				relativeBadgeOffset = 0 - badgeOffset - badgeWidth;
				relativeTextOffset = 0 - textOffset;
			} else {
				ctx.fillRect(cWidth - barWidth, barTop, barWidth, barHeight);
				relativeBadgeOffset = badgeOffset;
				relativeTextOffset = textOffset;
			}

			//Draw Badges
			this.contain(
				this.teamBadges[id],
				cWidth - barWidth + relativeBadgeOffset,
				barTop + (barHeight - badgeHeight) / 2,
				badgeWidth,
				badgeHeight
			);

			//Add Score
			ctx.fillStyle = colours.text;
			ctx.font = textStyles.score.string;
			ctx.textAlign = i === 0 ? "right" : "left";
			ctx.fillText(
				options.game.score[id],
				cWidth - barWidth + relativeTextOffset,
				barTop + barHeight / 2 + textStyles.score.size * 0.36
			);
		});

		//Add Game and brand logos
		const brandLogoUrl = `images/layout/branding/${branding.site_logo}`;
		if (includeGameLogo) {
			const gameLogoUrl = options.game.images.logo || brandLogoUrl;
			const gameLogo = await this.googleToCanvas(gameLogoUrl);
			this.contain(
				gameLogo,
				cWidth - (positions.rightPanelWidth + logoWidth) / 2,
				Math.round(cHeight * 0.05),
				logoWidth,
				logoHeight
			);
		}

		if (options.game.images.logo || !includeGameLogo) {
			await this.drawBrandLogo();
		}
	}

	async drawBrandLogo() {
		if (!this.branding) {
			await this.getBranding();
		}

		const { branding, ctx, cHeight, cWidth } = this;
		const brandLogoUrl = `images/layout/branding/${branding.site_logo}`;
		const brandLogo = await this.googleToCanvas(brandLogoUrl);

		ctx.shadowBlur = 20;
		ctx.shadowColor = "#000";
		this.contain(
			brandLogo,
			Math.round(cWidth * 0.04),
			Math.round(cHeight * 0.05),
			Math.round(cWidth * 0.1),
			Math.round(cHeight * 0.1)
		);
		this.resetShadow();
	}

	async drawPersonData() {
		if (!this.backgroundRendered) {
			await this.drawBackground();
		}
		const { ctx, cWidth, cHeight, _id, options, textStyles, positions } = this;
		let squadNumber, firstName, lastName, image;
		//Save time by pulling data from game, if possible
		if (options.game) {
			const { _team } = _.find(options.game.playerStats, ({ _player }) => _player._id == _id);
			const { name, images, number } = _.find(
				options.game.eligiblePlayers[_team],
				player => player._id == _id
			);
			squadNumber = number;
			firstName = name.first;
			lastName = name.last;
			if ((images.player || images.main) && _team == localTeam) {
				image = await this.googleToCanvas(
					`images/people/full/${images.player || images.main}`
				);
			}
		} else {
			const person = await Person.findById(_id, "name images").lean();

			//Get name
			firstName = person.name.first;
			lastName = person.name.last;

			//Get image url
			let { imageType } = options;
			if (!imageType) {
				imageType = "main";
			}
			const imageUrl = `images/people/full/${person.images[imageType]}`;
			image = await this.googleToCanvas(imageUrl);
		}

		//Draw Name
		if (options.includeName) {
			const firstRow = [];
			if (squadNumber) {
				firstRow.push({
					text: `${squadNumber}. `,
					font: textStyles.squadNumber.string,
					colour: this.colours.lightClaret
				});
			}
			firstRow.push({
				text: firstName.toUpperCase(),
				font: textStyles.playerName.string,
				colour: "#FFF"
			});

			const secondRow = [
				{
					text: lastName.toUpperCase().replace(/^MC/, "Mc"),
					colour: "#FC0",
					maxWidth: Math.round(cWidth * 0.55)
				}
			];

			//Output text
			ctx.shadowOffsetX = ctx.shadowOffsetY = Math.round(cHeight * 0.003);
			ctx.shadowColor = "black";
			this.textBuilder(
				[firstRow, secondRow],
				cWidth - positions.rightPanelWidth * 0.52,
				cHeight * 0.87,
				{
					lineHeight: 1.1
				}
			);
			this.resetShadow();
		}

		if (image) {
			this.cover(
				image,
				0,
				Math.round(cHeight * 0.02),
				Math.round(cWidth * 0.5),
				Math.round(cHeight * 0.98),
				{ xAlign: "right", yAlign: "top" }
			);
		}

		this.personDataRendered = true;
	}

	async drawGameEvent(event) {
		const { ctx, cWidth, cHeight, positions, options, textStyles } = this;
		let rows = [];
		let size = Math.round(cHeight * 0.18);
		let height = Math.round(cHeight * 0.375);
		ctx.fillStyle = this.colours.gold;
		ctx.shadowColor = "black";
		ctx.shadowOffsetX = 5;
		ctx.shadowOffsetY = 5;

		//Add Golden Point for extra time
		if (options.game.extraTime && ["T", "PK", "DG", "CN", "HT"].indexOf(event) > -1) {
			const hashtagSize = textStyles.hashtag.size;
			const font = textStyles.hashtag.string;
			const hashtagRows = [
				[
					{
						text: "#",
						colour: "#FFF",
						font
					},
					{
						text: "GOLDEN",
						colour: this.colours.gold,
						font
					},
					{
						text: "POINT",
						colour: "#FFF",
						font
					}
				]
			];
			this.textBuilder(hashtagRows, cWidth - positions.rightPanelWidth / 2, cHeight * 0.485);

			size = size - hashtagSize / 2;
			height = height - hashtagSize / 2;
		}

		switch (event) {
			case "T":
				rows.push([
					{
						text: "TRY",
						size: Math.round(cHeight * 0.3)
					}
				]);
				break;
			case "HT":
				rows.push([
					{
						text: "HAT",
						size
					},
					{
						text: " TRICK",
						size,
						colour: "#FFF"
					}
				]);
				break;
			case "PK":
				rows.push(
					[
						{
							text: "PENALTY",
							colour: "#FFF",
							size
						}
					],
					[
						{
							text: "GOAL",
							colour: this.colours.gold,
							size
						}
					]
				);
				break;
			case "CN":
				rows.push([
					{
						text: "CONVERSION",
						size: Math.round(cHeight * 0.16)
					}
				]);
				break;
			case "DG":
				rows.push(
					[
						{
							text: "DROP",
							colour: "#FFF",
							size
						}
					],
					[
						{
							text: "GOAL",
							colour: this.colours.gold,
							size
						}
					]
				);
				break;
			case "FT":
			case "TF": {
				size = size * 1.2;
				const row = [
					{
						text: "40",
						colour: this.colours.gold,
						size
					},
					{
						text: "/",
						colour: "#FFF",
						size
					},
					{
						text: "20",
						colour: this.colours.gold,
						size: size
					}
				];
				if (event === "TF") {
					row.reverse();
				}

				rows.push(row);
				break;
			}
			case "YC":
				rows.push([
					{
						text: "SIN",
						colour: "#FFF",
						size
					},
					{
						text: " BIN",
						colour: this.colours.gold,
						size
					}
				]);
				break;
			case "RC":
				rows.push([
					{
						text: "RED CARD",
						colour: "#F33",
						size
					}
				]);
				break;
			case "potm":
				rows.push(
					[
						{
							text: options.game.genderedString,
							size: size * 0.8
						}
					],
					[
						{
							text: "OF THE",
							size: size * 0.4,
							colour: "#FFF"
						}
					],
					[
						{
							text: "MATCH",
							colour: this.colours.gold,
							size: size * 0.8
						}
					]
				);
				break;
		}

		rows = rows.map(row => {
			return row.map(section => {
				return {
					font: `${section.size}px Monstro`,
					...section
				};
			});
		});

		this.textBuilder(rows, cWidth - positions.rightPanelWidth / 2, height);
	}

	async drawCustomText(textRows, xAlign, lineHeight) {
		const { ctx, cHeight, cWidth, positions, options } = this;

		if (!this.backgroundRendered) {
			await this.drawBackground();
		}

		//Then, convert each line to a textBuilder format
		const rows = textRows.map(row => {
			return row.map(({ text, colour, size, font }) => ({
				text,
				colour,
				font: `${Math.round(cHeight * (size / 100))}px ${font}`
			}));
		});

		//Work out x positioning based on xAlign
		let x;
		switch (xAlign) {
			case "left":
				x = cWidth - positions.rightPanelWidth * 0.9;
				break;
			case "right":
				x = cWidth - positions.rightPanelWidth * 0.1;
				break;
			default:
				x = cWidth - positions.rightPanelWidth * 0.5;
		}

		//Work out y positioning based on whether or not we include the name
		const y = options.includeName ? cHeight * 0.42 : cHeight * 0.5;

		//Finally, draw text
		ctx.shadowColor = "black";
		ctx.shadowOffsetX = 2;
		ctx.shadowOffsetY = 2;
		this.textBuilder(rows, x, y, {
			xAlign,
			lineHeight
		});
		this.resetShadow();
	}

	drawGameStats(statTypes) {
		const { ctx, colours, cHeight, cWidth, options, _id, textStyles } = this;

		const rows = formatPlayerStatsForImage(options.game, _id, statTypes, textStyles, colours, {
			fan_potm: cHeight * 0.05,
			steel: cHeight * 0.055
		});

		ctx.shadowColor = "black";
		ctx.shadowOffsetX = 2;
		ctx.shadowOffsetY = 2;
		const lineHeight = rows.length <= 5 ? 2 : null;
		this.textBuilder(rows, cWidth * 0.97, cHeight * 0.31, { xAlign: "right", lineHeight });
		this.resetShadow();
	}

	drawSteelPoints() {}

	async render(forTwitter = false) {
		if (!this.personDataRendered) {
			await this.drawPersonData();
		}

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
