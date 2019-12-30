//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "../../components/admin/BasicForm";
import NotFoundPage from "../NotFoundPage";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import {
	fetchProfiles,
	createProfile,
	updateProfile,
	deleteProfile,
	validateTwitterCredentials
} from "~/client/actions/socialActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminProfilePage extends Component {
	constructor(props) {
		super(props);

		const { profiles, fetchProfiles } = props;

		if (!profiles) {
			fetchProfiles();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { profiles, match } = nextProps;
		const newState = { isLoading: false };

		//Create Or Edit
		newState.isNew = !match.params._id;

		//Check Everything is loaded
		if (!newState.isNew && !profiles) {
			newState.isLoading = true;
			return newState;
		}

		//Get Current Profile
		if (!newState.isNew) {
			newState.profile = profiles[match.params._id] || false;
		}

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape({
			name: Yup.string()
				.required()
				.label("Name"),
			archived: Yup.boolean().label("Archived"),
			twitter: Yup.object().shape({
				access_token: Yup.string()
					.required()
					.label("Access Token"),
				access_token_secret: Yup.string()
					.required()
					.label("Access Token Secret")
			}),
			iftttKey: Yup.string()
				.required()
				.label("IFTTT Key")
		});

		return newState;
	}

	getInitialValues() {
		const { profile, isNew } = this.state;

		const defaultValues = {
			name: "",
			archived: false,
			twitter: {
				access_token: "",
				access_token_secret: ""
			},
			iftttKey: ""
		};

		if (isNew) {
			return defaultValues;
		} else {
			return _.mapValues(defaultValues, (defaultValue, key) =>
				profile[key] == null ? defaultValue : profile[key]
			);
		}
	}

	getFieldGroups() {
		const { twitterTestResults } = this.state;
		return [
			{
				fields: [
					{ name: "name", type: fieldTypes.text },
					{ name: "archived", type: fieldTypes.boolean },
					{ name: "iftttKey", type: fieldTypes.text }
				]
			},
			{
				label: "Twitter",
				fields: [
					{ name: "twitter.access_token", type: fieldTypes.text },
					{ name: "twitter.access_token_secret", type: fieldTypes.text }
				]
			},
			{
				render: values => [
					<button
						type="button"
						key="twitter-test-btn"
						disabled={
							_.filter(values.twitter, v => v == "").length ||
							twitterTestResults == "loading"
						}
						onClick={() => this.twitterTest(values.twitter)}
					>
						Test
					</button>,
					this.renderTwitterTestResults()
				]
			}
		];
	}

	async twitterTest(values) {
		await this.setState({ twitterTestResults: "loading" });
		const twitterTestResults = await this.props.validateTwitterCredentials(values);
		await this.setState({ twitterTestResults });
	}

	renderTwitterTestResults() {
		const { twitterTestResults } = this.state;

		if (twitterTestResults && twitterTestResults !== "loading") {
			let result;
			if (twitterTestResults.authenticated) {
				result = `\u2705 Logged in as @${twitterTestResults.user}`;
			} else {
				result = `\u274c ${twitterTestResults.error.message}`;
			}
			return <label key="result">{result}</label>;
		}
	}

	render() {
		const { profile, isNew, isLoading, validationSchema } = this.state;
		const { authUser, createProfile, updateProfile, deleteProfile } = this.props;

		//404 for non-admins
		if (!authUser.isAdmin) {
			return <NotFoundPage />;
		}

		//Await social list
		if (isLoading) {
			return <LoadingPage />;
		}

		//404
		if (!isNew && profile === false) {
			return <NotFoundPage message="Profile not found" />;
		}

		//Get Page Title
		const title = isNew ? "Add New Profile" : profile.name;

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createProfile(values),
				redirectOnSubmit: id => `/admin/social/${id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteProfile(profile._id),
				onSubmit: values => updateProfile(profile._id, values),
				redirectOnDelete: "/admin/social/"
			};
		}

		return (
			<div className="admin-profile-page">
				<HelmetBuilder title={title} />
				<section className="page-header">
					<div className="container">
						<h1>{title}</h1>
					</div>
				</section>
				<section className="form">
					<div className="container">
						<BasicForm
							fieldGroups={this.getFieldGroups()}
							initialValues={this.getInitialValues()}
							isNew={isNew}
							itemType="Profile"
							validationSchema={validationSchema}
							{...formProps}
						/>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ config, social }) {
	const { authUser } = config;
	const { profiles } = social;
	return { authUser, profiles };
}

export default connect(mapStateToProps, {
	fetchProfiles,
	createProfile,
	updateProfile,
	deleteProfile,
	validateTwitterCredentials
})(AdminProfilePage);
