//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";
import { editorStateFromRaw } from "megadraft";

//Components
import BasicForm from "../BasicForm";

//Actions
import { updateNewsPost } from "~/client/actions/newsActions";
import { fetchUserList } from "~/client/actions/userActions";
import { fetchGameList } from "~/client/actions/gamesActions";

//Constants
import newsDecorators from "~/constants/newsDecorators";
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminNewsPostContent extends Component {
	constructor(props) {
		super(props);

		const validationSchema = Yup.object().shape({
			content: Yup.mixed().label("")
		});

		this.state = { validationSchema };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullPosts, match } = nextProps;
		const { _id } = match.params;
		const newState = {};

		//Get post
		if (!newState.isNew) {
			newState.post = fullPosts[_id];
		}

		return newState;
	}

	getInitialValues() {
		const { post } = this.state;

		return {
			content: editorStateFromRaw(
				post.content ? JSON.parse(post.content) : null,
				newsDecorators
			)
		};
	}

	getFieldGroups() {
		return [
			{
				fields: [{ name: "content", type: fieldTypes.draft }]
			}
		];
	}

	render() {
		const { post, validationSchema } = this.state;
		const { updateNewsPost } = this.props;

		return (
			<BasicForm
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={false}
				itemType="Post"
				onSubmit={values => updateNewsPost(post._id, values)}
				useGrid={false}
				validationSchema={validationSchema}
			/>
		);
	}
}

function mapStateToProps({ news }) {
	const { fullPosts } = news;
	return { fullPosts };
}

export default connect(mapStateToProps, {
	fetchUserList,
	fetchGameList,
	updateNewsPost
})(AdminNewsPostContent);
