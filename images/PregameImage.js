import Canvas from "./Canvas";
import _ from "lodash";
import mongoose from "mongoose";
const { localTeam } = require("../config/keys");

//Removed from class so we can use it in constructor
function getTeamList(game, team) {
	const { pregameSquads, eligiblePlayers } = game;
	const result = _.find(pregameSquads, s => s._team == team);
	if (result) {
		const { squad } = result;
		return _.chain(squad)
			.map(player => {
				const squadEntry = _.find(
					eligiblePlayers[team._id],
					m => m._player._id == player._id
				);
				return {
					...player,
					number: squadEntry ? squadEntry.number : null
				};
			})
			.sortBy(p => p.number || 999)
			.value();
	}
}

export default class PregameImage extends Canvas {
	constructor(game, options = {}) {
		//Set Width
		const cWidth = 1400;

		//Constants
		const positions = {
			bannerTop: Math.round(cWidth * 0.055),
			bannerHeight: Math.round(cWidth * 0.025),
			bannerText: Math.round(cWidth * 0.072),
			teamBlockTop: Math.round(cWidth * 0.11),
			badgeWidth: Math.round(cWidth * 0.2),
			badgeHeight: Math.round(cWidth * 0.225),
			headerLeftIconOffset: Math.round(cWidth * 0.03),
			headerIconWidth: Math.round(cWidth * 0.1),
			headerIconHeight: Math.round(cWidth * 0.075),
			headerIconPadding: 0.1
		};
		positions.headerIconTop = Math.round(
			positions.bannerTop + positions.bannerHeight / 2 - positions.headerIconHeight / 2
		);
		positions.headerRightIconOffset = Math.round(
			cWidth - positions.headerLeftIconOffset - positions.headerIconWidth
		);

		//Set text list sizes
		let textRows;
		if (options.singleTeam) {
			positions.listPadding = Math.round(cWidth * 0.04);
			positions.listTextHeight = Math.round(cWidth * 0.021);
			positions.listTextMargin = positions.listTextHeight * 0.3;
			const players = getTeamList(game, options.singleTeam);
			textRows = Math.max(10, Math.ceil(players.length / 2));
		} else {
			positions.listTextHeight = Math.round(cWidth * 0.015);
			positions.listPadding = positions.listTextHeight;
			positions.listTextMargin = positions.listTextHeight * 0.14;
			const localPlayers = getTeamList(game, localTeam);
			const oppositionPlayers = getTeamList(game, game._opposition._id);
			textRows = Math.max(19, localPlayers.length, oppositionPlayers.length);
		}

		//Set Team Block Height
		positions.teamBlockHeight =
			//Top and bottom padding
			positions.listPadding * 2 +
			//Text + margin for each row
			textRows * (positions.listTextHeight + positions.listTextMargin);

		positions.listTop =
			positions.teamBlockTop + positions.listPadding + positions.listTextHeight;

		//Dynamically Set Height
		const cHeight =
			positions.teamBlockTop + positions.teamBlockHeight + Math.round(cWidth * 0.04);

		//Load In Fonts
		const fonts = [
			{ file: "Montserrat-Bold.ttf", family: "Montserrat" },
			{ file: "TitilliumWeb-Bold.ttf", family: "Titillium" }
		];

		//Create Canvas
		super(cWidth, cHeight, { fonts });
		this.positions = positions;

		const textStyles = {
			title: {
				size: cWidth * 0.035,
				family: "Montserrat"
			},
			subtitle: {
				size: cWidth * 0.0125,
				family: "Titillium"
			},
			list: {
				size: positions.listTextHeight,
				family: "Montserrat"
			}
		};
		this.setTextStyles(textStyles);

		//Variables
		this.game = game;
		this.options = {
			singleTeam: options.singleTeam, //False, or a team id
			playerForImage: options.playerForImage !== "false" && options.playerForImage,
			playersToHighlight: options.playersToHighlight
				? options.playersToHighlight.split(",")
				: []
		};
		const teamIds = [localTeam, game._opposition._id];
		this.teamIds = game.isAway ? teamIds.reverse() : teamIds;
	}

	drawBackground() {
		const { ctx, cWidth, cHeight } = this;
		ctx.fillStyle = "#EEE";
		ctx.fillRect(0, 0, cWidth, cHeight);
	}

