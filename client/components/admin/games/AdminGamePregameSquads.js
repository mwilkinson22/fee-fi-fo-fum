//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";

//Components
import LoadingPage from "../../LoadingPage";
import Table from "../../Table";

//Actions
import { fetchTeam } from "../../../actions/teamsActions";
import { setPregameSquads } from "../../../actions/gamesActions";

class AdminGamePregameSquads extends Component {
	constructor(props) {
		super(props);
		const { game, fullTeams, fetchTeam, localTeam } = props;

		if (!fullTeams[localTeam]) {
			fetchTeam(localTeam);
		}
		if (!fullTeams[game._opposition._id]) {
			fetchTeam(game._opposition._id);
		}

		this.state = { game, squads: {} };
	}

	static getDerivedStateFromProps(nextProps) {
		const { game, fullTeams, localTeam } = nextProps;
		const newState = {};

		let teams = [localTeam, game._opposition._id];

		//Ensure both teams have loaded
		if (_.reject(teams, team => fullTeams[team]).length) {
			return newState;
		}

		newState.teams = _.pick(fullTeams, [localTeam, game._opposition._id]);

		//Get Squad Filters
		const year = new Date(game.date).getFullYear();
		const { _teamType } = game;

		//Get squads
		newState.squads = _.chain(teams)
			.map(id => {
				const squad = _.find(fullTeams[id].squads, { year, _teamType });
				return [id, squad ? squad.players : null];
			})
			.fromPairs()
			.value();

		return newState;
	}

	renderRows(team, formikProps) {
		const { squads } = this.state;
		const { setFieldValue, values } = formikProps;
		const squad = squads[team];

		return squad.map(p => {
			const { number } = p;
			const { _id, name } = p._player;
			const currentValue = values[team][_id];
			return {
				key: _id,
				data: {
					checkbox: {
						content: currentValue ? "✔" : " "
					},
					number: {
						content: number || " ",
						sortValue: number || 999999999
					},
					first: {
						content: name.first
					},
					last: {
						content: name.last
					}
				},
				onClick: () => setFieldValue(`${team}[${_id}]`, !currentValue)
			};
		});
	}

	getDefaults() {
		const { game, squads } = this.state;

		return _.mapValues(squads, (squad, teamId) => {
			if (!squad) {
				return {};
			}
			//Get Current Squad
			const currentSquad = _.find(game.pregameSquads, obj => obj._team === teamId);
			return _.chain(squads[teamId])
				.map(p => {
					const playerId = p._player._id;
					const inSquad = currentSquad && currentSquad.squad.indexOf(playerId) > -1;
					return [playerId, inSquad];
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

	loadPreviousSquad(formikProps) {
		const { setValues, values } = formikProps;
		const { localTeam, lastGame } = this.props;
		const lastSquad = _.find(lastGame.pregameSquads, s => s._team == localTeam);
		const squadIds = lastSquad ? lastSquad.squad : [];

		setValues({
			...values,
			[localTeam]: _.mapValues(values[localTeam], (val, id) =>
				Boolean(_.find(squadIds, s => s == id))
			)
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
		const { squads, teams } = this.state;
		const { game, lastGame } = this.props;
		const { localTeam } = this.props;
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
						let teamIds = [localTeam, game._opposition._id];
						if (game.isAway) {
							teamIds = _.reverse(teamIds);
						}

						return (
							<Form>
								<div className="container">
									<div className="pregame-wrapper">
										{teamIds.map(id => {
											let content;
											if (!squads[id]) {
												content = <h5>No squad found</h5>;
											} else {
												const buttons = [
													<button
														type="button"
														key="clear"
														onClick={() =>
															this.clearList(formikProps, id)
														}
													>
														Clear
													</button>
												];
												if (id === localTeam && lastGame) {
													buttons.push(
														<button
															type="button"
															key="last19"
															onClick={() =>
																this.loadPreviousSquad(formikProps)
															}
														>
															Load Last 19
														</button>
													);
												}
												content = [
													<div className="buttons" key="buttons">
														{buttons}
													</div>,
													<Table
														key="table"
														{...tableProps}
														rows={this.renderRows(id, formikProps)}
														foot={this.renderFoot(
															formikProps.values[id]
														)}
														stickyFoot={true}
													/>
												];
											}
											return (
												<div key={id} className="pregame-squad-wrapper">
													<h2>{teams[id].name.short}</h2>
													{content}
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

function mapStateToProps({ config, teams }, ownProps) {
	const { fullTeams } = teams;
	const { localTeam } = config;
	return { fullTeams, localTeam, ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchTeam, setPregameSquads }
)(AdminGamePregameSquads);
