//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form, FastField } from "formik";
import * as Yup from "yup";

//Components
import Table from "../../Table";

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
		const statTypes = _.chain(playerStatTypes)
			.map((obj, key) => ({ key, ...obj }))
			.filter("storedInDatabase")
			.keyBy("key")
			.value();

		this.state = { teams, statTypes };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		return {};
	}

	getDefaults() {
		const { game } = this.props;
		const { statTypes } = this.state;

		return _.chain(game.playerStats)
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
	}

	getValidationSchema() {
		const { playerStats } = this.props.game;
		const { statTypes } = this.state;

		const shape = _.chain(playerStats)
			.map(p => {
				const { _player } = p;
				const stats = _.mapValues(statTypes, ({ plural }) => {
					return Yup.number()
						.min(0)
						.integer()
						.label(plural);
				});
				return [_player, Yup.object().shape(stats)];
			})
			.fromPairs()
			.value();
		return Yup.object()
			.shape(shape)
			.nullable();
	}

	renderTeamTable(formikProps, team) {
		const { playerStats, eligiblePlayers } = this.props.game;
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
					const playerErrors = formikProps.errors[p._player];
					if (playerErrors) {
						error = playerErrors[key];
					}
					return {
						content: (
							<FastField
								type="number"
								name={`${p._player}.${key}`}
								title={error || "obj.plural"}
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
			<Table
				columns={columns}
				rows={rows}
				defaultSortable={false}
				sortBy={{ key: "name", asc: true }}
				stickyHead={true}
			/>
		);
	}

	onSubmit(values) {
		console.log(values);
	}

	render() {
		const { teams } = this.state;
		const { teamList } = this.props;

		return (
			<div className="admin-stats-page">
				<Formik
					initialValues={this.getDefaults()}
					validationSchema={this.getValidationSchema()}
					onSubmit={values => this.onSubmit(values)}
					render={formikProps => {
						return (
							<div className="container">
								<Form>
									<div className="form-card grid">
										<div className="buttons">
											<button type="reset">Reset</button>
											<button type="submit">Update</button>
										</div>
									</div>
									<div className="stat-tables">
										<h3>{teamList[teams[0]].name.short}</h3>
										<div className="stat-table-wrapper">
											{this.renderTeamTable(formikProps, teams[0])}
										</div>
										<h3>{teamList[teams[1]].name.short}</h3>
										<div className="stat-table-wrapper">
											{this.renderTeamTable(formikProps, teams[1])}
										</div>
									</div>
								</Form>
							</div>
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

export default connect(mapStateToProps)(AdminGameStats);
