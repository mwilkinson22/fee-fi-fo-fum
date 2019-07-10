import { googleBucketName } from "~/config/keys";
import sharp from "sharp";
const bucket = require("~/constants/googleBucket");

export async function getDirectoryList(directory, exclude = ["webp"]) {
	const res = await bucket.getFiles({
		autoPaginate: false,
		directory
	});

	const files = res[0];
	return files
		.map(f => {
			const { timeCreated: created, updated, size } = f.metadata;
			return {
				created,
				updated,
				size,
				name: f.name.replace(directory, "")
			};
		})
		.filter(f => f.name.length && exclude.indexOf(f.name.split(".").pop()) === -1);
}

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
