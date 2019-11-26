//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

//Actions
import {
	fetchPostList,
	fetchNewsPost,
	createNewsPost,
	updateNewsPost,
	deleteNewsPost
} from "~/client/actions/newsActions";
import { fetchUserList } from "~/client/actions/userActions";
import { fetchGameList } from "~/client/actions/gamesActions";

//Constants
import newsCategories from "~/constants/newsCategories";
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { validateSlug } from "~/helpers/adminHelper";

class AdminNewsPostOverview extends Component {
	constructor(props) {
		super(props);

		const { userList, fetchUserList, gameList, fetchGameList } = props;

		if (!gameList) {
			fetchGameList();
		}

		if (!userList) {
			fetchUserList();
		}

		const validationSchema = Yup.object().shape({
			title: Yup.string()
				.required()
				.label("Title"),
			_author: Yup.mixed()
				.required()
				.label("Author"),
			subtitle: Yup.string().label("Sub-title"),
			category: Yup.mixed()
				.required()
				.label("Category"),
			slug: validateSlug(),
			image: Yup.string()
				.required()
				.label("Header Image"),
			dateCreated: Yup.date().label("Date Created"),
			timeCreated: Yup.string().label("Time Created"),
			isPublished: Yup.boolean().label("Published?")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullPosts, match, userList, gameList } = nextProps;
		const { _id } = match.params;
		const newState = { isLoading: false };

		//Is New
		newState.isNew = !_id;

		//Check we have the info we need
		if (!userList || !gameList) {
			return { isLoading: true };
		}

		//Get post
		if (!newState.isNew) {
			newState.post = fullPosts[_id];
		}

		//Get dropdown options
		newState.options = {};

		//Get Users
		newState.options.users = _.chain(userList)
			.map(user => ({ label: user.name.full, value: user._id }))
			.sortBy("label")
			.value();

		//Get Categories
		newState.options.categories = _.chain(newsCategories)
			.map(({ name, slug }) => ({ value: slug, label: name }))
			.sortBy("label")
			.value();

		return newState;
	}

	getInitialValues() {
		const { authUser } = this.props;
		const { isNew, options, post } = this.state;
		if (isNew) {
			return {
				title: "",
				_author: options.users.find(({ value }) => value == authUser._id) || "",
				subtitle: "",
				category: "",
				slug: "",
				image: ""
			};
		} else {
			const { title, subtitle, dateCreated, isPublished, slug } = post;
			return {
				title,
				_author: options.users.find(({ value }) => value == post._author._id) || "",
				subtitle: subtitle || "",
				slug,
				image: post.image || "",
				dateCreated: dateCreated.toString("yyyy-MM-dd"),
				timeCreated: dateCreated.toString("HH:mm"),
				isPublished: isPublished || false,
				category: options.categories.find(({ value }) => value == post.category) || ""
			};
		}
	}

	getFieldGroups() {
		const { isNew, options, post } = this.state;

		//Render Last Date Modified
		let dateModifiedString = "-";
		if (post && post.dateModified) {
			dateModifiedString = post.dateModified.toString("HH:mm:ss dd/MM/yyyy");
		}

		const fields = [
			{
				name: "image",
				type: fieldTypes.image,
				path: "images/news/headers/",
				acceptSVG: false
			},
			{ name: "title", type: fieldTypes.text },
			{ name: "subtitle", type: fieldTypes.text },
			{ name: "_author", type: fieldTypes.select, options: options.users },
			{
				name: "category",
				type: fieldTypes.select,
				options: options.categories
			},
			{ name: "slug", type: fieldTypes.text }
		];

		if (!isNew) {
			fields.push(
				{ name: "isPublished", type: fieldTypes.boolean },
				{ name: "dateCreated", type: fieldTypes.date },
				{ name: "timeCreated", type: fieldTypes.time }
			);
		}

		return [
			{
				fields
			},
			{
				render: () => [
					<label key="lm-label">Last Modified</label>,
					<input key="lm-input" disabled value={dateModifiedString} />
				]
			}
		];
	}

	alterValuesBeforeSubmit(values) {
		const { isNew } = this.state;

		if (!isNew) {
			values.dateCreated = new Date(`${values.dateCreated} ${values.timeCreated}`);
			delete values.timeCreated;
		}
	}

	render() {
		const { post, isNew, isLoading, validationSchema } = this.state;
		const { createNewsPost, updateNewsPost, deleteNewsPost } = this.props;

		//Await additional resources
		if (isLoading) {
			return <LoadingPage />;
		}

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createNewsPost(values),
				redirectOnSubmit: id => `/admin/news/post/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteNewsPost(post._id),
				onSubmit: values => updateNewsPost(post._id, values),
				redirectOnDelete: "/admin/news/"
			};
		}

		return (
			<BasicForm
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={isNew}
				itemType="Post"
				validationSchema={validationSchema}
				{...formProps}
			/>
		);
	}
}

function mapStateToProps({ config, games, news, users }) {
	const { authUser } = config;
	const { fullPosts } = news;
	const { userList } = users;
	const { gameList } = games;
	return { authUser, fullPosts, userList, gameList };
}

export default connect(mapStateToProps, {
	fetchPostList,
	fetchNewsPost,
	fetchUserList,
	fetchGameList,
	createNewsPost,
	updateNewsPost,
	deleteNewsPost
})(AdminNewsPostOverview);
