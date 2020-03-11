//Modules
import _ from "lodash";
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";

//Components
import LoadingPage from "../../components/LoadingPage";
import Table from "../Table";
import TeamImage from "~/client/components/teams/TeamImage";

//Actions
import { fetchNeutralGames } from "../../actions/neutralGamesActions";
import { fetchGames, fetchGameList } from "../../actions/gamesActions";
import { fetchCompetitionSegments } from "~/client/actions/competitionActions";
import { fetchTeamList } from "~/client/actions/teamsActions";

//Helpers
import { getLeagueTableGames } from "~/helpers/gameHelper";

class LeagueTable extends Component {
	constructor(props) {
		super(props);
		const {
			gameList,
			fetchGameList,
			neutralGames,
			fetchNeutralGames,
			competitionSegmentList,
			fetchCompetitionSegments,
			year,
			teamList,
			fetchTeamList,
			loadGames
		} = props;

		if (loadGames) {
			if (!gameList) {
				fetchGameList();
			}

			if (!neutralGames || !neutralGames[year]) {
				fetchNeutralGames(year);
			}
		}

		if (!teamList) {
			fetchTeamList();
		}
		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		this.state = {
			isLoadingGames: false
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const {
			gameList,
			neutralGames,
			competitionSegmentList,
			fullGames,
			fetchGames,
			competition,
			year,
			localTeam,
			fromDate,
			toDate,
			teamList,
			styleOverride,
			loadGames,
			bucketPaths
		} = nextProps;
		const newState = {};

		if (
			(loadGames && (!gameList || !neutralGames || !neutralGames[year])) ||
			!competitionSegmentList ||
			!teamList
		) {
			return newState;
		}

		//Get Competition Info
		newState.segment = competitionSegmentList[competition];
		newState.instance = _.find(
			newState.segment.instances,
			instance => instance.year == year || instance.year === null
		);

		//Get Styling
		newState.customStyling =
			(styleOverride && styleOverride.customStyling) || newState.instance.customStyling;
		newState.leagueTableColours =
			(styleOverride && styleOverride.leagueTableColours) ||
			newState.instance.leagueTableColours;

		//Set Columns
		const logo = newState.instance.image ? (
			<img
				src={bucketPaths.images.competitions + newState.instance.image}
				className="competition-logo"
			/>
		) : (
			""
		);
		newState.columns = [
			{ key: "position", label: logo, dataUsesTh: true },
			{ key: "team-badge", label: "", dataUsesTh: true },
			{ key: "team-name", label: "", dataUsesTh: true },
			{ key: "Pld", label: "Pld", title: "Games Played" },
			{ key: "W", label: "W", title: "Wins" },
			{ key: "D", label: "D", title: "Draws" },
			{ key: "L", label: "L", title: "Losses" },
			{ key: "F", label: "F", title: "Points Difference" },
			{ key: "A", label: "A", title: "Points Against" },
			{ key: "Diff", label: "Diff", title: "Points For" },
			{ key: "Pts", label: "Pts", title: "Points" }
		];

		if (loadGames) {
			//Set segment as variable, to enable for point inheritance
			const games = getLeagueTableGames(
				competition,
				competitionSegmentList,
				year,
				gameList,
				neutralGames[year],
				fromDate,
				toDate
			);

			const gamesToLoad = _.reject(games.local, id => fullGames[id]);
			if (gamesToLoad.length) {
				if (!prevState.isLoadingGames) {
					fetchGames(gamesToLoad);
					newState.isLoadingGames = true;
				}
			} else {
				newState.isLoadingGames = false;
				games.local = _.chain(games.local)
					.map(id => {
						const {
							isAway,
							_opposition,
							score,
							scoreOverride,
							date,
							title
						} = fullGames[id];

						if (!score && (!scoreOverride || Object.keys(scoreOverride).length < 2)) {
							return null;
						}

						//Return in the same format as a neutral game, for ease of parsing
						const _homeTeam = isAway ? _opposition._id : localTeam;
						const _awayTeam = isAway ? localTeam : _opposition._id;

						let homePoints, awayPoints;
						if (score) {
							homePoints = score[_homeTeam];
							awayPoints = score[_awayTeam];
						} else {
							homePoints = scoreOverride[_homeTeam];
							awayPoints = scoreOverride[_awayTeam];
						}

						return {
							_homeTeam,
							_awayTeam,
							homePoints,
							awayPoints,
							date,
							//Include title for Magic filtering
							title
						};
					})
					.filter(_.identity)
					.value();
				newState.games = [...games.local, ...games.neutral];
			}
		}

		return newState;
	}

	gameIsMagicWeekend(game) {
		const { games } = this.state;
		const magicWeekendGame = _.find(games, { title: "Magic Weekend" });

		if (!magicWeekendGame) {
			return true;
		} else {
			const fromDate = new Date(magicWeekendGame.date).addDays(-2);
			const toDate = new Date(magicWeekendGame.date).addDays(2);

			return game.date > fromDate && game.date < toDate;
		}
	}

	createRowForTeam(id) {
		const { teamList } = this.props;
		const { columns, instance } = this.state;
		const teamHasAdjustment = _.find(instance.adjustments, a => a._team === id);
		const row = _.chain(columns)
			.map(column => {
				const { key } = column;
				const team = teamList[id];
				let value;
				switch (key) {
					case "team-name":
						value = team.name.short;
						break;
					case "team-badge":
						value = <TeamImage team={team} variant="dark" size="small" />; //In case of rowClass, we overwrite this later
						break;
					default:
						value =
							teamHasAdjustment && teamHasAdjustment[key] != null
								? teamHasAdjustment[key]
								: 0;
				}
				return [key, value];
			})
			.fromPairs()
			.value();

		return row;
	}

	addGamesToRows(rows) {
		//If we have an empty object, no teams are defined and we can create them on the fly
		const createNewRows = Object.keys(rows).length === 0;

		let { games } = this.state;
		const { location } = this.props;
		const queries = _.chain(location.search.substr(1).split("&"))
			.map(q => q.split("="))
			.fromPairs()
			.value();

		if (queries.magic == "0") {
			games = _.reject(games, g => this.gameIsMagicWeekend(g));
		}

		if (queries.loopFixtures == "0") {
			games = _.chain(games)
				.orderBy("date")
				.groupBy(({ _homeTeam, _awayTeam }) => [_homeTeam, _awayTeam].sort().join(""))
				.map(games => {
					const magicGame = _.find(games, g => this.gameIsMagicWeekend(g));

					if (games.length === 2 || (magicGame && games.length === 3)) {
						//No Loop Fixtures
						return games;
					} else {
						let gamesToReturn = _.chain(games)
							//Remove Magic
							.filter(g => !magicGame || magicGame._id !== g._id)
							//Group
							.groupBy("_homeTeam")
							.map("0")
							.value();

						if (magicGame) {
							gamesToReturn.push(magicGame);
						}

						return gamesToReturn;
					}
				})
				.flatten()
				.value();
		}

		//Add basic details
		_.each(games, game => {
			let home;
			let away;

			const { _homeTeam, _awayTeam, homePoints, awayPoints } = game;
			//Ensure rows exist
			if (!rows[_homeTeam] && createNewRows) {
				rows[_homeTeam] = this.createRowForTeam(_homeTeam);
			}
			if (!rows[_awayTeam] && createNewRows) {
				rows[_awayTeam] = this.createRowForTeam(_awayTeam);
			}

			//Assign Rows, either to the table or a dummy row set
			//This prevents teams being added incorrectly where points carried from another league
			//I.e. The bottom four from the Regular Season won't be added to the Super 8s table
			home = rows[_homeTeam] || this.createRowForTeam(_homeTeam);
			away = rows[_awayTeam] || this.createRowForTeam(_awayTeam);

			//Set Points
			if (!isNaN(homePoints)) {
				home.F += homePoints;
				away.A += homePoints;
			}
			if (!isNaN(awayPoints)) {
				home.A += awayPoints;
				away.F += awayPoints;
			}

			//Set result
			if (homePoints > awayPoints) {
				home.W++;
				away.L++;
			} else if (awayPoints > homePoints) {
				home.L++;
				away.W++;
			} else {
				home.D++;
				away.D++;
			}
		});

		//Calculate Totals
		_.each(rows, row => {
			row.Pld = row.W + row.D + row.L;
			row.Pts += row.W * 2 + row.D; //Increment here to allow for adjustments
			row.Diff = row.F - row.A;
		});
	}

	formatRowsForTable(rows) {
		const { leagueTableColours } = this.state;
		const { localTeam, teamList } = this.props;
		let { highlightTeams } = this.props;
		if (!highlightTeams) {
			highlightTeams = [localTeam];
		}
		return _.chain(rows)
			.map((values, key) => {
				return {
					key,
					data: _.mapValues(values, v => ({ content: v }))
				};
			})
			.orderBy(
				[
					"data.Pts.content",
					"data.Diff.content",
					({ data }) => {
						const F = data.F.content;
						const A = data.A.content;
						if (F && A) {
							return F / A;
						} else {
							return 0;
						}
					},
					"data.team-name.content"
				],
				["desc", "desc", "desc", "asc"]
			)
			.map((row, pos) => {
				row.data.position.content = pos + 1;
				row.className = "";
				const rowClass = _.find(leagueTableColours, p => p.position.indexOf(pos + 1) > -1);
				if (highlightTeams.indexOf(row.key) > -1) {
					row.className += "highlight ";
				}
				if (rowClass) {
					const team = teamList[row.key];
					row.data["team-badge"].content = (
						<TeamImage team={team} variant="light" size="small" />
					);
					row.className += rowClass.className;
				}
				return row;
			})
			.value();
	}

	render() {
		const { loadGames, className } = this.props;
		const { games, instance, columns, customStyling } = this.state;

		if (loadGames && !games) {
			return <LoadingPage />;
		}

		//Get initial rows
		const rows = {};
		if (instance.teams) {
			_.each(instance.teams, id => {
				rows[id] = this.createRowForTeam(id);
			});
		}

		//Process
		if (loadGames) {
			this.addGamesToRows(rows);
		}

		//Return Table
		return (
			<Table
				className={`league-table ${className}`}
				columns={columns}
				rows={this.formatRowsForTable(rows)}
				defaultSortable={false}
				keyAsClassName={true}
				headerStyling={customStyling}
			/>
		);
	}
}

LeagueTable.propTypes = {
	className: PropTypes.string,
	competition: PropTypes.string.isRequired,
	fromDate: PropTypes.instanceOf(Date),
	highlightTeams: PropTypes.arrayOf(PropTypes.string),
	loadGames: PropTypes.bool, //Only false when we need a preview while editing the table style
	styleOverride: PropTypes.object,
	toDate: PropTypes.instanceOf(Date),
	year: PropTypes.number.isRequired
};

LeagueTable.defaultProps = {
	className: "",
	fromDate: null,
	highlightTeams: null,
	loadGames: true,
	styleOverride: null,
	toDate: null
};

function mapStateToProps({ config, games, teams, competitions }) {
	const { teamList } = teams;
	const { competitionSegmentList } = competitions;
	const { neutralGames, gameList, fullGames } = games;
	const { bucketPaths, localTeam } = config;
	return {
		teamList,
		neutralGames,
		gameList,
		fullGames,
		bucketPaths,
		localTeam,
		competitionSegmentList
	};
}

export default withRouter(
	connect(mapStateToProps, {
		fetchNeutralGames,
		fetchGames,
		fetchGameList,
		fetchCompetitionSegments,
		fetchTeamList
	})(LeagueTable)
);
