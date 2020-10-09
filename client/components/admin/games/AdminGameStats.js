//Modules
import _ from "lodash";
import React, { Component } from "react";
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

//Helpers
import { renderInput } from "~/helpers/formHelper";

class AdminGameStats extends Component {
	constructor(props) {
		super(props);

		//Set Stat Types
		this.state = {};
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
				const { name } = newState.game.eligiblePlayers[_team].find(
					p => p._player._id == _player
				)._player;
				//Loop through stats
				const playerValidation = _.mapValues(newState.statTypes, statType =>
					Yup.mixed()
						.test("isNumber", "A positive integer must be provided", value => {
							return value === "" || (Number.isInteger(value) && Number(value) >= 0);
						})
						.test("scoreIsProvided", "This field is required", function(value) {
							return !statType.scoreOnly || value !== "";
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
		const { game, teams } = this.state;

		const tables = teams.map(_team => ({
			label: teamList[_team].name.long,
			render: (values, formik) => this.renderTeamTable(formik, _team)
		}));

		return [
			{
				render: (values, formik) => (
					<AdminGameCrawler
						key="game-crawler"
						formikProps={formik}
						game={game}
						scoreOnly={scoreOnly}
						teams={teams}
					/>
				)
			},
			...tables
		];
	}

	renderTeamTable(formikProps, team) {
		const { game, statTypes } = this.state;

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
				const { _player, number } = game.eligiblePlayers[team].find(
					({ _player }) => _player._id == p._player
				);

				//Create Name Cell
				const name = {
					content: (number ? `${number}. ` : "") + _player.name.full,
					sortValue: p.position
				};

				//Get errors
				const errors = formikProps.errors && formikProps.errors[p._player];

				//Get Stat Inputs
				const statInputs = _.mapValues(statTypes, (obj, key) => {
					//Check for an error
					const error = errors && errors[key];

					return renderInput({
						name: `${_player._id}.${key}`,
						type: fieldTypes.number,
						title: error || `${_player.name.full} ${playerStatTypes[key].plural}`,
						className: error ? "error" : ""
					});
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
