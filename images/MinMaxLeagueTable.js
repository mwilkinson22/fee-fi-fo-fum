//Modules
import _ from "lodash";
import mongoose from "mongoose";
const Segment = mongoose.model("competitionSegments");
const Team = mongoose.model("teams");
const Settings = mongoose.model("settings");

//Canvas
import Canvas from "./Canvas";

//Helpers
import { processLeagueTableData } from "~/controllers/rugby/competitionController";

export default class MinMax extends Canvas {
	constructor(_segment, year, teamsToHighlight) {
		//This doesn't really matter as we'll be
		//resizing once we have teams
		const cWidth = 800;
		const cHeight = cWidth;

		//Load In Fonts
		const fonts = [
			{ file: "TitilliumWeb-SemiBold.ttf", family: "Titillium" },
			{ file: "TitilliumWeb-Bold.ttf", family: "Titillium Bold" },
			{ file: "Montserrat-Bold.ttf", family: "Montserrat" }
		];

		//Create Canvas
		super(cWidth, cHeight, { fonts });

		//Positions
		this.positions = {
			columnWidth: cWidth * 0.07,
			columnPadding: cWidth * 0.01,
			rowHeight: cHeight * 0.04,
			headerHeight: cHeight * 0.1,
			headerImageWidth: cWidth * 0.15
		};

		//Variables
		this._segment = _segment;
		this.year = year;
		this.teamsToHighlight = teamsToHighlight;

		//Constants
		const textStyles = {
			points: {
				size: this.positions.rowHeight * 0.5,
				family: "Titillium"
			},
			header: {
				size: this.positions.headerHeight * 0.4,
				family: "Montserrat"
			},
			subheader: {
				size: this.positions.headerHeight * 0.2,
				family: "Titillium"
			}
		};
		this.setTextStyles(textStyles);
		this.colours.lightClaret = "#a53552";
		this.columns = ["position", "_team", "Pld", "W", "D", "L", "F", "A", "Diff", "Pts"];
	}

	async getTeams() {
		const { instance } = this;

		//Get Teams
		const teams = await Team.find(
			{ _id: { $in: instance.teams } },
			"name colours images"
		).lean();

		//Create Team Object
		this.teams = _.keyBy(teams, "_id");

		//Add Images
		for (const team of teams) {
			this.teams[team._id].image = await this.googleToCanvas(
				`/images/teams/${team.images.main}`
			);
		}
	}

	calculateThresholds() {
		const { instance, tableData } = this;

		//First, loop through each team and work out their minimum + maximum points
		for (const team of tableData) {
			team.gamesToPlay = instance.totalRounds - team.Pld;
			team.maxPts = team.Pts + team.gamesToPlay * 2;
		}

		//Then we work out the maximum and minimum possible scores
		this.thresholds = {
			minPts: _.minBy(tableData, "Pts").Pts,
			maxPts: _.maxBy(tableData, "maxPts").maxPts
		};

		//Get the league boundaries
		this.leagueBoundaries = {};
		this.instance.leagueTableColours.forEach(c => {
			let value;
			if (c.className === "bottom") {
				value = Math.min(...c.position);
			} else {
				value = Math.max(...c.position);
			}

			this.leagueBoundaries[c.className] = value;
		});
	}

	drawBackground() {
		const { ctx, cWidth, cHeight } = this;
		ctx.fillStyle = "#e4e4e4";
		ctx.fillRect(0, 0, cWidth, cHeight);
	}

	async drawHeader() {
		const { colours, ctx, cWidth, instance, positions, segment, textStyles } = this;

		//Draw background
		ctx.fillStyle = instance.customStyling
			? instance.customStyling.backgroundColor
			: colours.claret;
		ctx.fillRect(0, 0, cWidth, positions.headerHeight);

		//Work out segment title
		const titleArr = [instance.year, instance.sponsor, segment._parentCompetition.name];
		if (segment.appendCompetitionName) {
			titleArr.push(segment.name);
		}
		const title = titleArr
			.filter(_.identity)
			.join(" ")
			.toUpperCase();

		//Draw Headers
		ctx.fillStyle = instance.customStyling ? instance.customStyling.color : "white";
		ctx.textAlign = "center";
		const maxWidth = cWidth - positions.headerImageWidth * 2;
		this.textBuilder(
			[
				[
					{
						text: title,
						font: textStyles.header.string,
						maxWidth
					}
				],
				[
					{
						text: `Minimum/Maximum Points By Team (as of ${new Date().toString(
							"dS MMMM"
						)})`,
						font: textStyles.subheader.string,
						maxWidth
					}
				]
			],
			cWidth / 2,
			positions.headerHeight / 2,
			{ lineHeight: 1.5 }
		);

		//Draw Competition Image
		const imagePadding = positions.headerImageWidth * 0.15;
		if (instance.image) {
			const instanceImage = await this.googleToCanvas(
				`images/competitions/${instance.image}`
			);
			this.contain(
				instanceImage,
				imagePadding,
				imagePadding,
				positions.headerImageWidth - imagePadding * 2,
				positions.headerHeight - imagePadding * 2,
				{ xAlign: "left" }
			);
		}

		//Draw Site Logo
		const siteLogo = await Settings.findOne({
			name: "site_logo"
		}).lean();
		const siteImage = await this.googleToCanvas(`images/layout/branding/${siteLogo.value}`);
		this.contain(
			siteImage,
			cWidth - positions.headerImageWidth + imagePadding,
			imagePadding,
			positions.headerImageWidth - imagePadding * 2,
			positions.headerHeight - imagePadding * 2,
			{ xAlign: "right" }
		);
	}

