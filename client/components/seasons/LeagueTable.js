import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchNeutralGames } from "../../actions/neutralGamesActions";
import { fetchGames, fetchGameList } from "../../actions/gamesActions";
import { fetchAllCompetitionSegments } from "~/client/actions/competitionActions";
import LoadingPage from "../../components/LoadingPage";
import { competitionImagePath } from "../../extPaths";
import { validateGameDate } from "~/helpers/gameHelper";
import Table from "../Table";
import TeamImage from "~/client/components/teams/TeamImage";

class LeagueTable extends Component {
	constructor(props) {
		super(props);
		const {
			gameList,
			fetchGameList,
			neutralGames,
			fetchNeutralGames,
			competitionSegmentList,
			fetchAllCompetitionSegments
		} = props;

		if (!gameList) {
			fetchGameList();
		}

		if (!neutralGames) {
			fetchNeutralGames();
		}

		if (!competitionSegmentList) {
			fetchAllCompetitionSegments();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const {
			gameList,
			neutralGames,
			competitionSegmentList,
			fullGames,
			fetchGames,
			competition,
			year,
			localTeam
		} = nextProps;
		const newState = {};

		if (!gameList || !neutralGames || !competitionSegmentList) {
			return newState;
		}
		//Get Competition Info
		newState.segment = _.find(competitionSegmentList, c => c._id === competition);
		newState.instance = _.find(
			newState.segment.instances,
			instance => instance.year == year || instance.year === null
		);

		//Set Columns
		const logo = newState.instance.image ? (
			<img
				src={competitionImagePath + newState.instance.image}
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

		//Set segment as variable, to enable for point inheritance
		const competitionSegment = _.find(competitionSegmentList, c => c._id == competition);
		const games = LeagueTable.getGames(competitionSegment, year, gameList, neutralGames);

		const gamesToLoad = _.reject(games.local, id => fullGames[id]);
		if (gamesToLoad.length) {
			fetchGames(gamesToLoad);
		} else {
			games.local = _.chain(games.local)
				.map(id => {
					const { isAway, _opposition, score } = fullGames[id];
					if (!score) {
						return null;
					}

					//Return in the same format as a neutral game, for ease of parsing
					const _homeTeam = isAway ? _opposition._id : localTeam;
					const _awayTeam = isAway ? localTeam : _opposition._id;
					const homePoints = score[_homeTeam];
					const awayPoints = score[_awayTeam];

					return {
						_homeTeam,
						_awayTeam,
						homePoints,
						awayPoints
					};
				})
				.filter(_.identity)
				.value();
			newState.games = [...games.local, ...games.neutral];
		}

		return newState;
	}

	static getGames(competitionSegment, year, gameList, neutralGames) {
		const games = {
			local: [],
			neutral: []
		};
		while (competitionSegment) {
			const l = _.chain(gameList)
				.filter(
					game =>
						game._competition === competitionSegment._id &&
						validateGameDate(game, "results", year)
				)
				.map(game => game._id)
				.value();

			const n = _.chain(neutralGames)
				.filter(
					game =>
						game._competition === competitionSegment._id &&
						validateGameDate(game, "results", year)
				)
				.map(g => _.pick(g, ["_homeTeam", "_awayTeam", "homePoints", "awayPoints"]))
				.value();

			games.local.push(...l);
			games.neutral.push(...n);
			competitionSegment = competitionSegment._pointsCarriedFrom;
		}
		return games;
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
						value = <TeamImage team={team} />;
						break;
					case "Pts":
						value = teamHasAdjustment ? teamHasAdjustment.adjustment : 0;
						break;
					default:
						value = 0;
				}
				return [key, value];
			})
			.fromPairs()
			.value();

		return row;
	}

	addGamesToRows(rows) {
		//Add basic details
		_.each(this.state.games, game => {
			const { _homeTeam, _awayTeam, homePoints, awayPoints } = game;
			//Ensure rows exist
			if (!rows[_homeTeam]) {
				rows[_homeTeam] = this.createRowForTeam(_homeTeam);
			}
			if (!rows[_awayTeam]) {
				rows[_awayTeam] = this.createRowForTeam(_awayTeam);
			}

			const home = rows[_homeTeam];
			const away = rows[_awayTeam];

			//Set Points
			home.F += homePoints;
			home.A += awayPoints;
			away.F += awayPoints;
			away.A += homePoints;

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
		const { instance } = this.state;
		const { localTeam } = this.props;
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
					"data.F.content",
					"data.team-name.content"
				],
				["desc", "desc", "asc", "asc"]
			)
			.map((row, pos) => {
				row.data.position.content = pos + 1;
				const rowClass = _.find(
					instance.leagueTableColours,
					p => p.position.indexOf(pos + 1) > -1
				);
				if (highlightTeams.indexOf(row.key) > -1) {
					row.className = "highlight";
				} else if (rowClass) {
					row.className = rowClass.className;
				}
				return row;
			})
			.value();
	}

	render() {
		const { games, instance, columns } = this.state;

		if (!games) {
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
		this.addGamesToRows(rows);

		//Return Table
		return (
			<Table
				className="league-table"
				columns={columns}
				rows={this.formatRowsForTable(rows)}
				defaultSortable={false}
				keyAsClassName={true}
				headerStyling={instance.customStyling}
			/>
		);
	}
}

function mapStateToProps({ config, games, teams, competitions }, ownProps) {
	const { teamList } = teams;
	const { competitionSegmentList } = competitions;
	const { neutralGames, gameList, fullGames } = games;
	const { localTeam } = config;
	return {
		teamList,
		neutralGames,
		gameList,
		fullGames,
		localTeam,
		competitionSegmentList,
		...ownProps
	};
}

export default connect(
	mapStateToProps,
	{ fetchNeutralGames, fetchGames, fetchGameList, fetchAllCompetitionSegments }
)(LeagueTable);
