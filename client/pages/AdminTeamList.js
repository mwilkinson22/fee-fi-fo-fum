import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchAllTeams } from "../actions/teamsActions";
import LoadingPage from "../components/LoadingPage";
import { Link } from "react-router-dom";
import { toRgb } from "../utils/colourHelper";
import TeamImage from "../components/teams/TeamImage";

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
				const { slug, name, colours } = team;
				return (
					<Link
						key={team._id}
						to={`/admin/teams/${slug}`}
						className="admin-team-card"
						style={{
							backgroundColor: toRgb(colours.main),
							borderColor: toRgb(colours.trim1)
						}}
					>
						<div className="image">
							<TeamImage team={team} />
						</div>
						<h6 style={{ color: toRgb(colours.text) }}>{name.long}</h6>
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
					<div className="container no-mobile-padding">{this.renderList()}</div>
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
