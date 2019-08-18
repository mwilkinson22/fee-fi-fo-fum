import Canvas from "./Canvas";
import _ from "lodash";
import mongoose from "mongoose";
import { localTeam } from "~/config/keys";
const Person = mongoose.model("people");
const Team = mongoose.model("teams");

export default class PlayerEventImage extends Canvas {
	constructor(player, options = {}) {
		//Set Dimensions
		const cWidth = 1400;
		const cHeight = cWidth / 2;

		//Load In Fonts
		const fonts = [
			{ file: "Montserrat-Bold.ttf", family: "Montserrat" },
			{ file: "Monstro.ttf", family: "Monstro" }
		];

		//Create Canvas
		super(cWidth, cHeight, { fonts });

		//Constants
		const textStyles = {
			squadNumber: {
				size: Math.round(cHeight * 0.075),
				family: "Montserrat"
			},
			playerName: {
				size: Math.round(cHeight * 0.1),
				family: "Montserrat"
			},
			score: {
				size: Math.round(cHeight * 0.08),
				family: "Montserrat"
			},
			hashtag: {
				size: Math.round(cHeight * 0.075),
				family: "Montserrat"
			}
		};
		this.setTextStyles(textStyles);
		this.colours.lightClaret = "#a53552";

		this.positions = {
			leftPanelWidth: Math.round(cWidth * 0.44),
			rightPanelWidth: Math.round(cWidth * 0.5)
		};

		//Variables
		this.player = player;
		this.backgroundRendered = false;
		this.playerDataRendered = false;
		this.game = options.game;
	}

	async loadTeamBadges() {
		if (!this.teamBadges) {
			const teams = await Team.find(
				{ _id: { $in: [localTeam, this.game._opposition._id] } },
				"images"
			);
			this.teamBadges = {};
			for (const team of teams) {
				const { _id, images } = team;
				this.teamBadges[_id] = await this.googleToCanvas(`images/teams/${images.main}`);
			}
		}
	}

	async drawBackground() {
		const { ctx, cWidth, cHeight } = this;
		const backgroundImage = await this.googleToCanvas("images/layout/canvas/player-event.jpg");
		ctx.drawImage(backgroundImage, 0, 0, cWidth, cHeight);
		this.backgroundRendered = true;
	}

	async drawGameData() {
		if (!this.backgroundRendered) {
			await this.drawBackground();
		}
		await this.loadTeamBadges();
		const { ctx, positions, game, cWidth, cHeight, textStyles } = this;

		//Add Team Objects
		let teams = [
			{ id: localTeam, colours: { main: this.colours.lightClaret, text: "#FFFFFF" } },
			{ id: game._opposition._id, colours: game._opposition.colours }
		];
		if (game.isAway) {
			teams = teams.reverse();
		}

		//Draw Bar
		const barTop = Math.round(cHeight * 0.575);
		const barHeight = Math.round(cHeight * 0.11);
		const barWidth = Math.round(positions.rightPanelWidth * 0.5);
		const badgeHeight = Math.round(barHeight * 1.6);
		const badgeOffset = Math.round(positions.rightPanelWidth * 0.13);
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
				ctx.moveTo(cWidth - barWidth * 2.092, barTop);
				ctx.lineTo(cWidth - barWidth, barTop);
				ctx.lineTo(cWidth - barWidth, barTop + barHeight);
				ctx.lineTo(cWidth - barWidth * 2.13, barTop + barHeight);
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
				game.score[id],
				cWidth - barWidth + relativeTextOffset,
				barTop + barHeight / 2 + textStyles.score.size * 0.36
			);
		});

		//Add Game Logo
		const brandLogoUrl = `images/layout/branding/square-logo-with-shadow.png`;
		const updateSponsor = "images/sponsors/burton-hills.jpg";
		const gameLogoUrl = updateSponsor || game.images.logo || brandLogoUrl;
		const gameLogo = await this.googleToCanvas(gameLogoUrl);
		this.contain(
			gameLogo,
			cWidth - (positions.rightPanelWidth + logoWidth) / 2,
			Math.round(cHeight * 0.05),
			logoWidth,
			logoHeight
		);

		if (game.images.logo) {
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
	}

	async drawPlayerData() {
		if (!this.backgroundRendered) {
			await this.drawBackground();
		}
		const { ctx, cWidth, cHeight, player, game, textStyles, positions } = this;
		let squadNumber, firstName, lastName, image, isPlayerImage;
		//Save time by pulling data from game, if possible
		if (this.game) {
			const { _team } = _.find(this.game.playerStats, ({ _player }) => _player._id == player);
			const { _player, number } = _.find(
				game.eligiblePlayers[_team],
				({ _player }) => _player._id == player
			);
			squadNumber = number;
			firstName = _player.name.first;
			lastName = _player.name.last;
			if (_player.image && _team == localTeam) {
				image = await this.googleToCanvas(`images/people/full/${_player.image}`);
				isPlayerImage = true;
			} else if (this.teamBadges) {
				image = this.teamBadges[_team];
				isPlayerImage = false;
			}
		} else {
			const player = await Person.findById(player, "name image").lean();
			firstName = player.name.first;
			lastName = player.name.last;
			image = await this.googleToCanvas(`images/people/full/${player.image}`);
			isPlayerImage = true;
		}

		//Draw Name
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
			{ text: lastName.toUpperCase(), colour: "#FC0", maxWidth: Math.round(cWidth * 0.55) }
		];

		//Output text
		ctx.shadowOffsetX = ctx.shadowOffsetY = Math.round(cHeight * 0.003);
		ctx.shadowColor = "black";
		this.textBuilder(
			[firstRow, secondRow],
			cWidth - positions.rightPanelWidth / 2,
			cHeight * 0.85,
			{
				lineHeight: 1.1
			}
		);
		this.resetShadow();

		if (isPlayerImage) {
			this.cover(
				image,
				0,
				Math.round(cHeight * 0.05),
				Math.round(cWidth * 0.5),
				Math.round(cHeight * 0.95),
				{ yAlign: "top" }
			);
		} else {
			const badgeWidth = Math.round(cWidth * 0.3);
			const badgeHeight = Math.round(cHeight * 0.6);
			this.contain(
				image,
				(positions.leftPanelWidth - badgeWidth) / 2,
				(cHeight - badgeHeight) / 2,
				badgeWidth,
				badgeHeight
			);
		}

		this.playerDataRendered = true;
	}

	async drawGameEvent(event) {
		const { ctx, cWidth, cHeight, positions, game, textStyles } = this;
		let rows = [];
		let size = Math.round(cHeight * 0.18);
		let height = Math.round(cHeight * 0.35);
		ctx.fillStyle = this.colours.gold;
		ctx.shadowColor = "black";
		ctx.shadowOffsetX = 5;
		ctx.shadowOffsetY = 5;

		//Add Golden Point for extra time
		if (game.extraTime && ["T", "PK", "DG", "CN", "HT"].indexOf(event) > -1) {
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
				size = size * 1.2;
				rows.push([
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
				]);
				break;
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
			case "motm":
			case "fan_motm":
				rows.push(
					[
						{
							text: "MAN",
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

		if (event === "fan_motm") {
			const rotation = -0.2;
			ctx.rotate(rotation);
			ctx.font = `${size * 0.5}px Monstro`;
			ctx.fillStyle = this.colours.lightClaret;
			ctx.fillText("FANS'", cWidth - positions.rightPanelWidth * 0.85, cHeight * 0.52);
			ctx.rotate(0 - rotation);
		}
	}

	async render(forTwitter = false) {
		if (!this.playerDataRendered) {
			await this.drawPlayerData();
		}

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
