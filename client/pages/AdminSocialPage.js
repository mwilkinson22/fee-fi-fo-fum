//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../components/admin/BasicForm";
import NotFoundPage from "./NotFoundPage";
import LoadingPage from "../components/LoadingPage";
import DeleteButtons from "../components/admin/fields/DeleteButtons";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import {
	fetchProfiles,
	createProfile,
	updateProfile,
	deleteProfile,
	twitterTest
} from "~/client/actions/socialActions";

class AdminProfilePage extends BasicForm {
	constructor(props) {
		super(props);

		const { profiles, fetchProfiles } = props;

		if (!profiles) {
			fetchProfiles();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { profiles, match } = nextProps;
		const newState = { isLoading: false };

		//Create Or Edit
		newState.isNew = !match.params.id;

		//Remove redirect after creation/deletion
		if (prevState.redirect == match.url) {
			newState.redirect = false;
		}

		//Check Everything is loaded
		if (!newState.isNew && !profiles) {
			newState.isLoading = true;
			return newState;
		}

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape({
			name: Yup.string()
				.required()
				.label("Name"),
			twitter: Yup.object().shape({
				consumer_key: Yup.string()
					.required()
					.label("Consumer Key"),
				consumer_secret: Yup.string()
					.required()
					.label("Consumer Secret"),
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

		//Get Current Profile
		if (!newState.isNew) {
			newState.profile = profiles[match.params.id] || false;
		}

		return newState;
	}

	getDefaults() {
		const { profile, isNew } = this.state;

		if (isNew) {
			return {
				name: "",
				twitter: {
					consumer_key: "",
					consumer_secret: "",
					access_token: "",
					access_token_secret: ""
				},
				iftttKey: ""
			};
		} else {
			return profile;
		}
	}

	async handleSubmit(values) {
		const { createProfile, updateProfile } = this.props;
		const { profile, isNew } = this.state;

		let newSlug;
		if (isNew) {
			newSlug = await createProfile(values);
		} else {
			newSlug = await updateProfile(profile._id, values);
		}
		await this.setState({ redirect: `/admin/social/${newSlug}` });
	}

	async handleDelete() {
		const { deleteProfile } = this.props;
		const { profile } = this.state;
		const success = await deleteProfile(profile._id);
		if (success) {
			this.setState({ isDeleted: true, redirect: "/admin/social" });
		}
	}

	renderDeleteButtons() {
		if (!this.state.isNew) {
			return (
				<div className="form-card">
					<DeleteButtons onDelete={() => this.handleDelete()} />
				</div>
			);
		}
	}

	async twitterTest(values) {
		await this.setState({ twitterTestResults: "loading" });
		const twitterTestResults = await this.props.twitterTest(values);
		await this.setState({ twitterTestResults });
	}

	renderTwitterTestResults() {
		const { twitterTestResults } = this.state;

		if (twitterTestResults && twitterTestResults !== "loading") {
			if (twitterTestResults.authenticated) {
				return (
					<label>
						{"\u2705"} Logged in as @{twitterTestResults.user}
					</label>
				);
			} else {
				return (
					<label>
						{"\u274c"} {twitterTestResults.error.message}
					</label>
				);
			}
		}
	}

	render() {
		const {
			redirect,
			profile,
			isNew,
			isLoading,
			validationSchema,
			twitterTestResults
		} = this.state;

		if (redirect) {
			return <Redirect to={redirect} />;
		}

		if (isLoading) {
			return <LoadingPage />;
		}
		if (!isNew && profile === false) {
			return <NotFoundPage message="Profile not found" />;
		}

		const title = isNew ? "Add New Profile" : profile.name;
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
						<Formik
							onSubmit={values => this.handleSubmit(values)}
							initialValues={this.getDefaults()}
							validationSchema={validationSchema}
							render={({ values }) => {
								const mainFields = [
									{ name: "name", type: "text" },
									{ name: "iftttKey", type: "text" }
								];
								const twitterFields = [
									{ name: "twitter.consumer_key", type: "text" },
									{ name: "twitter.consumer_secret", type: "text" },
									{ name: "twitter.access_token", type: "text" },
									{ name: "twitter.access_token_secret", type: "text" }
								];

								return (
									<Form>
										<div className="card form-card grid">
											{this.renderFieldGroup(mainFields)}
											<h6>Twitter</h6>
											{this.renderFieldGroup(twitterFields)}
											<button
												type="button"
												disabled={
													_.filter(values.twitter, v => v == "").length ||
													twitterTestResults == "loading"
												}
												onClick={() => this.twitterTest(values.twitter)}
											>
												Test
											</button>
											{this.renderTwitterTestResults()}
											<div className="buttons">
												<button type="reset">Reset</button>
												<button type="submit">
													{isNew ? "Add" : "Update"} Profile
												</button>
											</div>
										</div>
										{this.renderDeleteButtons()}
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

function mapStateToProps({ social }) {
	return { profiles: social };
}

export default connect(
	mapStateToProps,
	{ fetchProfiles, createProfile, updateProfile, deleteProfile, twitterTest }
)(AdminProfilePage);
