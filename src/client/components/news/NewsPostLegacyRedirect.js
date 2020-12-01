import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchLegacyNewsPost } from "../../actions/newsActions";
import LoadingPage from "../LoadingPage";
import NotFoundPage from "../../pages/NotFoundPage";
import { Redirect } from "react-router-dom";

class NewsPostLegacyRedirect extends Component {
	constructor(props) {
		super(props);
		const { redirect } = props;
		this.state = { redirect };
	}

	static getDerivedStateFromProps(nextProps) {
		const { redirect, match } = nextProps;
		if (redirect === undefined) {
			fetchLegacyNewsPost(match.params.id);
			return {};
		} else {
			return { redirect };
		}
	}
	render() {
		const { redirect } = this.state;
		if (redirect === undefined) {
			return <LoadingPage />;
		} else if (!redirect) {
			return <NotFoundPage message="Post not found" />;
		} else {
			return <Redirect to={`/news/post/${redirect.slug}`} />;
		}
	}
}

function mapStateToProps({ news }, ownProps) {
	return { redirect: news.redirects[ownProps.match.params.id] };
}

function loadData(store, path) {
	const id = path.split("/")[3];
	return store.dispatch(fetchLegacyNewsPost(id));
}

export default {
	component: connect(mapStateToProps, { fetchLegacyNewsPost })(NewsPostLegacyRedirect),
	loadData: loadData
};
