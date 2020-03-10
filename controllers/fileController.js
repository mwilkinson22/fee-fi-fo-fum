//Constants
const bucket = require("~/constants/googleBucket");

//Helpers
import { uploadToGoogle, uploadImageToGoogle } from "~/helpers/fileHelper";

//Get File List
export async function getFiles(req, res) {
	const { path } = req.params;
	const exclude = (req.query.exclude || "webp").split(",");

	const request = await bucket.getFiles({
		autoPaginate: false,
		directory: decodeURIComponent(path)
	});

	const files = request[0];
	res.send(
		files
			.map(f => {
				const { timeCreated: created, updated, size } = f.metadata;
				return {
					created,
					updated,
					size,
					name: f.name.replace(path, "")
				};
			})
			.filter(f => f.name.length && exclude.indexOf(f.name.split(".").pop()) === -1)
	);
}

//Upload File
export async function uploadFile(req, res) {
	const { path, name, fileSizeLimit } = req.body;

	//Convert string properties to necessary types
	const isImage = req.body.isImage === "true";
	const convertImageToWebP = req.body.convertImageToWebP === "true";
	let resize = JSON.parse(req.body.resize);

	//Ensure we're within the limit
	if (fileSizeLimit && req.file.size / 1024 / 1024 > fileSizeLimit) {
		res.status(413).send(`Image must be less than ${fileSizeLimit}mb`);
	} else {
		//Update originalname for blob
		req.file.originalname = name;

		//Upload
		let result;
		if (isImage) {
			//Check Resize Variable, only allow for png & jpeg
			const extension = name
				.split(".")
				.pop()
				.toLowerCase();

			const isJpgOrPng = ["jpg", "jpeg", "png"].indexOf(extension) === -1;
			if (!resize || !isJpgOrPng) {
				resize = {};
			}
			const { defaultSize, ...alternateSizes } = resize;

			//Upload using the defaultSize, and hold these values
			//in the result variable
			result = await uploadImageToGoogle(
				req.file,
				path,
				convertImageToWebP,
				null,
				defaultSize
			);

			//Upload alternate sizes.
			//No need to return these values
			for (const size in alternateSizes) {
				await uploadImageToGoogle(
					req.file,
					`${path}${size}/`,
					convertImageToWebP,
					null,
					alternateSizes[size]
				);
			}
		} else {
			result = await uploadToGoogle(req.file, path);
		}

		//Return
		res.send(result);
	}
}
