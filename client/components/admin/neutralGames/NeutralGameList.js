import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form, Field } from "formik";
import Table from "../../Table";
import { Link } from "react-router-dom";
import TeamImage from "../../teams/TeamImage";
import "datejs";

class NeutralGameList extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	getInitialValues() {
		const { games } = this.props;
		return _.chain(games)
			.map(game => {
				return [game._id, _.pick(game, ["homePoints", "awayPoints"])];
			})
			.fromPairs()
			.value();
	}

	render() {
		const { games, competitionSegmentList, teamList } = this.props;

		const columns = [
			{ key: "date", label: "Date" },
			{ key: "_competition", label: "Competiton" },
			{ key: "_homeTeam", label: "Home Team", className: "team-badge" },
			{ key: "homePoints", label: "Home Points" },
			{ key: "awayPoints", label: "Away Points" },
			{ key: "_awayTeam", label: "Away Team", className: "team-badge" },
			{ key: "edit", label: "" }
		];
		return (
			<Formik
				onSubmit={values => console.log(values)}
				initialValues={this.getInitialValues()}
				enableReinitialize={true}
				render={() => {
					const rows = _.chain(games)
						.sortBy("date")
						.map(game => {
							const competitionSegment = _.find(
								competitionSegmentList,
								c => c._id == game._competition
							);

							const data = _.chain(columns)
								.map(column => {
									const { key } = column;
									const result = {};
									const name = `${game._id}.${key}`;
									switch (key) {
										case "edit":
											result.content = (
												<Link
													to={`/admin/neutralGame/${game._id}`}
													className="button"
													style={{ display: "block" }}
												>
													Edit
												</Link>
											);
											break;
										case "_competition":
											result.content = competitionSegment.name;
											break;
										case "date":
											result.content = game.date.toString("ddd dS MMM HH:mm");
											result.sortValue = game.date.toString("yyyyMMddHHmmss");
											break;
										case "_homeTeam":
										case "_awayTeam":
											result.content = (
												<TeamImage team={teamList[game[key]]} />
											);
											break;
										case "homePoints":
										case "awayPoints":
											result.content = <Field type="number" name={name} />;
											break;
										default:
											result.content = game[key];
											break;
									}

									return [key, result];
								})
								.fromPairs()
								.value();

							return {
								key: game._id,
								data
							};
						})
						.value();
					return (
						<Form>
							<Table
								columns={columns}
								rows={rows}
								sortBy={{ key: "date", asc: true }}
								defaultSortable={false}
								className="neutral-game-table"
							/>
							<div className="form-card">
								<div className="buttons">
									<button type="submit">Save</button>
								</div>
							</div>
						</Form>
					);
				}}
			/>
		);
	}
}

function mapStateToProps({ competitions, teams }) {
	const { competitionSegmentList } = competitions;
	const { teamList } = teams;
	return { competitionSegmentList, teamList };
}

export default connect(mapStateToProps)(NeutralGameList);
