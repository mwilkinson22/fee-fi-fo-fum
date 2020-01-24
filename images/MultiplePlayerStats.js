//Modules
import _ from "lodash";

//Canvas
import Canvas from "./Canvas";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";

//Helpers
import PlayerStatsHelper from "~/client/helperClasses/PlayerStatsHelper";
import { formatPlayerStatsForImage } from "~/helpers/gameHelper";

export default class MultiplePlayerStats extends Canvas {
	constructor(game, playersAndStats, eventType) {
		//Set Dimensions
		const cWidth = 1200;
		const topBanner = eventType.includes("potm") ? cWidth * 0.075 : 0;
		const heightMultiplier = playersAndStats.length > 4 ? 0.7 : 0.5;
		const cHeight = cWidth * heightMultiplier + topBanner;

		//Load In Fonts
		const fonts = [
			{ file: "Montserrat-SemiBold.ttf", family: "Montserrat Semibold" },
			{ file: "Montserrat-Bold.ttf", family: "Montserrat Bold" },
			{ file: "Monstro.ttf", family: "Monstro" }
		];

		//Create Canvas
		super(cWidth, cHeight, { fonts });

		//Positions
		this.positions = {
			topBanner,
			padding: cWidth * 0.02
		};
		this.positions.playerSectionY = topBanner + this.positions.padding;
		this.positions.playerSectionWidth = cWidth - this.positions.padding * 2;
		this.positions.playerSectionHeight =
			cHeight - this.positions.playerSectionY - this.positions.padding;

		//Variables
		this.game = JSON.parse(JSON.stringify(game));
		this.playersAndStats = playersAndStats;
		this.eventType = eventType;
		this.splitRows = playersAndStats.length > 4;

		//Constants
		const statSize = Math.round(cWidth * (this.splitRows ? 0.015 : 0.018));
		const textStyles = {
			header: {
				size: Math.round(cHeight * 0.1),
				family: "Montserrat Semibold"
			},
			number: {
				size: Math.round(cWidth * 0.017),
				family: "Montserrat Semibold"
			},
			name: {
				size: Math.round(cWidth * 0.02),
				family: "Montserrat Semibold"
			},
			statsLabel: {
				size: statSize,
				family: "Montserrat Semibold"
			},
			statsValue: {
				size: statSize,
				family: "Montserrat Bold"
			}
		};
		this.setTextStyles(textStyles);
		this.colours.lightClaret = "#a53552";
		this.colours.fans = this.colours.gold;
	}

	async drawBackground() {
		const { ctx, cWidth, cHeight } = this;
		const backgroundImage = await this.googleToCanvas("images/layout/canvas/blank-claret.jpg");
		ctx.drawImage(backgroundImage, 0, 0, cWidth, cHeight);
	}

	drawFansPotmHeader() {
		const { colours, ctx, cWidth, game, positions, textStyles } = this;

		//Set Font
		ctx.font = textStyles.header.string;
		ctx.shadowColor = "black";
		ctx.shadowOffsetX = 2;
		ctx.shadowOffsetY = 2;

		//Create row of text
		const row = [
			{ text: "FANS' ", colour: colours.lightClaret },
			{ text: game.genderedString.toUpperCase(), colour: colours.gold },
			{ text: " OF THE ", colour: "#FFF" },
			{ text: "MATCH", colour: colours.gold }
		];

		//Output
		this.textBuilder([row], cWidth * 0.5, positions.padding + positions.topBanner / 2);
		this.resetShadow();
	}

