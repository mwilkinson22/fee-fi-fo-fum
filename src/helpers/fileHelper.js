import { googleBucketName } from "~/config/keys";
import sharp from "sharp";

const bucket = require("~/constants/googleBucket");

export async function uploadToGoogle({ originalname, buffer, mimeType }, path = "", cacheMaxAge) {
	const file = bucket.file(path + originalname);
	const externalUrl = await new Promise((resolve, reject) => {
		const stream = file.createWriteStream({
			metadata: {
				contentType: mimeType,
				cacheControl: `public, max-age=${Number(cacheMaxAge) || 31536000}`
			}
		});
		stream.on("error", err => {
			reject(err);
		});
		stream.on("finish", () => {
			resolve(`https://storage.googleapis.com/${googleBucketName}/${path}${originalname}`);
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

export async function uploadImageToGoogle(
	originalFile,
	path,
	webPConvert = true,
	nameOverride = null,
	resize = null,
	cacheMaxAge = null
) {
	//Using sharp().clone() doesn't seem to work as expected, so we
	//deconstruct the file object to prevent permanent changes.
	//Among other things, this prevents issues when resizing multiple times
	const file = { ...originalFile };

	//Process file name & extension
	let fileName;
	const fileNameArray = file.originalname.split(".");
	const extension = fileNameArray.pop().toLowerCase();

	//Update the name if necessary
	if (nameOverride) {
		fileName = nameOverride;
		file.originalname = `${fileName}.${extension}`;
	} else {
		fileName = fileNameArray.join(".");
	}

	//Get a sharp object
	let image = sharp(file.buffer);

	//Resize if necessary
	if (resize) {
		const resizeOptions = {
			withoutEnlargement: true,
			...resize
		};
		image = image.resize(resizeOptions);
	}

	//Convert to file type
	switch (extension) {
		case "jpg":
		case "jpeg":
			file.mimeType = "image/jpeg";
			image = image.jpeg();
			break;
		case "png":
			file.mimeType = "image/png";
			image = image.png();
			break;
		case "svg":
			file.mimeType = "image/svg+xml";
			webPConvert = false;
			break;
	}

	//Convert to buffer
	file.buffer = await image.toBuffer();

	const uploadedImage = await uploadToGoogle(file, path, cacheMaxAge);

	if (webPConvert) {
		const buffer = await sharp(file.buffer).webp().toBuffer();
		const webPData = {
			originalname: fileName + ".webp",
			buffer,
			mimeType: "image/webp"
		};
		await uploadToGoogle(webPData, path, cacheMaxAge);
	}

	return uploadedImage;
}

export async function uploadBase64ImageToGoogle(base64, path, webPConvert, name, format, cacheMaxAge = null) {
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
	return await uploadImageToGoogle(file, path, webPConvert, null, null, cacheMaxAge);
}
