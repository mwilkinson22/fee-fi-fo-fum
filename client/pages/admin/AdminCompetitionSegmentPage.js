//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { Switch, Route, Link } from "react-router-dom";

//Components
import ErrorBoundary from "../../components/ErrorBoundary";
import AdminCompetitionSegmentOverview from "../../components/admin/competitions/AdminCompetitionSegmentOverview";
import AdminCompetitionInstanceList from "../../components/admin/competitions/AdminCompetitionInstanceList";
import SubMenu from "../../components/SubMenu";
import NotFoundPage from "../NotFoundPage";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import { fetchCompetitions, fetchCompetitionSegments } from "~/client/actions/competitionActions";

class AdminCompetitionSegmentPage extends Component {
	constructor(props) {
		super(props);

		const {
			competitionList,
			fetchCompetitions,
			competitionSegmentList,
			fetchCompetitionSegments
		} = props;

		if (!competitionList) {
			fetchCompetitions();
		}

		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { competitionList, competitionSegmentList, match } = nextProps;
		const newState = { isLoading: false };

		//Create Or Edit
		newState.isNew = !match.params._id;

		//Check if everything is loaded.
		//We always need the segment list (to load the active
		//segment, and for "Points Carried From").
		//We only need the competition list to validate the parent of new segments
		if (!competitionSegmentList || (newState.isNew && !competitionList)) {
			newState.isLoading = true;
			return newState;
		}

		//Ensure parent competition is valid
		if (newState.isNew) {
			newState.parent = competitionList[match.params.parent];
		} else {
			newState.segment = competitionSegmentList[match.params._id] || false;
			newState.parent = newState.segment && newState.segment._parentCompetition;
		}

		return newState;
	}

	renderHeader() {
		let { parent, segment, isNew } = this.state;

		//Get Title
		const title = isNew ? `Add New Competition - ${parent.name}` : segment.name;

		//Render submenu for existing segments
		let submenu;
		if (segment) {
			const items = [
				{ label: "Overview", slug: "", isExact: true },
				{ label: "Instances", slug: "instances" }
			];

			submenu = (
				<SubMenu items={items} rootUrl={`/admin/competitions/segments/${segment._id}/`} />
			);
		}

		return (
			<section className="page-header">
				<HelmetBuilder title={title} />
				<div className="container">
					<Link className="nav-card" to={`/admin/competitions/${parent._id}/segments`}>
						Return to {parent.name}
					</Link>
					<h1>{title} (Segment)</h1>
					{submenu}
				</div>
			</section>
		);
	}

	renderContent() {
		return (
			<ErrorBoundary>
				<Switch>
					<Route
						path="/admin/competitions/segments/:_id/instances"
						component={AdminCompetitionInstanceList}
						exact
					/>
					<Route
						path="/admin/competitions/segments/new/:parent"
						exact
						component={AdminCompetitionSegmentOverview}
					/>
					<Route
						path="/admin/competitions/segments/:_id"
						exact
						component={AdminCompetitionSegmentOverview}
					/>
					<Route path="/" component={NotFoundPage} />
				</Switch>
			</ErrorBoundary>
		);
	}

	render() {
		const { segment, isNew, parent, isLoading } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}
		if (isNew && !parent) {
			return <NotFoundPage message="Invalid parent competition" />;
		}
		if (!isNew && segment === false) {
			return <NotFoundPage message="Competition Segment not found" />;
		}

		return (
			<div className="admin-competition-segment-page">
				{this.renderHeader()}
				{this.renderContent()}
			</div>
		);
	}
}

function mapStateToProps({ competitions }) {
	const { competitionList, competitionSegmentList } = competitions;
	return { competitionList, competitionSegmentList };
}

export default connect(mapStateToProps, {
	fetchCompetitions,
	fetchCompetitionSegments
})(AdminCompetitionSegmentPage);
