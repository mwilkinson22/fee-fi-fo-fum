import Canvas from "./Canvas";

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
		const dividerWidth = Math.round(cWidth * 0.06);
		const mainPanelOffset = sideBarWidth + dividerWidth;
		this.positions = {
			sideBarWidth,
			dividerWidth,
			mainPanelOffset,
			mainPanelWidth: cWidth - mainPanelOffset,
			bannerTop: Math.round(cHeight * 0.2),
			bannerHeight: Math.round(cHeight * 0.06)
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
		const { ctx, textStyles } = this;
		const { bannerHeight, bannerTop } = this.positions;

		//Text Banners
		let bannerY = bannerTop + bannerHeight * 0.5 + textStyles.banner.size * 0.4;
		ctx.textAlign = "center";
		ctx.font = textStyles.banner.string;
		ctx.fillStyle = "#FFF";
		["title", "date", "ground", "hashtag"].map(textType => {
			this.drawBannerText(textType, bannerY);
			bannerY += bannerHeight;
		});
	}

	drawBannerText(textType, bannerY) {
		const { ctx, game } = this;
		const { sideBarWidth } = this.positions;
		let text;
		switch (textType) {
			case "title":
				text = "Quarter Final";
				ctx.fillText(text, sideBarWidth * 0.5, bannerY);
				break;
			case "date":
				const date = new Date(game.date);

				const timeString = date.toString("HH:mm ");
				const dateString = date.toString("ddS MMMM yyyy");

				const timeWidth = ctx.measureText(timeString).width;
				const dateWidth = ctx.measureText(dateString).width;

				ctx.fillStyle = "#FC0";
				ctx.fillText(timeString, sideBarWidth * 0.5 - dateWidth / 2, bannerY);
				ctx.fillStyle = "#FFF";
				ctx.fillText(dateString, sideBarWidth * 0.5 + timeWidth / 2, bannerY);
				break;
			case "ground":
				text = game._ground.name;
				ctx.fillText(text, sideBarWidth * 0.5, bannerY);
				break;
			case "hashtag":
				text = game.hashtags ? "#" + game.hashtags[0] : "#CowbellArmy";
				ctx.fillText(text, sideBarWidth * 0.5, bannerY);
				break;
		}
	}

	async render(forTwitter = false) {
		await this.drawBackground();
		await this.drawSidebar();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
