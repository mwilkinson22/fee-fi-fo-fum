//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import Searcher from "../../components/admin/Searcher";
import TeamImage from "../../components/teams/TeamImage";

class AdminTeamList extends Component {
	constructor(props) {
		super(props);

		this.state = { filteredTeamList: props.teamList };
	}

	renderList() {
		const { localTeam } = this.props;
		const { filteredTeamList } = this.state;
		const list = _.chain(filteredTeamList)
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
									<TeamImage team={team} size="medium" />
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

		if (list.length) {
			return <ul>{list}</ul>;
		} else {
			return (
				<div className="form-card">
					<p>No teams found</p>
				</div>
			);
		}
	}

	render() {
		const { teamList } = this.props;
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
						<Searcher
							data={teamList}
							emptySearchReturnsAll={true}
							handleFilter={({ name }, searchString, convert) =>
								convert(name.short).includes(searchString) ||
								convert(name.long).includes(searchString)
							}
							minimumSearchValue={0}
							onChange={filteredTeamList => this.setState({ filteredTeamList })}
						/>
						{this.renderList()}
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
