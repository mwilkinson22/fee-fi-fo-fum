//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as Yup from "yup";
import { diff } from "deep-object-diff";

//Components
import DeleteButtons from "~/client/components/fields/DeleteButtons";
import BasicForm from "~/client/components/admin/BasicForm";
import BasicSocialForm from "~/client/components/admin/BasicSocialForm";
import PopUpDialog from "~/client/components/PopUpDialog";

//Actions
import { fetchProfiles, simpleSocialPostThread } from "~/client/actions/socialActions";
import LoadingPage from "~/client/components/LoadingPage";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
const defaultPostTypeKey = "text-only";

//Internal key incrementer
let lastKey = 1;

class SocialPostThreader extends Component {
	constructor(props) {
		super(props);

		//Get profiles
		const { profiles, fetchProfiles } = props;
		if (!profiles) {
			fetchProfiles();
		}

		//Set post types
		const postTypes = { ...props.customPostTypes };

		//If we have no custom post types, or if we need to add the default,
		//we do so here
		const insertDefaultType =
			!Object.keys(postTypes).length ||
			(props.includeDefaultPostType && !postTypes[defaultPostTypeKey]);
		if (insertDefaultType) {
			postTypes[defaultPostTypeKey] = {
				label: "Text Only"
			};
		}

		//If we've got custom post types but no custom onSubmit,
		//warn the user as this will likely not work as expected
		if (Object.keys(props.customPostTypes).length && !props.onSubmit) {
			console.warn("Custom post types have been provided with no custom onSubmit method");
		}

		//Create dropdown options for postTypes and channels.
		//We wait for profiles and create those options in getDerivedStateFromProps
		const options = {};
		options.postTypes = _.map(postTypes, ({ label, group }, value) => ({
			label,
			value,
			group
		}));
		const channels = ["Facebook"];
		if (!props.enforceTwitter) {
			channels.unshift("Twitter");
		}
		options.channels = channels.map(label => ({
			label,
			value: label.toLowerCase()
		}));

		//Set ref for post list, so we can autoscroll
		this.postList = React.createRef();

		//Get initial posts, assign an internal key
		const posts = props.initialPosts.map(post => ({ ...post, key: lastKey++ }));

		//Set initial state
		this.state = {
			currentPost: null,
			currentlyBeingReordered: [],
			options,
			posts,
			postTypes,
			showTypeSelector: false
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { profiles } = nextProps;
		const newState = { isLoading: false };

		if (!profiles) {
			newState.isLoading = true;
			return newState;
		}

		//Convert profiles to options
		newState.options = prevState.options;
		newState.options.profiles = _.chain(profiles)
			.reject("archived")
			.map(({ name, _id }) => ({ value: _id, label: name }))
			.sortBy("label")
			.value();

		return newState;
	}

	async handleSubmit(settings) {
		let { enforceTwitter, onSubmit, simpleSocialPostThread } = this.props;
		const { currentPost, postTypes, posts } = this.state;

		let error;

		//Ensure we have posts and none are being edited
		if (currentPost || !posts.length) {
			error = true;
		}
		//Ensure posts are all valid
		else {
			for (const i in posts) {
				const post = posts[i];
				const postType = postTypes[post.type];
				const yupSchema = postType.additionalFieldValidationSchema;

				if (yupSchema) {
					const values = { content: post.content, ...post.additionalValues };
					const schema = Yup.object().shape(yupSchema);
					post.isInvalid = !(await schema.isValid(values));
				} else {
					post.isInvalid = post.content.trim().length === 0;
				}
			}
			const invalidPosts = posts.filter(p => p.isInvalid);

			if (invalidPosts.length) {
				error = true;
			}
		}

		//Update error and invalid posts
		this.setState({ posts });

		//If we're error free, submit the data
		if (!error) {
			//Default to simple thread
			if (!onSubmit) {
				onSubmit = simpleSocialPostThread;
			}

			//Set up payload
			const payload = { posts, ...settings };
			if (enforceTwitter) {
				if (payload.channels) {
					payload.channels.push("twitter");
				} else {
					payload.channels = ["twitter"];
				}
			}

			//Set up channels
			await onSubmit(payload);
		}
	}

	confirmWeCanChangeCurrentPost() {
		const { currentPost, posts } = this.state;

		//Nothing to check
		if (currentPost === null || !this.unsavedValues) {
			return true;
		}

		//Compare current post and unsaved changes
		const post = posts[currentPost];
		const savedValues = { content: post.content };
		if (post.additionalValues) {
			Object.assign(savedValues, post.additionalValues);
		}

		if (Object.keys(diff(savedValues, this.unsavedValues)).length) {
			return confirm("Discard changes to current post?");
		}

		return true;
	}

	add(type) {
		const { postTypes, posts } = this.state;

		if (this.confirmWeCanChangeCurrentPost()) {
			//Get post type
			const postType = postTypes[type];

			//Push new post
			posts.push({
				type,
				content: postType.initialContent || "",
				additionalValues: postType.additionalFieldInitialValues,
				key: lastKey++
			});

			//Update state
			this.setState({ error: null, posts, currentPost: posts.length - 1 }, () => {
				//Scroll post list
				const postList = this.postList.current;
				postList.scrollTop = postList.scrollHeight;
			});
		}
	}

	update(values) {
		const { currentPost, posts } = this.state;

		const { content, ...additionalValues } = values;

		//Insert combined object into array
		posts[currentPost] = {
			...posts[currentPost],
			additionalValues,
			content,
			isInvalid: false
		};

		//Update post list and remove currentPost
		this.setState({ error: null, posts, currentPost: null });

		//Delete unsavedValues
		delete this.unsavedValues;
	}

	remove(i) {
		let { currentPost, posts } = this.state;

		//Update current post accordingly
		if (currentPost === i) {
			currentPost = null;
		} else if (currentPost > i) {
			currentPost = currentPost - 1;
		}

		posts.splice(i, 1);
		this.setState({ error: null, currentPost, posts });
	}

	reorder(oldIndex, newIndex) {
		let { currentPost, posts } = this.state;

		//Update currentlyBeingReordered, to enable css transition
		this.setState({ currentlyBeingReordered: [oldIndex, newIndex].sort() });

		//Wait for transition
		setTimeout(() => {
			//If we're reordering the current post, update this value
			if (currentPost === oldIndex) {
				currentPost = newIndex;
			} else if (currentPost === newIndex) {
				currentPost = oldIndex;
			}

			//Remove the element and save it to post variable
			const [post] = posts.splice(oldIndex, 1);

			//Reinsert it at the new index,
			//clear the currentlyBeingReordered array
			posts.splice(newIndex, 0, post);
			this.setState({ currentPost, posts, currentlyBeingReordered: [] });
		}, 200);
	}

	setCurrentPost(i) {
		if (this.confirmWeCanChangeCurrentPost()) {
			this.setState({ currentPost: i });
		}
	}

	renderTypeSelector() {
		const { options, showTypeSelector } = this.state;
		const onDestroy = () => this.setState({ showTypeSelector: false });
		if (showTypeSelector) {
			const list = [];
			_.chain(options.postTypes)
				.groupBy("group")
				.map((types, group) => {
					//Add header
					if (group !== "undefined") {
						list.push(
							<li key={`group-${group}`} className="header">
								<strong>{group}</strong>
							</li>
						);
					}
					//Add each type
					types.forEach(({ label, value }) =>
						list.push(
							<li
								key={value}
								className="clickable"
								onClick={() => {
									onDestroy();
									this.add(value);
								}}
							>
								{label}
							</li>
						)
					);
				})
				.value();
			return (
				<PopUpDialog className="type-selector" onDestroy={onDestroy}>
					<h6>Choose Type</h6>
					<ul className="plain-list">{list}</ul>
				</PopUpDialog>
			);
		}
	}

	renderAddPostListItem() {
		const { options } = this.state;

		//Click handler
		let onClick;
		if (options.postTypes.length === 1) {
			onClick = () => this.add(options.postTypes[0].value);
		} else {
			onClick = () => this.setState({ showTypeSelector: true });
		}

		//Type Selector
		return (
			<li key="Add New" className="new" onClick={onClick}>
				<strong>Add New Post</strong>
			</li>
		);
	}

	renderPostList() {
		const { currentlyBeingReordered, currentPost, postTypes, posts } = this.state;

		//Convert current posts to list
		const list = posts.map((post, i) => {
			//Determine Active Status
			const isActive = i === currentPost;

			//Create click handler
			let onClick;
			if (!isActive) {
				onClick = ev => {
					if (ev.target.type !== "button") {
						this.setCurrentPost(i);
					}
				};
			}

			//Reorder Buttons
			const reorderIndex = currentlyBeingReordered.indexOf(i) + 1;
			const isFirstPost = i === 0;
			const isLastPost = i === posts.length - 1;
			const reorderButtons = (
				<div className="post-buttons">
					<button
						onClick={() => this.reorder(i, i - 1)}
						disabled={isFirstPost}
						type="button"
					>
						&#9650;
					</button>
					<button
						onClick={() => this.reorder(i, i + 1)}
						disabled={isLastPost}
						type="button"
					>
						&#9660;
					</button>
				</div>
			);

			//Create classname
			const classNames = [];
			if (isActive) {
				classNames.push("active");
			} else if (post.isInvalid) {
				classNames.push("invalid");
			}

			if (reorderIndex) {
				classNames.push("reordered reordered-" + reorderIndex);
			}
			const className = classNames.length ? classNames.join(" ") : null;

			//Type string
			const postType = postTypes[post.type].label;

			return (
				<li key={i} className={className} onClick={onClick}>
					<div className="post-header">
						<strong>
							#{i + 1} - {postType}
						</strong>
						{reorderButtons}
					</div>
					{post.content}
					<DeleteButtons onDelete={() => this.remove(i)} />
				</li>
			);
		});

		//"Add" method
		list.push(this.renderAddPostListItem());

		return (
			<div className="form-card no-padding social-post-list">
				<h6>Current Thread</h6>
				<ul ref={this.postList}>{list}</ul>
			</div>
		);
	}

	renderActivePost() {
		const { currentPost, postTypes, posts } = this.state;
		if (currentPost === null || !posts[currentPost]) {
			//Empty div to preserve the grid layout
			return <div />;
		}

		//Get current post
		const post = posts[currentPost];

		//Get post type
		const postType = postTypes[post.type];

		//Swap out reset button
		const discardButton = (
			<button type="button" onClick={() => this.setState({ currentPost: null })}>
				Discard Changes
			</button>
		);

		//Pull dynamic props from post type
		const props = _.pick(postType, [
			"additionalFieldsComeAfter",
			"additionalFieldGroups",
			"additionalFieldValidationSchema",
			"getPreviewImage",
			"variableInstruction",
			"variables"
		]);

		//Get additional values
		const additionalValues = { ...post.additionalValues, type: post.type };

		return (
			<BasicSocialForm
				{...props}
				additionalFieldInitialValues={additionalValues}
				key={post.key}
				includeChannelSelector={false}
				includeProfileSelector={false}
				includeReplyTweetField={false}
				initialContent={post.content}
				label={`Update ${postType.label} Post ${currentPost + 1}`}
				replaceResetButton={discardButton}
				retrieveValues={values => (this.unsavedValues = values)}
				submitButtonText="Update Post"
				submitOverride={values => this.update(values)}
			/>
		);
	}

	getSettingsFieldGroups(values, error) {
		const { allowFacebookJoin, enforceTwitter } = this.props;
		const { options } = this.state;

		//Field Groups
		const fieldGroups = [
			{
				fields: [
					{ name: "_profile", type: fieldTypes.select, options: options.profiles },
					{
						name: "channels",
						type: fieldTypes.select,
						options: options.channels,
						isMulti: true
					}
				]
			}
		];

		//Add replyTweet
		const channels = values.channels || [];
		if (enforceTwitter || channels.find(v => v === "twitter")) {
			fieldGroups[0].fields.push({ name: "replyTweet", type: fieldTypes.text });
		}

		//Add facebook join bool
		if (allowFacebookJoin && channels.find(v => v === "facebook")) {
			fieldGroups[0].fields.push({ name: "joinForFacebook", type: fieldTypes.boolean });
		}

		//Conditionally add error message
		if (error) {
			fieldGroups.push({
				render: () => (
					<span className="error" key="error">
						{error}
					</span>
				)
			});
		}

		return fieldGroups;
	}

	checkForErrors() {
		const { currentPost, posts } = this.state;

		//Check we don't have a post open, to avoid accidentally submitting
		//unsaved changes
		if (currentPost !== null) {
			return "Save or discard current post to submit";
		}
		//Ensure we have posts
		else if (!posts.length) {
			return "At least one post must be added";
		}

		const invalidPosts = posts.filter(p => p.isInvalid);
		if (invalidPosts.length) {
			return `Validation errors found on ${invalidPosts.length} ${
				invalidPosts.length === 1 ? "post" : "posts"
			} `;
		}
	}

	renderSettings() {
		const { allowFacebookJoin, defaultProfile, enforceTwitter } = this.props;
		const { isLoading, options } = this.state;

		//Await Profiles
		if (isLoading) {
			return (
				<div className="form-card settings">
					<LoadingPage />
				</div>
			);
		}

		//Initial Values
		const initialValues = {
			_profile: defaultProfile || options.profiles[0].value,
			channels: [],
			replyTweet: ""
		};

		//Conditionally enforce twitter
		if (!enforceTwitter) {
			initialValues.channels.push("twitter");
		}

		//Validation Schema
		const rawValidationSchema = {
			_profile: Yup.string()
				.label("Profile")
				.required(),
			channels: Yup.array()
				.of(Yup.string())
				.label(`${enforceTwitter ? "Additional " : ""}Channels`),
			replyTweet: Yup.string().label("Reply Tweet ID"),
			joinForFacebook: Yup.bool().label("Single Facebook post?")
		};

		//Conditionally allow facebook merging
		if (allowFacebookJoin) {
			initialValues.joinForFacebook = true;
			rawValidationSchema.joinForFacebook = Yup.bool().label("Single Facebook post?");
		}

		//Convert validation schema to Yup
		const validationSchema = Yup.object().shape(rawValidationSchema);

		//Get Field Groups
		const error = this.checkForErrors();
		const fieldGroups = values => this.getSettingsFieldGroups(values, error);

		return (
			<BasicForm
				className="settings"
				enforceDisable={Boolean(error)}
				fieldGroups={fieldGroups}
				initialValues={initialValues}
				isInitialValid={true}
				isNew={true}
				itemType="Thread"
				onSubmit={values => this.handleSubmit(values)}
				submitButtonText="Post Thread"
				validationSchema={validationSchema}
			/>
		);
	}

	render() {
		return (
			<div className="social-post-threader">
				{this.renderPostList()}
				{this.renderActivePost()}
				{this.renderSettings()}
				{this.renderTypeSelector()}
			</div>
		);
	}
}

SocialPostThreader.propTypes = {
	allowFacebookJoin: PropTypes.bool,
	customPostTypes: PropTypes.objectOf(
		PropTypes.shape({
			additionalFieldsComeAfter: PropTypes.bool,
			additionalFieldGroups: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
			additionalFieldInitialValues: PropTypes.object,
			additionalFieldValidationSchema: PropTypes.object,
			initialContent: PropTypes.string,
			getPreviewImage: PropTypes.func,
			label: PropTypes.string.isRequired,
			variableInstruction: PropTypes.string,
			variables: PropTypes.arrayOf(
				PropTypes.shape({ label: PropTypes.string, value: PropTypes.string })
			)
		})
	),
	enforceTwitter: PropTypes.bool,
	includeDefaultPostType: PropTypes.bool,
	initialPosts: PropTypes.arrayOf(
		PropTypes.shape({
			content: PropTypes.string.isRequired,
			type: PropTypes.string.isRequired,
			additionalValues: PropTypes.object
		})
	),
	onSubmit: PropTypes.func,
	replyTweet: PropTypes.string
};

SocialPostThreader.defaultProps = {
	allowFacebookJoin: false,
	customPostTypes: {},
	enforceTwitter: true,
	includeDefaultPostType: true,
	initialPosts: [],
	onSubmit: null, //defaults to socialActions.simpleSocialPostThread
	replyTweet: ""
};

function mapStateToProps({ social }) {
	const { profiles, defaultProfile } = social;
	return { profiles, defaultProfile };
}

export default connect(mapStateToProps, { fetchProfiles, simpleSocialPostThread })(
	SocialPostThreader
);
