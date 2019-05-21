import _ from "lodash";
import Canvas from "./Canvas";
import { localTeam } from "~/config/keys";
import mongoose from "mongoose";

export default class SquadImage extends Canvas {
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
		const textStyles = {
			banner: {
				size: cHeight * 0.03,
				family: "Titillium"
			}
		};
		this.setTextStyles(textStyles);

		const sideBarWidth = Math.round(cWidth * 0.28);
		const sideBarIconX = Math.round(sideBarWidth * 0.1);
		const dividerWidth = Math.round(cWidth * 0.06);
		const mainPanelOffset = sideBarWidth + dividerWidth;
		this.positions = {
			sideBarWidth,
			sideBarIconX,
			sideBarIconWidth: sideBarWidth - sideBarIconX * 2,
			sideBarGameIconY: Math.round(cHeight * 0.03),
			sideBarGameIconHeight: Math.round(cHeight * 0.15),
			teamIconHeight: Math.round(cHeight * 0.15),
			dividerWidth,
			mainPanelOffset,
			mainPanelWidth: cWidth - mainPanelOffset,
			bannerY: Math.round(cHeight * 0.32),
			playerHeight: Math.round(cHeight * 0.17),
			playerWidth: Math.round(cWidth * 0.07)
		};
		this.positions.players = [
			[0.5, 0.1], //FB
			[0.185, 0.26], //RW
			[0.395, 0.26], //RC
			[0.605, 0.26], //LC
			[0.815, 0.26], //LW
			[0.36, 0.46], //SO
			[0.64, 0.46], //SH
			[0.22, 0.9], //P
			[0.5, 0.9], //HK
			[0.78, 0.9], //P
			[0.36, 0.75], //RSR
			[0.64, 0.75], //LSR
			[0.5, 0.63] //LF
		].map(p => this.processPlayerPositions(p));

