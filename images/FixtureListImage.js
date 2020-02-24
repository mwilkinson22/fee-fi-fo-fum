import Canvas from "./Canvas";
import _ from "lodash";
import { easter } from "date-easter";

export default class FixtureListImage extends Canvas {
	constructor(games, year) {
		//Set Width
		const cWidth = 1400;

		//Positioning
		const positions = {};
		positions.boxWidth = cWidth * 0.28;
		positions.boxXMargin = (cWidth / 3 - positions.boxWidth) / 2;
		positions.boxHeight = cWidth * 0.035;
		positions.boxYMargin = positions.boxHeight * 0.35;

		//Use box positioning to sort height
		const maxGamesPerColumn = Math.ceil(games.length / 2);
		const cHeight =
			maxGamesPerColumn * (positions.boxHeight + positions.boxYMargin) + positions.boxYMargin;

		//Logo Positioning
		positions.logoWidth = cWidth * 0.1;
		positions.logoHeight = cWidth * 0.06;
		positions.logoX = (cWidth - positions.logoWidth) / 2;
		positions.logoY = cHeight - cWidth * 0.11;

		//Load In Fonts
		const fonts = [
			{ file: "Montserrat-Bold.ttf", family: "Montserrat" },
			{ file: "TitilliumWeb-SemiBold.ttf", family: "Titillium" },
			{ file: "TitilliumWeb-Bold.ttf", family: "Titillium-Bold" }
		];

		//Create Canvas
		super(cWidth, cHeight, { fonts });

		const textStyles = {
			teamName: {
				size: positions.boxHeight * 0.42,
				family: "Montserrat"
			},
			gameDate: {
				size: positions.boxHeight * 0.3,
				family: "Titillium"
			},
			middleHeader: {
				size: positions.boxHeight * 0.8,
				family: "Montserrat"
			},
			middleText: {
				size: positions.boxHeight * 0.5,
				family: "Titillium"
			},
			table: {
				size: positions.boxHeight * 0.4,
				family: "Titillium"
			},
			tableBold: {
				size: positions.boxHeight * 0.4,
				family: "Titillium-Bold"
			}
		};
		this.setTextStyles(textStyles);

		//Variables
		this.positions = positions;
		this.games = _.sortBy(games, g => new Date(g.date));
		this.year = year;
	}

	async getTeamImages() {
		const teams = _.chain(this.games)
			.map("_opposition")
			.uniqBy("_id")
			.value();

		this.images = {};
		for (const team of teams) {
			const image = await this.googleToCanvas(`images/teams/${team.images.main}`);
			this.images[team._id] = image;
		}
	}

	drawBackground() {
		const { ctx, cWidth, cHeight, positions } = this;

		//Main Background
		const claret = "#5f232f";
		ctx.fillStyle = claret;
		ctx.fillRect(0, 0, cWidth, cHeight);

		//Lines behind logo
		ctx.fillStyle = "#e1a321";
		ctx.fillRect(
			0,
			positions.logoY + positions.logoHeight * 0.35,
			cWidth,
			positions.logoHeight * 0.3
		);
		ctx.fillStyle = "#FFF";
		ctx.fillRect(
			0,
			positions.logoY + positions.logoHeight * 0.45,
			cWidth,
			positions.logoHeight * 0.1
		);

		//Box over lines
		ctx.fillStyle = claret;
		ctx.fillRect(
			positions.logoX - positions.logoWidth * 0.1,
			positions.logoY,
			positions.logoWidth * 1.2,
			positions.logoHeight
		);

		//Side Panels
		ctx.shadowColor = "#000";
		ctx.shadowBlur = cWidth * 0.05;
		ctx.fillStyle = "#491c23";
		ctx.fillRect(0, 0, cWidth / 3, cHeight);
		ctx.fillRect((cWidth / 3) * 2, 0, cWidth / 3, cHeight);
		this.resetShadow();
	}

