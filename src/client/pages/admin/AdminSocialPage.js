//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";
import NewWindow from "react-new-window";

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
import { getAuthorisedAccounts } from "~/client/actions/oAuthActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminProfilePage extends Component {
	constructor(props) {
		super(props);

		const { profiles, fetchProfiles } = props;

		if (!profiles) {
			fetchProfiles();
		}

		this.state = { isAuthorising: false };
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
		const { getAuthorisedAccounts } = this.props;
		const { isAuthorising, twitterTestResults } = this.state;

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
				render: (values, formik) => {
					const elements = [
						<button
							key="twitter-auth-btn"
							type="button"
							disabled={isAuthorising}
							onClick={() => this.authoriseTwitter()}
						>
							Connect to Twitter
						</button>,
						this.renderTwitterAuthResults(),
						<button
							type="button"
							key="twitter-test-btn"
							disabled={_.filter(values.twitter, v => v == "").length || twitterTestResults == "loading"}
							onClick={() => this.twitterTest(values.twitter)}
						>
							Test
						</button>,
						this.renderTwitterTestResults()
					];

					if (isAuthorising) {
						elements.push(
							<NewWindow
								key="twitter-auth-window"
								url={"/api/oauth/twitter/authorise"}
								onUnload={async () => {
									//Get accounts, with secret
									const { twitter } = await getAuthorisedAccounts(true);

									//Update Formik
									formik.setFieldValue("twitter.access_token", twitter.access_token);
									formik.setFieldValue("twitter.access_token_secret", twitter.access_token_secret);

									//Update State
									this.setState({
										isAuthorising: false,
										twitterAuthResults: twitter.screen_name
									});
								}}
							/>
						);
					}

					return elements;
				}
			}
		];
	}

	async authoriseTwitter() {
		//Disable button
		this.setState({ isAuthorising: true });
	}

	async twitterTest(values) {
		await this.setState({ twitterTestResults: "loading" });
		const twitterTestResults = await this.props.validateTwitterCredentials(values);
		await this.setState({ twitterTestResults });
	}

	renderTwitterAuthResults() {
		const { twitterAuthResults } = this.state;

		let result;
		if (twitterAuthResults) {
			result = `\u2705 Connected to @${twitterAuthResults}`;
		}
		return <label key="auth-result">{result}</label>;
	}
	renderTwitterTestResults() {
		const { twitterTestResults } = this.state;

		let result;
		if (twitterTestResults && twitterTestResults !== "loading") {
			if (twitterTestResults.authenticated) {
				result = `\u2705 Logged in as @${twitterTestResults.user}`;
			} else {
				result = `\u274c ${twitterTestResults.error.message}`;
			}
		}
		return <label key="test-result">{result}</label>;
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
	validateTwitterCredentials,
	getAuthorisedAccounts
})(AdminProfilePage);
