import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchLeagueTable } from "../../actions/seasonActions";
import LoadingPage from "../../components/LoadingPage";

class LeagueTable extends Component {
	constructor(props) {
		super(props);
		const { competition, year, fetchLeagueTable, leagueTables, fromDate, toDate } = props;
		const leagueTable = _.find(leagueTables, { competition, year, fromDate, toDate });
		if (!leagueTable) {
			fetchLeagueTable(competition, year, fromDate, toDate);
		}
		this.state = { leagueTable };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { competition, year, fetchLeagueTable, leagueTables, fromDate, toDate } = nextProps;
		const leagueTable = _.find(leagueTables, { competition, year, fromDate, toDate });
		if (!leagueTable) {
			fetchLeagueTable(competition, year, fromDate, toDate);
		}
		return { leagueTable };
	}

	render() {
		const { leagueTable } = this.state;
		if (!leagueTable) {
			return <LoadingPage />;
		} else {
			const columns = {
				Pld: "Games Played",
				W: "Wins",
				D: "Draws",
				L: "Losses",
				F: "Points Scored",
				A: "Points Conceded",
				Diff: "Points Difference",
				Pts: "Points"
			};

			const orderedTable = _.chain(leagueTable.teams)
				.map(team => team) //Convert to array
				.orderBy(["Pts", "Diff", "F", "Pld"], ["desc", "desc", "desc", "asc"])
				.value();

			return (
				<table className="league-table">
					<thead>
						<tr>
							<th colSpan="3" />
							{_.map(columns, (title, header) => (
								<th title={title} key={header}>
									{header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{_.map(orderedTable, (team, pos) => {
							return (
								<tr key={team.name}>
									<th>{pos + 1}</th>
									<th />
									<th>{team.name}</th>
									{_.map(columns, (title, key) => {
										return (
											<td
												key={team.name + key}
												title={`${team.name} ${title}`}
											>
												{team[key]}
											</td>
										);
									})}
								</tr>
							);
						})}
					</tbody>
				</table>
			);
		}
	}
}

function mapStateToProps({ seasons }, ownProps) {
	const { leagueTables } = seasons;
	return { leagueTables, ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchLeagueTable }
)(LeagueTable);