	async drawHeader() {
		const { game, ctx, cWidth, positions, colours, teams, textStyles } = this;

		//Game Title
		ctx.fillStyle = colours.claret;
		const titleText = `${teams[0].name.short.toUpperCase()} vs ${teams[1].name.short.toUpperCase()}`;
		ctx.font = textStyles.title.string;
		ctx.textAlign = "center";
		ctx.fillText(titleText, cWidth * 0.5, positions.bannerTop);

		//Main Banner
		ctx.fillRect(0, positions.bannerTop, cWidth, positions.bannerHeight);

		//Subtitles
		ctx.font = textStyles.subtitle.string;
		ctx.fillStyle = "#FFF";

		const date = new Date(game.date).toString("ddd dS MMM - HH:mm");
		ctx.fillText(date, cWidth * 0.25, positions.bannerText);

		const ground = `${game._ground.name}, ${game._ground.address._city.name}`;
		ctx.fillText(ground, cWidth * 0.5, positions.bannerText);

		let hashtag = "#";
		if (game.hashtags && game.hashtags.length) {
			hashtag += game.hashtags[0];
		} else {
			hashtag += "CowbellArmy";
		}
		ctx.fillText(hashtag, cWidth * 0.75, positions.bannerText);

		//Left Icon
		ctx.fillStyle = "#EEE";
		let leftIcon;
		if (game.images.logo) {
			leftIcon = await this.googleToCanvas(game.images.logo);
		} else {
			leftIcon = await this.googleToCanvas(
				`images/teams/${_.find(this.teams, t => t._id == localTeam).images.main}`
			);
		}

		if (leftIcon) {
			ctx.fillRect(
				positions.headerLeftIconOffset,
				positions.headerIconTop,
				positions.headerIconWidth,
				positions.headerIconHeight
			);
			this.contain(
				leftIcon,
				positions.headerLeftIconOffset +
					positions.headerIconWidth * positions.headerIconPadding,
				positions.headerIconTop + positions.headerIconHeight * positions.headerIconPadding,
				positions.headerIconWidth * (1 - positions.headerIconPadding * 2),
				positions.headerIconHeight * (1 - positions.headerIconPadding * 2)
			);
		}

		//Right Icon
		const rightIcon = await this.googleToCanvas(
			"images/layout/branding/square-logo-with-shadow.png"
		);
		if (rightIcon) {
			ctx.fillRect(
				positions.headerRightIconOffset,
				positions.headerIconTop,
				positions.headerIconWidth,
				positions.headerIconHeight
			);
			this.contain(
				rightIcon,
				positions.headerRightIconOffset +
					positions.headerIconWidth * positions.headerIconPadding,
				positions.headerIconTop + positions.headerIconHeight * positions.headerIconPadding,

				positions.headerIconWidth * (1 - positions.headerIconPadding * 2),
				positions.headerIconHeight * (1 - positions.headerIconPadding * 2)
			);
		}
	}

	async drawTeamBlock(team, align) {
		const { ctx, cWidth, positions } = this;

		//Block
		ctx.fillStyle = team.colours.main;
		ctx.fillRect(
			align === "right" ? cWidth * 0.5 : 0,
			positions.teamBlockTop,
			align === "full" ? cWidth : cWidth * 0.5,
			positions.teamBlockHeight
		);

		//Badge
		if (team.images && team.images.main) {
			const badge = await this.googleToCanvas("images/teams/" + team.images.main);
			const y = positions.teamBlockTop + positions.teamBlockHeight * 0.1;
			ctx.globalAlpha = 0.5;
			if (align === "full") {
				this.contain(
					badge,
					cWidth - positions.badgeWidth,
					y,
					positions.badgeWidth * 2,
					positions.teamBlockHeight * 0.8,
					{ xAlign: "left" }
				);
			} else {
				const x = align === "left" ? cWidth * 0.5 - positions.badgeWidth : cWidth * 0.5;

				this.cover(badge, x, y, positions.badgeWidth, positions.badgeHeight, {
					xAlign: align
				});
			}
			ctx.globalAlpha = 1;
		}
	}

	async drawPlayer(singleTeam) {
		const { ctx, game, options, cWidth, cHeight } = this;
		const { squad } = _.find(game.pregameSquads, s => s._team == localTeam);
		const squadWithImages = _.filter(squad, s => s.images.player || s.images.main);
		const playerForImage =
			_.find(squadWithImages, p => p._id == options.playerForImage) ||
			_.sample(squadWithImages);

		const playerImage = await this.googleToCanvas(
			"images/people/full/" + (playerForImage.images.player || playerForImage.images.main)
		);

		//Positions
		const x = singleTeam ? 0 - cWidth * 0.05 : cWidth * 0.3;
		const y = cWidth * 0.09;
		const w = cWidth * 0.4;
		const h = cHeight - y;

		//Set Shadow
		ctx.shadowBlur = 10;
		ctx.shadowColor = "rgba(0, 0, 0, 0.6)";

		this.contain(playerImage, x, y, w, h);
		this.resetShadow();
	}

