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
		const textStyles = {};
		this.setTextStyles(textStyles);

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

	async render(forTwitter = false) {
		//BG
		await this.drawBackground();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
