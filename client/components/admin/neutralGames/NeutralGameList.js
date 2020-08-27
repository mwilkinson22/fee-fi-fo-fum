//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form, FastField } from "formik";
import { Link } from "react-router-dom";

//Components
import Table from "../../Table";
import TeamImage from "../../teams/TeamImage";
import BooleanSlider from "../../fields/BooleanSlider";
import DeleteButtons from "../../fields/DeleteButtons";

//Actions
import { updateNeutralGames } from "~/client/actions/neutralGamesActions";

class NeutralGameList extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { games } = nextProps;
		const newState = { games };

		return newState;
	}

	getInitialValues() {
		const { games } = this.state;
		return _.chain(games)
			.map(game => {
				return [
					game._id,
					{
						homePoints: game.homePoints === null ? "" : game.homePoints,
						awayPoints: game.awayPoints === null ? "" : game.awayPoints,
						delete: false
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
		const { competitionSegmentList, teamList } = this.props;
		const { games } = this.state;

		const columns = [
			{ key: "date", label: "Date" },
			{ key: "_competition", label: "Competiton" },
			{ key: "_homeTeam", label: "Home Team", className: "team-badge" },
			{ key: "homePoints", label: "Home Points" },
			{ key: "awayPoints", label: "Away Points" },
			{ key: "_awayTeam", label: "Away Team", className: "team-badge" },
			{ key: "edit", label: "" },
			{ key: "delete", label: "Delete" }
		];
		return (
			<Formik
				onSubmit={values => this.handleSubmit(values)}
				initialValues={this.getInitialValues()}
				enableReinitialize={true}
				render={({ values, submitForm }) => {
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
											result.content = (
												<FastField type="number" name={name} />
											);
											break;
										case "delete":
											result.content = (
												<FastField
													name={name}
													render={({ field }) => (
														<BooleanSlider {...field} />
													)}
												/>
											);
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
								data,
								className: values[game._id].delete ? "disabled" : ""
							};
						})
						.value();

					//Get Buttons
					const gamesToDelete = _.filter(values, g => g.delete).length;
					let buttons;
					if (gamesToDelete) {
						let deleteText = `Delete ${gamesToDelete} `;

						const gamesToSave = _.reject(values, g => g.delete).length;
						if (gamesToSave) {
							deleteText += `& Save ${gamesToSave} `;
						}

						deleteText += gamesToDelete + gamesToSave === 1 ? "Game" : "Games";

						buttons = (
							<DeleteButtons deleteText={deleteText} onDelete={() => submitForm()} />
						);
					} else {
						buttons = (
							<div className="buttons">
								<button type="submit">Save</button>
							</div>
						);
					}

					return (
						<Form>
							<div className="table-wrapper">
								<Table
									columns={columns}
									rows={rows}
									sortBy={{ key: "date", asc: true }}
									defaultSortable={false}
									className="neutral-game-table"
								/>
							</div>
							<div className="form-card">{buttons}</div>
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
