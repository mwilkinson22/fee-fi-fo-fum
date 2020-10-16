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
		const { authUser, fetchProfiles, profiles, includeProfileSelector } = props;
		if (authUser && authUser.isAdmin && includeProfileSelector) {
			//Get Social Media Profiles
			if (!profiles) {
				fetchProfiles();
			}
		}

		this.state = {
			previewImage: null
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const {
			enforceTwitter,
			profiles,
			replyTweet,
			additionalFieldValidationSchema,
			additionalFieldGroups,
			additionalFieldInitialValues,
			getPreviewImage,
			includeChannelSelector,
			includeProfileSelector,
			includeReplyTweetField
		} = nextProps;

		const newState = {
			isLoading: false,
			replyTweet,
			additionalFieldGroups,
			additionalFieldInitialValues,
			getPreviewImage
		};

		//Wait for profiles
		if (includeProfileSelector && !profiles) {
			return { isLoading: true };
		}

		//Create Validation Schema
		const rawValidationSchema = {
			...additionalFieldValidationSchema,
			content: Yup.string()
				.required()
				.label("Content")
		};

		//Create dropdown options
		newState.options = {};

		//Add Channel Selector data
		if (includeChannelSelector) {
			//Options
			newState.options.channels = [{ label: "Facebook", value: "facebook" }];
			if (!enforceTwitter) {
				newState.options.channels.unshift({ label: "Twitter", value: "twitter" });
			}

			//Validation
			rawValidationSchema.channels = Yup.array()
				.of(Yup.string())
				.min(1)
				.label(enforceTwitter ? "Additional Channels" : "Channels");
		}

		if (includeProfileSelector) {
			//Options
			newState.options.profiles = _.chain(profiles)
				.reject("archived")
				.map(({ name, _id }) => ({ value: _id, label: name }))
				.sortBy("label")
				.value();

			//Validation
			rawValidationSchema._profile = Yup.string().label("Social Profile");
		}

		if (includeReplyTweetField) {
			rawValidationSchema.replyTweet = Yup.string().label("Reply Tweet ID");
		}

		newState.validationSchema = Yup.object().shape(rawValidationSchema);

		return newState;
	}

	getInitialValues() {
		const {
			defaultProfile,
			initialContent,
			includeChannelSelector,
			includeProfileSelector,
			includeReplyTweetField
		} = this.props;
		const { additionalFieldInitialValues, options, replyTweet } = this.state;

		const values = {
			...additionalFieldInitialValues,
			content: initialContent
		};

		if (includeChannelSelector) {
			values.channels = options.channels.map(o => o.value);
		}

		if (includeProfileSelector) {
			values._profile = defaultProfile;
		}

		if (includeReplyTweetField) {
			values.replyTweet = replyTweet;
		}

		return values;
	}

	getFieldGroups(values) {
		const {
			enforceTwitter,
			label,
			variables,
			variableInstruction,
			additionalFieldsComeAfter,
			includeChannelSelector,
			includeProfileSelector,
			includeReplyTweetField
		} = this.props;
		const { options, getPreviewImage, previewImage } = this.state;
		let { additionalFieldGroups } = this.state;

		//Set initial fieldgroup array
		const fieldGroups = [{ label }];

		//Set initial field array
		const fields = [];

		//Conditionally add profile & channels
		if (includeProfileSelector) {
			fields.push({ name: "_profile", type: fieldTypes.select, options: options.profiles });
		}
		if (includeChannelSelector) {
			fields.push({
				name: "channels",
				type: fieldTypes.select,
				options: options.channels,
				isMulti: true
			});
		}

		//Work out whether we need Twitter-based fields
		const twitterRequired =
			enforceTwitter || (values.channels && values.channels.find(v => v === "twitter"));

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
		if (twitterRequired && includeReplyTweetField) {
			fields.push({ name: "replyTweet", type: fieldTypes.text });
		}

		//If additionalFieldGroups is a function, get the returned object
		if (typeof additionalFieldGroups === "function") {
			additionalFieldGroups = additionalFieldGroups(values);
		}

		//Add everything to fieldgroup object
		if (additionalFieldsComeAfter) {
			fieldGroups.push({ fields }, ...additionalFieldGroups);
		} else {
			fieldGroups.push(...additionalFieldGroups, { fields });
		}

		//Add Preview Fields
		if (getPreviewImage) {
			fieldGroups.push({
				render: () => (
					<div className="buttons" key="preview-buttons">
						<button
							type="button"
							disabled={previewImage === "Loading"}
							onClick={async () => {
								//Set State to loading
								this.setState({ previewImage: "Loading" });

								//Get Image
								const image = await getPreviewImage(values);

								//Set state to image
								this.setState({ previewImage: image });
							}}
						>
							Get Preview
						</button>
						<button
							type="button"
							disabled={!previewImage || previewImage == "Loading"}
							onClick={() => this.setState({ previewImage: null })}
						>
							Clear Preview
						</button>
					</div>
				)
			});
		}

		//Add preview
		if (previewImage) {
			let content;
			if (previewImage === "Loading") {
				content = <LoadingPage />;
			} else {
				content = <img src={previewImage} alt="Preview Image" className="preview-image" />;
			}

			fieldGroups.push({
				render: () => (
					<div className="full-span preview-image" key="preview">
						{content}
					</div>
				)
			});
		}

		return fieldGroups;
	}

	async handleSubmit(rawValues) {
		const { enforceTwitter, submitOverride, simpleSocialPost } = this.props;

		const values = { ...rawValues };
		if (enforceTwitter) {
			const channels = values.channels || [];
			channels.push("twitter");
			values.channels = channels;
		}

		//Clear preview
		this.setState({ previewImage: null });

		//Get submit function
		const submit = submitOverride || simpleSocialPost;

		await submit(values);
	}

	render() {
		const { authUser, replaceResetButton, retrieveValues, submitButtonText } = this.props;
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
				replaceResetButton={replaceResetButton}
				retrieveValues={retrieveValues}
				submitButtonText={submitButtonText}
				validationSchema={validationSchema}
			/>
		);
	}
}

