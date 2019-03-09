import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../../LoadingPage";
import { fetchYearsWithSquads } from "../../../actions/teamsActions";
import { fetchSquad } from "../../../actions/teamsActions";
import { setPregameSquads } from "../../../actions/gamesActions";
import Table from "../../Table";
import { Formik, Form, Field } from "formik";
import { localTeam } from "~/config/keys";
const firstTeam = "5c34e00a0838a5b090f8c1a7";

class AdminGamePregameSquads extends Component {
	constructor(props) {
		super(props);
		const { game, squads } = props;

		this.state = { game };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { game, fetchYearsWithSquads, fetchSquad, squads } = nextProps;
		const home = game.teams.home._id;
		const away = game.teams.away._id;
		const year = new Date(game.date).getFullYear();

		const newState = { game, squads: {} };

		for (const ha of [home, away]) {
			if (!squads[ha]) {
				fetchYearsWithSquads(ha);
			} else if (!squads[ha][year] || !squads[ha][year][game._teamType]) {
				fetchSquad(year, ha, game._teamType);
			} else {
				newState.squads[ha] = squads[ha][year][game._teamType];
			}
		}

		return newState;
	}

	renderRows(ha, formikProps) {
		const { game, squads } = this.state;
		const { setFieldValue, values } = formikProps;
		const team = game.teams[ha];
		const squad = squads[team._id];
		return squad.map(player => {
			const currentValue = values[team._id][player._id];
			return {
				key: player._id,
				data: {
					checkbox: {
						content: currentValue ? "✔" : " "
					},
					number: {
						content: player.number || " ",
						sortValue: player.number || 999999999
					},
					first: {
						content: player.name.first
					},
					last: {
						content: player.name.last
					}
				},
				onClick: () => setFieldValue(`${team._id}[${player._id}]`, !currentValue)
			};
		});
	}

	getDefaults() {
		const { game, squads } = this.state;

		return _.mapValues(squads, (squad, teamId) => {
			const currentPregameSquad = _.filter(game.pregameSquads, obj => obj._team === teamId);
			return _.chain(squad)
				.map(player => {
					const id = player._id;
					return [
						id,
						currentPregameSquad.length && currentPregameSquad[0].squad.indexOf(id) > -1
					];
				})
				.fromPairs()
				.value();
		});
	}

	renderFoot(values) {
		return {
			checkbox: "✔", //This keeps the width consistent
			last: `Total: ${_.filter(values, value => value).length}`
		};
	}

	clearList(formikProps, teamId) {
		const { setValues, values } = formikProps;
		setValues({
			...values,
			[teamId]: _.mapValues(values[teamId], () => false)
		});
	}

	onSubmit(values) {
		const { game } = this.state;
		const { setPregameSquads } = this.props;

		values = _.mapValues(values, teamList =>
			_.chain(teamList)
				.pickBy()
				.map((val, key) => key)
				.value()
		);

		setPregameSquads(game._id, values);
	}

	render() {
		const { game, squads } = this.state;

		if (Object.keys(squads).length < 2) {
			return <LoadingPage />;
		}

		const columns = [
			{
				key: "checkbox",
				label: "",
				sortable: false
			},
			{
				key: "number",
				label: "#"
			},
			{
				key: "first",
				label: "First Name"
			},
			{
				key: "last",
				label: "Last Name"
			}
		];

		const tableProps = {
			columns,
			defaultAscSort: true,
			sortBy: { key: "number", asc: true }
		};

		return (
			<div className="admin-pregame-squad-page">
				<Formik
					onSubmit={values => this.onSubmit(values)}
					initialValues={this.getDefaults()}
					render={formikProps => {
						return (
							<Form>
								<div className="container">
									<div className="pregame-wrapper">
										{["home", "away"].map(ha => {
											const team = game.teams[ha];
											const buttons = [
												<button
													type="button"
													key="clear"
													onClick={() =>
														this.clearList(formikProps, team._id)
													}
												>
													Clear
												</button>
											];
											if (team._id === localTeam) {
												buttons.push(
													<button type="button" key="last19">
														Load Last 19
													</button>
												);
											}
											return (
												<div key={ha} className="pregame-squad-wrapper">
													<h2>{team.name.short}</h2>
													<div className="buttons">{buttons}</div>
													<Table
														{...tableProps}
														rows={this.renderRows(ha, formikProps)}
														foot={this.renderFoot(
															formikProps.values[game.teams[ha]._id]
														)}
														stickyFoot={true}
													/>
												</div>
											);
										})}
									</div>

									<div className="form-card">
										<div className="buttons">
											<button type="reset">Reset</button>
											<button type="submit">Submit</button>
										</div>
									</div>
								</div>
							</Form>
						);
					}}
				/>
			</div>
		);
	}
}

function mapStateToProps({ teams }, ownProps) {
	const { squads } = teams;
	return { squads, ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchYearsWithSquads, fetchSquad, setPregameSquads }
)(AdminGamePregameSquads);
