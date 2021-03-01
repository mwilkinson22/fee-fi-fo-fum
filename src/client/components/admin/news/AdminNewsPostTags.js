//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

//Actions
import { updateNewsPost } from "~/client/actions/newsActions";
import { fetchPeopleList } from "~/client/actions/peopleActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminNewsPostTags extends Component {
	constructor(props) {
		super(props);

		const { peopleList, fetchPeopleList } = props;

		if (!peopleList) {
			fetchPeopleList();
		}

		const validationSchema = Yup.object().shape({
			tags: Yup.array()
				.of(Yup.mixed())
				.label("Custom Tags"),
			_people: Yup.array()
				.of(Yup.mixed())
				.label("People"),
			_teams: Yup.array()
				.of(Yup.mixed())
				.label("Teams")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullPosts, match, peopleList, teamList } = nextProps;
		const { _id } = match.params;
		const newState = { isLoading: false };

		//Is New
		newState.isNew = !_id;

		//Check we have the info we need
		if (!peopleList) {
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

		newState.options._people = _.chain(peopleList)
			.map(({ name, _id }) => ({ label: `${name.first} ${name.last}`, value: _id }))
			.sortBy("label")
			.value();

		newState.options._teams = _.chain(teamList)
			.map(({ name, _id }) => ({ value: _id, label: name.long }))
			.sortBy("label")
			.value();

		return newState;
	}

	getInitialValues() {
		const { isNew, options, post } = this.state;

		//Declare default values
		const defaultValues = {
			tags: [],
			_people: [],
			_teams: []
		};

		if (isNew) {
			return defaultValues;
		} else {
			return _.mapValues(defaultValues, (defaultValue, key) => {
				if (post[key] == null) {
					return defaultValue;
				}

				switch (key) {
					case "_people":
						return post[key].map(({ _id }) => options[key].find(({ value }) => value == _id));
					default:
						return post[key];
				}
			});
		}
	}

	getFieldGroups() {
		const { options } = this.state;

		return [
			{
				fields: [
					{
						name: "_people",
						type: fieldTypes.asyncSelect,
						isMulti: true,
						loadOptions: input => {
							if (input.length > 3) {
								return new Promise(resolve => {
									resolve(
										options._people.filter(({ label }) =>
											label.toLowerCase().includes(input.toLowerCase())
										)
									);
								});
							}
						}
					},
					{
						name: "_teams",
						type: fieldTypes.select,
						isMulti: true,
						options: options._teams
					},
					{
						name: "tags",
						type: fieldTypes.creatableSelect,
						isMulti: true,
						showDropdown: false,
						options: []
					}
				]
			}
		];
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

function mapStateToProps({ news, people, teams }) {
	const { fullPosts } = news;
	const { peopleList } = people;
	const { teamList } = teams;
	return { fullPosts, peopleList, teamList };
}

export default connect(mapStateToProps, {
	fetchPeopleList,
	updateNewsPost
})(AdminNewsPostTags);
