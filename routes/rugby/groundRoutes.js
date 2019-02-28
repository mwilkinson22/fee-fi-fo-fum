const mongoose = require("mongoose");
const collectionName = "grounds";

//Models
const Grounds = mongoose.model("grounds");

module.exports = app => {
	app.get("/api/grounds", async (req, res) => {
		const grounds = await Grounds.find({}).populate({
			path: "address._city",
			populate: {
				path: "_country"
			}
		});
		res.send(grounds);
	});
};
