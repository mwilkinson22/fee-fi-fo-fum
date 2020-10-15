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

//Actions
import { fetchProfiles, simpleSocialPostThread } from "~/client/actions/socialActions";
import LoadingPage from "~/client/components/LoadingPage";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class SocialPostThreader extends Component {
	constructor(props) {
		super(props);

		//Get profiles
		const { profiles, fetchProfiles } = props;
		if (!profiles) {
			fetchProfiles();
		}

		//Set ref for post list, so we can autoscroll
		this.postList = React.createRef();

		//Set initial state
		this.state = {
			posts: props.initialPosts,
			currentPost: null,
			currentlyBeingReordered: []
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const { profiles } = nextProps;
		const newState = { isLoading: false };

		if (!profiles) {
			newState.isLoading = true;
			return newState;
		}

		//Convert profiles to options
		newState.profiles = _.chain(profiles)
			.reject("archived")
			.map(({ name, _id }) => ({ value: _id, label: name }))
			.sortBy("label")
			.value();

		return newState;
	}

	async handleSubmit(settings) {
		let { onSubmit, simpleSocialPostThread } = this.props;
		const { posts } = this.state;

		let error;
		//Ensure we have posts
		if (!posts.length) {
			error = "At least one post must be added";
		}

		//Ensure all posts have content
		const emptyPosts = [];
		posts.forEach(({ content }, i) => {
			if (!content.trim().length) {
				emptyPosts.push(i + 1);
			}
		});
		if (emptyPosts.length) {
			const isPlural = emptyPosts.length !== 1;
			error = `Empty posts cannot be submitted. `;
			error += `Add content to ${isPlural ? "posts" : "post"} `;
			if (isPlural) {
				const lastPost = emptyPosts.pop();
				error += `${emptyPosts.join(", ")} & ${lastPost}`;
			} else {
				error += emptyPosts[0];
			}
			error += `, or delete ${isPlural ? "them" : "it"}.`;
		}

		//Update error in state
		this.setState({ error });

		//If we're error free, submit the data
		if (!error) {
			//Default to simple thread
			if (!onSubmit) {
				onSubmit = simpleSocialPostThread;
			}

			//Set up channels
			await onSubmit({ posts, ...settings });
		}
	}

	confirmWeCanChangeCurrentPost() {
		const { currentPost, posts } = this.state;

		//Nothing to check
		if (currentPost === null || !this.unsavedValues) {
			return true;
		}

		//Compare current post and unsaved changes
		if (Object.keys(diff(posts[currentPost], this.unsavedValues)).length) {
			return confirm("Discard changes to current post?");
		}

		return true;
	}

	add() {
		const { defaultNewPostContent } = this.props;
		const { posts } = this.state;

		if (this.confirmWeCanChangeCurrentPost()) {
			//Push new post
			posts.push({ content: defaultNewPostContent });

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

		//Insert combined object into array
		posts[currentPost] = {
			...posts[currentPost],
			...values
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

	renderPostList() {
		const { currentlyBeingReordered, currentPost, posts } = this.state;

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
			}

			if (reorderIndex) {
				classNames.push("reordered reordered-" + reorderIndex);
			}
			const className = classNames.length ? classNames.join(" ") : null;

			return (
				<li key={i} className={className} onClick={onClick}>
					<div className="post-header">
						<strong>Post {reorderIndex ? "" : `#${i + 1}`}</strong>
						{reorderButtons}
					</div>
					{post.content}
					<DeleteButtons onDelete={() => this.remove(i)} />
				</li>
			);
		});

		//Button to add new post
		list.push(
			<li key="Add New" className="new" onClick={() => this.add()}>
				Add New Post
			</li>
		);

		return (
			<div className="form-card no-padding social-post-list">
				<h6>Current Thread</h6>
				<ul ref={this.postList}>{list}</ul>
			</div>
		);
	}

	renderActivePost() {
		const { currentPost, posts } = this.state;
		if (currentPost === null || !posts[currentPost]) {
			//Empty div to preserve the grid layout
			return <div />;
		}

		//Get current post
		const post = posts[currentPost];

		//Swap out reset button
		const discardButton = (
			<button type="button" onClick={() => this.setState({ currentPost: null })}>
				Discard Changes
			</button>
		);

		return (
			<BasicSocialForm
				includeChannelSelector={false}
				includeProfileSelector={false}
				includeReplyTweetField={false}
				initialContent={post.content}
				label={`Update Post ${currentPost + 1}`}
				replaceResetButton={discardButton}
				retrieveValues={values => (this.unsavedValues = values)}
				submitButtonText="Update Post"
				submitOverride={values => this.update(values)}
			/>
		);
	}

	getSettingsFieldGroups(values) {
		const { error, profiles } = this.state;

		//Create Channel Options
		const channels = ["Twitter", "Facebook"].map(label => ({
			label,
			value: label.toLowerCase()
		}));

		//Field Groups
		const fieldGroups = [
			{
				fields: [
					{ name: "_profile", type: fieldTypes.select, options: profiles },
					{ name: "channels", type: fieldTypes.select, options: channels, isMulti: true },
					{ name: "replyTweet", type: fieldTypes.text }
				]
			}
		];

		//Add facebook join bool
		if (values.channels.find(v => v === "facebook")) {
			fieldGroups[0].fields.push({ name: "joinForFacebook", type: fieldTypes.boolean });
		}

		//Add error
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

	renderSettings() {
		const { defaultProfile } = this.props;
		const { isLoading, profiles } = this.state;

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
			_profile: defaultProfile || profiles[0].value,
			channels: ["twitter"],
			replyTweet: "",
			joinForFacebook: true
		};

		const validationSchema = Yup.object().shape({
			_profile: Yup.string()
				.label("Profile")
				.required(),
			channels: Yup.array()
				.of(Yup.string())
				.label("Channels"),
			replyTweet: Yup.string().label("Reply Tweet ID"),
			joinForFacebook: Yup.bool().label("Single Facebook post?")
		});

		return (
			<BasicForm
				className="settings"
				fieldGroups={values => this.getSettingsFieldGroups(values)}
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
			</div>
		);
	}
}

SocialPostThreader.propTypes = {
	defaultNewPostContent: PropTypes.string,
	initialPosts: PropTypes.arrayOf(PropTypes.shape({ content: PropTypes.string.isRequired })),
	onSubmit: PropTypes.func,
	replyTweet: PropTypes.string
};

SocialPostThreader.defaultProps = {
	defaultNewPostContent: "",
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
