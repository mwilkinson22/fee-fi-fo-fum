//Modules
import _ from "lodash";
import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";
import AdminGameCrawler from "./AdminGameCrawler";
import Table from "../../Table";

//Actions
import { setStats } from "../../../actions/gamesActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import playerStatTypes from "~/constants/playerStatTypes";
import playerPositions from "~/constants/playerPositions";

//Helpers
import { renderInput } from "~/helpers/formHelper";
import { getOrdinalNumber } from "~/helpers/genericHelper";

class AdminGameStats extends Component {
	constructor(props) {
		super(props);

		//Set Stat Types
		this.state = {
			incrementMode: props.scoreOnly
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullGames, localTeam, match } = nextProps;

		const newState = {};

		//Get Game
		newState.game = fullGames[match.params._id];

		//Get Teams
		newState.teams = [localTeam, newState.game._opposition._id];
		if (newState.game.isAway) {
			newState.teams.reverse();
		}

		//Get stat types to display.
		//Ensure we only show stats stored in the database (i.e. no average values)
		//and limit the scoreOnly ones where necessary
		newState.statTypes = _.chain(playerStatTypes)
			.map((obj, key) => ({ key, ...obj }))
			.filter("storedInDatabase")
			.reject(obj => nextProps.scoreOnly && !obj.scoreOnly)
			.keyBy("key")
			.value();

		//Validation Schema
		const validationSchema = _.chain(newState.game.playerStats)
			//Loop through players
			.map(({ _player, _team }) => {
				const { name } = newState.game.eligiblePlayers[_team].find(p => p._id == _player);
				//Loop through stats
				const playerValidation = _.mapValues(newState.statTypes, statType =>
					Yup.mixed()
						.test("isNumber", "A positive integer must be provided", value => {
							return !value || (Number.isInteger(value) && Number(value) >= 0);
						})
						.label(`${name.full} ${statType.plural}`)
				);
				return [_player, Yup.object().shape(playerValidation)];
			})
			.fromPairs()
			.value();

		//Create a yup object
		newState.validationSchema = Yup.object().shape(validationSchema);

		return newState;
	}

	getInitialValues() {
		const { game, statTypes } = this.state;

		//Set an empty object
		const initialValues = {};

		//Loop each player in the squad
		game.playerStats.forEach(p => {
			const { _player, stats } = p;

			initialValues[_player] = _.mapValues(statTypes, (obj, key) => {
				if (stats[key] != null) {
					//If the value is set, return it
					return stats[key];
				} else {
					//Otherwise, keep it blank
					return "";
				}
			});
		});

		return initialValues;
	}

	getFieldGroups() {
		const { scoreOnly, teamList } = this.props;
		const { game, teams, incrementMode } = this.state;

		const tables = teams.map(_team => ({
			label: teamList[_team].name.long,
			render: (values, formik) => this.renderTeamTable(formik, _team)
		}));

		return [
			{
				render: (values, formik) => (
					<Fragment key="game-crawler-and-increment">
						<div className="form-card">
							<button type="button" onClick={() => this.setState({ incrementMode: !incrementMode })}>
								{incrementMode ? "Disable" : "Enable"} Increment Mode
							</button>
						</div>
						<AdminGameCrawler formikProps={formik} game={game} scoreOnly={scoreOnly} teams={teams} />
					</Fragment>
				)
			},
			...tables
		];
	}

	renderTeamTable(formikProps, team) {
		const { game, statTypes, incrementMode } = this.state;

		//Create Columns
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

		//Loop through all players
		const rows = _.chain(game.playerStats)
			//Filter by team
			.filter(({ _team }) => _team == team)
			//Put them in order
			.sortBy("position")
			.map(p => {
				//Get Player Info
				const player = game.eligiblePlayers[team].find(({ _id }) => _id == p._player);

				//Create Name Cell
				let position;
				if (p.isExtraInterchange) {
					position = (
						<Fragment>
							{p.position}
							<sup>{getOrdinalNumber(p.position, true)}</sup>
						</Fragment>
					);
				} else {
					position = "I";
					for (let key in playerPositions) {
						if (playerPositions[key].numbers.includes(p.position)) {
							position = key;
						}
					}
				}

				const positionElement = <span className="position">{position}</span>;

				const name = {
					content: (
						<Fragment>
							{positionElement}
							{(player.number ? `${player.number}. ` : "") + player.name.full}
						</Fragment>
					),
					sortValue: p.position
				};

				//Get errors
				const errors = formikProps.errors && formikProps.errors[p._player];

				//Get Stat Inputs
				const statInputs = _.mapValues(statTypes, (obj, key) => {
					const fieldName = `${player._id}.${key}`;

					//Check for an error
					const error = errors && errors[key];
					if (incrementMode) {
						const value = formikProps.values[player._id][key];
						return (
							<div className="score-incrementer-wrapper">
								{value === "" ? "-" : value}
								<div className="score-incrementer-buttons">
									<button
										type="button"
										disabled={!value}
										onClick={() => formikProps.setFieldValue(fieldName, value - 1)}
									>
										-
									</button>
									<button
										type="button"
										onClick={() => formikProps.setFieldValue(fieldName, value + 1)}
									>
										+
									</button>
								</div>
							</div>
						);
					} else {
						return renderInput({
							name: fieldName,
							type: fieldTypes.number,
							title: error || `${player.name.full} ${playerStatTypes[key].plural}`,
							className: error ? "error" : ""
						});
					}
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
			<div key={team} className="stat-tables">
				<div className="stat-table-wrapper no-max-height">
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

	onSubmit(values) {
		const { setStats } = this.props;
		const { game } = this.state;
		setStats(game._id, values);
	}

	render() {
		const { validationSchema } = this.state;

		return (
			<BasicForm
				className="admin-stats-page"
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={false}
				itemType="Stats"
				useFormCard={false}
				onSubmit={values => this.onSubmit(values)}
				validationSchema={validationSchema}
			/>
		);
	}
}

function mapStateToProps({ config, games, teams }) {
	const { localTeam } = config;
	const { fullGames } = games;
	const { teamList } = teams;
	return { fullGames, localTeam, teamList };
}

export default withRouter(connect(mapStateToProps, { setStats })(AdminGameStats));