		//Variables
		this.game = game;
		this.options = options;
	}

	processPlayerPositions([x, y]) {
		const { sideBarWidth, dividerWidth, mainPanelWidth } = this.positions;
		const newX = sideBarWidth + dividerWidth * 0.75 + Math.round(mainPanelWidth * x);
		const newY = Math.round(this.cHeight * y);
		return [newX, newY];
	}

	async drawBackground() {
		const { ctx, cWidth, cHeight } = this;
		const backgroundImage = await this.googleToCanvas(
			"images/layout/canvas/squad-image-bg.jpg"
		);
		ctx.drawImage(backgroundImage, 0, 0, cWidth, cHeight);
	}

	async drawSidebar() {
		const { ctx, game, textStyles, cWidth, cHeight, localTeamObject } = this;
		const {
			bannerY,
			sideBarWidth,
			sideBarIconX,
			sideBarIconWidth,
			sideBarGameIconY,
			sideBarGameIconHeight,
			teamIconHeight
		} = this.positions;

		//Add Game Logo
		const siteIcon = await this.googleToCanvas(
			"images/layout/branding/square-logo-with-shadow.png"
		);
		let gameIcon;
		if (game.images.logo) {
			gameIcon = await this.googleToCanvas(game.images.logo);

			//We have a gameIcon so we place the siteIcon on the right
			if (siteIcon) {
				const { width, height, offsetX, offsetY } = this.contain(
					sideBarIconWidth / 2,
					sideBarGameIconHeight * 0.6,
					siteIcon.width,
					siteIcon.height
				);
				ctx.drawImage(
					siteIcon,
					cWidth - width - offsetX - sideBarIconX / 2,
					sideBarGameIconY / 0.6 + offsetY,
					width,
					height
				);
			}
		} else {
			gameIcon = siteIcon;
		}

		if (gameIcon) {
			const { width, height, offsetX, offsetY } = this.contain(
				sideBarIconWidth,
				sideBarGameIconHeight,
				gameIcon.width,
				gameIcon.height
			);
			ctx.drawImage(
				gameIcon,
				sideBarIconX + offsetX,
				sideBarGameIconY + offsetY,
				width,
				height
			);
		}

		//Text Banners
		ctx.textAlign = "center";
		ctx.font = textStyles.banner.string;
		ctx.fillStyle = "#FFF";
		const bannerText = [];

		//Title
		bannerText.push([{ text: game.title }]);

		//Date/Time
		const date = new Date(this.game.date);
		bannerText.push([
			{ text: date.toString("HH:mm "), colour: "#FC0" },
			{ text: date.toString("dS MMMM yyyy"), colour: "#FFF" }
		]);

		//Ground
		bannerText.push([{ text: game._ground.name }]);

		//Hashtag
		const { hashtags } = game;
		bannerText.push([
			{ text: "#", colour: "#FC0" },
			{ text: hashtags ? hashtags[0] : "CowbellArmy", colour: "#FFF" }
		]);

		this.textBuilder(bannerText, sideBarWidth * 0.5, bannerY, {
			lineHeight: 2.7
		});

		//Team Badges
		const oppositionBadge = await this.googleToCanvas("images/teams/" + game._opposition.image);
		const localBadge = await this.googleToCanvas("images/teams/" + localTeamObject.image);
		let badges = [localBadge, oppositionBadge];
		if (game.isAway) {
			badges = badges.reverse();
		}
		badges.map((badge, i) => {
			const { width, height, offsetX, offsetY } = this.contain(
				sideBarIconWidth / 2,
				teamIconHeight,
				badge.width,
				badge.height
			);
			ctx.drawImage(
				badge,
				(i === 0 ? 0 : sideBarIconWidth / 2) + sideBarIconX + offsetX,
				cHeight - teamIconHeight - sideBarGameIconY + offsetY,
				width,
				height
			);
		});
	}

	async drawSquad() {
		const { playerStats, date, _teamType } = this.game;
		const { squads } = this.localTeamObject;

		//Get Squad Numbers
		const year = new Date(date).getFullYear();
		const squad = _.find(squads, s => s.year == year && s._teamType == _teamType);
		const squadNumbers = _.chain(squad.players)
			.keyBy("_player")
			.mapValues("number")
			.value();

		//Create Squad Object
		this.squad = _.chain(playerStats)
			.filter(s => s._team == localTeam)
			.sortBy("position")
			.map(({ _player }) => {
				const { name, nickname, displayNicknameInCanvases, _id } = _player;
				return {
					displayName: displayNicknameInCanvases && nickname ? nickname : name.last,
					number: squadNumbers[_id],
					..._player
				};
			})
			.value();

		//Fix duplicate names
		const duplicates = _.chain(this.squad)
			.groupBy("displayName")
			.filter(a => a.length > 1)
			.flatten()
			.map("_id")
			.value();

		_.each(this.squad, p => {
			if (_.find(duplicates, id => id == p._id)) {
				const { squadNameWhenDuplicate, name } = p;
				p.displayName =
					squadNameWhenDuplicate || `${name.first.substr(0, 1)}. ${name.last}`;
			}
		});

		//Draw Players
		for (const i in this.squad) {
			const player = this.squad[i];
			if (i < 13) {
				await this.drawStartingSquadMember(player, i);
			}
		}
	}

	async drawStartingSquadMember(player, position) {
		const { ctx, positions } = this;
		const { playerHeight, playerWidth, players } = positions;
		const [x, y] = players[position];
		const { image, displayName, number } = player;

		//Player Image
		const playerImage = await this.googleToCanvas(`images/people/full/${image || "blank.png"}`);
		const sx = 0;
		const sy = 0;
		const sw = playerImage.width;
		const sh = playerImage.width / (playerWidth / playerHeight);
		const dx = x - playerWidth / 2;
		const dy = y - playerHeight / 2;
		ctx.drawImage(playerImage, sx, sy, sw, sh, dx, dy, playerWidth, playerHeight);
	}

	async render(forTwitter = false) {
		const Team = mongoose.model("teams");
		this.localTeamObject = await Team.findById(localTeam, "image squads").lean();
		await this.drawBackground();
		await this.drawSidebar();
		await this.drawSquad();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
