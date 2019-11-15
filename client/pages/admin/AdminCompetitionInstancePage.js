//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Switch, Route, Link, withRouter } from "react-router-dom";

//Components
import AdminCompetitionInstanceOverview from "../../components/admin/competitions/AdminCompetitionInstanceOverview";
import SubMenu from "../../components/SubMenu";
import NotFoundPage from "../NotFoundPage";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import { fetchCompetitionSegments } from "~/client/actions/competitionActions";

class AdminCompetitionInstancePage extends Component {
	constructor(props) {
		super(props);

		const { competitionSegmentList, fetchCompetitionSegments } = props;

		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { competitionSegmentList, match } = nextProps;
		const newState = { isLoading: false };

		//Create Or Edit
		newState.isNew = !match.params.instanceId;

		//Check if everything is loaded.
		if (!competitionSegmentList) {
			newState.isLoading = true;
			return newState;
		}

		//Get segment
		newState.segment = competitionSegmentList[match.params.segmentId] || false;

		//Get instance
		if (newState.segment && !newState.isNew) {
			newState.instance =
				newState.segment.instances.find(({ _id }) => _id === match.params.instanceId) ||
				false;
		}

		return newState;
	}

	renderHeader() {
		let { instance, segment, isNew } = this.state;

		//Get Title
		const titleArr = [];
		if (isNew) {
			titleArr.push("Add New Competition Instance -");
		} else if (segment.multipleInstances) {
			titleArr.push(instance.year);
		}
		titleArr.push(segment._parentCompetition.name);
		if (segment.appendCompetitionName) {
			titleArr.push(segment.name);
		}
		const title = titleArr.join(" ");

		//Render submenu for existing segments
		let submenu;
		if (instance) {
			const items = [{ label: "Overview", slug: "", isExact: true }];

			submenu = (
				<SubMenu
					items={items}
					rootUrl={`/admin/competitions/segments/${segment._id}/instances/${instance._id}/`}
				/>
			);
		}

		return (
			<section className="page-header">
				<HelmetBuilder title={title} />
				<div className="container">
					<Link
						className="nav-card"
						to={`/admin/competitions/segments/${segment._id}/${
							segment.multipleInstances ? "instances" : ""
						}`}
					>
						Return to {segment.name}
					</Link>
					<h1>{title} (instance)</h1>
					{submenu}
				</div>
			</section>
		);
	}

	renderContent() {
		const root = "/admin/competitions/segments/:segmentId/instances";
		return (
			<Switch>
				<Route path={`${root}/new`} exact component={AdminCompetitionInstanceOverview} />
				<Route
					path={`${root}/:instanceId`}
					exact
					component={AdminCompetitionInstanceOverview}
				/>
				<Route path="/" component={NotFoundPage} />
			</Switch>
		);
	}

	render() {
		const { history } = this.props;
		const { instance, segment, isNew, isLoading } = this.state;

		//Await competitionSegmentList
		if (isLoading) {
			return <LoadingPage />;
		}
		//404 for invalid IDs
		if (segment === false) {
			return <NotFoundPage message="Segment not found" />;
		}
		if (!isNew && instance === false) {
			return <NotFoundPage message="Instance not found" />;
		}

		//Prevent adding multiple entries where segments do not allow it
		if (isNew && !segment.multipleInstances && segment.instances.length) {
			history.replace(
				`/admin/competitions/segments/${segment._id}/instances/${segment.instances[0]._id}`
			);
			return null;
		}

		return (
			<div className="admin-competition-instance-page">
				{this.renderHeader()}
				{this.renderContent()}
			</div>
		);
	}
}

function mapStateToProps({ competitions }) {
	const { competitionSegmentList } = competitions;
	return { competitionSegmentList };
}

export default withRouter(
	connect(mapStateToProps, {
		fetchCompetitionSegments
	})(AdminCompetitionInstancePage)
);
