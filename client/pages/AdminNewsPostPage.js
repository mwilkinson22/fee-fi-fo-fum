//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import LoadingPage from "../components/LoadingPage";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "~/client/pages/NotFoundPage";
import DeleteButtons from "~/client/components/admin/fields/DeleteButtons";

//Actions
import { fetchPostList, fetchNewsPost, updateNewsPost } from "~/client/actions/newsActions";
import { fetchUserList } from "~/client/actions/userActions";
import { fetchGameList } from "~/client/actions/gamesActions";

//Constants
import newsCategories from "~/constants/newsCategories";

//Helpers
import { processFormFields } from "~/helpers/adminHelper";

class AdminNewsPostPage extends Component {
	constructor(props) {
		super(props);

		const { postList, fetchPostList, userList, fetchUserList, gameList, fetchGameList } = props;

		if (!postList) {
			fetchPostList();
		}

		if (!gameList) {
			fetchGameList();
		}

		if (!userList) {
			fetchUserList();
		}

		this.state = {};

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fullPosts, match, slugMap, fetchNewsPost, userList, gameList } = nextProps;
		const { slug } = match.params;
		const newState = {};

		//Check we have the info we need
		if (!slugMap || !userList || !gameList) {
			return newState;
		}

		//Get Post
		if (!slugMap[slug]) {
			newState.post = false;
		} else if (slugMap[slug].redirect) {
			//TODO
			return {};
		} else if (slugMap) {
			const id = slugMap[slug].id;
			const post = fullPosts[id];
			if (!post && !prevState.isLoading) {
				fetchNewsPost(id);
				newState.isLoading = true;
			} else if (post) {
				newState.post = post;
				newState.isLoading = false;
			}
		}

		//Get Users
		newState.users = _.chain(userList)
			.map(user => ({ label: user.name.full, value: user._id }))
			.sortBy("label")
			.value();

		//Get Categories
		newState.categories = _.chain(newsCategories)
			.map(({ name, slug }) => ({ value: slug, label: name }))
			.sortBy("label")
			.value();

		return newState;
	}

	getValidationSchema() {
		return Yup.object().shape({
			title: Yup.string()
				.required()
				.label("Title"),
			_author: Yup.mixed()
				.required()
				.label("Author"),
			subtitle: Yup.string().label("Sub-title"),
			dateCreated: Yup.date().label("Date Created"),
			timeCreated: Yup.string().label("Time Created"),
			isPublished: Yup.boolean()
				.required()
				.label("Published?"),
			category: Yup.mixed()
				.required()
				.label("Category")
		});
	}

	getDefaults() {
		const { post, users, categories } = this.state;
		if (post) {
			const { title, subtitle, dateCreated, isPublished } = post;
			return {
				title,
				_author: users.find(({ value }) => value == post._author._id) || "",
				subtitle: subtitle || "",
				dateCreated: dateCreated.toString("yyyy-MM-dd"),
				timeCreated: dateCreated.toString("HH:mm:ss"),
				isPublished,
				category: categories.find(({ value }) => value == post.category) || ""
			};
		}
	}

	async handleSubmit(fValues) {
		const { updateNewsPost } = this.props;
		const { post } = this.state;
		const values = _.cloneDeep(fValues);
		values._author = values._author.value;
		values.category = values.category.value;
		values.dateCreated = new Date(`${values.dateCreated} ${values.timeCreated}`);
		delete values.timeCreated;
		await updateNewsPost(post._id, values);
	}

	handleDelete() {
		console.log("Deleting");
	}

	renderViewLink() {
		const { post } = this.state;
		if (post.isPublished) {
			return (
				<Link className="card nav-card" to={`/news/post/${post.slug}`}>
					View this post
				</Link>
			);
		} else {
			return null;
		}
	}

	render() {
		const { isNew } = this.props;
		const { post, users, categories, isLoading } = this.state;

		if (post === false && !isNew) {
			return <NotFoundPage error={"Game not found"} />;
		}

		if (isLoading || (post === undefined && !isNew)) {
			return <LoadingPage />;
		}

		const validationSchema = this.getValidationSchema();
		const title = isNew ? "New Post" : post.title;
		let dateModifiedString = "-";
		if (post && post.dateModified) {
			dateModifiedString = post.dateModified.toString("HH:mm:ss dd/MM/yyyy");
		}
		return (
			<div>
				<HelmetBuilder title={title} />
				<section className="page-header">
					<div className="container">
						<Link className="nav-card card" to="/admin/news">
							↩ Return to post list
						</Link>
						{this.renderViewLink()}
						<h1>{title}</h1>
					</div>
				</section>
				<section>
					<div className="container">
						<Formik
							initialValues={this.getDefaults()}
							validationSchema={validationSchema}
							onSubmit={values => this.handleSubmit(values)}
							render={formikProps => {
								const mainFields = [
									{ name: "title", type: "text" },
									{ name: "subtitle", type: "text" },
									{ name: "_author", type: "Select", options: users },
									{ name: "category", type: "Select", options: categories },
									{ name: "isPublished", type: "Boolean" },
									{ name: "dateCreated", type: "date" },
									{ name: "timeCreated", type: "time" }
								];
								return (
									<Form>
										<div className="form-card grid">
											<h6>Post Info</h6>
											{processFormFields(mainFields, validationSchema)}
											<label>Last Modified</label>
											<input disabled value={dateModifiedString} />
										</div>
										<div className="form-card grid">
											<div className="buttons">
												<button type="reset">Reset</button>
												<button type="submit">Save Post</button>
											</div>
										</div>
										{isNew ? null : (
											<DeleteButtons onDelete={() => this.handleDelete()} />
										)}
									</Form>
								);
							}}
						/>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ games, news, users }) {
	const { postList, slugMap, fullPosts } = news;
	const { userList } = users;
	const { gameList } = games;
	return { postList, slugMap, fullPosts, userList, gameList };
}

export default connect(
	mapStateToProps,
	{ fetchPostList, fetchNewsPost, fetchUserList, fetchGameList, updateNewsPost }
)(AdminNewsPostPage);
