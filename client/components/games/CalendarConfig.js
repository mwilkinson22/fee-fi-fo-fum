//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import PopUpDialog from "../PopUpDialog";
import LoadingPage from "../LoadingPage";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Actions
import { fetchGames, getCalendar } from "../../actions/gamesActions";

//Helpers
import { convertGameToCalendarString } from "~/helpers/gameHelper";
import { renderFieldGroup } from "~/helpers/formHelper";

class CalendarConfigDialog extends Component {
	constructor(props) {
		super(props);

		//Create Ref for the hidden download link
		this.downloadLink = React.createRef();

		//Validation Schema
		const validationSchema = Yup.object().shape({
			_competitions: Yup.array()
				.of(Yup.mixed())
				.min(1, "You must select at least one competition")
				.required()
				.label("Competitions"),
			teams: Yup.string().label("Teams"),
			teamName: Yup.string().label("Team Names"),
			teamTypes: Yup.string().label("Include Team Types?"),
			venue: Yup.string().label("Home/Away"),
			withBroadcaster: Yup.bool().label("Include Broadcaster?")
		});

		//Ensure we have all required games
		const { gameList, fullGames, fetchGames } = props;
		const gamesRequired = _.filter(gameList, g => g.date > new Date()).map(g => g._id);

		//Load any that are missing
		const gamesToLoad = gamesRequired.filter(g => !fullGames[g]);
		if (gamesToLoad.length) {
			fetchGames(gamesToLoad);
		}

		this.state = { validationSchema, gamesRequired };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fullGames, teamTypes, localTeam, fullTeams } = nextProps;
		const { options, gamesRequired } = prevState;
		const newState = { isLoading: false };

		//Ensure we have all games
		if (gamesRequired.filter(g => !fullGames[g]).length) {
			newState.isLoading = true;
			return newState;
		}

		//Otherwise, continue
		else if (!options) {
			//Radio Options
			newState.options = {};
			newState.options.teams = [
				{ label: "Opposition Only", value: "oppositionOnly" },
				{ label: `${fullTeams[localTeam].name.short} vs Opposition`, value: "localVs" },
				{ label: "Home vs Away", value: "homeAway" }
			];
			newState.options.teamName = [
				{ label: "Short", value: "short" },
				{ label: "Long", value: "long" }
			];
			newState.options.teamTypes = [
				{ label: "None", value: "none" },
				{ label: "All except First Team", value: "allButFirst" },
				{ label: "All", value: "all" }
			];
			newState.options.venue = [
				{ label: "Don't Include", value: "none" },
				...newState.options.teamName
			];
			newState.options._competitions = _.chain(fullGames)
				//Only Fixtures
				.filter(({ date }) => date >= new Date())
				//Get Competitions
				.map(({ _competition, _teamType }) => ({ ..._competition, _teamType }))
				.uniqBy("_id")
				//Group By Team Type
				.groupBy("_teamType")
				//Convert to react-select format
				.map((competitions, _t) => {
					const { name, sortOrder } = teamTypes[_t];
					const options = competitions.map(c => ({
						label: c.instance.title,
						value: c._id
					}));
					return {
						label: name,
						sortOrder,
						options,
						_teamType: _t
					};
				})
				.sortBy("sortOrder")
				.value();

			//Example games
			const teams = _.chain(fullGames)
				.sortBy([({ date }) => (date > new Date() ? 0 : 1), "date"])
				.map("_opposition")
				.uniqBy("_id")
				.value();

			newState.sampleGames = [
				{
					_opposition: teams[0],
					isAway: false,
					_broadcaster: null,
					_teamType: Object.keys(teamTypes)[0]
				},
				{
					_opposition: teams[1] || teams[0],
					isAway: true,
					_broadcaster: { name: "Sky" },
					_teamType: Object.keys(teamTypes)[2]
				},
				{
					_opposition: teams[2] || teams[0],
					isAway: true,
					_broadcaster: { name: "OurLeague" },
					_teamType: Object.keys(teamTypes)[3]
				}
			];
		}

