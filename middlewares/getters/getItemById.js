const validateId = require("../../utils/validateMongooseId");
const mongoose = require("mongoose");

module.exports = async (collectionName, id, req, res) => {
	if (!validateId(id)) {
		res.status(400).send({
			response: "The given ID is not a valid Mongoose ID",
			parameters: req.params
		});
	} else {
		const Collection = mongoose.model(collectionName);
		const item = await Collection.findById(id);
		if (item) {
			res.status(200).send(item);
		} else {
			res.status(400).send({
				Response: "Item not found",
				parameters: req.params
			});
		}
	}
};
