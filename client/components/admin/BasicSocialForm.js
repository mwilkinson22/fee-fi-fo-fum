//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import * as Yup from "yup";

//Components
import BasicForm from "./BasicForm";
import LoadingPage from "../LoadingPage";

//Actions
import { fetchProfiles, simpleSocialPost } from "~/client/actions/socialActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class BasicSocialForm extends Component {
	constructor(props) {
		super(props);

		//Ensure we have an admin user
		const { authUser, fetchProfiles, profiles } = props;
		if (authUser && authUser.isAdmin) {
			//Get Social Media Profiles
			if (!profiles) {
				fetchProfiles();
			}
		}

		//Validation Schema
		const validationSchema = Yup.object().shape({
			channels: Yup.array()
				.of(Yup.string())
				.min(1)
				.label("Channels"),
			_profile: Yup.string().label("Social Profile"),
			content: Yup.string()
				.required()
				.label("Content"),
			replyTweet: Yup.string().label("Reply Tweet ID")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { profiles, replyTweet } = nextProps;
		const newState = { isLoading: false, replyTweet };

		//Wait for profiles
		if (!profiles) {
			return { isLoading: true };
		}

		//Create dropdown options
		newState.options = {};
		newState.options.channels = [
			{ label: "Twitter", value: "twitter" },
			{ label: "Facebook", value: "facebook" }
		];

		newState.options.profiles = _.chain(profiles)
			.reject("archived")
			.map(({ name, _id }) => ({ value: _id, label: name }))
			.sortBy("label")
			.value();

		return newState;
	}

	getInitialValues() {
		const { defaultProfile, initialContent } = this.props;
		const { options, replyTweet } = this.state;

		return {
			_profile: defaultProfile,
			channels: options.channels.map(o => o.value),
			content: initialContent,
			replyTweet
		};
	}

	getFieldGroups(values) {
		const { label, variables, variableInstruction } = this.props;
		const { options } = this.state;

		//Set initial field array
		const fields = [
			{ name: "_profile", type: fieldTypes.select, options: options.profiles },
			{ name: "channels", type: fieldTypes.select, options: options.channels, isMulti: true }
		];

		//Work out whether we need Twitter-based fields
		const twitterRequired = values.channels && values.channels.find(v => v === "twitter");

		//Add composer
		const composerField = {
			name: "content",
			type: fieldTypes.tweet,
			includeButton: false,
			variables,
			variableInstruction
		};
		if (!twitterRequired) {
			composerField.forTwitter = false;
		}
		fields.push(composerField);

		//Conditionally add reply tweet field
		if (twitterRequired) {
			fields.push({ name: "replyTweet", type: fieldTypes.text });
		}

		return [{ label, fields }];
	}

	async handleSubmit(values) {
		const { submitOverride, simpleSocialPost } = this.props;

		const submit = submitOverride || simpleSocialPost;

		await submit(values);
	}

	render() {
		const { authUser } = this.props;
		const { isLoading, validationSchema } = this.state;

		//Safeguard from non-admin users
		if (!authUser || !authUser.isAdmin) {
			console.error("BasicSocialForm should not be called for non-admin users");
			return null;
		}

		//Await profiles
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<BasicForm
				fieldGroups={values => this.getFieldGroups(values)}
				initialValues={this.getInitialValues()}
				isInitialValid={true}
				isNew={false}
				itemType={"Post"}
				onSubmit={values => this.handleSubmit(values)}
				submitButtonText="Post to Social"
				validationSchema={validationSchema}
			/>
		);
	}
}

BasicSocialForm.propTypes = {
	initialContent: PropTypes.string,
	label: PropTypes.string,
	replyTweet: PropTypes.string,
	submitOverride: PropTypes.func,
	variableInstruction: PropTypes.string,
	variables: PropTypes.arrayOf(
		PropTypes.shape({ label: PropTypes.string, value: PropTypes.string })
	)
};

BasicSocialForm.defaultProps = {
	initialContent: "",
	label: "Post to Social",
	replyTweet: "",
	variables: [],
	variableInstruction: "Add Variable"
};

function mapStateToProps({ config, social }) {
	const { authUser } = config;
	const { profiles, defaultProfile } = social;
	return { authUser, profiles, defaultProfile };
}

export default connect(mapStateToProps, { fetchProfiles, simpleSocialPost })(BasicSocialForm);
