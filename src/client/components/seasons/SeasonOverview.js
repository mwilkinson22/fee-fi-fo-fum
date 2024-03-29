//Modules
import _ from "lodash";
import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

//Components
import LoadingPage from "../LoadingPage";
import LeagueTable from "./LeagueTable";

//Actions
import { fetchCompetitionSegments } from "~/client/actions/competitionActions";

class SeasonOverview extends Component {
	constructor(props) {
		super(props);

		const { competitionSegmentList, fetchCompetitionSegments } = props;

		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { games, year, teamType, competitionSegmentList } = nextProps;
		let newState = {};

		if (competitionSegmentList) {
			newState = {
				games,
				year,
				teamType
			};
			newState.games = games;
			newState.year = year;
			newState.leagues = _.chain(games)
				.orderBy(["date"], ["desc"])
				.uniqBy(g => g._competition._id)
				.map(g => competitionSegmentList[g._competition._id])
				.filter(c => c.type == "League")
				.value();
		}

		return newState;
	}

	renderLeagueTables() {
		const { year, leagues } = this.state;
		if (Number(year)) {
			return leagues.map(c => <LeagueTable key={c._id} competition={c._id} year={year} />);
		}
	}

	renderOverviewTable() {
		const { localTeam } = this.props;
		const { games, leagues } = this.state;
		const rows = [];

		//Get Result Stats
		const results = games
			.filter(g => g.score)
			.map(({ slug, score, _opposition }) => {
				const margin = score[localTeam] - score[_opposition._id];

				let scoreString = _.values(score).sort().reverse().join("-");

				if (margin > 0) {
					scoreString += " Win";
				} else if (margin < 0) {
					scoreString += " Loss";
				} else {
					scoreString += " Draw";
				}

				scoreString += ` vs ${_opposition.name.short}`;

				return {
					slug,
					score,
					_opposition,
					margin,
					scoreString
				};
			});

		if (results.length) {
			const bestResult = _.maxBy(results, "margin");
			const worstResult = _.minBy(results, "margin");
			const wins = results.filter(g => g.margin > 0).length;
			rows.push(
				{
					label: "Win Rate",
					value: `${Math.round((wins / results.length) * 10000) / 100}%`
				},
				{
					label: "Best Result",
					value: <Link to={`/games/${bestResult.slug}`}>{bestResult.scoreString}</Link>
				},
				{
					label: "Worst Result",
					value: <Link to={`/games/${worstResult.slug}`}>{worstResult.scoreString}</Link>
				}
			);
		}

		//Get Attendance Stats
		const gamesForAttendance = games.filter(
			g => !g.isAway && leagues.find(l => l._id == g._competition._id) && g.attendance && !g.isNeutralGround
		);

		if (gamesForAttendance.length) {
			const minGame = _.minBy(gamesForAttendance, "attendance");
			const maxGame = _.maxBy(gamesForAttendance, "attendance");
			rows.push(
				{
					label: "Smallest Crowd",
					value: (
						<Link to={`/games/${minGame.slug}`}>
							{minGame.attendance.toLocaleString()} vs {minGame._opposition.name.short}
						</Link>
					)
				},
				{
					label: "Average Crowd",
					value: Math.ceil(_.meanBy(gamesForAttendance, "attendance")).toLocaleString()
				},
				{
					label: "Biggest Crowd",
					value: (
						<Link to={`/games/${maxGame.slug}`}>
							{maxGame.attendance.toLocaleString()} vs {maxGame._opposition.name.short}
						</Link>
					)
				}
			);
		}

		if (rows.length) {
			return (
				<div className="info-table">
					<table>
						<tbody>
							{rows.map(({ label, value }, i) => (
								<tr key={i}>
									<th>{label}</th>
									<td>{value}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			);
		}
	}

	render() {
		const { games } = this.state;
		if (!games) {
			return <LoadingPage />;
		}

		let content;
		if (games.length) {
			content = (
				<Fragment>
					{this.renderOverviewTable()}
					{this.renderLeagueTables()}
				</Fragment>
			);
		} else {
			content = <div className="form-card">No Game Data was found for this Team Type.</div>;
		}

		return (
			<section className="season-overview">
				<div className="container">{content}</div>
			</section>
		);
	}
}

SeasonOverview.propTypes = {
	games: PropTypes.arrayOf(PropTypes.object).isRequired,
	year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
};

SeasonOverview.defaultProps = {};

function mapStateToProps({ competitions, config }) {
	const { competitionSegmentList } = competitions;
	const { localTeam } = config;
	return { competitionSegmentList, localTeam };
}

export default connect(mapStateToProps, { fetchCompetitionSegments })(SeasonOverview);
