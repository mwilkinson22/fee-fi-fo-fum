//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import ShareableTeamSelector from "../components/teamselectors/ShareableTeamSelector";
import LoadingPage from "../components/LoadingPage";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "./NotFoundPage";

//Actions
import { fetchAllTeamSelectors, fetchTeamSelector } from "~/client/actions/teamSelectorActions";

//Helpers
import { matchSlugToItem } from "~/helpers/routeHelper";

class TeamSelectorPage extends Component {
	constructor(props) {
		super(props);

		const { fetchAllTeamSelectors, selectorList } = props;

		if (!selectorList) {
			fetchAllTeamSelectors();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const newState = { isLoadingList: false };
		const { fetchTeamSelector, match, selectorList, selectors } = nextProps;

		//Check we have the list
		if (!selectorList) {
			newState.isLoadingList = true;
			return newState;
		}

		//Get the selector
		const { item } = matchSlugToItem(match.params.slug, selectorList);

		if (!item) {
			newState.selector = false;
			return newState;
		}

		//Ensure it's fully loaded
		if (!selectors[item._id] && !prevState.isLoadingSelector) {
			fetchTeamSelector(item._id);
			newState.isLoadingSelector = true;
		} else if (selectors[item._id]) {
			newState.selector = selectors[item._id];
			newState.isLoadingSelector = false;
		}

		return newState;
	}

	renderHeader() {
		const { authUser } = this.props;
		const { selector } = this.state;

		let adminLink;
		if (authUser.isAdmin) {
			adminLink = (
				<Link className="nav-card" to={`/admin/team-selectors/${selector._id}`}>
					Edit this selector
				</Link>
			);
		}

		return (
			<section className="page-header">
				<HelmetBuilder
					title={selector.title}
					cardImage={selector.socialCard}
					description="Select your team and share it with the world!"
				/>
				<div className="container">
					<h1>{selector.title}</h1>
					{adminLink}
				</div>
			</section>
		);
	}

	render() {
		const { isLoadingList, isLoadingSelector, selector } = this.state;

		if (isLoadingList || isLoadingSelector) {
			return <LoadingPage />;
		}

		if (!selector) {
			return <NotFoundPage />;
		}

		return (
			<div className="team-selector-page">
				{this.renderHeader()}
				<section>
					<ShareableTeamSelector selector={selector} />
				</section>
			</div>
		);
	}
}

function mapStateToProps({ config, teams, teamSelectors }) {
	const { authUser } = config;
	const { teamTypes } = teams;
	const { selectors, selectorList } = teamSelectors;
	return { authUser, selectors, selectorList, teamTypes };
}

async function loadData(store, path) {
	await store.dispatch(fetchAllTeamSelectors());

	const slug = path.split("/")[2];
	const { item } = matchSlugToItem(slug, store.getState().teamSelectors.selectorList);

	if (item) {
		return store.dispatch(fetchTeamSelector(item._id));
	}
}

export default {
	component: connect(mapStateToProps, {
		fetchAllTeamSelectors,
		fetchTeamSelector
	})(TeamSelectorPage),
	loadData
};
