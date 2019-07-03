//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";

//Components
import Table from "../../Table";

//Actions
import { setPregameSquads } from "../../../actions/gamesActions";

class AdminGamePregameSquads extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { teamList } = nextProps;
		if (!nextProps) {
			return {};
		} else {
			return { teamList };
		}
	}

	renderRows(team, formikProps) {
		const { eligiblePlayers } = this.props.game;
		const { setFieldValue, values } = formikProps;
		const squad = _.sortBy(eligiblePlayers[team], "number");

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
		const { eligiblePlayers, pregameSquads } = this.props.game;

		return _.mapValues(eligiblePlayers, (squad, teamId) => {
			if (!squad) {
				return {};
			}
			//Get Current Squad
			const currentSquad = _.find(pregameSquads, obj => obj._team === teamId);
			return _.chain(eligiblePlayers[teamId])
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
		const { game, setPregameSquads } = this.props;

		values = _.mapValues(values, teamList =>
			_.chain(teamList)
				.pickBy()
				.map((val, key) => key)
				.value()
		);

		setPregameSquads(game._id, values);
	}

	render() {
		const { game, lastGame, localTeam } = this.props;
		const { teamList } = this.state;

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
											if (!game.eligiblePlayers[id].length) {
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
													<h2>{teamList[id].name.short}</h2>
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

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { teamList } = teams;
	return { localTeam, teamList };
}

export default connect(
	mapStateToProps,
	{ setPregameSquads }
)(AdminGamePregameSquads);
