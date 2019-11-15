//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../../LoadingPage";

//Actions
import { fetchCompetitionSegments } from "~/client/actions/competitionActions";

class AdminCompetitionInstanceList extends Component {
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

		if (!competitionSegmentList) {
			newState.isLoading = true;
			return newState;
		}

		//Get the current segment
		newState.segment = competitionSegmentList[match.params._id] || false;

		return newState;
	}

	renderList() {
		const { segment } = this.state;

		const list = _.chain(segment.instances)
			.orderBy(["year"], ["desc"])
			.map(({ year, _id, sponsor }) => {
				const titleArr = [year, sponsor, segment._parentCompetition.name];

				if (segment.appendCompetitionName) {
					titleArr.push(segment.name);
				}

				const title = _.filter(titleArr, _.identity).join(" ");

				return (
					<li key={_id}>
						<Link to={`/admin/competitions/segments/${segment._id}/instances/${_id}`}>
							{title}
						</Link>
					</li>
				);
			})
			.value();

		if (list.length) {
			return (
				<div className="card form-card">
					<ul className="plain-list">{list}</ul>
				</div>
			);
		}
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
					<Link
						to={`/admin/competitions/segments/${match.params._id}/instances/new`}
						className={`card nav-card`}
					>
						Create New Segment
					</Link>
					{this.renderList()}
				</div>
			</section>
		);
	}
}

function mapStateToProps({ competitions }) {
	const { competitionSegmentList } = competitions;
	return { competitionSegmentList };
}

export default connect(mapStateToProps, { fetchCompetitionSegments })(AdminCompetitionInstanceList);
