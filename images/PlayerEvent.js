import Canvas from "./Canvas";

export default class PlayerEvent extends Canvas {
	constructor(player, options = {}) {
		//Set Dimensions
		const cWidth = 1400;
		const cHeight = cWidth / 2;

		//Load In Fonts
		const fonts = [
			{ file: "Montserrat-Bold.ttf", family: "Montserrat" },
			{ file: "Monstro.ttf", family: "Monstro" }
		];

		//Create Canvas
		super(cWidth, cHeight, { fonts });

		//Constants
		const textStyles = {};
		this.setTextStyles(textStyles);

		this.positions = {};

		//Variables
	}

	async drawBackground() {
		const { ctx, cWidth, cHeight } = this;
		const backgroundImage = await this.googleToCanvas("images/layout/canvas/player-event.jpg");
		ctx.drawImage(backgroundImage, 0, 0, cWidth, cHeight);
	}

	async render(forTwitter = false) {
		await this.drawBackground();

		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
