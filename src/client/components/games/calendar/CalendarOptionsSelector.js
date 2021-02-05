//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import * as Yup from "yup";

//Components
import BasicForm from "../../admin/BasicForm";
import LoadingPage from "../../LoadingPage";

//Actions
import { fetchGames } from "~/client/actions/gamesActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { convertGameToCalendarString } from "~/helpers/gameHelper";

class CalendarOptionsSelector extends Component {
	constructor(props) {
		super(props);

		const {
			showAllTeamTypes,
			selectedTeamTypes,
			gameList,
			fullGames,
			fetchGames,
			localTeam,
			fullTeams
		} = props;

		const now = new Date();
		const gamesRequired = _.chain(gameList)
			.filter(g => g.date > now)
			.filter(g => showAllTeamTypes || selectedTeamTypes.indexOf(g._teamType) > -1)
			.sortBy("date")
			.map("_id")
			.value();

		//Ensure we have all the games we need
		const gamesToLoad = gamesRequired.filter(id => !fullGames[id]);
		if (gamesToLoad.length) {
			fetchGames(gamesToLoad, "basic");
		}

		//Get Local Team
		const localTeamName = fullTeams[localTeam].name;

		//Set Validation Schema
		const validationSchema = Yup.object().shape({
			teams: Yup.string().label("Team Format"),
			teamName: Yup.string().label("Team Names"),
			displayTeamTypes: Yup.string().label("Team Types (Academy, Reserves, etc)"),
			venue: Yup.string().label("Home/Away"),
			withBroadcaster: Yup.bool().label("Broadcaster")
		});

		//Set dropdown options
		const options = {};
		options.teams = [
			{ label: "Opposition Only", value: "oppositionOnly" },
			{ label: `${localTeamName.short} vs Opposition`, value: "localVs" },
			{ label: "Home vs Away", value: "homeAway" }
		];
		options.teamName = [
			{ label: "Short", value: "short" },
			{ label: "Long", value: "long" }
		];
		options.venue = [
			{ label: "Ignore", value: "none" },
			{ label: "H/A", value: "short" },
			{ label: "Home/Away", value: "long" }
		];
		options.withBroadcaster = [
			{ label: "Ignore", value: false },
			{ label: "Include", value: true }
		];

		//Set State
		this.state = { gamesRequired, localTeamName, options, validationSchema };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fullGames, selectedTeamTypes, teamTypes } = nextProps;
		const { gamesRequired } = prevState;

		const newState = { isLoading: false };

		//Await all games
		if (gamesRequired.filter(id => !fullGames[id]).length) {
			newState.isLoading = true;
			return newState;
		}

		//Get Game Objects
		const gameObjects = _.sortBy(
			gamesRequired.map(id => fullGames[id]),
			"date"
		);

		//Get Selected Team Type Objects
		const selectedTeamTypeObjects = selectedTeamTypes.map(id => teamTypes[id]);

		//Get Example Games
		if (!prevState.exampleGames && gameObjects.length) {
			//First, pick the first game from each team type
			newState.exampleGames = _.chain(gameObjects)
				.groupBy("_teamType")
				.map(games => games[0])
				.flatten()
				.value();

			//Try to add a broadcasted game
			if (!newState.exampleGames.filter(g => g._broadcaster).length) {
				const broadcastedGame = gameObjects.find(g => g._broadcaster);
				if (broadcastedGame) {
					//If we find a broadcasted game, add it on
					newState.exampleGames.push(broadcastedGame);
				} else {
					//If not, update the first game to have a broadcaster,
					//just so we have something for the examples
					newState.exampleGames[0] = {
						...newState.exampleGames[0],
						_broadcaster: { name: "BBC" }
					};
				}
			}

			//Ensure we have at least one home and away
			if (Object.keys(_.groupBy(newState.exampleGames, "isAway")).length === 1) {
				//We can work out whether they are all home or
				//away by looking at the first game
				const currentValue = newState.exampleGames[0].isAway;
				const gameToAdd = gameObjects.find(g => g.isAway === !currentValue);
				if (gameToAdd) {
					newState.exampleGames.push(gameToAdd);
				}
			}

			//Ensure we have at least one team where short and long names are different
			const differentLongAndShort = ({ _opposition }) =>
				_opposition.name.short !== _opposition.name.long;
			if (!newState.exampleGames.find(differentLongAndShort)) {
				const gameToAdd = gameObjects.find(differentLongAndShort);
				if (gameToAdd) {
					newState.exampleGames.push(gameToAdd);
				}
			}
		}

