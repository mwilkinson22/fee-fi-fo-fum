//Helpers
import { uploadToGoogle, uploadImageToGoogle } from "~/helpers/fileHelper";

//Upload File
export async function uploadFile(req, res) {
	const { path, name, isImage, convertImageToWebP, fileSizeLimit } = req.body;
	if (fileSizeLimit && req.file.size / 1024 / 1024 > fileSizeLimit) {
		res.status(413).send(`Image must be less than ${fileSizeLimit}mb`);
	} else {
		//Update originalname for blob
		req.file.originalname = name;

		//Upload
		let result;
		if (isImage) {
			result = await uploadImageToGoogle(req.file, path, convertImageToWebP);
		} else {
			result = await uploadToGoogle(req.file, path);
		}

		//Return
		res.send(result);
	}
}
