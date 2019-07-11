import * as FileController from "../controllers/fileController";
import requireAdmin from "../middlewares/requireAdmin";
import upload from "../middlewares/upload";

module.exports = app => {
	app.post("/api/file", requireAdmin, upload.single("file"), FileController.uploadFile);
};
