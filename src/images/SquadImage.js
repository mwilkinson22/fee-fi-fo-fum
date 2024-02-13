import _ from "lodash";
import Canvas from "./Canvas";
import { localTeam } from "~/config/keys";
import mongoose from "mongoose";
import { applyPreviousIdentity } from "~/helpers/teamHelper";
import { getOrdinalNumber } from "~/helpers/genericHelper";
const Settings = mongoose.model("settings");

export default class SquadImage extends Canvas {
	constructor(players, options = {}) {
		//Set Dimensions
		const cWidth = 1200;
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
		const sideBarIconWidth = Math.round(sideBarWidth * 0.3);
		const dividerWidth = Math.round(cWidth * 0.06);
		const mainPanelOffset = sideBarWidth + dividerWidth;
		this.positions = {
			sideBarWidth,
			sideBarIconWidth,
			sideBarIconX: Math.round(sideBarWidth / 2 - sideBarIconWidth / 2),
			sideBarIconY: Math.round(cHeight * 0.045),
			sideBarIconHeight: Math.round(cHeight * 0.12),
			rightBrandIconWidth: Math.round(cWidth * 0.1),
			rightBrandIconHeight: Math.round(cWidth * 0.05),
			dividerWidth,
			mainPanelOffset,
			mainPanelWidth: cWidth - mainPanelOffset,
			bannerY: Math.round(cHeight * 0.32),
			playerHeight: Math.round(cHeight * 0.17),
			playerWidth: Math.round(cWidth * 0.095),
			playerNameBarHeight: Math.round(cHeight * 0.04),
			playerNameBarRadius: Math.round(cHeight * 0.01),
			playerNameBarNumberWidth: Math.round(cWidth * 0.025),
			interchangeHeaderY: Math.round(cHeight * 0.52),
			interchangeHeader: Math.round(cHeight * 0.05),
			standardInterchangeYGap: Math.round(cHeight * 0.062)
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
		this.players = players;
		this.game = options.game;
		this.selector = options.selector;
		this.options = options;
		this.teamBadges = {};
		this.teamBadges[localTeam] = {};

		// Sometimes this is defined in the selector settings. If not, we check the game.
		this.usesExtraInterchange = this.selector ? this.selector.usesExtraInterchange : false;

		if (this.game) {
			this.teamBadges[this.game._opposition._id] = {};
			if (this.usesExtraInterchange == null && this.game._competition.instance) {
				this.usesExtraInterchange = this.game._competition.instance.usesExtraInterchange;
			}
		}

		this.expectedTeamLength = this.usesExtraInterchange ? 18 : 17;

		//If we have the expected team length including an extra interchange
		this.hasExtraInterchange = this.usesExtraInterchange && players.length == this.expectedTeamLength;

		//If we have more than the expected team length
		this.compressInterchangeList = players.length > this.expectedTeamLength;

		if (!this.compressInterchangeList && !this.hasExtraInterchange) {
			this.positions.interchangeHeaderY += Math.round(cHeight * 0.03);
			this.positions.standardInterchangeYGap += Math.round(this.positions.standardInterchangeYGap * 0.2);
		}
	}

	async getBranding() {
		const settings = await Settings.find({
			name: { $in: ["site_social", "site_logo"] }
		}).lean();
		this.branding = _.fromPairs(settings.map(({ name, value }) => [name, value]));
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
		let localTeamObject = await Team.findById(localTeam, "images previousIdentities").lean();

		//Apply previous identities
		if (game) {
			const gameYear = new Date(game.date).getFullYear();
			localTeamObject = applyPreviousIdentity(gameYear, localTeamObject);
			game._opposition = applyPreviousIdentity(gameYear, game._opposition);
		}

		//First, load the 'dark' image to be shown in the sidebar
		this.teamBadges[localTeam].dark = await this.googleToCanvas(`images/teams/${localTeamObject.images.dark || localTeamObject.images.main}`);

		//If it's directly linked to a game, then we also load the
		//opposition dark image
		if (game) {
			this.teamBadges[game._opposition._id].dark = await this.googleToCanvas(
				`images/teams/${game._opposition.images.dark || game._opposition.images.main}`
			);

			//If we're showing the opposition players, then we
			//also need the light variant to show in lieu of player images
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
	}

	async drawBackground() {
		const { ctx, cWidth, cHeight } = this;
		const backgroundImage = await this.googleToCanvas("images/layout/canvas/squad-image-bg.jpg");
		ctx.drawImage(backgroundImage, 0, 0, cWidth, cHeight);
	}

	async drawSidebar() {
		const { ctx, game, textStyles, cWidth, cHeight, teamBadges, compressInterchangeList, players, options, selector, branding } = this;
		const {
			bannerY,
			sideBarWidth,
			sideBarIconX,
			sideBarIconWidth,
			sideBarIconY,
			sideBarIconHeight,
			interchangeHeaderY,
			rightBrandIconWidth,
			rightBrandIconHeight
		} = this.positions;

		//Determine whether we need to show interchanges
		const showInterchanges = players.length > 13;

		//Add Main Logo
		const brandIcon = await this.googleToCanvas(`images/layout/branding/${branding.site_logo}`);

		let mainIcon;
		if (game && game.images.logo) {
			//If we have a game with its own icon (custom or based on competition),
			//we use this as the main icon
			mainIcon = await this.googleToCanvas(game.images.logo);

			//We have a mainIcon so we place the brandIcon on the right
			if (brandIcon) {
				const border = Math.round(cHeight * 0.04);
				this.contain(brandIcon, cWidth - rightBrandIconWidth - border, border, rightBrandIconWidth, rightBrandIconHeight, {
					xAlign: "right",
					yAlign: "top"
				});
			}
		} else {
			//Otherwise, we use the brandIcon as the main icon
			mainIcon = brandIcon;
		}

		if (mainIcon) {
			this.contain(mainIcon, sideBarIconX, sideBarIconY, sideBarIconWidth, sideBarIconHeight);
		}

		//Add team badges
		if (game) {
			let badges = [teamBadges[localTeam].dark, teamBadges[game._opposition._id].dark];
			if (game.isAway) {
				badges = badges.reverse();
			}
			badges.map((badge, i) => {
				const x = i == 0 ? sideBarIconX - sideBarIconWidth : sideBarIconX + sideBarIconWidth;
				this.contain(badge, x, sideBarIconY, sideBarIconWidth, sideBarIconHeight);
			});
		}

		//Text Banners
		ctx.textAlign = "center";
		ctx.font = textStyles.banner.string;
		ctx.fillStyle = "#FFF";
		const bannerText = [];

		if (game) {
			//Title
			bannerText.push([{ text: game.title }]);

			//Date/Time
			const date = new Date(game.date);
			bannerText.push([
				{ text: date.toString("HH:mm "), colour: "#FC0" },
				{ text: date.toString("dS MMMM yyyy"), colour: "#FFF" }
			]);

			//Ground
			let groundText;
			if (game._ground) {
				groundText = game._ground.name;
			} else {
				groundText = "Venue TBD";
			}
			bannerText.push([{ text: groundText }]);

			//Hashtag
			const { hashtags } = game;
			bannerText.push([
				{ text: "#", colour: "#FC0" },
				{ text: hashtags ? hashtags[0] : "CowbellArmy", colour: "#FFF" }
			]);
		} else if (selector) {
			//Add title
			bannerText.push([{ text: selector.canvasText1 || selector.title }]);

			//Add subtitle
			if (selector.canvasText2) {
				bannerText.push([{ text: selector.canvasText2 }]);
			}

			//Standard Text
			bannerText.push([{ text: "Created On" }], [{ text: options.siteUrl.replace(/^www./, ""), colour: "#FC0" }]);

			//Add a twitter handle if we're a row short
			if (bannerText.length < 4) {
				bannerText.push([{ text: "@" }, { text: branding.site_social, colour: "#FFF" }]);
			}
		}

		this.textBuilder(bannerText, sideBarWidth * 0.5, bannerY, {
			lineHeight: 2.9
		});

		//Interchanges Header, for normal interchange display
		if (showInterchanges && !compressInterchangeList) {
			ctx.fillStyle = this.colours.claret;
			ctx.font = textStyles.interchangeHeader.string;
			ctx.fillText("INTERCHANGES", sideBarWidth / 2, interchangeHeaderY);
		}
	}

	async drawSquad() {
		const { ctx, colours, cHeight, game, positions, players, textStyles } = this;

		//Create Squad Object
		this.squad = players.map(player => {
			const { name, nickname, displayNicknameInCanvases } = player;
			return {
				displayName: displayNicknameInCanvases ? nickname || name.first : name.last,
				...player
			};
		});

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
				p.displayName = squadNameWhenDuplicate || `${name.first.substr(0, 1)}. ${name.last}`;
			}

			p.displayName = p.displayName.toUpperCase();
		});

