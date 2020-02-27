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
import { fetchGames, getCalendar } from "~/client/actions/gamesActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { convertGameToCalendarString } from "~/helpers/gameHelper";

class CalendarOptionsSelector extends Component {
	constructor(props) {
		super(props);

		const { games, fullGames, fetchGames, localTeam, teamList } = props;

		//Ensure we have all the games we need
		const gamesToLoad = games.filter(id => !fullGames[id]);
		if (gamesToLoad.length) {
			fetchGames(gamesToLoad, "basic");
		}

		//Create Ref for the hidden download link
		this.downloadLink = React.createRef();

		//Get Local Team
		const localTeamName = teamList[localTeam].name;

		//Set Validation Schema
		const validationSchema = Yup.object().shape({
			teams: Yup.string().label("Teams"),
			teamName: Yup.string().label("Team Names"),
			teamTypes: Yup.string().label("Team Types"),
			venue: Yup.string().label("Venues"),
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
		this.state = { localTeamName, options, validationSchema };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { games, fullGames, teamTypes } = nextProps;
		const newState = { isLoading: false };

		//Await all games
		if (games.filter(id => !fullGames[id]).length) {
			newState.isLoading = true;
			return newState;
		}

		//Get Game Objects
		const gameObjects = _.sortBy(
			games.map(id => fullGames[id]),
			"date"
		);

		//Get Team Types
		const includedTeamTypes = _.uniqBy(gameObjects, "_teamType").map(
			g => teamTypes[g._teamType]
		);

		//Get Example Games
		if (!prevState.exampleGames) {
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
					newState.exampleGames.push(broadcastedGame);
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
		if (!prevState.options.teamTypes) {
			newState.options = prevState.options;
			newState.options.teamTypes = [{ label: "Ignore", value: "none" }];

			//If we have multiple and one of them is first team, we offer an
			//"all but first" option
			if (includedTeamTypes.length > 1 && includedTeamTypes.find(t => t.sortOrder == 1)) {
				newState.options.teamTypes.push({
					label: "Include (except for First Team)",
					value: "allButFirst"
				});
			}

			//Then we add an include all
			newState.options.teamTypes.push({ label: "Include", value: "all" });
		}

		return newState;
	}

	getInitialValues() {
		const { options } = this.state;

		//Get Default TeamTypes option
		const teamTypes =
			options.teamTypes.find(({ value }) => value == "allButFirst") || options.teamTypes[0];

		return {
			teams: "oppositionOnly",
			teamName: "short",
			teamTypes: teamTypes.value,
			venue: "none",
			withBroadcaster: false
		};
	}

	getFieldGroups() {
		const { fullGames, games } = this.props;
		const { failedDownload, options } = this.state;

		const fieldGroups = [
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
						name: "teamTypes",
						options: options.teamTypes,
						type: fieldTypes.select,
						isSearchable: false
					},
					{
						name: "venue",
						options: options.venue,
						type: fieldTypes.select,
						isSearchable: false
					}
				]
			}
		];

		//Check for broadcasters
		if (games.map(id => fullGames[id]).filter(g => g._broadcaster).length) {
			fieldGroups[0].fields.push({
				name: "withBroadcaster",
				options: options.withBroadcaster,
				type: fieldTypes.select,
				isSearchable: false
			});
		}

		//Render Preview
		fieldGroups.push({ render: values => this.renderExamples(values) });

		//Render Error
		if (failedDownload) {
			fieldGroups.push({
				render: () => (
					<p className="error" key="error">
						Error downloading, please try again
					</p>
				)
			});
		}

		return fieldGroups;
	}

	async handleSubmit(options) {
		const { games, getCalendar } = this.props;

		//Remove error
		this.setState({ failedDownload: false });

		//Get Calendar Data
		const data = await getCalendar(games, options);

		if (data) {
			//Convert to Blob
			const file = new Blob([data], { type: "text/calendar" });

			//Apply to hidden link
			this.setState({ objectUrl: URL.createObjectURL(file) });

			//"Download"
			this.downloadLink.current.click();
		} else {
			this.setState({ failedDownload: true });
		}
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
		const list = exampleGames.map(g => (
			<li key={g._id}>{convertGameToCalendarString(g, options, teamTypes, localTeamName)}</li>
		));

		return (
			<div key="examples">
				<h6>Examples</h6>
				<ul>{list}</ul>
			</div>
		);
	}

	render() {
		const { localTeam, teamList } = this.props;
		const { isLoading, objectUrl, validationSchema } = this.state;

		//Wait for games
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<div>
				<p>
					And finally, use the options below to configure how your calendar entries will
					be formatted.
				</p>
				<p>
					These options only affect the title of the entries. The date, time and venue
					will be saved as well!
				</p>
				<a
					download={`${teamList[localTeam].name.long} Fixtures.ics`}
					key="downloadLink"
					ref={this.downloadLink}
					href={objectUrl}
				/>
				<BasicForm
					fieldGroups={this.getFieldGroups()}
					initialValues={this.getInitialValues()}
					isInitialValid={true}
					itemType="Calendar"
					isNew={false}
					onSubmit={values => this.handleSubmit(values)}
					replaceResetButton={this.renderBackButton()}
					submitButtonText="Download to Calendar"
					useFormCard={false}
					validationSchema={validationSchema}
				/>
			</div>
		);
	}
}

CalendarOptionsSelector.propTypes = {
	games: PropTypes.array,
	onBack: PropTypes.func.isRequired
};

function mapStateToProps({ config, games, teams }) {
	const { localTeam } = config;
	const { fullGames, gameList } = games;
	const { teamList, teamTypes } = teams;
	return { localTeam, fullGames, gameList, teamList, teamTypes };
}

export default connect(mapStateToProps, { fetchGames, getCalendar })(CalendarOptionsSelector);