	setTeamShadow(team) {
		const { ctx } = this;
		ctx.shadowBlur = 4;
		ctx.shadowColor = team.colours.main;
	}

	drawList(team) {
		const { ctx, cWidth, game, options, positions, textStyles } = this;
		const squad = getTeamList(game, team._id);

		//Set Text
		ctx.font = textStyles.list.string;
		ctx.textAlign = "left";
		this.setTeamShadow(team);

		//Set Positioning
		let numX = options.playerForImage ? Math.round(cWidth * 0.3) : Math.round(cWidth * 0.075);
		let nameX = numX + Math.round(textStyles.list.size * 1.7);

		let y = positions.listTop;
		let widest = 0;

		_.each(squad, ({ name, number, id }, i) => {
			//Number
			ctx.fillStyle = ctx.fillStyle = team.colours.trim1;
			ctx.fillText(number || "", numX, y);

			//Name
			const isHighlighted = options.playersToHighlight.indexOf(id) > -1;
			ctx.fillStyle = isHighlighted ? team.colours.trim1 : team.colours.text;
			ctx.fillText(`${name.first} ${name.last}`.toUpperCase(), nameX, y);
			y += positions.listTextHeight + positions.listTextMargin;

			//Update widest point
			const { width } = ctx.measureText(`${name.first} ${name.last}`);
			if (width > widest) {
				widest = width;
			}

			//Reset for second column
			if (i === Math.floor(squad.length / 2)) {
				numX = nameX + widest + Math.round(textStyles.list.size * 4);
				nameX = numX + Math.round(textStyles.list.size * 1.7);
				y = positions.listTop;
			}
		});
	}

	drawLists() {
		const { teams, ctx, cWidth, game, options, positions, textStyles } = this;
		ctx.font = textStyles.list.string;
		_.each(teams, (team, i) => {
			this.setTeamShadow(team);

			let nameX, numX, nameAlign, numAlign;
			let y = positions.listTop;
			if (i === 0) {
				numAlign = "left";
				numX = Math.round(cWidth * 0.29);
				nameAlign = "right";
				nameX = Math.round(cWidth * 0.28);
			} else {
				numAlign = "right";
				numX = Math.round(cWidth * 0.71);
				nameAlign = "left";
				nameX = Math.round(cWidth * 0.72);
			}

			const squad = getTeamList(game, team._id);
			_.each(squad, ({ name, number, id }) => {
				//Number
				ctx.fillStyle = ctx.fillStyle = team.colours.trim1;
				ctx.textAlign = numAlign;
				ctx.fillText(number || "", numX, y);

				//Name
				const isHighlighted = options.playersToHighlight.indexOf(id) > -1;
				ctx.fillStyle = isHighlighted ? team.colours.trim1 : team.colours.text;
				ctx.textAlign = nameAlign;
				ctx.fillText(`${name.first} ${name.last}`.toUpperCase(), nameX, y);
				y += positions.listTextHeight + positions.listTextMargin;
			});
		});
	}

	async render(forTwitter = false) {
		const { ctx, cWidth, positions, teamIds, options } = this;

		//Populate Teams
		const Team = mongoose.model("teams");
		const teams = await Team.find({ _id: { $in: teamIds } }, "name colours images").lean();
		this.teams = _.map(teamIds, id => _.find(teams, t => t._id == id));

		//BG
		this.drawBackground();

		//Header
		await this.drawHeader();

		//Team Block Shadow
		ctx.shadowBlur = 10;
		ctx.shadowColor = "black";
		ctx.fillRect(0, positions.teamBlockTop, cWidth, positions.teamBlockHeight);
		this.resetShadow();

		//Team Block(s)
		const singleTeam = _.find(teams, t => t._id == options.singleTeam);
		if (singleTeam) {
			await this.drawTeamBlock(singleTeam, "full");
		} else {
			await this.drawTeamBlock(this.teams[0], "left");
			await this.drawTeamBlock(this.teams[1], "right");
		}

		//Player
		if (options.playerForImage) {
			await this.drawPlayer(Boolean(singleTeam));
		}

		//Team List(s)
		if (singleTeam) {
			this.drawList(singleTeam);
		} else {
			this.drawLists();
		}

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