		//Draw Players
		let interchangeY = positions.interchangeHeaderY;
		for (let i in this.squad) {
			i = Number(i);
			const player = this.squad[i];
			if (i < 13) {
				await this.drawStartingSquadMember(player, i);
			} else if (!this.compressInterchangeList) {
				//Add the extra interchange label if necessary
				if (this.usesExtraInterchange && i == this.expectedTeamLength - 1) {
					const genderedString = game ? game.genderedString : "Player";
					const extraInterchangeLabel = `${getOrdinalNumber(i + 1)} ${genderedString}`;
					interchangeY += Math.round(positions.standardInterchangeYGap * 1.3);
					ctx.textAlign = "center";
					ctx.font = textStyles.interchangeHeader.string;
					ctx.fillText(extraInterchangeLabel.toUpperCase(), positions.sideBarWidth / 2, interchangeY);
				}

				interchangeY += positions.standardInterchangeYGap;
				this.drawInterchange(player, interchangeY);
			}
		}

		//Longer interchange list
		if (this.compressInterchangeList) {
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
			//We add the header here so it's automatically positioned
			interchangeList.unshift([{ text: "INTERCHANGES", font: (ctx.font = this.textStyles.interchangeHeader) }]);

			ctx.fillStyle = colours.claret;
			this.textBuilder(interchangeList, positions.sideBarWidth * 0.5, Math.round(cHeight * 0.74), {
				lineHeight: 1.8
			});
		}
	}

	async drawStartingSquadMember(player, position) {
		const { ctx, positions, textStyles, colours, options, teamBadges, game } = this;
		const { playerHeight, playerWidth, players, playerNameBarHeight, playerNameBarRadius, playerNameBarNumberWidth } = positions;
		const [x, y] = players[position];
		const { images, displayName, number, gender } = player;

		//Player Image
		const dx = x - playerWidth / 2;
		const dy = y - playerHeight / 2;
		if (options.showOpposition) {
			this.contain(teamBadges[game._opposition._id].light, dx, dy + playerNameBarHeight / 2, playerWidth, playerHeight - playerNameBarHeight);
		} else {
			const playerImageName = images.player || images.main || `blank-${gender}.png`;
			const playerImage = await this.googleToCanvas(`images/people/full/${playerImageName}`);
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
		const { width: nameWidth, actualBoundingBoxAscent: nameHeight } = ctx.measureText(displayName);

		//Set the name box width, plus half the number width as padding
		let nameBoxWidth = Math.max(nameWidth, playerWidth) + playerNameBarNumberWidth / 2;
		const totalBoxWidth = nameBoxWidth + playerNameBarNumberWidth;
		const numberBoxX = x - totalBoxWidth / 2;
		let nameBoxX = numberBoxX + playerNameBarNumberWidth;
		const boxY = y + playerHeight / 2 - playerNameBarHeight;
		const textY = boxY + playerNameBarHeight / 2 + nameHeight / 2;

		//If there's no number, nameBoxWidth and nameBoxX need to match totalBox
		//We set nameBoxRounding exceptions if there is a number
		let nameBoxRounding = {};
		if (number) {
			nameBoxRounding = {
				topLeft: 0,
				bottomLeft: 0
			};
		} else {
			nameBoxWidth = totalBoxWidth;
			nameBoxX = numberBoxX;
		}

		//Draw Box Shadow
		ctx.fillStyle = "white";
		ctx.shadowBlur = 10;
		ctx.shadowColor = "#000000AA";
		ctx.shadowOffsetY = 10;
		this.fillRoundedRect(numberBoxX, boxY, totalBoxWidth, playerNameBarHeight, playerNameBarRadius);

		this.resetShadow();

		if (number) {
			//Draw Number Box
			if (options.showOpposition) {
				ctx.fillStyle = game._opposition.colours.text;
			} else {
				ctx.fillStyle = colours.claret;
			}
			this.fillRoundedRect(numberBoxX, boxY, playerNameBarNumberWidth, playerNameBarHeight, playerNameBarRadius, {
				topRight: 0,
				bottomRight: 0
			});

			//Add Number
			if (options.showOpposition) {
				ctx.fillStyle = game._opposition.colours.main;
			} else {
				ctx.fillStyle = colours.gold;
			}
			ctx.textAlign = "center";
			ctx.fillText(number, numberBoxX + playerNameBarNumberWidth / 2, textY);
		}

		//Draw Name box
		if (options.showOpposition) {
			ctx.fillStyle = game._opposition.colours.main;
		} else {
			ctx.fillStyle = "#F4F4F4";
		}
		this.fillRoundedRect(nameBoxX, boxY, nameBoxWidth, playerNameBarHeight, playerNameBarRadius, nameBoxRounding);

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

		//Set Font
		ctx.font = textStyles.interchange.string;

		if (number) {
			//Add Box
			ctx.fillStyle = colours.claret;
			ctx.fillRect(numberBoxXCentre - numberBoxSize / 2, y - numberBoxSize / 2 - textStyles.interchange.size * 0.3, numberBoxSize, numberBoxSize);

			//Add Number
			ctx.textAlign = "center";
			ctx.fillStyle = colours.gold;
			ctx.fillText(number, numberBoxXCentre, y);
		}

		//Add Name
		ctx.fillStyle = colours.claret;
		if (number) {
			ctx.textAlign = "left";
			ctx.fillText(displayName, sideBarWidth * 0.34, y);
		} else {
			ctx.textAlign = "center";
			ctx.fillText(displayName, sideBarWidth * 0.5, y);
		}
	}

	async render(forTwitter = false) {
		await this.getBranding();
		await this.loadTeamImages();
		await this.drawBackground();
		await this.drawSidebar();
		await this.drawSquad();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
