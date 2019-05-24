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

	resetShadow(ctx = this.ctx) {
		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
	}

	fillRoundedRect(x, y, w, h, defaultRadius, options = {}) {
		const defaultOptions = {
			topLeft: defaultRadius,
			topRight: defaultRadius,
			bottomLeft: defaultRadius,
			bottomRight: defaultRadius,
			fill: true,
			stroke: false,
			ctx: this.ctx
		};
		const { topLeft, topRight, bottomLeft, bottomRight, ctx, fill, stroke } = {
			...defaultOptions,
			...options
		};

		ctx.beginPath();
		ctx.moveTo(x + topLeft, y);
		ctx.lineTo(x + w - topRight, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + topRight);
		ctx.lineTo(x + w, y + h - bottomRight);
		ctx.quadraticCurveTo(x + w, y + h, x + w - bottomRight, y + h);
		ctx.lineTo(x + bottomLeft, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - bottomLeft);
		ctx.lineTo(x, y + topLeft);
		ctx.quadraticCurveTo(x, y, x + topLeft, y);
		ctx.closePath();

		if (fill) {
			ctx.fill();
		}
		if (stroke) {
			ctx.stroke();
		}
	}

	async googleToCanvas(file) {
		const [buffer] = await googleBucket.file(file).download();
		const image = await loadImage(buffer);
		return image;
	}
	fit(contain, src, dx, dy, dw, dh, options) {
		let { xAlign, yAlign, ctx } = options;

		//Allow square values
		if (dh === null) {
			dh = dw;
		}

		//Set Canvas
		if (!ctx) {
			ctx = this.ctx;
		}

		//Set xAlign
		if (xAlign !== "left" && xAlign !== "right") {
			xAlign = "center";
		}

		//Set yAlign
		if (yAlign !== "top" && yAlign !== "bottom") {
			yAlign = "center";
		}

		//Get Aspect Ratios
		const srcRatio = src.width / src.height;
		const destRatio = dw / dh;

		//Set Default Values
		let sw = src.width;
		let sh = src.height;
		let sx = 0;
		let sy = 0;

		//Override based on aspect ratio
		if (srcRatio > destRatio) {
			//Source image wider
			if (contain) {
				let initialDh = dh;
				dh = dh / (srcRatio / destRatio);
				switch (yAlign) {
					case "center":
						dy += (initialDh - dh) / 2;
						break;
					case "bottom":
						dy += initialDh - dh;
						break;
				}
			} else {
				let initialSw = sw;
				sw = sw / (srcRatio / destRatio);
				switch (xAlign) {
					case "center":
						sx += (initialSw - sw) / 2;
						break;
					case "right":
						sx += initialSw - sw;
						break;
				}
			}
		} else if (destRatio > srcRatio) {
			//Source image taller
			if (contain) {
				let initialDw = dw;
				dw = dw / (destRatio / srcRatio);
				switch (xAlign) {
					case "center":
						dx += (initialDw - dw) / 2;
						break;
					case "right":
						dx += initialDw - dw;
						break;
				}
			} else {
				let initialSh = sh;
				sh = sh / (destRatio / srcRatio);
				switch (yAlign) {
					case "center":
						sy += (initialSh - sh) / 2;
						break;
					case "bottom":
						sy += initialSh - sh;
						break;
				}
			}
		}

		//Draw on canvas
		ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
	}

	contain(src, dx, dy, dw, dh = null, options = {}) {
		this.fit(true, src, dx, dy, dw, dh, options);
	}

	cover(src, dx, dy, dw, dh = null, options = {}) {
		this.fit(false, src, dx, dy, dw, dh, options);
	}

	textBuilder(rows, x, y, options = {}) {
		let { xAlign, yAlign, lineHeight, padding } = options;

		//Set xAlign
		if (xAlign !== "left" && xAlign !== "right") {
			xAlign = "center";
		}

		//Set yAlign
		if (yAlign !== "top" && yAlign !== "bottom") {
			yAlign = "center";
		}

		//Set lineHeight
		if (!lineHeight || isNaN(lineHeight)) {
			lineHeight = 1.2;
		}

		//Set Padding
		if (!padding) {
			padding = 0.1; //Avoid setting to 0 to account for tails on letters like g
		}

		//Set total width and height
		let drawableWidth = 0;
		let drawableHeight = 0;
		const processedRows = rows.map((row, i) => {
			let rowWidth = 0;
			let rowHeight = 0;
			row.map(({ text, font, maxWidth }) => {
				if (font) {
					this.ctx.font = font;
				}
				const dimensions = this.ctx.measureText(text);
				rowWidth += Math.min(dimensions.width, maxWidth || dimensions.width);
				rowHeight = Math.max(rowHeight, dimensions.actualBoundingBoxAscent);
			});

			//Update Totals
			drawableWidth = Math.max(drawableWidth, rowWidth);
			if (i > 0) {
				drawableHeight += Math.round(rowHeight * lineHeight);
			} else {
				drawableHeight += rowHeight;
			}

			return { row, rowWidth, rowHeight };
		});

		//Create Temporary Canvas
		const xPadding = drawableWidth * padding;
		const yPadding = drawableHeight * padding;
		const totalWidth = drawableWidth + xPadding * 2;
		const totalHeight = drawableHeight + yPadding * 2;
		const canvas = createCanvas(totalWidth, totalHeight);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = this.ctx.fillStyle;
		ctx.font = this.ctx.font;

		let rowY = 0 + yPadding;

		//Draw Text
		ctx.textAlign = "left";
		processedRows.map(({ row, rowWidth, rowHeight }, i) => {
			//Set X Value
			let rowX;
			switch (xAlign) {
				case "left":
					rowX = xPadding;
					break;
				case "center":
					rowX = (drawableWidth - rowWidth) / 2 + xPadding;
					break;
				case "right":
					rowX = drawableWidth - rowWidth - xPadding;
					break;
			}

			//Set Y Value
			if (i > 0) {
				rowY += Math.round(rowHeight * lineHeight);
			} else {
				rowY += rowHeight;
			}

			//Print Text
			row.map(({ text, font, colour, maxWidth }) => {
				if (font) {
					ctx.font = font;
				}
				if (colour) {
					ctx.fillStyle = colour;
				}
				const { width } = ctx.measureText(text);
				ctx.fillText(text, rowX, rowY, maxWidth || width);

				//Update x
				rowX += width;
			});
		});

		//Calculate destination x
		switch (xAlign) {
			//case "left": use initial x value
			case "center":
				x = x - drawableWidth / 2;
				break;
			case "right":
				x = x - drawableWidth;
				break;
		}
		x = x - xPadding;

		//Calculate destination y
		switch (yAlign) {
			//case "top": use initial y value
			case "center":
				y = y - drawableHeight / 2;
				break;
			case "bottom":
				y = y - drawableHeight;
				break;
		}
		y = y - yPadding;

		//Add to main canvas
		this.ctx.drawImage(canvas, x, y);

		//Return Key Positioning Values
		return { drawableHeight, drawableWidth, totalHeight, totalWidth, x, y, padding };
	}

	outputFile(type = "base64") {
		const { canvas } = this;
		switch (type) {
			case "base64":
				return canvas.toDataURL();
			case "twitter":
				return canvas.toDataURL().split("base64,")[1];
			default:
				console.error(`Invalid render type: '${type}'`);
				return null;
		}
	}
}
