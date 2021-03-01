//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import Searcher from "../../components/admin/Searcher";
import TeamImage from "../../components/teams/TeamImage";
import LoadingPage from "../../components/LoadingPage";

//Actions
import { fetchCompetitionSegments } from "../../actions/competitionActions";

class AdminTeamList extends Component {
	constructor(props) {
		super(props);

		const { competitionSegmentList, fetchCompetitionSegments } = props;

		let isLoading = false;
		if (!competitionSegmentList) {
			isLoading = true;
			fetchCompetitionSegments();
		}

		this.state = { filteredTeamList: props.teamList, isLoading };
	}

	static getDerivedStateFromProps(nextProps) {
		const { competitionSegmentList } = nextProps;

		if (!competitionSegmentList) {
			return null;
		}

		return { isLoading: false };
	}

	renderList() {
		const { localTeam, competitionSegmentList, mainCompetitionSegment } = this.props;
		const { filteredTeamList } = this.state;

		//Get main competition as an object
		const competitionSegment = competitionSegmentList[mainCompetitionSegment];

		//Get its latest instance
		const latestCompetitionInstance = _.maxBy(competitionSegment.instances, "year");

		const list = _.chain(filteredTeamList)
			.groupBy(({ _id }) => {
				//Group into one of three sections.
				//Prefix with a number that we can use to sort
				if (_id == localTeam) {
					return "0Local Team";
				}
				if (latestCompetitionInstance.teams.find(_team => _team == _id)) {
					return `1${competitionSegment.basicTitle} ${latestCompetitionInstance.year}`;
				}
				return "2Other Teams";
			})
			.toPairs()
			.sortBy(teams => teams[0])
			.fromPairs()
			.map((teams, label) => {
				//Map teams into a list
				const subList = _.chain(teams)
					.sortBy("name.long")
					.map(team => {
						const { _id, name, colours } = team;
						return (
							<li key={_id} className={_id == localTeam ? "full-span" : null}>
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
										<div className="team-trim" style={{ backgroundColor: colours.trim1 }}>
											<div className="inner" style={{ backgroundColor: colours.trim2 }} />
										</div>
									</div>
								</Link>
							</li>
						);
					})
					.value();

				//Add the label, use substr to remove sorting number
				subList.unshift(
					<li key={label} className="full-span section-header">
						<h6>{label.substr(1)}</h6>
					</li>
				);

				return subList;
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
		const { isLoading } = this.state;
		if (isLoading) {
			return <LoadingPage />;
		}
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
								convert(name.short).includes(searchString) || convert(name.long).includes(searchString)
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

function mapStateToProps({ config, competitions, teams }) {
	const { localTeam, mainCompetitionSegment } = config;
	const { competitionSegmentList } = competitions;
	const { teamList } = teams;
	return { localTeam, teamList, mainCompetitionSegment, competitionSegmentList };
}

export default connect(mapStateToProps, { fetchCompetitionSegments })(AdminTeamList);
