//Mongoose
import _ from "lodash";
import mongoose from "mongoose";
const collectionName = "newsPosts";
const NewsPost = mongoose.model(collectionName);
const SlugRedirect = mongoose.model("slugRedirect");
import { EditorState, convertToRaw } from "draft-js";

//Helpers
import { getRedirects } from "./genericController";

//Config
function generateQuery(user, obj = {}) {
	let query = {};
	if (!user) {
		query = {
			isPublished: true,
			dateCreated: { $lte: new Date().toISOString() }
		};
	}

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
	const postList = _.keyBy(posts, "_id");

	const redirects = await getRedirects(posts, collectionName);
	return { postList, redirects };
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
	const newsPost = await NewsPost.findOne(query).fullPost();

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

//Create Post
export async function createPost(req, res) {
	const values = req.body;
	if (!values.content) {
		values.content = JSON.stringify(
			convertToRaw(EditorState.createEmpty().getCurrentContent())
		);
	}

	//Set date values
	const now = new Date().toISOString();
	values.dateCreated = now;
	values.dateModified = now;

	const post = new NewsPost(values);
	await post.save();

	await getUpdatedPost(post._id, res);
}

//Update Post
export async function updatePost(req, res) {
	const { _id } = req.params;
	const newsPost = await NewsPost.findById(_id);
	if (!newsPost) {
		res.status(404).send(`No post found with id ${_id}`);
		return false;
	} else {
		const values = _.mapValues(req.body, v => (v === "" ? null : v));

		//Update modified date
		const now = new Date().toISOString();
		values.dateModified = now;

		//Update created date on publish
		if (values.isPublished && !newsPost.isPublished) {
			values.dateCreated = now;
		}

		//Update post
		await newsPost.updateOne(values);
		await getUpdatedPost(_id, res);
	}
}

//Create Post
export async function deletePost(req, res) {
	const { _id } = req.params;
	const newsPost = await NewsPost.findById(_id);
	if (!newsPost) {
		res.status(404).send(`No post found with id ${_id}`);
		return false;
	} else {
		await NewsPost.findByIdAndRemove(_id);
		res.send(_id);
	}
}