//Canvas
import Canvas from "./Canvas";

//Helpers
import { processLeagueTableData } from "~/controllers/rugby/competitionController";

export default class LeagueTable extends Canvas {
	constructor(_segment, year, teamsToHighlight, options = {}) {
		//Set Dimensions
		const cWidth = 1000;

		//This doesn't really matter as we'll be
		//resizing once we have teams
		const cHeight = 1000;

		//Load In Fonts
		const fonts = [
			{ file: "TitilliumWeb-Regular.ttf", family: "Titillium" },
			{ file: "TitilliumWeb-SemiBold.ttf", family: "Titillium Semi" },
			{ file: "TitilliumWeb-Bold.ttf", family: "Titillium Bold" }
		];

		//Create Canvas
		super(cWidth, cHeight, { fonts });

		//Positions
		this.positions = {
			imagePadding: cWidth * 0.015,
			rowHeight: cWidth * 0.08,
			standardColumnWidth: cWidth * 0.07
		};

		//Variables
		this._segment = _segment;
		this.year = year;
		this.teamsToHighlight = teamsToHighlight;
		this.options = options;

		//Constants
		const textSize = this.positions.rowHeight * 0.35;
		const textStyles = {
			regular: {
				size: textSize,
				family: "Titillium"
			},
			diffPc: {
				size: textSize * 0.8,
				family: "Titillium"
			},
			semi: {
				size: textSize,
				family: "Titillium Semi"
			},
			bold: {
				size: textSize,
				family: "Titillium Bold"
			}
		};
		this.setTextStyles(textStyles);
		this.colours.lightClaret = "#a53552";
	}

	async getTeamImages() {
		const { tableData } = this;

		//Add Images
		for (const row of tableData.rowData) {
			row.team.image = await this.googleToCanvas(`/images/teams/${row.team.images.main}`);
		}
	}

	async drawHeader() {
		const { columns, ctx, cWidth, positions, tableData, textStyles } = this;
		const { customStyling, image } = tableData.settings;

		//Draw Background
		ctx.fillStyle = customStyling.backgroundColor || "#111";
		ctx.fillRect(0, 0, cWidth, positions.rowHeight * 1.5);

		//Add Logo
		if (image) {
			const logo = await this.googleToCanvas(`/images/competitions/${image}`);
			this.contain(
				logo,
				positions.imagePadding,
				positions.imagePadding,
				cWidth * 0.5,
				positions.rowHeight * 1.5 - positions.imagePadding * 2,
				{
					xAlign: "left"
				}
			);
		}

		//Add Column Headers
		//Do it in reverse, so we can simply break out once we reach _team
		ctx.textAlign = "center";
		ctx.fillStyle = customStyling.color;
		ctx.font = textStyles.bold.string;
		let textX = cWidth - positions.standardColumnWidth * 0.65;
		const textY = positions.rowHeight;
		const reversedColumns = [...columns].reverse();
		for (const column of reversedColumns) {
			//Stop once we get to team
			if (column === "team") {
				break;
			}

			//Right padding for Win %
			if (column === "Win %") {
				textX -= positions.standardColumnWidth / 4;
			}

			//Draw Text
			ctx.fillText(column, textX, textY);

			//Update textX
			textX -= positions.standardColumnWidth;

			//Left padding for Win %
			if (column === "Win %") {
				textX -= positions.standardColumnWidth / 4;
			}
		}
	}

	drawRows() {
		const { columns, colours, ctx, cWidth, positions, tableData, teamsToHighlight, textStyles } = this;

		for (const row of tableData.rowData) {
			let background, colour;
			switch (row.className) {
				case "champions":
					background = "#518c56";
					colour = "#FFF";
					break;
				case "top":
					background = "#77b66b";
					colour = "#FFF";
					break;
				case "bottom":
					background = "#b63c3d";
					colour = "#FFF";
					break;
				default:
					background = "#F4F4F4";
					colour = "#000";
					break;
			}

			//Draw Background
			ctx.fillStyle = background;
			const rowY = positions.rowHeight * (row.position + 0.5);
			const rowBackgroundParams = [0, rowY, cWidth, positions.rowHeight];
			ctx.fillRect(...rowBackgroundParams);

			//Add semitransparent overlay to even rows
			if (row.position % 2 === 0) {
				ctx.fillStyle = "#2222220B";
				ctx.fillRect(...rowBackgroundParams);
			}

			//Add highlight
			if (teamsToHighlight.includes(row.team._id.toString())) {
				ctx.fillStyle = colours.gold;
				ctx.fillRect(0, rowY, positions.rowHeight * 0.1, positions.rowHeight);
			}

			//Add Columns
			let textX = 0;
			const textY = positions.rowHeight * (row.position + 1.15);
			ctx.fillStyle = colour;
			columns.forEach(column => {
				if (column === "team") {
					//Set Alignment
					ctx.textAlign = "left";

					//Set Font
					ctx.font = textStyles.semi.string;

					//Get Team
					const { team } = row;

					//Add Badge
					const imageSize = positions.rowHeight - positions.imagePadding * 2;
					this.contain(
						team.image,
						textX + positions.imagePadding,
						positions.rowHeight * (row.position + 0.5) + positions.imagePadding,
						imageSize
					);

					//Add Text
					ctx.fillText(team.name.short, textX + imageSize + positions.standardColumnWidth * 0.5, textY);

					//Update textX
					let otherColumns = columns.length - 1;

					//Add extra space for Win % & Diff %
					if (columns.includes("Win %")) {
						otherColumns += 0.5;
					}

					textX +=
						cWidth - otherColumns * positions.standardColumnWidth - positions.standardColumnWidth * 0.15;
				} else {
					//Set Alignment
					ctx.textAlign = "center";

					//Set Font
					const useBold = ["position", tableData.settings.usesWinPc ? "Win %" : "Pts"].indexOf(column) > -1;
					let style;
					if (column === "Diff %") {
						style = "diffPc";
					} else if (useBold) {
						style = "bold";
					} else {
						style = "regular";
					}
					ctx.font = textStyles[style].string;

					//Get Value
					let value;
					if (column === "Win %") {
						value = Number(row.WinPc.toFixed(2)) + "%";
						textX += positions.standardColumnWidth / 4;
					} else if (column === "Diff %") {
						value = Number(row.DiffPc.toFixed(2)) + "%";
					} else {
						value = row[column];
					}

					//Add Text
					ctx.fillText(value, textX + positions.standardColumnWidth * 0.5, textY);

					//Update textX
					textX += positions.standardColumnWidth;
				}
			});
		}
	}

	async render(forTwitter = false) {
		const { positions, _segment, options, year } = this;

		//Get Table
		this.tableData = await processLeagueTableData(_segment, year, options);

		//Set Columns
		this.columns = ["position", "team", "Pld", "W", "D", "L", "F", "A"];

		//Handle win pc
		let w = this.cWidth;
		const { usesWinPc } = this.tableData.settings;
		if (usesWinPc) {
			w += positions.standardColumnWidth * 1.5;
			this.columns.push("Pts", "Diff %", "Win %");
		} else {
			this.columns.push("Diff", "Pts");
		}
		this.resizeCanvas(w, positions.rowHeight * (this.tableData.rowData.length + 1.5));

		//Get Teams
		await this.getTeamImages();

		//Draw Header
		await this.drawHeader();

		//Draw Row Backgrounds
		this.drawRows();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