		return newState;
	}

	getInitialValues() {
		const { options } = this.state;
		const { activeTeamType } = this.props;

		const activeTeamCompetitions = options._competitions.find(
			({ _teamType }) => _teamType == activeTeamType
		);

		return {
			_competitions: activeTeamCompetitions
				? activeTeamCompetitions.options.map(o => o.value)
				: [],
			teams: "oppositionOnly",
			teamName: "short",
			teamTypes: "none",
			venue: "none",
			withBroadcaster: false
		};
	}

	async onSubmit(values) {
		const { getCalendar, onDestroy } = this.props;
		this.setState({ isDownloading: true });

		const { _competitions, ...options } = values;

		//Get Calendar Data
		const data = await getCalendar(_competitions, options);

		//Convert to Blob
		const file = new Blob([data], { type: "text/calendar" });

		//Apply to hidden link
		this.setState({ objectUrl: URL.createObjectURL(file) });

		//"Download"
		this.downloadLink.current.click();

		//Remove Element
		onDestroy();
	}

	renderExampleEntries(options) {
		const { teamTypes, fullTeams, localTeam } = this.props;
		const { sampleGames } = this.state;

		const content = sampleGames.map(g => (
			<li key={g._teamType}>
				{convertGameToCalendarString(g, options, teamTypes, fullTeams[localTeam].name)}
			</li>
		));

		return <ul>{content}</ul>;
	}

	render() {
		const { onDestroy } = this.props;
		const { isDownloading, objectUrl, options, isLoading, validationSchema } = this.state;

		if (isLoading || isDownloading) {
			return (
				<PopUpDialog onDestroy={onDestroy}>
					<LoadingPage />
					<a
						download="Huddersfield Giants Fixtures.ics"
						ref={this.downloadLink}
						href={objectUrl}
					/>
				</PopUpDialog>
			);
		} else {
			return (
				<Formik
					initialValues={this.getInitialValues()}
					onSubmit={values => this.onSubmit(values)}
					validationSchema={this.state.validationSchema}
					render={({ values }) => {
						const competitionField = [
							{
								name: "_competitions",
								type: fieldTypes.select,
								options: options._competitions,
								isMulti: true,
								isNested: true
							}
						];
						const configFields = [
							{ name: "teams", type: fieldTypes.radio, options: options.teams },
							{ name: "teamName", type: fieldTypes.radio, options: options.teamName },
							{
								name: "teamTypes",
								type: fieldTypes.radio,
								options: options.teamTypes
							},
							{ name: "venue", type: fieldTypes.radio, options: options.venue },
							{ name: "withBroadcaster", type: fieldTypes.boolean }
						];
						return (
							<Form>
								<PopUpDialog onDestroy={onDestroy} asGrid={true}>
									<h6>Download Fixture Calendar</h6>
									<p className="full-span">
										Use the fields below to generate an ics file and add all
										upcoming Giants fixtures to your calendar
									</p>
									<p className="full-span mobile-only">
										Just open the file directly from your phone or tablet and it
										should import automatically!
									</p>
									<p className="full-span desktop-only">
										Opening the file from your phone or tablet should import it
										automatically. From a PC, it can easily be imported into
										most calendar services, such as&nbsp;
										<a
											href="https://calendar.google.com/calendar/r/settings/export"
											target="_blank"
											rel="noopener noreferrer"
										>
											Google
										</a>
										,&nbsp;
										<a
											href="https://support.office.com/en-gb/article/import-or-subscribe-to-a-calendar-in-outlook-on-the-web-503ffaf6-7b86-44fe-8dd6-8099d95f38df"
											target="_blank"
											rel="noopener noreferrer"
										>
											Outlook
										</a>
										&nbsp;and&nbsp;
										<a
											href="https://support.apple.com/en-gb/guide/calendar/icl1023/mac"
											target="_blank"
											rel="noopener noreferrer"
										>
											Apple
										</a>
									</p>
									<hr />
									{renderFieldGroup(competitionField, validationSchema)}
									<hr />
									<p className="full-span">
										Customise how your calendar entries will appear
									</p>
									{renderFieldGroup(configFields, validationSchema)}
									<label>Examples</label>
									{this.renderExampleEntries(values)}
									<div className="buttons">
										<button type="button" onClick={onDestroy}>
											Cancel
										</button>
										<button type="submit">Download</button>
									</div>
								</PopUpDialog>
							</Form>
						);
					}}
				/>
			);
		}
	}
}

CalendarConfigDialog.propTypes = {
	onDestroy: PropTypes.func.isRequired
};

function mapStateToProps({ config, games, teams }) {
	const { localTeam } = config;
	const { fullGames, gameList } = games;
	const { activeTeamType, fullTeams, teamTypes } = teams;
	return { localTeam, gameList, fullGames, activeTeamType, fullTeams, teamTypes };
}

export default connect(mapStateToProps, { fetchGames, getCalendar })(CalendarConfigDialog);
