//Mongoose
import _ from "lodash";
import mongoose from "mongoose";
const collectionName = "newsPosts";
const NewsPost = mongoose.model(collectionName);
const SlugRedirect = mongoose.model("slugRedirect");

//Helpers
import { getListsAndSlugs } from "./genericController";

//Config
function generateQuery(user, obj = {}) {
	const query = user ? {} : { isPublished: true };
	return {
		...query,
		...obj
	};
}

//Return updated post
async function getUpdatedPost(_id, res) {
	//Get Full Game
	const post = await NewsPost.find({ _id }).fullPost();
	const fullPosts = _.keyBy(post, "_id");

	//Get Game For List
	const list = await processList();

	res.send({ _id, fullPosts, ...list });
}

//Process List
async function processList(req = null) {
	const query = req ? generateQuery(req.user) : {};
	const posts = await NewsPost.find(query).forList();

	const { list, slugMap } = await getListsAndSlugs(posts, collectionName);
	return { postList: list, slugMap };
}

//Get basic list of posts
export async function getPostList(req, res) {
	const list = await processList(req);
	res.send(list);
}

//Get full post
export async function getFullPost(req, res) {
	const { id } = req.params;
	const query = generateQuery(req.user, { _id: id });
	const newsPost = await NewsPost.findOne(query, {
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

//Get Legacy Post
export async function getLegacyPost(req, res) {
	const { id } = req.params;
	const redir = await SlugRedirect.findOne({ collectionName, oldSlug: id }).lean();
	if (redir) {
		const post = await NewsPost.findById(redir.itemId, "slug");
		res.send(post);
	} else {
		res.status(404).send({});
	}
}

//Update Post
export async function updatePost(req, res) {
	const { _id } = req.params;
	const newsPost = await NewsPost.findById(_id);
	if (!newsPost) {
		res.status(404).send(`No post found with id ${_id}`);
		return false;
	} else {
		await NewsPost.findOneAndUpdate(
			{ _id },
			{
				...req.body,
				dateModified: new Date()
			}
		);

		await getUpdatedPost(_id, res);
	}
}