		//Set teamType dropdown options
		if (!prevState.options.displayTeamTypes) {
			newState.options = prevState.options;
			newState.options.displayTeamTypes = [{ label: "Ignore", value: "none" }];

			//If we have multiple and one of them is first team, we offer an
			//"all but first" option
			if (
				selectedTeamTypes.length > 1 &&
				selectedTeamTypeObjects.find(t => t.sortOrder === 1)
			) {
				newState.options.displayTeamTypes.push({
					label: "Include all except First Team",
					value: "allButFirst"
				});
			}

			//Then we add an include all
			newState.options.displayTeamTypes.push({ label: "Include All", value: "all" });
		}

		return newState;
	}

	getInitialValues() {
		const { initialOptions, selectedTeamTypes, showAllTeamTypes } = this.props;
		const { options } = this.state;

		//Get default displayTeamTypes option
		let displayTeamTypes;
		if (!showAllTeamTypes && selectedTeamTypes.length === 1) {
			//If one team type is selected, we default to "hide"
			displayTeamTypes = options.displayTeamTypes[0].value;
		} else {
			//Otherwise, we take the second option.
			//Either "include" or "include all but first team"
			displayTeamTypes = options.displayTeamTypes[1].value;
		}

		//Set default values
		const defaultValues = {
			teams: "oppositionOnly",
			teamName: "short",
			displayTeamTypes,
			venue: "short",
			withBroadcaster: true
		};

		//If we have initialOptions (i.e. if we're editing),
		//then we override the defaults here
		if (initialOptions) {
			for (const key in defaultValues) {
				const initialValue = initialOptions[key];

				//If (somehow) no value is found, we simply skip this key
				if (initialValue == null) {
					continue;
				}

				//The displayTeamType options can change based on the selected teamTypes,
				//so we only override if initialOptions.displayTeamType is still valid
				if (key === "displayTeamTypes") {
					const optionInDropdown = options.displayTeamTypes.find(
						({ value }) => value == initialValue
					);
					if (!optionInDropdown) {
						continue;
					}
				}

				//If we get to this point, we're good to override
				defaultValues[key] = initialValue;
			}
		}

		return defaultValues;
	}

	getFieldGroups() {
		const { options } = this.state;

		return [
			{
				fields: [
					{
						name: "teams",
						options: options.teams,
						type: fieldTypes.select,
						isSearchable: false
					},
					{
						name: "teamName",
						options: options.teamName,
						type: fieldTypes.select,
						isSearchable: false
					},
					{
						name: "displayTeamTypes",
						options: options.displayTeamTypes,
						type: fieldTypes.select,
						isSearchable: false
					},
					{
						name: "venue",
						options: options.venue,
						type: fieldTypes.select,
						isSearchable: false
					},
					{
						name: "withBroadcaster",
						options: options.withBroadcaster,
						type: fieldTypes.select,
						isSearchable: false
					}
				]
			},
			{
				render: values => this.renderExamples(values)
			}
		];
	}

	renderBackButton() {
		return (
			<button type="button" onClick={() => this.props.onBack()}>
				Back
			</button>
		);
	}

	renderExamples(options) {
		const { teamTypes } = this.props;
		const { exampleGames, localTeamName } = this.state;
		if (exampleGames && exampleGames.length) {
			const list = exampleGames.map(g => (
				<li key={g._id}>
					{convertGameToCalendarString(g, options, teamTypes, localTeamName)}
				</li>
			));

			return (
				<div key="examples">
					<h6>Examples</h6>
					<ul>{list}</ul>
				</div>
			);
		}
	}

	render() {
		const { onNext } = this.props;
		const { isLoading, validationSchema } = this.state;

		//Wait for games
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<div>
				<p>
					Use the options below to configure how the titles of your calendar entries will
					be formatted.
				</p>
				<BasicForm
					fieldGroups={this.getFieldGroups()}
					initialValues={this.getInitialValues()}
					isInitialValid={true}
					itemType="Calendar"
					isNew={false}
					onSubmit={options => onNext(options)}
					replaceResetButton={this.renderBackButton()}
					submitButtonText="Next"
					useFormCard={false}
					validationSchema={validationSchema}
				/>
			</div>
		);
	}
}

CalendarOptionsSelector.propTypes = {
	initialOptions: PropTypes.object,
	selectedTeamTypes: PropTypes.arrayOf(PropTypes.string),
	showAllTeamTypes: PropTypes.bool,
	onBack: PropTypes.func.isRequired,
	onNext: PropTypes.func.isRequired
};

function mapStateToProps({ config, games, teams }) {
	const { localTeam } = config;
	const { fullGames, gameList } = games;
	const { fullTeams, teamTypes } = teams;
	return { localTeam, fullGames, gameList, fullTeams, teamTypes };
}

export default connect(mapStateToProps, { fetchGames })(CalendarOptionsSelector);