	async drawPlayers() {
		const { playersAndStats, positions, splitRows } = this;
		const { playerSectionY, playerSectionWidth, playerSectionHeight } = positions;

		//Set the box sizing based on the player count
		let playerBoxWidth, playerBoxHeight, playerBoxY, xMargin;

		if (splitRows) {
			playerBoxWidth = playerSectionWidth * 0.22;
			playerBoxHeight = playerSectionHeight * 0.45;

			//Get the length of each row
			const rowLengths = [
				Math.floor(playersAndStats.length / 2),
				Math.ceil(playersAndStats.length / 2)
			];

			//Loop the rows
			for (const row in rowLengths) {
				const rowLength = rowLengths[row];

				//Pull the xMargin from this row's player count
				xMargin = (playerSectionWidth - rowLength * playerBoxWidth) / (rowLength + 1);

				//Get y and players
				let players;
				const playerBoxYMargin = (playerSectionHeight - playerBoxHeight * 2) / 3;
				playerBoxY = playerSectionY + playerBoxYMargin;
				if (row == 0) {
					players = playersAndStats.filter((p, i) => i < rowLength);
				} else {
					players = playersAndStats.filter((p, i) => i >= rowLengths[0]);
					playerBoxY += playerBoxHeight + playerBoxYMargin;
				}

				//Draw row
				await this.drawPlayerRow(
					players,
					xMargin,
					playerBoxY,
					playerBoxWidth,
					playerBoxHeight
				);
			}
		} else {
			playerBoxWidth = playerSectionWidth * 0.22;
			playerBoxHeight = playerSectionHeight * 0.8;
			playerBoxY = playerSectionY + (playerSectionHeight - playerBoxHeight) / 2;
			xMargin =
				(playerSectionWidth - playersAndStats.length * playerBoxWidth) /
				(playersAndStats.length + 1);
			await this.drawPlayerRow(
				playersAndStats,
				xMargin,
				playerBoxY,
				playerBoxWidth,
				playerBoxHeight
			);
		}
	}

	async drawPlayerRow(players, xMargin, y, width, height) {
		const { colours, ctx, game, positions, textStyles } = this;

		//Get Initial X Value
		let x = xMargin + positions.padding;

		//Work out maximum stat rows
		const maximumStatRows = Math.max(...players.map(p => p.stats.length));
		const statRowPadding = 1.8;
		const statBoxHeight = (maximumStatRows + 0.5) * textStyles.statsValue.size * statRowPadding;
		const imageBoxHeight = height - statBoxHeight;

		//Flatten eligible players
		const eligiblePlayers = _.chain(game.eligiblePlayers)
			.values()
			.flatten()
			.keyBy(({ _player }) => _player._id)
			.value();

		for (const { _player, stats } of players) {
			//Draw empty box with shadow
			ctx.fillStyle = "#00000000";
			ctx.shadowColor = "#00000055";
			ctx.shadowOffsetX = 4;
			ctx.shadowOffsetY = 4;
			ctx.shadowBlur = 2;
			ctx.fillRect(x, y, width, height);
			this.resetShadow();

			//Draw image box
			ctx.fillStyle = "#EEEEEE";
			ctx.fillRect(x, y, width, imageBoxHeight);

			//Get Player Object
			const player = eligiblePlayers[_player];

			//Get Image
			const { images, gender, name } = player._player;
			const image = await this.googleToCanvas(
				`images/people/full/${images.player || images.main || `blank-${gender}.png`}`
			);
			this.cover(image, x, y + imageBoxHeight * 0.05, width, imageBoxHeight, {
				yAlign: "top"
			});

			//Add name & number
			const firstNameRow = [];
			if (player.number) {
				firstNameRow.push({
					text: `${player.number}. `,
					font: textStyles.number.string,
					colour: colours.lightClaret
				});
			}
			firstNameRow.push({
				text: name.first.toUpperCase(),
				colour: "#FFF",
				font: textStyles.name.string
			});
			const nameRows = [
				firstNameRow,
				[
					{
						text: name.last.toUpperCase(),
						colour: colours.gold
					}
				]
			];
			ctx.fillStyle = "#000000AA";
			ctx.fillRect(
				x,
				y + imageBoxHeight - textStyles.name.size * 3 + 2,
				width,
				textStyles.name.size * 3
			);
			this.textBuilder(
				nameRows,
				x + width / 2,
				y + imageBoxHeight - textStyles.name.size / 2,
				{
					yAlign: "bottom"
				}
			);

			//Draw stat box
			ctx.fillStyle = colours.claret;
			ctx.fillRect(x, y + imageBoxHeight, width, statBoxHeight);

			//Add Stats
			const rows = formatPlayerStatsForImage(game, _player, stats, textStyles, colours, {
				steel: textStyles.statsValue.size * 0.8,
				fan_potm: textStyles.statsValue.size * 0.78
			});

			this.textBuilder(rows, x + width / 2, y + imageBoxHeight + statBoxHeight / 2, {
				lineHeight: statRowPadding * 1.25
			});

			//Increase x for next player
			x += xMargin + width;
		}
	}

	async render(forTwitter = false) {
		const { eventType } = this;
		await this.drawBackground();

		if (eventType.includes("potm")) {
			this.drawFansPotmHeader();
		}

		await this.drawPlayers();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
