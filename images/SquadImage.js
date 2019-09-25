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
			},
			interchangeHeader: {
				size: cHeight * 0.035,
				family: "Titillium"
			},
			interchange: {
				size: cHeight * 0.03,
				family: "Montserrat"
			},
			extraInterchange: {
				size: cHeight * 0.035,
				family: "Montserrat"
			},
			playerNameBar: {
				size: cHeight * 0.025,
				family: "Montserrat"
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
			playerWidth: Math.round(cWidth * 0.07),
			playerNameBarHeight: Math.round(cHeight * 0.04),
			playerNameBarRadius: Math.round(cHeight * 0.01),
			playerNameBarNumberWidth: Math.round(cWidth * 0.025),
			interchangeHeaderY: Math.round(cHeight * 0.5),
			interchangeHeader: Math.round(cHeight * 0.05)
		};
		this.positions.players = [
			[0.5, 0.1], //FB
			[0.14, 0.26], //RW
			[0.37, 0.26], //RC
			[0.63, 0.26], //LC
			[0.86, 0.26], //LW
			[0.33, 0.46], //SO
			[0.67, 0.46], //SH
			[0.2, 0.87], //P
			[0.5, 0.87], //HK
			[0.8, 0.87], //P
			[0.35, 0.75], //RSR
			[0.65, 0.75], //LSR
			[0.5, 0.63] //LF
		].map(p => this.processPlayerPositions(p));

		//Variables
		this.game = game;
		this.options = options;
		this.teamBadges = {
			[localTeam]: {},
			[game._opposition._id]: {}
		};
		this.extraInterchanges =
			_.filter(
				game.playerStats,
				s => s._team == (options.showOpposition ? game._opposition._id : localTeam)
			).length > 17;
	}

	processPlayerPositions([x, y]) {
		const { sideBarWidth, dividerWidth, mainPanelWidth } = this.positions;
		const newX = sideBarWidth + dividerWidth * 0.75 + Math.round(mainPanelWidth * x);
		const newY = Math.round(this.cHeight * y);
		return [newX, newY];
	}

	async loadTeamImages() {
		const { game, options } = this;
		//Get Team Badges
		const Team = mongoose.model("teams");
		const localTeamObject = await Team.findById(localTeam, "images").lean();

		this.teamBadges[localTeam].dark = await this.googleToCanvas(
			`images/teams/${localTeamObject.images.dark || localTeamObject.images.main}`
		);
		this.teamBadges[game._opposition._id].dark = await this.googleToCanvas(
			`images/teams/${game._opposition.images.dark || game._opposition.images.main}`
		);

		if (options.showOpposition) {
			const { _id, images } = game._opposition;
			let image;
			if (!images.light && !images.dark) {
				//If we don't have light/dark variants, we've already loaded the main image and can copy it
				image = this.teamBadges[_id].dark;
			} else {
				//Otherwise, load either the light or main one
				image = await this.googleToCanvas(`images/teams/${images.light || images.main}`);
			}
			this.teamBadges[_id].light = image;
		}
	}

	async drawBackground() {
		const { ctx, cWidth, cHeight } = this;
		const backgroundImage = await this.googleToCanvas(
			"images/layout/canvas/squad-image-bg.jpg"
		);
		ctx.drawImage(backgroundImage, 0, 0, cWidth, cHeight);
	}

	async drawSidebar() {
		const { ctx, game, textStyles, cWidth, cHeight, teamBadges, extraInterchanges } = this;
		const {
			bannerY,
			sideBarWidth,
			sideBarIconX,
			sideBarIconWidth,
			sideBarGameIconY,
			sideBarGameIconHeight,
			teamIconHeight,
			interchangeHeaderY
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
				this.contain(
					siteIcon,
					cWidth - sideBarIconX / 2,
					sideBarGameIconY / 0.6,
					sideBarIconWidth / 2,
					sideBarGameIconHeight * 0.6
				);
			}
		} else {
			gameIcon = siteIcon;
		}

		if (gameIcon) {
			this.contain(
				gameIcon,
				sideBarIconX,
				sideBarGameIconY,
				sideBarIconWidth,
				sideBarGameIconHeight
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

		//Team Badges (limit to 17-man squads)
		if (!extraInterchanges) {
			let badges = [teamBadges[localTeam].dark, teamBadges[game._opposition._id].dark];
			if (game.isAway) {
				badges = badges.reverse();
			}
			badges.map((badge, i) => {
				this.contain(
					badge,
					(i === 0 ? 0 : sideBarIconWidth / 2) + sideBarIconX,
					cHeight - teamIconHeight - sideBarGameIconY,
					sideBarIconWidth / 2,
					teamIconHeight
				);
			});
		}

		//Interchanges Header
		ctx.fillStyle = this.colours.claret;
		ctx.font = textStyles.interchangeHeader.string;
		ctx.fillText("INTERCHANGES", sideBarWidth / 2, interchangeHeaderY);
	}

	async drawSquad() {
		const { cHeight, positions, options, game } = this;
		const { eligiblePlayers, playerStats } = this.game;

		//Create Squad Object
		const filterTeam = options.showOpposition ? game._opposition._id : localTeam;
		this.squad = _.chain(playerStats)
			.filter(s => s._team == filterTeam)
			.sortBy("position")
			.map(({ _player }) => {
				const { name, nickname, displayNicknameInCanvases, _id } = _player;
				const squadEntry = _.find(eligiblePlayers[filterTeam], m => m._player._id == _id);
				return {
					displayName: displayNicknameInCanvases && nickname ? nickname : name.last,
					number: squadEntry && squadEntry.number ? squadEntry.number : "",
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

			p.displayName = p.displayName.toUpperCase();
		});

		//Draw Players
		let interchangeY = Math.round(cHeight * 0.565);
		for (const i in this.squad) {
			const player = this.squad[i];
			if (i < 13) {
				await this.drawStartingSquadMember(player, i);
			} else if (!this.extraInterchanges) {
				this.drawInterchange(player, interchangeY);
				interchangeY += Math.round(cHeight * 0.065);
			}
		}

		//Longer interchange list
		if (this.extraInterchanges) {
			const interchangeList = _.chain(this.squad)
				.map(({ number, name }, i) => {
					if (i < 13) {
						return null;
					} else {
						return [
							{
								text: `${number ? `${number}. ` : ""}${name.full.toUpperCase()}`,
								font: this.textStyles.extraInterchange
							}
						];
					}
				})
				.filter(_.identity)
				.value();

			this.textBuilder(
				interchangeList,
				positions.sideBarWidth * 0.5,
				Math.round(cHeight * 0.74),
				{ lineHeight: 1.8 }
			);
		}
	}

	async drawStartingSquadMember(player, position) {
		const { ctx, positions, textStyles, colours, options, teamBadges, game } = this;
		const {
			playerHeight,
			playerWidth,
			players,
			playerNameBarHeight,
			playerNameBarRadius,
			playerNameBarNumberWidth
		} = positions;
		const [x, y] = players[position];
		const { images, displayName, number, gender } = player;

		//Player Image
		const dx = x - playerWidth / 2;
		const dy = y - playerHeight / 2;
		if (options.showOpposition) {
			this.contain(
				teamBadges[game._opposition._id].light,
				dx,
				dy + playerNameBarHeight / 2,
				playerWidth,
				playerHeight - playerNameBarHeight
			);
		} else {
			const playerImage = await this.googleToCanvas(
				`images/people/full/${images.player || images.main || `blank-${gender}.png`}`
			);
			const sx = 0;
			const sy = 0;
			const sw = playerImage.width;
			const sh = playerImage.width / (playerWidth / playerHeight);
			ctx.shadowBlur = 15;
			ctx.shadowColor = "black";
			ctx.drawImage(playerImage, sx, sy, sw, sh, dx, dy, playerWidth, playerHeight);
		}

		//Get Box Sizes
		ctx.font = textStyles.playerNameBar.string;
		const { width: nameWidth, actualBoundingBoxAscent: nameHeight } = ctx.measureText(
			displayName
		);
		const nameBoxWidth = Math.max(nameWidth, playerWidth) + playerNameBarNumberWidth / 2;
		const totalBoxWidth = nameBoxWidth + playerNameBarNumberWidth;
		const numberBoxX = x - totalBoxWidth / 2;
		const nameBoxX = numberBoxX + playerNameBarNumberWidth;
		const boxY = y + playerHeight / 2 - playerNameBarHeight;
		const textY = boxY + playerNameBarHeight / 2 + nameHeight / 2;

		//Draw Box Shadow
		ctx.fillStyle = "red";
		ctx.shadowBlur = 10;
		ctx.shadowColor = "#000000AA";
		ctx.shadowOffsetY = 10;
		this.fillRoundedRect(
			numberBoxX,
			boxY,
			totalBoxWidth,
			playerNameBarHeight,
			playerNameBarRadius
		);

		this.resetShadow();

		//Draw Number Box
		if (options.showOpposition) {
			ctx.fillStyle = game._opposition.colours.text;
		} else {
			ctx.fillStyle = colours.claret;
		}
		this.fillRoundedRect(
			numberBoxX,
			boxY,
			playerNameBarNumberWidth,
			playerNameBarHeight,
			playerNameBarRadius,
			{
				topRight: 0,
				bottomRight: 0
			}
		);

		//Draw Name box
		if (options.showOpposition) {
			ctx.fillStyle = game._opposition.colours.main;
		} else {
			ctx.fillStyle = "#F4F4F4";
		}
		this.fillRoundedRect(
			nameBoxX,
			boxY,
			nameBoxWidth,
			playerNameBarHeight,
			playerNameBarRadius,
			{
				topLeft: 0,
				bottomLeft: 0
			}
		);

		//Add Number
		if (options.showOpposition) {
			ctx.fillStyle = game._opposition.colours.main;
		} else {
			ctx.fillStyle = colours.gold;
		}
		ctx.textAlign = "center";
		ctx.fillText(number, numberBoxX + playerNameBarNumberWidth / 2, textY);

		//Add Name
		if (options.showOpposition) {
			ctx.fillStyle = game._opposition.colours.text;
		} else {
			ctx.fillStyle = colours.claret;
		}
		ctx.fillText(displayName, nameBoxX + nameBoxWidth / 2, textY);
	}

	drawInterchange({ number, displayName }, y) {
		const { ctx, positions, colours, textStyles } = this;
		const { sideBarWidth } = positions;

		const numberBoxXCentre = sideBarWidth * 0.27;
		const numberBoxSize = textStyles.interchange.size * 1.75;

		//Add Box
		ctx.fillStyle = colours.claret;
		ctx.fillRect(
			numberBoxXCentre - numberBoxSize / 2,
			y - numberBoxSize / 2 - textStyles.interchange.size * 0.3,
			numberBoxSize,
			numberBoxSize
		);

		//Set Font
		ctx.font = textStyles.interchange.string;

		//Add Number
		ctx.textAlign = "center";
		ctx.fillStyle = colours.gold;
		ctx.fillText(number, numberBoxXCentre, y);

		//Add Name
		ctx.textAlign = "left";
		ctx.fillStyle = colours.claret;
		ctx.fillText(displayName, sideBarWidth * 0.34, y);
	}

	async render(forTwitter = false) {
		await this.loadTeamImages();
		await this.drawBackground();
		await this.drawSidebar();
		await this.drawSquad();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
