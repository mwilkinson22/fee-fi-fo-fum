//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { Switch, Route, Link } from "react-router-dom";

//Components
import ErrorBoundary from "../../components/ErrorBoundary";
import AdminCompetitionInstanceOverview from "../../components/admin/competitions/AdminCompetitionInstanceOverview";
import AdminCompetitionInstanceSpecialRounds from "../../components/admin/competitions/AdminCompetitionInstanceSpecialRounds";
import AdminCompetitionInstanceAdjustments from "../../components/admin/competitions/AdminCompetitionInstanceAdjustments";
import AdminCompetitionInstanceStyle from "../../components/admin/competitions/AdminCompetitionInstanceStyle";
import AdminCompetitionInstanceSharedSquads from "../../components/admin/competitions/AdminCompetitionInstanceSharedSquads";
import AdminCompetitionInstanceImage from "../../components/admin/competitions/AdminCompetitionInstanceImage";
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
			newState.instance = newState.segment.instances.find(({ _id }) => _id === match.params.instanceId) || false;
		}

		return newState;
	}

	renderHeader() {
		let { instance, segment, isNew } = this.state;

		//Get Title
		const titleArr = [];
		if (isNew) {
			titleArr.push("Add New Competition Instance -");
		} else {
			titleArr.push(instance.year);
		}
		titleArr.push(segment.basicTitle);

		const title = titleArr.join(" ");

		//Render copy link for existing instances
		let copyLink;
		if (!isNew) {
			copyLink = (
				<Link
					to={`/admin/competitions/segments/${segment._id}/instances/new/${instance._id}`}
					className={`card nav-card`}
				>
					Copy Instance
				</Link>
			);
		}

		//Render submenu for existing instances
		let submenu;
		if (!isNew) {
			const items = [
				{ label: "Overview", slug: "", isExact: true },
				{ label: "Special Rounds", slug: "special-rounds", isExact: true },
				{ label: "Shared Squads", slug: "shared-squads" }
			];

			if (segment.type === "League" && instance.teams) {
				items.push(
					{ label: "Adjustments", slug: "adjustments" },
					{ label: "Table Styling", slug: "style" },
					{ label: "Images", slug: "images" }
				);
			}

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
					<Link className="nav-card" to={`/admin/competitions/segments/${segment._id}/instances`}>
						Return to {segment.name}
					</Link>
					{copyLink}
					<h1>{title} (instance)</h1>
					{submenu}
				</div>
			</section>
		);
	}

	renderContent() {
		const root = "/admin/competitions/segments/:segmentId/instances";
		return (
			<ErrorBoundary parentProps={this.props} parentState={this.state}>
				<Switch>
					<Route path={`${root}/:instanceId/images`} exact component={AdminCompetitionInstanceImage} />
					<Route path={`${root}/:instanceId/style`} exact component={AdminCompetitionInstanceStyle} />
					<Route
						path={`${root}/:instanceId/adjustments`}
						exact
						component={AdminCompetitionInstanceAdjustments}
					/>
					<Route
						path={`${root}/:instanceId/shared-squads`}
						exact
						component={AdminCompetitionInstanceSharedSquads}
					/>
					<Route
						path={`${root}/:instanceId/special-rounds`}
						exact
						component={AdminCompetitionInstanceSpecialRounds}
					/>
					<Route path={`${root}/new/:copyFromId`} exact component={AdminCompetitionInstanceOverview} />
					<Route path={`${root}/new`} exact component={AdminCompetitionInstanceOverview} />
					<Route path={`${root}/:instanceId`} exact component={AdminCompetitionInstanceOverview} />
					<Route path="/" component={NotFoundPage} />
				</Switch>
			</ErrorBoundary>
		);
	}

	render() {
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

export default connect(mapStateToProps, {
	fetchCompetitionSegments
})(AdminCompetitionInstancePage);
