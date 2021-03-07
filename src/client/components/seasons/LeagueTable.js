//Modules
import _ from "lodash";
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";

//Components
import LoadingPage from "../LoadingPage";
import Table from "../Table";
import TeamImage from "~/client/components/teams/TeamImage";

//Actions
import { fetchLeagueTableData } from "~/client/actions/competitionActions";

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
			//Redux
			leagueTableData,
			fetchLeagueTableData
		} = props;

		//Get Table String
		const tableString = createLeagueTableString(competition, year, fromDate, toDate);

		//Get League Table Data
		if (
			!leagueTableData[tableString] ||
			new Date(leagueTableData[tableString].loaded) < new Date().addMinutes(-5)
		) {
			fetchLeagueTableData(competition, year, fromDate, toDate);
		}

		this.state = {
			tableString
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { bucketPaths, leagueTableData, styleOverride } = nextProps;
		const { tableString } = prevState;
		const newState = { isLoading: false };

		//Wait on dependencies
		if (!leagueTableData[tableString]) {
			newState.isLoading = true;
			return newState;
		}

		const { rowData, settings } = leagueTableData[tableString];
		newState.rows = rowData;
		newState.tableSettings = settings;

		//Set Table Data
		let logo = "";
		if (settings.image) {
			logo = (
				<img
					src={bucketPaths.images.competitions + settings.image}
					className="competition-logo"
					alt={settings.title}
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

		if (settings.usesWinPc) {
			newState.columns.push({
				key: "WinPc",
				label: "Win %",
				title: "Win Percentage"
			});
		}

		//Get Styling
		newState.customStyling = (styleOverride && styleOverride.customStyling) || settings.customStyling;
		if (styleOverride && styleOverride.leagueTableColours) {
			newState.rowClassOverride = _.chain(styleOverride.leagueTableColours)
				.map(({ position, className }) => position.map(p => [p, className]))
				.flatten()
				.fromPairs()
				.value();
		}

		return newState;
	}

	formatRowsForTable(rows) {
		const { rowClassOverride } = this.state;
		const { localTeam } = this.props;
		let { highlightTeams } = this.props;
		if (!highlightTeams) {
			highlightTeams = [localTeam];
		}
		return rows.map(({ className, team, ...values }) => {
			//Clone values
			const data = { ...values };

			const key = team._id;

			//Add Team Name & Badge
			data["team-name"] = team.name.short;
			data["team-badge"] = <TeamImage size="small" team={team} />;

			//Convert to table data
			if (data.WinPc) {
				data.WinPc = {
					content: Number(data.WinPc.toFixed(2)) + "%",
					sortValue: data.WinPc
				};
			}

			//Create array to hold class names
			const classNames = [];

			//If we're overriding it, then we ignore the value from the server
			if (rowClassOverride) {
				const overrideValue = rowClassOverride[data.position];
				if (overrideValue) {
					classNames.push(overrideValue);
				}
			} else if (className) {
				classNames.push(className);
			}

			//Add highlight where necessary
			if (highlightTeams.includes(key)) {
				classNames.push("highlight");
			}

			//Format to row
			return {
				key,
				data,
				className: classNames.length ? classNames.join(" ") : null
			};
		});
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

function mapStateToProps({ config, competitions }) {
	const { leagueTableData } = competitions;
	const { bucketPaths, localTeam } = config;
	return {
		bucketPaths,
		localTeam,
		leagueTableData
	};
}

export default withRouter(
	connect(mapStateToProps, {
		fetchLeagueTableData
	})(LeagueTable)
);
