const mongoose = require("mongoose");
const collectionName = "grounds";

//Models
const Grounds = mongoose.model(collectionName);

//Helper
import { getListsAndSlugs } from "../../controllers/genericController";

module.exports = app => {
	app.get("/api/grounds", async (req, res) => {
		const grounds = await Grounds.find({}).populate({
			path: "address._city",
			populate: {
				path: "_country"
			}
		});

		const { list, slugMap } = await getListsAndSlugs(grounds, collectionName);

		res.send({ groundList: list, slugMap });
	});
};