	drawFixtures() {
		const { ctx, cWidth, games, images, textStyles } = this;

		//Get Positions
		const { boxHeight, boxWidth, boxXMargin, boxYMargin } = this.positions;

		//Starting values
		let x = boxXMargin;
		let y = boxYMargin;
		let badgeX = 0;
		const badgePadding = cWidth * 0.01;

		for (const i in games) {
			const game = games[i];

			//Main Box
			ctx.fillStyle = game._opposition.colours.main;
			this.fillRoundedRect(x, y, boxWidth, boxHeight, 8, { bottomRight: 0, bottomLeft: 0 });

			//Trim
			ctx.fillStyle = game._opposition.colours.trim1;
			ctx.fillRect(x, y + boxHeight * 0.9, boxWidth, boxHeight * 0.1);

			//Add Team name
			ctx.font = textStyles.teamName.string;
			ctx.textAlign = "center";
			ctx.fillStyle = game._opposition.colours.text;
			const teamName = `${game._opposition.name.short} (${
				game.isAway ? "A" : "H"
			})`.toUpperCase();
			ctx.fillText(teamName, x + boxWidth / 2, y + boxHeight * 0.45);

			//Add date
			ctx.font = textStyles.gameDate.string;
			const dateFormat = `${game.hasTime ? "H:mm | " : ""}dddd dS MMMM`;
			let dateText = game.date.toString(dateFormat);
			if (game.title === "Magic Weekend") {
				dateText = "Magic Weekend";
			}
			ctx.fillText(dateText.toUpperCase(), x + boxWidth / 2, y + boxHeight * 0.8);

			//Add Badge
			this.contain(
				images[game._opposition._id],
				badgeX + badgePadding,
				y - boxYMargin * 0.2,
				cWidth / 3 - badgePadding * 2,
				boxHeight + boxYMargin * 0.4,
				{
					xAlign: game.isAway ? "right" : "left"
				}
			);

			//Update positioning
			y += boxHeight + boxYMargin;

			if (i == Math.ceil(games.length / 2) - 1) {
				//Move to the right column
				x = (cWidth / 3) * 2 + boxXMargin;
				badgeX = (cWidth / 3) * 2;
				y = boxYMargin;
				if (games.length % 2) {
					y += boxHeight / 2;
				}
			}
		}
	}

	async drawMiddleColumn() {
		const { ctx, cWidth, textStyles, positions } = this;

		// Add Logo
		const logo = await this.googleToCanvas(
			`images/layout/branding/square-logo-with-shadow.png`
		);

		this.cover(
			logo,
			positions.logoX,
			positions.logoY,
			positions.logoWidth,
			positions.logoHeight
		);

		//Add Gameday table
		const gameDayTableY = this.getGamedayTable(positions.logoY);

		//Add Text Rows
		const textRowSections = [
			this.getInternationalGames(),
			this.getEasterGames(),
			this.getMagicWeekend(),
			this.getLoopFixtures()
		];
		const textRows = _.chain(textRowSections)
			.filter(_.identity)
			.flatten()
			.map((row, i) => {
				const formattedRow = row.map(({ isHeader, ...e }) => ({
					...e,
					colour: isHeader ? "#FC0" : "#FFF",
					font: textStyles[isHeader ? "middleHeader" : "middleText"].string
				}));

				if (i !== 0 && row[0].isHeader) {
					return [
						[
							{
								text: "|",
								colour: "transparent",
								font: textStyles.middleHeader.string
							}
						],
						formattedRow
					];
				}
				return [formattedRow];
			})
			.flatten()
			.map(row => row.map(segment => ({ ...segment, maxWidth: cWidth * 0.32 })))
			.value();

		ctx.shadowColor = "black";
		ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = cWidth * 0.002;
		this.textBuilder(textRows, cWidth * 0.5, gameDayTableY * 0.5, {
			lineHeight: 1.4
		});

		//Add Social Tag
		ctx.font = textStyles.middleText.string;
		ctx.fillStyle = "#FFF";
		ctx.fillText("@FeeFiFoFumRL", cWidth / 2, positions.logoY + positions.logoHeight * 1.4);

		this.resetShadow();
	}

	getGamedayTable(logoY) {
		const { ctx, cWidth, games, positions, textStyles } = this;

		const rows = _.chain(games)
			.reject(g => g.title == "Magic Weekend")
			.groupBy(({ date }) => date.toString("dddd"))
			.map((games, day) => {
				const total = games.length;
				const h = games.filter(g => !g.isAway).length;
				const a = games.filter(g => g.isAway).length;
				return { total, h, a, day };
			})
			.orderBy("total", "desc")
			.value();

		const rowHeight = positions.boxHeight * 0.8;
		const tableWidth = positions.boxWidth;
		const tableHeight = rowHeight * (rows.length + 1.4);
		const borderPadding = cWidth * 0.01;
		const x = cWidth / 3 + (cWidth / 3 - tableWidth) / 2;
		const initialY = logoY - tableHeight - rowHeight;
		let y = initialY;

		//Draw Table
		ctx.fillStyle = "#EEE";
		ctx.shadowColor = "#222222AA";
		ctx.shadowOffsetX = cWidth * 0.005;
		ctx.shadowOffsetY = cWidth * 0.005;
		ctx.shadowBlur = cWidth * 0.005;
		this.fillRoundedRect(x, y, tableWidth, tableHeight, 10);
		this.resetShadow();

		//Draw Rows
		[{ day: "", h: "Home", a: "Away", total: "Total" }, ...rows].map((row, i) => {
			const textY = y + rowHeight * 0.75;
			const borderY = y + rowHeight * 0.11;

			//Add Day
			ctx.textAlign = "right";
			ctx.font = textStyles.tableBold.string;
			ctx.fillStyle = "#000";
			ctx.fillText(row.day, x + tableWidth * 0.3, textY);

			//Add Total
			ctx.textAlign = "center";
			ctx.fillText(row.total, x + tableWidth * 0.84, textY);

			if (i > 0) {
				//Draw upper border
				ctx.strokeStyle = "#ccc";
				ctx.beginPath();
				ctx.moveTo(x + borderPadding, borderY);
				ctx.lineTo(x + tableWidth - borderPadding, borderY);
				ctx.stroke();

				ctx.font = textStyles.table.string;
			}

			//Add Home and Away
			ctx.fillText(row.h, x + tableWidth * 0.44, textY);
			ctx.fillText(row.a, x + tableWidth * 0.63, textY);

			//Update y
			y += rowHeight;
		});

		return initialY;
	}

