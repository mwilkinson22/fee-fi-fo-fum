import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import TeamBanner from "../components/teams/TeamBanner";

class AdminTeamList extends Component {
	renderList() {
		return _.chain(this.props.teamList)
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
		return (
			<div className="admin-page admin-team-list">
				<section className="page-header">
					<h1>Teams</h1>
				</section>
				{this.renderList()}
			</div>
		);
	}
}

function mapStateToProps({ teams }, ownProps) {
	const { teamList } = teams;
	return { teamList, ...ownProps };
}

export default connect(mapStateToProps)(AdminTeamList);
