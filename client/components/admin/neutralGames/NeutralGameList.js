import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form, Field } from "formik";
import Table from "../../Table";
import { Link } from "react-router-dom";
import { updateNeutralGames } from "~/client/actions/neutralGamesActions";
import TeamImage from "../../teams/TeamImage";

class NeutralGameList extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	getInitialValues() {
		const { games } = this.props;
		return _.chain(games)
			.map(game => {
				return [
					game._id,
					{
						homePoints: game.homePoints === null ? "" : game.homePoints,
						awayPoints: game.awayPoints === null ? "" : game.awayPoints
					}
				];
			})
			.fromPairs()
			.value();
	}

	handleSubmit(values) {
		const { updateNeutralGames } = this.props;
		updateNeutralGames(values);
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
				onSubmit={values => this.handleSubmit(values)}
				initialValues={this.getInitialValues()}
				enableReinitialize={true}
				render={() => {
					const rows = _.chain(games)
						.sortBy("date")
						.map(game => {
							const competitionSegment = competitionSegmentList[game._competition];

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
													tabIndex="-1"
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
												<div>
													<TeamImage
														team={teamList[game[key]]}
														variant="dark"
														size="small"
													/>
													<span className="team-name">
														{teamList[game[key]].name.short}
													</span>
												</div>
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

export default connect(mapStateToProps, { updateNeutralGames })(NeutralGameList);