	getInternationalGames() {
		const { games } = this;

		return _.chain(games)
			.filter(g => g._ground.address._city._country._id != "5c03f5575b718639dc2bf8b8")
			.groupBy(g => g._opposition.name.short)
			.mapValues(games =>
				_.chain(games)
					.sortBy("date")
					.map(({ date }) => date.toString("dddd dS MMMM"))
					.value()
			)
			.map((dates, team) => [
				[
					[
						{
							text: `${team} AWAY`.toUpperCase(),
							isHeader: true
						}
					]
				],
				...dates.map(date => [
					[
						{
							text: date
						}
					]
				])
			])
			.flattenDepth(2)
			.value();
	}

	getEasterGames() {
		const { games, year } = this;
		const { month, day } = easter(year);
		const easterSunday = new Date(Date.UTC(year, month - 1, day));
		const tuesday = new Date(easterSunday).addDays(2);
		const friday = new Date(easterSunday).addDays(-2);

		let title;
		let bodyRows;

		const easterGames = games.filter(g => g.date > friday && g.date < tuesday);
		if (easterGames.length === 1) {
			const game = easterGames[0];
			switch (game.date.getDay()) {
				case 0:
					title = "Easter Sunday";
					break;
				case 1:
					title = "Easter Monday";
					break;
				case 5:
					title = "Good Friday";
					break;
				default:
					//Should only be Saturday
					title = "Easter Weekend";
					break;
			}
		} else {
			title = "Easter Weekend";
		}
		bodyRows = easterGames.map(({ _opposition, isAway, date, hasTime }) => {
			let text = `${_opposition.name.short} (${isAway ? "A" : "H"})`;
			if (easterGames.length > 1) {
				text += date.toString(" - dddd");
			}
			if (hasTime) {
				text += date.toString(" - HH:mm");
			}

			return [{ text }];
		});

		return [[{ text: title.toUpperCase(), isHeader: true }], ...bodyRows];
	}

	getMagicWeekend() {
		const { games } = this;
		const magicGame = games.find(g => g.title == "Magic Weekend");
		if (magicGame) {
			return [
				[
					{
						text: "MAGIC WEEKEND",
						isHeader: true
					}
				],
				[
					{
						text: magicGame._opposition.name.long
					}
				]
			];
		}
	}

	getLoopFixtures() {
		const { games } = this;

		//Work out loop fixtures
		const loopGames = _.chain(games)
			.reject(g => g.title === "Magic Weekend")
			.groupBy(g => g._opposition._id)
			.filter(g => g.length > 2)
			.map(games => {
				const team = games[0]._opposition.name.short;
				const gamesByVenue = _.countBy(games, g => (g.isAway ? "A" : "H"));

				const loopVenue = gamesByVenue.H > gamesByVenue.A ? "H" : "A";

				return { team, loopVenue };
			})
			.groupBy("loopVenue")
			.map((g, venue) => ({ venue, teams: g.map(g => g.team).sort() }))
			.orderBy("venue", "desc")
			.map(({ teams, venue }) => [
				{
					text: `${teams.join(", ")} (${venue})`
				}
			])
			.value();

		if (loopGames.length) {
			return [
				[
					{
						text: "LOOP FIXTURES",
						isHeader: true
					}
				],
				...loopGames
			];
		}
	}

	async render(forTwitter = false) {
		this.drawBackground();

		await this.getTeamImages();

		this.drawFixtures();

		await this.drawMiddleColumn();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
