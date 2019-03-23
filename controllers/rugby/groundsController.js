//Mongoose
import mongoose from "mongoose";
const collectionName = "grounds";
const Ground = mongoose.model(collectionName);

//Helpers
import { getListsAndSlugs } from "../genericController";

//Getters
export async function getGroundsList(req, res) {
	const grounds = await Ground.find({}).populate({
		path: "address._city",
		populate: {
			path: "_country"
		}
	});

	const { list, slugMap } = await getListsAndSlugs(grounds, collectionName);

	res.send({ groundList: list, slugMap });
}
