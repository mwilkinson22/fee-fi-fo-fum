import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import TeamImage from "../../components/teams/TeamImage";

class AdminTeamList extends Component {
	renderList() {
		const { localTeam, teamList } = this.props;
		return _.chain(teamList)
			.sortBy(({ _id, name }) => `${_id == localTeam ? 0 : 1}${name.long}`)
			.sortBy()
			.map(team => {
				const { _id, name, colours } = team;
				return (
					<li key={_id}>
						<Link to={`/admin/teams/${_id}`}>
							<div
								className="team-wrapper card"
								style={{
									background: colours.main
								}}
							>
								<div className="team-image-wrapper">
									<TeamImage team={team} />
								</div>
								<div className="team-name">
									<h6 style={{ color: colours.text }}>{name.short}</h6>
								</div>
								<div
									className="team-trim"
									style={{ backgroundColor: colours.trim1 }}
								>
									<div
										className="inner"
										style={{ backgroundColor: colours.trim2 }}
									/>
								</div>
							</div>
						</Link>
					</li>
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
				<section className="team-list">
					<div className="container">
						<Link to="/admin/teams/new" className="nav-card">
							Add New Team
						</Link>
						<ul>{this.renderList()}</ul>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { teamList } = teams;
	return { localTeam, teamList };
}

export default connect(mapStateToProps)(AdminTeamList);