	drawPointsColumn() {
		const { ctx, positions, textStyles, thresholds } = this;

		ctx.fillStyle = "black";
		ctx.font = textStyles.points.string;

		let textY = positions.rowHeight * 1.25 + positions.headerHeight;
		for (let i = thresholds.maxPts; i >= thresholds.minPts; i--) {
			ctx.fillText(i, positions.columnWidth * 0.4, textY);
			textY += positions.rowHeight;
		}
	}

	drawTeamColumns() {
		const { ctx, positions, tableData, teams, thresholds } = this;

		let x = positions.columnWidth + positions.columnPadding / 2;
		let baseY = positions.rowHeight * 0.5 + positions.headerHeight;

		ctx.fillStyle = "black";
		for (const column of tableData) {
			//Get upper y value
			const rowsFromTop = thresholds.maxPts - column.maxPts;
			const y = baseY + rowsFromTop * positions.rowHeight;

			//Get height
			const h = positions.rowHeight * (column.maxPts - column.Pts + 1);

			//Get Team
			const team = teams[column._team];

			//Draw main bar
			ctx.fillStyle = team.colours.main;
			ctx.fillRect(x, y, positions.columnWidth, h);

			//Add Image
			let imageH = h - positions.rowHeight * 2;
			let imageY = y + positions.rowHeight;
			let maxHeightRelativeToColumn = 6;
			if (h > positions.columnWidth * maxHeightRelativeToColumn) {
				const initialImageH = imageH;
				imageH = positions.columnWidth * maxHeightRelativeToColumn;
				imageY += (initialImageH - imageH) / 2;
			}
			ctx.globalAlpha = 0.2;
			this.cover(team.image, x, imageY, positions.columnWidth, imageH);
			ctx.globalAlpha = 1;

			//Add min points
			ctx.fillStyle = team.colours.trim1;
			ctx.fillRect(
				x,
				y + h - positions.rowHeight,
				positions.columnWidth,
				positions.rowHeight
			);
			ctx.fillStyle = team.colours.main;
			ctx.fillText(
				column.Pts,
				x + positions.columnWidth / 2,
				y + h - positions.rowHeight * 0.25
			);

			//Add max points
			ctx.fillStyle = team.colours.trim1;
			ctx.fillRect(x, y, positions.columnWidth, positions.rowHeight);
			ctx.fillStyle = team.colours.main;
			ctx.fillText(
				column.maxPts,
				x + positions.columnWidth / 2,
				y + positions.rowHeight * 0.75
			);

			//Add outline
			ctx.strokeStyle = team.colours.trim1;
			ctx.lineWidth = 3;
			ctx.strokeRect(x, y, positions.columnWidth, h);

			//Increase x var
			x += positions.columnWidth + positions.columnPadding;
		}
	}

	async render(forTwitter = false) {
		const { positions, _segment, year } = this;

		//Call getSegments. This will loop when necessary,
		//to get _pointsCarriedFrom segments
		const segment = await Segment.findById(
			_segment,
			"instances _parentCompetition name appendCompetitionName"
		).populate({ path: "_parentCompetition", select: "name" });
		this.segment = JSON.parse(JSON.stringify(segment));

		//Get Instance
		this.instance = this.segment.instances.find(i => i.year == year);

		//Get Teams
		await this.getTeams();

		//Get Table
		this.tableData = await processLeagueTableData(_segment, year);

		//Work out thresholds
		this.calculateThresholds();

		//Set Canvas Width
		this.canvas.width = this.cWidth =
			(positions.columnWidth + positions.columnPadding) * (this.tableData.length + 1);
		//Set Canvas Height
		this.canvas.height = this.cHeight =
			positions.rowHeight * (this.thresholds.maxPts - this.thresholds.minPts + 2) +
			positions.headerHeight;

		this.drawBackground();
		await this.drawHeader();
		this.drawPointsColumn();
		this.drawTeamColumns();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
