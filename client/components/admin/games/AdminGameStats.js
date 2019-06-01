//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form, FastField } from "formik";
import * as Yup from "yup";

//Components
import AdminGameCrawler from "./AdminGameCrawler";
import Table from "../../Table";

//Actions
import { setStats } from "../../../actions/gamesActions";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";

class AdminGameStats extends Component {
	constructor(props) {
		super(props);

		const { game, localTeam } = props;

		//Set Teams
		let teams = [localTeam, game._opposition._id];
		if (game.isAway) {
			teams = teams.reverse();
		}

		//Set Stat Types
		this.state = { teams, errors: [] };
	}

	static getDerivedStateFromProps(nextProps) {
		const statTypes = _.chain(playerStatTypes)
			.map((obj, key) => ({ key, ...obj }))
			.filter("storedInDatabase")
			.reject(obj => nextProps.scoreOnly && !obj.scoreOnly)
			.keyBy("key")
			.value();

		return { statTypes };
	}

	getDefaults() {
		const { game } = this.props;
		const { statTypes } = this.state;

		const stats = _.chain(game.playerStats)
			.map(p => {
				const { _player, stats } = p;
				const statValues = _.chain(statTypes)
					.map((obj, key) => {
						const value = stats[key] != null ? stats[key] : "";
						return [key, value];
					})
					.fromPairs()
					.value();
				return [_player, statValues];
			})
			.fromPairs()
			.value();
		return { stats };
	}

	getValidationSchema() {
		const { playerStats } = this.props.game;
		const { statTypes } = this.state;

		const stats = _.chain(playerStats)
			.map(p => {
				const { _player } = p;
				const stats = _.mapValues(statTypes, () => {
					return Yup.mixed()
						.test("isNumber", "A positive integer must be provided", value => {
							return value === "" || (Number.isInteger(value) && Number(value) >= 0);
						})
						.test("scoreIsProvided", "This field is required", function(value) {
							const key = this.path.split(".").pop();
							return !playerStatTypes[key].scoreOnly || value !== "";
						});
				});
				return [_player, Yup.object().shape(stats)];
			})
			.fromPairs()
			.value();

		return Yup.object().shape({
			stats: Yup.object().shape(stats)
		});
	}

	renderGameCrawler(formikProps) {
		const { game, scoreOnly } = this.props;
		//Only Show on the stats page
		if (scoreOnly) {
			return null;
		} else {
			return (
				<AdminGameCrawler
					formikProps={formikProps}
					game={game}
					scoreOnly={scoreOnly}
					teams={this.state.teams}
				/>
			);
		}
	}

	renderTeamTable(formikProps, team) {
		const { teamList, game } = this.props;
		const { playerStats, eligiblePlayers } = game;
		const { statTypes } = this.state;

		const statColumns = _.chain(statTypes)
			.map(({ plural }, key) => {
				return {
					key,
					label: plural
				};
			})
			.value();

		const columns = [
			{
				key: "name",
				label: "Player",
				dataUsesTh: true
			},
			...statColumns
		];

		const rows = _.chain(playerStats)
			.filter(({ _team }) => _team == team)
			.sortBy("position")
			.map(p => {
				//Get Name
				const player = _.find(eligiblePlayers[team], m => m._player._id == p._player);
				const name = {
					content: (player.number ? `${player.number}. ` : "") + player._player.name.full,
					sortValue: p.position
				};

				//Get Stats
				const statInputs = _.mapValues(playerStatTypes, (obj, key) => {
					let error;
					const playerErrors =
						formikProps.errors.stats && formikProps.errors.stats[p._player];
					if (playerErrors) {
						error = playerErrors[key];
					}
					return {
						content: (
							<FastField
								type="number"
								name={`stats.${p._player}.${key}`}
								title={error || `${player._player.name.full} - ${obj.plural}`}
								className={error ? "error" : ""}
							/>
						)
					};
				});

				return {
					key: p._player,
					data: {
						name,
						...statInputs
					}
				};
			})
			.value();

		return (
			<div>
				<h3>{teamList[team].name.short}</h3>
				<div className="stat-table-wrapper">
					<Table
						columns={columns}
						rows={rows}
						defaultSortable={false}
						sortBy={{ key: "name", asc: true }}
						stickyHead={true}
					/>
				</div>
			</div>
		);
	}

	generateErrorList(formikProps) {
		if (Object.keys(formikProps.errors).length) {
			const errorList = [];
			const { eligiblePlayers } = this.props.game;
			const playerList = [
				..._.values(eligiblePlayers)[0],
				..._.values(eligiblePlayers)[1]
			].map(p => p._player);

			_.each(formikProps.errors.stats, (errors, player) => {
				errorList.push(
					<li>
						<strong>{_.find(playerList, p => p._id == player).name.full}</strong>
					</li>
				);
				_.each(errors, (error, key) => {
					errorList.push(
						<li>
							{playerStatTypes[key].plural}: {error}
						</li>
					);
				});
			});
			return (
				<ul className="errors full-span">
					<li>
						<strong>Errors:</strong>
					</li>
					{errorList}
				</ul>
			);
		} else {
			return null;
		}
	}

	onSubmit(values) {
		const { game, setStats } = this.props;
		setStats(game._id, values.stats);
	}

	render() {
		const { teams } = this.state;
		return (
			<div className="admin-stats-page">
				<Formik
					initialValues={this.getDefaults()}
					validationSchema={this.getValidationSchema()}
					onSubmit={values => this.onSubmit(values)}
					render={formikProps => {
						return (
							<Form>
								{this.renderGameCrawler(formikProps)}
								<div className="stat-tables">
									{this.renderTeamTable(formikProps, teams[0])}
									{this.renderTeamTable(formikProps, teams[1])}
								</div>
								<div className="container">
									<div className="form-card grid">
										{this.generateErrorList(formikProps)}
										<div className="buttons">
											<button type="reset">Reset</button>
											<button
												type="submit"
												disabled={Object.keys(formikProps.errors).length}
											>
												Update
											</button>
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
	{ setStats }
)(AdminGameStats);
