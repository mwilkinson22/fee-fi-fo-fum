const validateId = require("../../utils/validateMongooseId");
const mongoose = require("mongoose");
const _ = require("lodash");
const ObjectId = mongoose.Types.ObjectId;

module.exports = (collectionName, getter = null) => {
	async function getterHelper(params) {
		const Collection = mongoose.model(collectionName);
		let item;
		if (getter) {
			const items = await Collection.aggregate(
				_.concat(
					[
						{
							$match: params
						}
					],
					getter
				)
			);
			if (items.length) item = items[0];
		} else {
			item = await Collection.findOne(params);
		}
		return item;
	}

	return {
		async getItemById(req, res) {
			const id = req.params.id;
			const idIsValid = await validateId(id);

			if (idIsValid) {
				const Collection = mongoose.model(collectionName);
				const item = await getterHelper({ _id: ObjectId(id) });
				if (item) {
					res.status(200).send(item);
				} else {
					res.status(400).send({
						Response: "Item not found",
						parameters: req.params
					});
				}
			} else {
				res.status(400).send({
					response: "The given ID is not a valid Mongoose ID",
					parameters: req.params
				});
			}
		},

		async getItemBySlug(req, res) {
			const Collection = mongoose.model(collectionName);
			const SlugRedirect = mongoose.model("slugRedirect");
			const slug = req.params.slug;
			let item = await Collection.findOne({ slug });

			//If the slug doesn't match, check slugRedirect, to avoid broken links
			if (!item) {
				const slugRedirect = await SlugRedirect.findOne({
					oldSlug: slug,
					collectionName
				});

				if (slugRedirect) {
					item = await Collection.findOne({
						_id: slugRedirect.itemId
					});
				}
			}

			if (item && process.env.NODE_ENV !== "production") {
				item = await getterHelper({ _id: ObjectId(item._id) });
			}

			//Return value
			if (item) {
				res.status(200).send(item);
			} else {
				const debugObject = {
					getter,
					item
				};
				res.status(404).send({
					Response: "Item not found",
					parameters: req.params
				});
			}
		}
	};
};
