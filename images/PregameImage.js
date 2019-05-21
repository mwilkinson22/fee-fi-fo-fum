import Canvas from "./Canvas";
import _ from "lodash";
import mongoose from "mongoose";
const { localTeam } = require("../config/keys");

export default class PregameImage extends Canvas {
	constructor(game, options = {}) {
		//Set Dimensions
		const cWidth = 1400;
		const cHeight = cWidth / 2;

		//Load In Fonts
		const fonts = [
			{ file: "Montserrat-Bold.ttf", family: "Montserrat" },
			{ file: "TitilliumWeb-Bold.ttf", family: "Titillium" }
		];

		//Create Canvas
		super(cWidth, cHeight, { fonts });

		//Constants
		const positions = {
			bannerTop: Math.round(cHeight * 0.11),
			bannerHeight: Math.round(cHeight * 0.05),
			bannerText: Math.round(cHeight * 0.144),
			teamBlockTop: Math.round(cHeight * 0.22),
			teamBlockHeight: Math.round(cHeight * 0.71),
			badgeWidth: Math.round(cWidth * 0.2),
			badgeHeight: Math.round(cHeight * 0.4),
			badgeCutoff: 0.15,
			headerLeftIconOffset: Math.round(cWidth * 0.03),
			headerIconWidth: Math.round(cWidth * 0.1),
			headerIconHeight: Math.round(cHeight * 0.15),
			headerIconPadding: 0.1
		};
		positions.headerIconTop = Math.round(
			positions.bannerTop + positions.bannerHeight / 2 - positions.headerIconHeight / 2
		);
		positions.headerRightIconOffset = Math.round(
			cWidth - positions.headerLeftIconOffset - positions.headerIconWidth
		);
		this.positions = positions;

		const textStyles = {
			title: {
				size: cHeight * 0.07,
				family: "Montserrat"
			},
			subtitle: {
				size: cHeight * 0.025,
				family: "Titillium"
			},
			singleList: {
				size: cHeight * 0.042,
				family: "Montserrat"
			},
			doubleList: {
				size: cHeight * 0.03,
				family: "Montserrat"
			}
		};
		this.setTextStyles(textStyles);

		//Variables
		this.game = game;
		this.options = {
			singleTeam: options.singleTeam, //False, or a team id
			playerForImage: options.playerForImage !== "false" && options.playerForImage, //If undefined, unavailable or has no image, we choose randomly
			playersToHighlight: options.playersToHighlight.split(",")
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
			leftIcon = await this.googleToCanvas(`images/teams/${game.teams[localTeam].image}`);
		}

		if (leftIcon) {
			ctx.fillRect(
				positions.headerLeftIconOffset,
				positions.headerIconTop,
				positions.headerIconWidth,
				positions.headerIconHeight
			);
			const { width, height, offsetX, offsetY } = this.contain(
				positions.headerIconWidth * (1 - positions.headerIconPadding * 2),
				positions.headerIconHeight * (1 - positions.headerIconPadding * 2),
				leftIcon.width,
				leftIcon.height
			);
			ctx.drawImage(
				leftIcon,
				positions.headerLeftIconOffset +
					positions.headerIconWidth * positions.headerIconPadding +
					offsetX,
				positions.headerIconTop +
					positions.headerIconHeight * positions.headerIconPadding +
					offsetY,
				width,
				height
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
			const { width, height } = this.contain(
				positions.headerIconWidth * (1 - positions.headerIconPadding * 2),
				positions.headerIconHeight * (1 - positions.headerIconPadding * 2),
				rightIcon.width,
				rightIcon.height
			);
			ctx.drawImage(
				rightIcon,
				positions.headerRightIconOffset +
					positions.headerIconWidth * positions.headerIconPadding,
				positions.headerIconTop + positions.headerIconHeight * positions.headerIconPadding,
				width,
				height
			);
		}
	}

	async drawTeamBlock(team, align) {
		const { ctx, cWidth, cHeight, positions } = this;

		//Block
		ctx.fillStyle = team.colours.main;
		ctx.fillRect(
			align === "right" ? cWidth * 0.5 : 0,
			positions.teamBlockTop,
			align === "full" ? cWidth : cWidth * 0.5,
			positions.teamBlockHeight
		);

		//Badge
		if (team.image) {
			const badge = await this.googleToCanvas("images/teams/" + team.image);
			ctx.globalAlpha = 0.5;
			if (align === "full") {
				const { width, height } = this.contain(
					positions.badgeWidth * 2,
					positions.teamBlockHeight * 0.8,
					badge.width,
					badge.height
				);
				ctx.drawImage(
					badge,
					cWidth - width * 0.5,
					positions.teamBlockTop + positions.teamBlockHeight * 0.1,
					width,
					height
				);
			} else {
				const sx = align === "left" ? 0 : badge.width * positions.badgeCutoff;
				const sy = 0;
				const sWidth = badge.width * (1 - positions.badgeCutoff);
				const sHeight = badge.height;

				const { width, height } = this.contain(
					positions.badgeWidth,
					positions.badgeHeight,
					sWidth,
					sHeight
				);

				const dx = align === "left" ? cWidth * 0.5 - width : cWidth * 0.5;
				const dy = cHeight * 0.25;
				const dWidth = width;
				const dHeight = height;
				ctx.drawImage(badge, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
			}
			ctx.globalAlpha = 1;
		}
	}

	async drawPlayer(singleTeam) {
		const { ctx, game, options, cWidth, cHeight, colours } = this;
		const { squad } = _.find(game.pregameSquads, s => s._team == localTeam);
		const squadWithImages = _.filter(squad, s => s.image);
		const playerForImage =
			_.find(squadWithImages, p => p._id == options.playerForImage) ||
			_.sample(squadWithImages);

		const playerImage = await this.googleToCanvas("images/people/full/" + playerForImage.image);
		const { width, height } = this.contain(
			cWidth * 0.4,
			cHeight * 0.82,
			playerImage.width,
			playerImage.height
		);
		ctx.shadowBlur = 10;
		ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
		ctx.drawImage(
			playerImage,
			singleTeam ? 0 - width * 0.1 : (cWidth - width) / 2,
			cHeight - height,
			width,
			height
		);
		this.resetShadow();
	}

	getTeamList(team) {
		const { game } = this;
		const result = _.find(game.pregameSquads, s => s._team == team._id);
		if (result) {
			const { squad } = result;
			const numbers = _.find(
				team.squads,
				s => s.year == new Date(game.date).getFullYear() && s._teamType == game._teamType
			).players;
			return _.chain(squad)
				.map(player => {
					let number;
					const squadEntry = _.find(numbers, p => p._player == player._id);
					if (squadEntry) {
						number = squadEntry.number;
					}
					return {
						...player,
						number
					};
				})
				.sortBy(p => p.number || 999)
				.value();
		}
	}

	setTeamShadow(team) {
		const { ctx } = this;
		ctx.shadowBlur = 4;
		ctx.shadowColor = team.colours.main;
	}

	drawList(team) {
		const { ctx, cHeight, cWidth, options, textStyles } = this;
		const squad = this.getTeamList(team);

		//Set Text
		ctx.font = textStyles.singleList.string;
		ctx.textAlign = "left";
		this.setTeamShadow(team);

		//Set Positioning
		let numX = options.playerForImage ? Math.round(cWidth * 0.3) : Math.round(cWidth * 0.2);
		let nameX = numX + Math.round(textStyles.singleList.size * 1.7);
		const initialY = Math.round(cHeight * 0.34);
		let y = initialY;
		let widest = 0;

		_.each(squad, ({ name, number, id }, i) => {
			//Number
			ctx.fillStyle = ctx.fillStyle = team.colours.trim1;
			ctx.fillText(number || "", numX, y);

			//Name
			const isHighlighted = options.playersToHighlight.indexOf(id) > -1;
			ctx.fillStyle = isHighlighted ? team.colours.trim1 : team.colours.text;
			ctx.fillText(`${name.first} ${name.last}`.toUpperCase(), nameX, y);
			y += Math.round(textStyles.singleList.size * 1.3);

			//Update widest point
			const { width } = ctx.measureText(`${name.first} ${name.last}`);
			if (width > widest) {
				widest = width;
			}

			//Reset for second column
			if (i === Math.floor(squad.length / 2)) {
				numX = nameX + widest + Math.round(textStyles.singleList.size * 3);
				nameX = numX + Math.round(textStyles.singleList.size * 1.7);
				y = initialY;
			}
		});
	}

	drawLists() {
		const { teams, ctx, cHeight, cWidth, options, textStyles } = this;
		ctx.font = textStyles.doubleList.string;
		_.each(teams, (team, i) => {
			this.setTeamShadow(team);

			let nameX, numX, nameAlign, numAlign;
			let y = Math.round(cHeight * 0.28);
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

			const squad = this.getTeamList(team);
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
				y += Math.round(cHeight * 0.034);
			});
		});
	}

	async render(forTwitter = false) {
		const { ctx, cWidth, positions, teamIds, options } = this;

		//Populate Teams
		const Team = mongoose.model("teams");
		const teams = await Team.find(
			{ _id: { $in: teamIds } },
			"name colours hashtagPrefix squads image"
		);
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
		if (options.playerForImage !== false) {
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
