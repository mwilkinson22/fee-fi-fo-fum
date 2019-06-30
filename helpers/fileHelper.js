import { googleBucketName } from "~/config/keys";
import sharp from "sharp";
const bucket = require("~/constants/googleBucket");

export async function uploadToGoogle({ originalname, buffer, mimetype }, path = "") {
	const file = bucket.file(path + originalname);
	const externalUrl = await new Promise((resolve, reject) => {
		const stream = file.createWriteStream({
			metaData: {
				contentType: mimetype
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
		externalUrl
	};
}

export async function uploadImageToGoogle(file, path, webPConvert = true) {
	const fileNameArray = file.originalname.split(".");
	fileNameArray.pop();
	const fileName = fileNameArray.join(".");

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
