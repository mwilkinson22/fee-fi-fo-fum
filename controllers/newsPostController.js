//Mongoose
import mongoose from "mongoose";
const collectionName = "newsPosts";
const NewsPost = mongoose.model(collectionName);
const SlugRedirect = mongoose.model("slugRedirect");

//Helpers
import { getListsAndSlugs } from "./genericController";

//Config
function generateQuery(user, obj = {}) {
	const query = user ? { isPublished: true } : {};
	return {
		...query,
		...obj
	};
}

//Get basic list of posts
export async function getPostList(req, res) {
	const query = generateQuery(req.user);

	const posts = await NewsPost.find(query, "title category slug image isPublished dateCreated");

	const { list, slugMap } = await getListsAndSlugs(posts, collectionName);

	res.send({ postList: list, slugMap });
}

//Get full post
export async function getFullPost(req, res) {
	const { id } = req.params;
	const query = generateQuery(req.user, { _id: id });
	let newsPost = await NewsPost.findOne(query, {
		contentHistory: false,
		version: false
	}).populate({
		path: "_author",
		select: "name frontendName twitter image"
	});

	if (newsPost) {
		res.send(newsPost);
	} else {
		res.status(404).send("Post not found");
	}
}

//Get Legacy Post. Possibly unneccesary
export async function getLegacyPost(req, res) {
	const { id } = req.params;
	const redir = await SlugRedirect.findOne({ collectionName, oldSlug: id });
	if (redir) {
		const post = await NewsPost.findById(redir.itemId, "slug");
		res.send(post);
	} else {
		res.status(404).send({});
	}
}