BasicSocialForm.propTypes = {
	additionalFieldsComeAfter: PropTypes.bool,
	additionalFieldGroups: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
	additionalFieldInitialValues: PropTypes.object,
	additionalFieldValidationSchema: PropTypes.object,
	checkValues: PropTypes.func,
	enforceTwitter: PropTypes.bool,
	getPreviewImage: PropTypes.func,
	initialContent: PropTypes.string,
	includeChannelSelector: PropTypes.bool,
	includeProfileSelector: PropTypes.bool,
	includeReplyTweetField: PropTypes.bool,
	label: PropTypes.string,
	replaceResetButton: PropTypes.node,
	replyTweet: PropTypes.string,
	retrieveValues: PropTypes.func,
	submitButtonText: PropTypes.string,
	submitOverride: PropTypes.func,
	variableInstruction: PropTypes.string,
	variables: PropTypes.arrayOf(
		PropTypes.shape({ label: PropTypes.string, value: PropTypes.string })
	)
};

BasicSocialForm.defaultProps = {
	additionalFieldsComeAfter: false,
	additionalFieldGroups: [],
	additionalFieldInitialValues: {},
	additionalFieldValidationSchema: {},
	checkValues: null,
	enforceTwitter: false,
	getPreviewImage: null,
	includeChannelSelector: true,
	includeProfileSelector: true,
	includeReplyTweetField: true,
	initialContent: "",
	label: "Post to Social",
	replaceResetButton: null,
	replyTweet: "",
	retrieveValues: null,
	submitButtonText: "Post to Social",
	variables: [],
	variableInstruction: "Add Variable"
};

function mapStateToProps({ config, social }) {
	const { authUser } = config;
	const { profiles, defaultProfile } = social;
	return { authUser, profiles, defaultProfile };
}

export default connect(mapStateToProps, { fetchProfiles, simpleSocialPost })(BasicSocialForm);
