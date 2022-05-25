//Modules
import _ from "lodash";
import mongoose from "mongoose";
const Team = mongoose.model("teams");

//Canvas
import Canvas from "./Canvas";

//Constants
import { localTeam } from "~/config/keys";
import playerStatTypes from "~/constants/playerStatTypes";

//Helpers
import { calculateAdditionalStats, statToString } from "~/helpers/statsHelper";
import { applyPreviousIdentity } from "~/helpers/teamHelper";

export default class TeamStatsImage extends Canvas {
	constructor(game, statTypes) {
		//Set Width
		const cWidth = 800;

		//Set Row Dimensions
		const rowHeight = Math.round(cWidth * 0.13);
		const cHeight = rowHeight * (statTypes.length + 1);

		//Load In Fonts
		const fonts = [
			{ file: "Montserrat-Bold.ttf", family: "Montserrat" },
			{ file: "TitilliumWeb-Regular.ttf", family: "Titillium" },
			{ file: "TitilliumWeb-Bold.ttf", family: "Titillium-Bold" }
		];

		//Create Canvas
		super(cWidth, cHeight, { fonts });

		//Assign positions to class
		this.positions = {
			rowHeight,
			leftColumnCentre: cWidth * 0.15,
			statBarX: cWidth * 0.05
		};
		this.positions.rightColumnCentre = cWidth - this.positions.leftColumnCentre;

		//Text Styles
		const textStyles = {
			statType: {
				size: Math.round(rowHeight * 0.3),
				family: "Montserrat"
			},
			value: {
				size: Math.round(rowHeight * 0.24),
				family: "Titillium"
			},
			boldValue: {
				size: Math.round(rowHeight * 0.24),
				family: "Titillium-Bold"
			}
		};
		this.setTextStyles(textStyles);

		//Colours
		this.colours.lightClaret = "#a53552";

		//Variables
		this.game = JSON.parse(JSON.stringify(game));
		this.statTypes = statTypes;
	}

	async getTeamInfo() {
		const { date, isAway, _opposition } = this.game;

		//Get the local team object
		const localTeamObject = await Team.findById(localTeam, "name images colours previousIdentities").lean();

		const gameYear = new Date(date).getFullYear();
		applyPreviousIdentity(gameYear, localTeamObject);
		applyPreviousIdentity(gameYear, _opposition);

		//Get team images. The background colour should correspond
		//to the local team, so we can just use the main image
		localTeamObject.badge = await this.googleToCanvas(`images/teams/${localTeamObject.images.main}`);
		_opposition.badge = await this.googleToCanvas(
			`images/teams/${_opposition.images.light || _opposition.images.main}`
		);

		//Assign to array
		this.teams = [localTeamObject, _opposition];
		if (isAway) {
			this.teams.reverse();
		}
	}

	drawTableHeader() {
		const { colours, ctx, cWidth, positions, teams } = this;
		const { rowHeight } = positions;

		//Draw Header BG
		ctx.fillStyle = colours.claret;
		ctx.fillRect(0, 0, cWidth, rowHeight);

		//Add team badges
		teams.forEach(({ badge }, i) => {
			const width = cWidth * 0.3;
			const x = i === 0 ? 0 : cWidth - width;
			this.contain(badge, x, rowHeight * 0.1, width, rowHeight * 0.8);
		});
	}

	drawRows() {
		const { ctx, cWidth, game, positions, statTypes, teams, textStyles } = this;
		const { leftColumnCentre, rightColumnCentre, rowHeight, statBarX } = positions;

		const stats = _.chain(game.playerStats)
			.groupBy("_team")
			.mapValues(obj => {
				const stats = _.map(obj, "stats");
				const summedStats = _.fromPairs(Object.keys(playerStatTypes).map(key => [key, _.sumBy(stats, key)]));
				return calculateAdditionalStats(summedStats);
			})
			.value();

		//Set the initial y to be row height (as we've already added the header)
		let y = rowHeight;

		//Loop the stat types and add rows
		statTypes.forEach((key, i) => {
			const { moreIsBetter, plural } = playerStatTypes[key];

			//Alternate row background
			ctx.fillStyle = i % 2 ? "#F2F2F2" : "#E4E4E4";

			//Draw row background
			ctx.fillRect(0, y, cWidth, rowHeight);

			//Add stat name
			ctx.fillStyle = "#333";
			ctx.font = textStyles.statType.string;
			this.textBuilder([[{ text: plural.toUpperCase() }]], cWidth * 0.5, y + rowHeight * 0.3);

			//Get values for this stat
			const values = teams.map(({ _id }) => stats[_id][key]);

			//Work out which needs highlighting
			values.map((value, i) => {
				//Get x value based on column
				const x = i === 0 ? leftColumnCentre : rightColumnCentre;

				//Get font based on value
				const useBoldFont = value === (moreIsBetter ? _.max(values) : _.min(values));
				ctx.font = textStyles[useBoldFont ? "boldValue" : "value"].string;

				//Convert value to string
				const text = statToString(key, value, 2);

				this.textBuilder([[{ text }]], x, y + rowHeight * 0.3);
			});

			//Work out the percentage for each team
			const total = values[0] + values[1];
			let percentages;
			if (total === 0) {
				percentages = [0.5, 0.5];
			} else {
				//We round off the home team's percentage to prevent awkward
				//decimals, accurate enough for a progress bar
				percentages = values.map(val => Math.round((val / total) * 100) / 100);
			}

			//Define stat bar dimensions
			const statBarY = y + rowHeight * 0.6;
			const statBarHeight = rowHeight * 0.2;
			const statBarWidth = cWidth - statBarX * 2;
			const statBarRadius = 10;

			//Draw a full home bar
			if (percentages[0]) {
				ctx.fillStyle = teams[0].colours.statBarColour || teams[0].colours.main;
				this.fillRoundedRect(
					statBarX,
					statBarY,
					statBarWidth - statBarRadius * 2,
					statBarHeight,
					statBarRadius
				);
			}

			//Draw an away bar as needed
			if (percentages[1]) {
				ctx.fillStyle = teams[1].colours.statBarColour || teams[1].colours.main;

				//Override radius where necessary
				const options = {};
				if (percentages[0]) {
					options.topLeft = 0;
					options.bottomLeft = 0;
				}

				const adjustedX = statBarX + statBarWidth * percentages[0];

				this.fillRoundedRect(
					adjustedX,
					statBarY,
					statBarWidth - adjustedX + statBarRadius * 2,
					statBarHeight,
					statBarRadius,
					options
				);
			}

			//Increase y
			y += rowHeight;
		});
	}

	async render(forTwitter = false) {
		await this.getTeamInfo();

		this.drawTableHeader();
		this.drawRows();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
