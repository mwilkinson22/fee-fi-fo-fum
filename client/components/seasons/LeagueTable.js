import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchLeagueTable } from "../../actions/seasonActions";
import LoadingPage from "../../components/LoadingPage";
import { teamImagePath } from "../../extPaths";

class LeagueTable extends Component {
	constructor(props) {
		super(props);
		const { competition, year, fetchLeagueTable, leagueTables, fromDate, toDate } = props;
		const key = [competition, year, fromDate, toDate].join("-");
		const leagueTable = leagueTables[key];
		if (!leagueTable) {
			fetchLeagueTable(competition, year, fromDate, toDate);
		}
		this.state = { leagueTable };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { competition, year, fetchLeagueTable, leagueTables, fromDate, toDate } = nextProps;
		const key = [competition, year, fromDate, toDate].join("-");
		const leagueTable = leagueTables[key];
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

			return (
				<table className="league-table card">
					<thead>
						<tr>
							<th className="position" />
							<th className="team-badge" />
							<th className="team-name" />
							{_.map(columns, (title, header) => (
								<th title={title} key={header} className={header}>
									{header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{_.map(leagueTable.teams, team => {
							const { name, position, classNames, image } = team;
							return (
								<tr key={position} className={classNames.join(" ")}>
									<th className="position">{position}</th>
									<th className="team-badge">
										<img src={`${teamImagePath}${image}`} />
									</th>
									<th className="team-name">{name}</th>
									{_.map(columns, (title, key) => {
										return (
											<td
												key={name + key}
												title={`${name} ${title}`}
												className={key}
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
