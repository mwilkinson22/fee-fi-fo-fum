import _ from "lodash";
import { createCanvas, loadImage, registerFont } from "canvas";
const googleBucket = require("~/constants/googleBucket");

export default class Canvas {
	constructor(w, h, options) {
		if (options.fonts) {
			this.registerFonts(options.fonts);
		}

		//Constants
		this.colours = {
			claret: "#751432",
			gold: "#FFCC00"
		};

		this.canvas = createCanvas(w, h);
		this.ctx = this.canvas.getContext("2d");
		this.cWidth = w;
		this.cHeight = h;
	}
	registerFonts(fontList) {
		fontList.map(font => {
			const { file, family, ...data } = font;
			if (!file || !family) {
				console.error("Invalid Font Data", font);
			} else {
				registerFont(`./assets/fonts/${file}`, { family, ...data });
			}
		});
	}

	setTextStyles(styles) {
		this.textStyles = _.mapValues(styles, style => {
			style.size = Math.round(style.size);
			style.string = `${style.size}px ${style.family}`;
			return style;
		});
	}

	async googleToCanvas(file) {
		const [buffer] = await googleBucket.file(file).download();
		const image = await loadImage(buffer);
		return image;
	}

	fit(contains) {
		return (
			parentWidth,
			parentHeight,
			childWidth,
			childHeight,
			scale = 1,
			offsetX = 0.5,
			offsetY = 0.5
		) => {
			const childRatio = childWidth / childHeight;
			const parentRatio = parentWidth / parentHeight;
			let width = parentWidth * scale;
			let height = parentHeight * scale;

			if (contains ? childRatio > parentRatio : childRatio < parentRatio) {
				height = width / childRatio;
			} else {
				width = height * childRatio;
			}

			return {
				width,
				height,
				offsetX: (parentWidth - width) * offsetX,
				offsetY: (parentHeight - height) * offsetY
			};
		};
	}

	contain() {
		return this.fit(true)(...arguments);
	}

	cover() {
		return this.fit(false)(...arguments);
	}

	outputFile(type = "base64") {
		const { canvas } = this;
		switch (type) {
			case "base64":
				return canvas.toDataURL();
			case "twitter":
				return canvas.toDataUrl().split("base64,")[1];
			default:
				console.error(`Invalid render type: '${type}'`);
				return null;
		}
	}
}
