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
import { fetchTeamList } from "~/client/actions/teamsActions";
import {
	fetchCompetitionSegments,
	fetchLeagueTableData
} from "~/client/actions/competitionActions";

//Helpers
import { createLeagueTableString } from "~/helpers/competitionHelper";

class LeagueTable extends Component {
	constructor(props) {
		super(props);

		const {
			//Direct props
			competition,
			year,
			fromDate,
			toDate,
			//Redux State
			leagueTableData,
			teamList,
			competitionSegmentList,
			//Redux Actions
			fetchTeamList,
			fetchLeagueTableData,
			fetchCompetitionSegments
		} = props;

		//Get Teams
		if (!teamList) {
			fetchTeamList();
		}

		//Get Table String
		const tableString = createLeagueTableString(competition, year, fromDate, toDate);

		//Get League Table Data
		if (!leagueTableData[tableString]) {
			fetchLeagueTableData(competition, year, fromDate, toDate);
		}

		//Get competition segments
		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		this.state = {
			tableString
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const {
			bucketPaths,
			competition,
			competitionSegmentList,
			leagueTableData,
			styleOverride,
			teamList,
			year
		} = nextProps;
		const { tableString } = prevState;
		const newState = { isLoading: false };

		//Wait on dependencies
		if (!leagueTableData[tableString] || !competitionSegmentList || !teamList) {
			newState.isLoading = true;
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

		//Set Table Data
		let logo = "";
		if (newState.instance.image) {
			logo = (
				<img
					src={bucketPaths.images.competitions + newState.instance.image}
					className="competition-logo"
				/>
			);
		}
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

		if (newState.instance.usesWinPc) {
			newState.columns.push({
				key: "WinPc",
				label: "Win %",
				title: "Win Percentage"
			});
		}

		newState.rows = leagueTableData[tableString];

		return newState;
	}

	formatRowsForTable(rows) {
		const { leagueTableColours } = this.state;
		const { localTeam, teamList } = this.props;
		let { highlightTeams } = this.props;
		if (!highlightTeams) {
			highlightTeams = [localTeam];
		}
		return _.chain(rows)
			.map(values => {
				//Get Team
				const team = teamList[values._team];

				//Add Team Name
				//Badge is added later so we know whether to go for light or dark variant
				values["team-name"] = team.name.short;

				//Convert to table data
				const data = _.mapValues(values, (value, key) => {
					switch (key) {
						case "WinPc":
							return { content: Number(value.toFixed(2)) + "%" };
						default:
							return { content: value };
					}
				});

				//Format to row
				return {
					key: values._team,
					data
				};
			})
			.map((row, pos) => {
				//Add the position (increment to allow for 0-indexing)
				row.data.position.content = pos + 1;

				//Set blank className
				const classNames = [];
				row.className = "";

				//Add highlighted teams
				if (highlightTeams.indexOf(row.key) > -1) {
					classNames.push("highlight");
				}

				//Get the row class from leagueTableColours
				const rowClass = _.find(leagueTableColours, p => p.position.indexOf(pos + 1) > -1);

				//If we find one, add it to the class array and set a light icon
				let badgeVariant;
				if (rowClass) {
					badgeVariant = "light";
					classNames.push(rowClass.className);
				} else {
					badgeVariant = "dark";
				}

				//Add badge
				const team = teamList[row.key];
				row.data["team-badge"] = {
					content: <TeamImage size="small" team={team} variant={badgeVariant} />
				};

				//Add classes
				if (classNames.length) {
					row.className = classNames.join(" ");
				}

				return row;
			})
			.value();
	}

	render() {
		const { className } = this.props;
		const { columns, customStyling, isLoading, rows } = this.state;

		if (isLoading) {
			return <LoadingPage />;
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

function mapStateToProps({ config, teams, competitions }) {
	const { teamList } = teams;
	const { competitionSegmentList, leagueTableData } = competitions;
	const { bucketPaths, localTeam } = config;
	return {
		teamList,
		bucketPaths,
		localTeam,
		leagueTableData,
		competitionSegmentList
	};
}

export default withRouter(
	connect(mapStateToProps, {
		fetchCompetitionSegments,
		fetchTeamList,
		fetchLeagueTableData
	})(LeagueTable)
);
