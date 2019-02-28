import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchAllTeams } from "../actions/teamsActions";
import LoadingPage from "../components/LoadingPage";
import { Link } from "react-router-dom";
import { toRgb } from "../utils/colourHelper";
import TeamImage from "../components/teams/TeamImage";
import TeamBanner from "../components/teams/TeamBanner";

class AdminTeamList extends Component {
	constructor(props) {
		super(props);
		const { teamList, fetchAllTeams } = props;

		if (!teamList) {
			fetchAllTeams();
		}

		this.state = { teamList };
	}

	static getDerivedStateFromProps(nextProps) {
		const { teamList } = nextProps;
		return { teamList };
	}

	renderList() {
		const { teamList } = this.state;
		return _.chain(teamList)
			.sortBy("name.long")
			.map(team => {
				const { slug } = team;
				return (
					<Link key={team._id} to={`/admin/teams/${slug}`}>
						<TeamBanner team={team} />
					</Link>
				);
			})
			.value();
	}

	render() {
		const { teamList } = this.state;
		if (!teamList) {
			return <LoadingPage />;
		} else {
			return (
				<div className="admin-team-list">
					<section className="page-header">
						<h1>Teams</h1>
					</section>
					{this.renderList()}
				</div>
			);
		}
	}
}

function mapStateToProps({ teams }, ownProps) {
	const { teamList } = teams;
	return { teamList, ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchAllTeams }
)(AdminTeamList);
