//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, Switch, Route } from "react-router-dom";

//Components
import ErrorBoundary from "../../components/ErrorBoundary";
import AdminTeamSelectorOverview from "../../components/admin/teamSelectors/AdminTeamSelectorOverview";
import AdminTeamSelectorPlayers from "../../components/admin/teamSelectors/AdminTeamSelectorPlayers";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "../../components/HelmetBuilder";
import NotFoundPage from "../NotFoundPage";
import SubMenu from "../../components/SubMenu";

//Actions
import { fetchTeamSelector, fetchAllTeamSelectors } from "../../actions/teamSelectorActions";

class AdminTeamSelectorPage extends Component {
	constructor(props) {
		super(props);

		const { selectorList, fetchAllTeamSelectors } = props;

		if (!selectorList) {
			fetchAllTeamSelectors();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fetchTeamSelector, match, selectors, selectorList } = nextProps;
		const { _id } = match.params;
		const newState = { isLoadingList: false };

		//Create or edit
		newState.isNew = !_id;

		//Validate existing entries
		if (!newState.isNew) {
			//Check everything has loaded
			if (!selectorList) {
				newState.isLoadingList = true;
				return newState;
			}

			//Check for a valid id
			if (!selectorList[_id]) {
				newState.selector = false;
			} else {
				//It's valid, ensure it's fully loaded
				if (selectors[_id]) {
					newState.selector = selectors[_id];
					newState.isLoadingSelector = false;
				} else if (!prevState.isLoadingSelector) {
					newState.isLoadingSelector = true;
					fetchTeamSelector(_id);
				}
			}
		}

		return newState;
	}

	getHeader() {
		const { isNew, selector } = this.state;

		//Create Submenu
		let submenu;
		if (!isNew) {
			const items = [
				{ label: "Overview", slug: "", isExact: true },
				{ label: "Players", slug: "players", isExact: true }
			];

			submenu = (
				<div className="container">
					<SubMenu items={items} rootUrl={`/admin/team-selectors/${selector._id}/`} />
				</div>
			);
		}

		//Header Text, Banner and Title
		let title;
		if (isNew) {
			title = "Add New Team Selector";
		} else {
			title = selector.title;
		}

		return (
			<section className="page-header">
				<HelmetBuilder title={title} />
				<div className="container">
					<Link className="nav-card card" to="/admin/team-selectors">
						↩ Return to Team Selector list
					</Link>
					<Link className="nav-card" to={`/team-selectors/${selector.slug}`}>
						View on frontend
					</Link>
					<h1>{title}</h1>
				</div>
				{submenu}
			</section>
		);
	}

	getContent() {
		return (
			<div className="container">
				<ErrorBoundary>
					<Switch>
						<Route
							path="/admin/team-selectors/new"
							exact
							component={AdminTeamSelectorOverview}
						/>
						<Route
							path="/admin/team-selectors/:_id/players"
							component={AdminTeamSelectorPlayers}
						/>
						<Route
							path="/admin/team-selectors/:_id"
							exact
							component={AdminTeamSelectorOverview}
						/>
						<Route path="/" component={NotFoundPage} />
					</Switch>
				</ErrorBoundary>
			</div>
		);
	}

	render() {
		const { isLoadingList, isLoadingSelector, isNew, selector } = this.state;
		if (isLoadingList || isLoadingSelector) {
			return <LoadingPage />;
		}

		if (!isNew && selector === false) {
			return <NotFoundPage message="Team Selector not found" />;
		}

		return (
			<div className="admin-team-selector-page admin-page">
				{this.getHeader()}
				{this.getContent()}
			</div>
		);
	}
}

function mapStateToProps({ teamSelectors }) {
	const { selectors, selectorList } = teamSelectors;
	return { selectors, selectorList };
}
export default connect(mapStateToProps, { fetchTeamSelector, fetchAllTeamSelectors })(
	AdminTeamSelectorPage
);
