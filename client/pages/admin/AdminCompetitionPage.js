//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { Switch, Route, Link } from "react-router-dom";

//Components
import AdminCompetitionOverview from "../../components/admin/competitions/AdminCompetitionOverview";
import AdminCompetitionSegmentList from "../../components/admin/competitions/AdminCompetitionSegmentList";
import NotFoundPage from "../NotFoundPage";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "~/client/components/HelmetBuilder";
import SubMenu from "../../components/SubMenu";

//Actions
import { fetchCompetitions } from "~/client/actions/competitionActions";

class AdminCompetitionPage extends Component {
	constructor(props) {
		super(props);

		const { competitionList, fetchCompetitions } = props;

		if (!competitionList) {
			fetchCompetitions();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { competitionList, match } = nextProps;
		const newState = { isLoading: false };

		//Create Or Edit
		newState.isNew = !match.params._id;

		//Check Everything is loaded
		if (!newState.isNew && !competitionList) {
			newState.isLoading = true;
			return newState;
		}

		//Get Current Competition
		if (!newState.isNew) {
			newState.competition = competitionList[match.params._id] || false;
		}

		return newState;
	}

	renderHeader() {
		const { competition, isNew } = this.state;

		//Render the title
		const title = isNew ? "Add New Competition" : competition.name;

		let submenu;
		if (!isNew) {
			submenu = (
				<SubMenu
					items={[
						{ label: "Overview", slug: "", isExact: true },
						{ label: "Segments", slug: "segments" }
					]}
					rootUrl={`/admin/competitions/${competition._id}/`}
				/>
			);
		}

		return (
			<section className="page-header">
				<HelmetBuilder title={title} />
				<div className="container">
					<Link className="nav-card" to={`/admin/competitions/`}>
						Return to Competitions list
					</Link>
					<h1>{title} (Competition)</h1>
				</div>
				{submenu}
			</section>
		);
	}

	renderContent() {
		return (
			<Switch>
				<Route
					path="/admin/competitions/:_id/segments"
					component={AdminCompetitionSegmentList}
				/>
				<Route path="/admin/competitions/new" exact component={AdminCompetitionOverview} />
				<Route path="/admin/competitions/:_id" exact component={AdminCompetitionOverview} />
				<Route path="/" component={NotFoundPage} />
			</Switch>
		);
	}

	render() {
		const { competition, isNew, isLoading } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}
		if (!isNew && competition === false) {
			return <NotFoundPage message="Competition not found" />;
		}

		return (
			<div className="admin-competition-page">
				{this.renderHeader()}
				{this.renderContent()}
			</div>
		);
	}
}

function mapStateToProps({ competitions }) {
	const { competitionList } = competitions;
	return { competitionList };
}

export default connect(mapStateToProps, { fetchCompetitions })(AdminCompetitionPage);
