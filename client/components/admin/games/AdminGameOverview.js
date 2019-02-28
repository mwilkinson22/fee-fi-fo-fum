//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Colour from "color";
import "datejs";

//Actions
import { fetchAllTeams, fetchAllTeamTypes } from "../../../actions/teamsActions";
import { fetchAllCompetitionSegments } from "../../../actions/competitionActions";

//Components
import { localTeam } from "../../../../config/keys";
import LoadingPage from "../../LoadingPage";
import processFormFields from "../../../../helpers/processFormFields";

class AdminGameOverview extends Component {
	constructor(props) {
		super(props);
		const {
			game,
			teamTypes,
			teamList,
			competitionSegmentList,
			fetchAllTeamTypes,
			fetchAllTeams,
			fetchAllCompetitionSegments
		} = props;
		if (!teamTypes) {
			fetchAllTeamTypes();
		}
		if (!teamList) {
			fetchAllTeams();
		}
		if (!competitionSegmentList) {
			fetchAllCompetitionSegments();
		}
		this.state = {
			game,
			teamTypes,
			teamList,
			competitionSegmentList
		};
	}

	componentDidMount() {
		this.getOptions();
	}

	static getDerivedStateFromProps(nextProps) {
		const { game, teamTypes, teamList, competitionSegmentList } = nextProps;
		return {
			game,
			teamTypes,
			teamList,
			competitionSegmentList
		};
	}

	getValidationSchema() {
		const { game } = this.state;
		let date;
		if (game && game.status > 0) {
			const year = new Date(game.date).getFullYear();
			date = Yup.date()
				.required()
				.label("Date")
				.min(`${year}-01-01`)
				.max(`${year}-12-31`);
		} else {
			date = Yup.date()
				.required()
				.label("Date");
		}
		return Yup.object().shape({
			date,
			time: Yup.string()
				.required()
				.label("Time"),
			_teamType: Yup.string()
				.required()
				.label("Team Type"),
			_competition: Yup.string()
				.required()
				.label("Competition"),
			_opposition: Yup.string()
				.required()
				.label("Opposition"),
			round: Yup.number()
				.min(1)
				.label("Round"),
			venue: Yup.string()
				.required()
				.label("Venue")
		});
	}

	getDefaults() {
		const { game } = this.state;
		const { teamTypes, competition, opposition } = this.getOptions();

		const _teamType = _.filter(teamTypes, type => type.value === game._teamType);
		const _competition = _.filter(competition, comp => comp.value === game._competition._id);
		const _opposition = _.filter(opposition, team => team.value === game._opposition._id);

		return {
			date: new Date(game.date).toString("yyyy-MM-dd"),
			time: new Date(game.date).toString("HH:mm:ss"),
			_teamType: _teamType ? _teamType[0] : "",
			_competition: _competition ? _competition[0] : "",
			_opposition: _opposition ? _opposition[0] : "",
			round: game.round,
			venue: game.isAway ? "away" : "home"
		};
	}

	onSubmit(values) {
		console.log(values);
	}

	getOptions(formikProps) {
		const options = {};
		let { teamTypes, teamList, competitionSegmentList } = this.state;
		const { game } = this.state;
		//Filter
		if (formikProps || game) {
			const values = formikProps ? formikProps.values : null;

			//Filter Competitions
			const filterDate = values ? values.date : game.date;
			const filterYear = new Date(filterDate).getFullYear();
			const filterTeamType = values ? values._teamType.value : game._teamType;
			competitionSegmentList = _.filter(competitionSegmentList, comp => {
				return (
					comp._teamType === filterTeamType &&
					_.filter(
						comp.instances,
						instance => instance.year === filterYear || instance.year === null
					).length > 0
				);
			});
		}

		//Team Types
		options.teamTypes = _.map(teamTypes, teamType => ({
			value: teamType._id,
			label: teamType.name
		}));

		//Competition
		options.competition = _.chain(competitionSegmentList)
			.map(competition => ({
				value: competition._id,
				label: `${competition._parentCompetition.name}${
					competition.appendCompetitionName ? " " + competition.name : ""
				}`
			}))
			.sortBy("label")
			.value();

		//Opposition
		options.opposition = _.chain(teamList)
			.map(team => ({
				value: team._id,
				label: team.name.long
			}))
			.sortBy("label")
			.value();

		return options;
	}

	renderFields(formikProps) {
		const validationSchema = this.getValidationSchema();

		const { teamTypes, competition, opposition } = this.getOptions(formikProps);
		const venueOptions = [
			{ value: "home", label: "Home" },
			{ value: "away", label: "Away" },
			{ value: "neutral", label: "Neutral" }
		];
		const fields = [
			{ name: "date", type: "date" },
			{ name: "time", type: "time" },
			{ name: "_teamType", type: "Select", options: teamTypes },
			{ name: "_competition", type: "Select", options: competition },
			{ name: "_opposition", type: "Select", options: opposition },
			{ name: "round", type: "number" },
			{ name: "venue", type: "Radio", options: venueOptions }
		];
		return (
			<Form>
				<div className="form-card">
					{processFormFields(fields, validationSchema)}
					<div className="buttons">
						<button type="clear">Clear</button>
						<button type="submit">Submit</button>
					</div>
				</div>
			</Form>
		);
	}

	render() {
		const { teamTypes, teamList, competitionSegmentList } = this.state;
		if (!teamTypes || !teamList || !competitionSegmentList) {
			return <LoadingPage />;
		}

		return (
			<div className="container">
				<Formik
					validationSchema={() => this.getValidationSchema()}
					onSubmit={values => this.onSubmit(values)}
					initialValues={this.getDefaults()}
					render={formikProps => this.renderFields(formikProps)}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ games, teams, competitions }, ownProps) {
	const { slug } = ownProps.match.params;
	const game = games.fullGames[slug];
	const { teamTypes, teamList } = teams;
	const { competitionSegmentList } = competitions;
	return { game, teamTypes, teamList, competitionSegmentList, ...ownProps };
}
// export default form;
export default connect(
	mapStateToProps,
	{ fetchAllTeamTypes, fetchAllTeams, fetchAllCompetitionSegments }
)(AdminGameOverview);
