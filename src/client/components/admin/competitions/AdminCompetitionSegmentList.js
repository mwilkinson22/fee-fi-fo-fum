//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../../LoadingPage";

//Actions
import { fetchCompetitionSegments } from "~/client/actions/competitionActions";

class AdminCompetitionSegmentList extends Component {
	constructor(props) {
		super(props);

		const { competitionSegmentList, fetchCompetitionSegments } = props;
		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { competitionSegmentList, match, teamTypes } = nextProps;
		const newState = { isLoading: false };

		if (!competitionSegmentList) {
			newState.isLoading = true;
			return newState;
		}

		//Get Segments for this competition, grouped by team type
		newState.competitionSegments = _.chain(competitionSegmentList)
			.filter(({ _parentCompetition }) => _parentCompetition._id == match.params._id)
			.sortBy(({ _teamType }) => teamTypes[_teamType].sortOrder)
			.groupBy(({ _teamType }) => teamTypes[_teamType].name)
			.value();

		return newState;
	}

	renderList() {
		const { competitionSegments } = this.state;

		return _.map(competitionSegments, (segments, teamType) => {
			const list = segments.map(({ name, _id }) => (
				<li key={_id}>
					<Link to={`/admin/competitions/segments/${_id}`}>{name}</Link>
				</li>
			));

			return (
				<div key={teamType} className="card form-card">
					<h6>{teamType}</h6>
					<ul className="plain-list">{list}</ul>
				</div>
			);
		});
	}

	render() {
		const { isLoading } = this.state;
		const { match } = this.props;

		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<section className="list">
				<div className="container">
					<Link to={`/admin/competitions/segments/new/${match.params._id}`} className={`card nav-card`}>
						Create New Segment
					</Link>
					{this.renderList()}
				</div>
			</section>
		);
	}
}

function mapStateToProps({ competitions, teams }) {
	const { competitionSegmentList } = competitions;
	const { teamTypes } = teams;
	return { competitionSegmentList, teamTypes };
}

export default connect(mapStateToProps, { fetchCompetitionSegments })(AdminCompetitionSegmentList);
