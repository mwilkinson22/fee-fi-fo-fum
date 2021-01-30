//Mongoose
import _ from "lodash";
import mongoose from "mongoose";
const collectionName = "newsPosts";
const NewsPost = mongoose.model(collectionName);
import { EditorState, convertToRaw } from "draft-js";

//Constants
import { newsPostsPerPage } from "~/config/keys";

//Helpers
import { getIdFromSlug } from "~/helpers/routeHelperSERVER";

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

	res.send({ _id, fullPosts });
}

//Get first 6 for sidebar & homepage
export async function getFirstSixPosts(req, res) {
	const query = generateQuery(req.user);
	const posts = await NewsPost.find(query)
		.sort({ dateCreated: -1 })
		.limit(6)
		.forList()
		.lean();

	res.send(_.keyBy(posts, "_id"));
}

//Get page count
export async function getPageCount(req, res) {
	const postsByCategory = await NewsPost.aggregate([
		{
			$match: generateQuery(req.user)
		},
		{
			$group: {
				_id: "$category",
				count: { $sum: 1 }
			}
		}
	]);
	postsByCategory.push({ _id: "all", count: _.sumBy(postsByCategory, "count") });

	const pageCount = _.mapValues(_.keyBy(postsByCategory, "_id"), ({ count }) =>
		Math.ceil(count / newsPostsPerPage)
	);

	res.send(pageCount);
}

export async function getPage(req, res) {
	const { category, page } = req.params;
	const query = generateQuery(req.user);
	if (category !== "all") {
		query.category = category;
	}

	const ids = await NewsPost.find(query, "_id")
		.sort({ dateCreated: -1 })
		.skip(newsPostsPerPage * (page - 1))
		.limit(newsPostsPerPage)
		.lean();

	res.send(ids.map(doc => doc._id));
}

//Get basic list of posts
export async function getPostList(req, res) {
	const { ids } = req.params;

	//Generate query
	const query = generateQuery(req.user);
	query._id = { $in: ids.split(",") };

	const posts = await NewsPost.find(query).forList();

	res.send(_.keyBy(posts, "_id"));
}

//Get full post list
export async function getFullPostList(req, res) {
	const { exclude } = req.query;

	//Generate query
	const query = generateQuery(req.user);
	if (exclude) {
		query._id = { $nin: exclude.split(",") };
	}

	const posts = await NewsPost.find(query).forList();

	res.send(_.keyBy(posts, "_id"));
}

//Get full post
export async function getFullPostBySlug(req, res) {
	const { slug } = req.params;

	const _id = await getIdFromSlug("newsPosts", slug);

	if (_id) {
		req.params._id = _id;
		await getFullPost(req, res);
	}
}

export async function getFullPost(req, res) {
	const { _id } = req.params;
	const query = generateQuery(req.user, { _id });

	//Get full post and for list
	const fullPostQuery = await NewsPost.findOne(query).fullPost();
	const listQuery = await NewsPost.findOne(query).forList();
	let [fullPost, postList] = await Promise.all([fullPostQuery, listQuery]);

	if (fullPost) {
		res.send({ fullPosts: { [_id]: fullPost }, postList: { [_id]: postList } });
	} else {
		res.status(404).send("Post not found");
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
		await getFullPost(req, res);
	}
}

//Delete Post
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
