import Canvas from "./Canvas";
import { localTeam } from "~/config/keys";

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
			dividerWidth,
			mainPanelOffset,
			mainPanelWidth: cWidth - mainPanelOffset,
			bannerY: Math.round(cHeight * 0.32)
		};

		//Variables
		this.game = game;
		this.options = options;
	}

	async drawBackground() {
		const { ctx, cWidth, cHeight } = this;
		const backgroundImage = await this.googleToCanvas(
			"images/layout/canvas/squad-image-bg.jpg"
		);
		ctx.drawImage(backgroundImage, 0, 0, cWidth, cHeight);
	}

	async drawSidebar() {
		const { ctx, game, textStyles } = this;
		const {
			bannerY,
			sideBarWidth,
			sideBarIconX,
			sideBarIconWidth,
			sideBarGameIconY,
			sideBarGameIconHeight
		} = this.positions;

		//Add Game Logo
		let gameIcon;
		if (game.images.logo) {
			gameIcon = await this.googleToCanvas(game.images.logo);
		} else {
			gameIcon = await this.googleToCanvas(`images/teams/${game.teams[localTeam].image}`);
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
	}

	async render(forTwitter = false) {
		await this.drawBackground();
		await this.drawSidebar();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
