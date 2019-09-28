import { googleBucketName } from "~/config/keys";
import sharp from "sharp";
const bucket = require("~/constants/googleBucket");

export async function uploadToGoogle({ originalname, buffer, mimeType }, path = "") {
	const file = bucket.file(path + originalname);
	const externalUrl = await new Promise((resolve, reject) => {
		const stream = file.createWriteStream({
			metaData: {
				contentType: mimeType
			}
		});
		stream.on("error", err => {
			reject(err);
		});
		stream.on("finish", () => {
			resolve(`https://storage.cloud.google.com/${googleBucketName}/${path}${originalname}`);
		});
		stream.end(buffer);
	});

	return {
		name: originalname,
		nameWithPath: path + originalname,
		externalUrl,
		extension: originalname.split(".").pop()
	};
}

export async function uploadImageToGoogle(file, path, webPConvert = true, nameOverride = null) {
	let fileName;
	const fileNameArray = file.originalname.split(".");
	const extension = fileNameArray.pop().toLowerCase();

	if (nameOverride) {
		fileName = nameOverride;
		file.originalname = `${fileName}.${extension}`;
	} else {
		fileName = fileNameArray.join(".");
	}

	switch (extension) {
		case "jpg":
		case "jpeg":
			file.buffer = await sharp(file.buffer)
				.jpeg()
				.toBuffer();
			break;
		case "png":
			file.buffer = await sharp(file.buffer)
				.png()
				.toBuffer();
			break;
	}
	const uploadedImage = await uploadToGoogle(file, path);

	if (webPConvert) {
		const buffer = await sharp(file.buffer)
			.webp()
			.toBuffer();
		const webPData = {
			originalname: fileName + ".webp",
			buffer,
			mimeType: "image/webp"
		};
		await uploadToGoogle(webPData, path);
	}

	return uploadedImage;
}

export async function uploadBase64ImageToGoogle(base64, path, webPConvert, name, format) {
	//Strip base64 prefix
	const buffer = Buffer.from(base64.split("base64,").pop(), "base64");

	//Ensure valid format
	let originalname, mimeType;
	switch (format) {
		case "jpeg":
		case "jpg":
			originalname = `${name}.jpg`;
			mimeType = "image/jpeg";
			break;
		case "png":
			originalname = `${name}.png`;
			mimeType = "image/png";
			break;
		default:
			throw new Error("Invalid format supplied");
	}

	//Convert
	const file = {
		originalname,
		mimeType,
		buffer
	};

	//Pass on to main function
	const uploadedImage = await uploadImageToGoogle(file, path, webPConvert);
	return uploadedImage;
}
