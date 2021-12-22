//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

//Actions
import { createNewsPost, updateNewsPost, deleteNewsPost } from "~/client/actions/newsActions";
import { fetchUserList } from "~/client/actions/userActions";
import { fetchEntireGameList } from "~/client/actions/gamesActions";

//Constants
import newsCategories from "~/constants/newsCategories";
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { validateSlug } from "~/helpers/adminHelper";
import { getGameYearsNotYetLoaded } from "~/helpers/gameHelper";

class AdminNewsPostOverview extends Component {
	constructor(props) {
		super(props);

		const { userList, fetchUserList, fetchEntireGameList, gameYears } = props;

		//Ensure we have a full game list
		if (getGameYearsNotYetLoaded(gameYears).length) {
			fetchEntireGameList();
		}

		if (!userList) {
			fetchUserList();
		}

		const validationSchema = Yup.object().shape({
			title: Yup.string().required().label("Title"),
			_author: Yup.mixed().required().label("Author"),
			subtitle: Yup.string().label("Sub-title"),
			category: Yup.mixed().required().label("Category"),
			_game: Yup.mixed()
				.test("isRequired", "A game is required for this category", function (value) {
					const category = this.parent.category;
					if (category && (category.value === "recaps" || category.value === "previews")) {
						return value;
					} else {
						return true;
					}
				})
				.label("Game"),
			slug: validateSlug(),
			image: Yup.string().required().label("Header Image"),
			dateCreated: Yup.date().label("Date Created"),
			timeCreated: Yup.string().label("Time Created"),
			isPublished: Yup.boolean().label("Published?")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { location, fullPosts, match, userList, gameList, teamList, teamTypes, gameYears } = nextProps;
		const { _id } = match.params;
		const newState = { isLoading: false };

		//Is New
		newState.isNew = !_id;

		//Check we have the info we need
		if (!userList || getGameYearsNotYetLoaded(gameYears).length) {
			return { isLoading: true };
		}

		//Get post
		if (!newState.isNew) {
			newState.post = fullPosts[_id];
		}

		//Check for query values on new posts
		newState.query = _.fromPairs(
			location.search
				.substr(1)
				.split("&")
				.map(s => s.split("="))
		);

		//Get dropdown options
		newState.options = {};

		newState.options.users = _.chain(userList)
			.map(user => ({ label: user.name.full, value: user._id }))
			.sortBy("label")
			.value();

		newState.options.categories = _.chain(newsCategories)
			.map(({ name, slug }) => ({ value: slug, label: name }))
			.sortBy("label")
			.value();

		newState.options.games = _.chain(gameList)
			.groupBy("_teamType")
			.map((games, _teamType) => {
				return {
					label: teamTypes[_teamType].name,
					order: teamTypes[_teamType].sortOrder,
					options: _.chain(games)
						.sortBy("date")
						.map(g => {
							const labelArr = [];
							//Add Team Name
							labelArr.push(teamList[g._opposition].name.short);

							//Add Date
							labelArr.push(g.date.toString("ddd dS MMM yyyy"));

							return { label: labelArr.join(" - "), value: g._id, date: g.date };
						})
						.value()
				};
			})
			.sortBy("order")
			.value();

		return newState;
	}

	getInitialValues() {
		const { authUser, gameList, teamList, teamTypes } = this.props;
		const { isNew, post, query } = this.state;

		//Declare default values
		const defaultValues = {
			title: "",
			_author: authUser._id,
			subtitle: "",
			category: "",
			slug: "",
			image: "",
			_game: ""
		};

		if (isNew) {
			//If it's new, check the query in the URL for recap/preview values
			if (query.recap || query.preview) {
				//First, check the game exists
				const gameId = query.recap || query.preview;
				const game = gameList[gameId];
				if (game) {
					defaultValues.category = query.recap ? "recaps" : "previews";
					defaultValues._game = gameId;
					defaultValues.slug = `${game.slug}-${query.recap ? "recap" : "preview"}`;

					//Create Title
					const titleArr = [teamList[game._opposition].name.short];
					if (teamTypes[game._teamType].slug !== "first") {
						titleArr.push(teamTypes[game._teamType].name);
					}
					titleArr.push(game.date.toString("dd/MM/yyyy"));
					titleArr.push("-");
					titleArr.push(query.recap ? "Recap" : "Preview");
					defaultValues.title = titleArr.join(" ");
				}
			}
			defaultValues.isPublished = false;

			return defaultValues;
		} else {
			const values = _.mapValues(defaultValues, (defaultValue, key) => {
				if (post[key] == null) {
					return defaultValue;
				}

				switch (key) {
					case "_author":
						return post[key]._id;
					default:
						return post[key];
				}
			});

			//Add Created Date
			values.dateCreated = post.dateCreated.toString("yyyy-MM-dd");
			values.timeCreated = post.dateCreated.toString("HH:mm");

			//Add Published Status
			values.isPublished = post.isPublished || false;

			return values;
		}
	}

	getFieldGroups(values) {
		const { isNew, options, post, query } = this.state;

		//Render Last Date Modified
		let dateModifiedString = "-";
		if (post && post.dateModified) {
			dateModifiedString = post.dateModified.toString("dddd dS MMMM yyyy - HH:mm:ss");
		}

		//Standard Fields
		const fields = [
			{
				name: "image",
				type: fieldTypes.image,
				path: "images/news/headers/",
				acceptSVG: false,
				resize: { card: { width: 550 } }
			},
			{ name: "title", type: fieldTypes.text },
			{ name: "subtitle", type: fieldTypes.text },
			{ name: "_author", type: fieldTypes.select, options: options.users },
			{ name: "slug", type: fieldTypes.text },
			{
				name: "category",
				type: fieldTypes.select,
				options: options.categories,
				isDisabled: query.recap || query.preview
			}
		];

		//If the category is a recap or a preview, we add a game field
		if (values.category === "recaps" || values.category === "previews") {
			//Filter Options By Years
			const filterYear = (values.dateCreated ? new Date(values.dateCreated) : new Date()).getFullYear();

			const gameOptions = _.chain(options.games)
				.map(({ label, options }) => {
					const filteredGames = options.filter(g => g.date.getFullYear() == filterYear);
					if (filteredGames.length) {
						return { label, options: filteredGames };
					}
				})
				.filter(_.identity)
				.value();

			fields.push({
				name: "_game",
				type: fieldTypes.select,
				options: gameOptions,
				isNested: true,
				isDisabled: query.recap || query.preview
			});
		}

		//Once a post is created, we add a few more fields
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

		if (values.category !== "recaps" && values.category !== "previews") {
			delete values._game;
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
				alterValuesBeforeSubmit={values => this.alterValuesBeforeSubmit(values)}
				fieldGroups={values => this.getFieldGroups(values)}
				initialValues={this.getInitialValues()}
				isNew={isNew}
				itemType="Post"
				validationSchema={validationSchema}
				{...formProps}
			/>
		);
	}
}

function mapStateToProps({ config, games, news, teams, users }) {
	const { authUser } = config;
	const { fullPosts } = news;
	const { userList } = users;
	const { gameList, gameYears } = games;
	const { teamList, teamTypes } = teams;
	return { authUser, fullPosts, userList, gameList, teamList, teamTypes, gameYears };
}

export default connect(mapStateToProps, {
	fetchUserList,
	fetchEntireGameList,
	createNewsPost,
	updateNewsPost,
	deleteNewsPost
})(AdminNewsPostOverview);
