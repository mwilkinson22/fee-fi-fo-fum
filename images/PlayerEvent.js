import Canvas from "./Canvas";
import _ from "lodash";
import mongoose from "mongoose";
import { localTeam } from "~/config/keys";
const Person = mongoose.model("people");
const Team = mongoose.model("teams");

export default class PlayerEvent extends Canvas {
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
			}
		};
		this.setTextStyles(textStyles);
		this.colours.lightClaret = "#c11560";

		this.positions = {};

		//Variables
		this.player = player;
		this.playerDataRendered = false;
		this.game = options.game;
	}

	async drawBackground() {
		const { ctx, cWidth, cHeight } = this;
		const backgroundImage = await this.googleToCanvas("images/layout/canvas/player-event.jpg");
		ctx.drawImage(backgroundImage, 0, 0, cWidth, cHeight);
	}

	async drawPlayerData() {
		const { ctx, cWidth, cHeight, player, game, textStyles } = this;
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
			} else {
				const team = await Team.findById(_team, "image").lean();
				image = await this.googleToCanvas(`images/teams/${team.image}`);
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
		this.textBuilder([firstRow, secondRow], cWidth * 0.72, cHeight * 0.85, {
			lineHeight: 1.1
		});
		this.resetShadow();

		if (isPlayerImage) {
			const { width, height, offsetY } = this.contain(
				Math.round(cWidth * 0.5),
				cHeight,
				image.width,
				image.height
			);
			ctx.drawImage(
				image,
				Math.round(cWidth * 0.25) - width / 2,
				Math.round(cHeight * 0.55) - height / 2 + offsetY,
				width,
				height
			);
		} else {
			const { width, height, offsetY } = this.contain(
				Math.round(cWidth * 0.4),
				Math.round(cHeight * 0.6),
				image.width,
				image.height
			);
			ctx.drawImage(
				image,
				Math.round(cWidth * 0.22) - width / 2,
				Math.round(cHeight * 0.5) - height / 2 + offsetY,
				width,
				height
			);
		}

		this.playerDataRendered = true;
	}

	async render(forTwitter = false) {
		await this.drawBackground();

		if (!this.playerDataRendered) {
			await this.drawPlayerData();
		}

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
