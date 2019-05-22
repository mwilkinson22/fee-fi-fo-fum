//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import "datejs";

//Actions
import { fetchAllCompetitionSegments } from "../../../actions/competitionActions";
import { fetchAllGrounds } from "../../../actions/groundActions";
import { fetchPeopleList } from "../../../actions/peopleActions";
import { updateGameBasics } from "../../../actions/gamesActions";

//Components
import LoadingPage from "../../LoadingPage";
import { processFormFields } from "~/helpers/adminHelper";

class AdminGameOverview extends Component {
	constructor(props) {
		super(props);
		const {
			competitionSegmentList,
			fetchAllCompetitionSegments,
			groundList,
			fetchAllGrounds,
			peopleList,
			fetchPeopleList
		} = props;

		if (!competitionSegmentList) {
			fetchAllCompetitionSegments();
		}
		if (!groundList) {
			fetchAllGrounds();
		}
		if (!peopleList) {
			fetchPeopleList();
		}
		this.state = {};
	}

	componentDidMount() {
		this.getOptions();
	}

	static getDerivedStateFromProps(nextProps) {
		return _.pick(nextProps, [
			"game",
			"teamList",
			"teamTypes",
			"competitionSegmentList",
			"groundList",
			"peopleList"
		]);
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
			customTitle: Yup.string().label("Title"),
			customHashtags: Yup.string().label("Hashtags"),
			isAway: Yup.boolean()
				.required()
				.label("Home/Away"),
			_ground: Yup.string()
				.required()
				.label("Ground"),
			tv: Yup.string().label("TV"),
			_referee: Yup.string()
				.label("Referee")
				.nullable(),
			_video_referee: Yup.string()
				.label("Video Referee")
				.nullable()
		});
	}

	getDefaults() {
		const { game } = this.state;
		const {
			teamTypes,
			competitionSegmentList,
			teamList,
			groundList,
			referees
		} = this.getOptions();

		//Get Select Values
		const _teamType = _.filter(teamTypes, type => type.value === game._teamType);
		const _competition = _.filter(
			competitionSegmentList,
			comp => comp.value === game._competition._id
		);
		const _opposition = _.filter(teamList, team => team.value === game._opposition._id);
		const _ground = _.filter(groundList, ground => ground.value === game._ground._id);
		const _referee = game._referee
			? _.filter(referees, ref => ref.value === game._referee._id)
			: "";
		const _video_referee = game._video_referee
			? _.filter(referees, ref => ref.value === game._video_referee._id)
			: "";

		return {
			date: new Date(game.date).toString("yyyy-MM-dd"),
			time: new Date(game.date).toString("HH:mm:ss"),
			_teamType: _teamType ? _teamType[0] : "",
			_competition: _competition ? _competition[0] : "",
			_opposition: _opposition ? _opposition[0] : "",
			round: game.round || "",
			customTitle: game.customTitle || "",
			customHashtags: game.customHashtags ? game.customHashtags.join(" ") : "",
			isAway: game.isAway,
			_ground: _ground ? _ground[0] : "",
			tv: game.tv || "",
			_referee,
			_video_referee
		};
	}

	onSubmit(values) {
		const { updateGameBasics, game } = this.props;
		updateGameBasics(game._id, values);
	}

	getOptions(formikProps) {
		const options = {};
		let { teamTypes, teamList, competitionSegmentList, groundList, peopleList } = this.state;
		const { game } = this.state;
		//Filter
		if (formikProps || game) {
			const values = formikProps ? formikProps.values : null;

			//Filter Competitions on Team Type and Year
			const filterDate = values ? values.date : game.date;
			const filterTeamType = values ? values._teamType.value : game._teamType;
			const filterYear = filterDate ? new Date(filterDate).getFullYear() : null;

			//If the date and team types aren't set, return an empty list
			if (!filterDate || !filterTeamType || !competitionSegmentList) {
				competitionSegmentList = [];
			} else {
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
			//Filter Team on Competition and Year
			let competitionSegment = values ? values._competition : game._competition;
			if (!filterYear || !competitionSegment || !competitionSegmentList.length) {
				teamList = [];
			} else {
				//Get Full Segment Object
				competitionSegment = _.filter(
					competitionSegmentList,
					comp => comp.id === competitionSegment.value
				);

				//Get Instance
				const competitionInstance = _.filter(
					competitionSegment.instances,
					instance => instance.year === filterYear || instance.year === null
				);
				// if (competitionInstance.teams) {
				// 	teamList = _.filter(
				// 		teamList,
				// 		team => competitionInstance.teams.indexOf(team._id) > -1
				// 	);
				// }
			}
		}

		//Team Types
		options.teamTypes = _.map(teamTypes, teamType => ({
			value: teamType._id,
			label: teamType.name
		}));

		//Competition
		options.competitionSegmentList = _.chain(competitionSegmentList)
			.map(competition => ({
				value: competition._id,
				label: `${competition._parentCompetition.name}${
					competition.appendCompetitionName ? " " + competition.name : ""
				}`
			}))
			.sortBy("label")
			.value();

		//Opposition
		options.teamList = _.chain(teamList)
			.map(team => ({
				value: team._id,
				label: team.name.long
			}))
			.sortBy("label")
			.value();

		//Grounds
		const filteredGroundList = _.chain(groundList)
			.map(ground => ({
				value: ground._id,
				label: `${ground.name}, ${ground.address._city.name}`
			}))
			.sortBy("label")
			.value();
		options.groundList = [
			{ value: "auto", label: "Home Team's Ground" },
			...filteredGroundList
		];

		//Refs
		options.referees = _.chain(peopleList)
			.filter(person => person.isReferee)
			.map(ref => ({
				value: ref._id,
				label: `${ref.name.first} ${ref.name.last}`
			}))
			.sortBy("label")
			.value();

		return options;
	}

	renderFields(formikProps) {
		const validationSchema = this.getValidationSchema();

		//Options
		const {
			teamTypes,
			competitionSegmentList,
			teamList,
			groundList,
			referees
		} = this.getOptions(formikProps);
		const awayOptions = [{ value: false, label: "Home" }, { value: true, label: "Away" }];
		const tvOptions = [
			{ value: "", label: "None" },
			{ value: "sky", label: "Sky" },
			{ value: "bbc", label: "BBC" }
		];

		//Fields
		const mainFields = [
			{ name: "date", type: "date" },
			{ name: "time", type: "time" },
			{ name: "_teamType", type: "Select", options: teamTypes },
			{ name: "_competition", type: "Select", options: competitionSegmentList },
			{ name: "_opposition", type: "Select", options: teamList },
			{ name: "round", type: "number" }
		];
		const venueFields = [
			{ name: "isAway", type: "Radio", options: awayOptions },
			{ name: "_ground", type: "Select", options: groundList }
		];
		const mediaFields = [
			{ name: "customTitle", type: "text", placeholder: "Auto-generated if left blank" },
			{ name: "customHashtags", type: "text", placeholder: "Auto-generated if left blank" },
			{ name: "tv", type: "Radio", options: tvOptions }
		];
		const refereeFields = [
			{ name: "_referee", type: "Select", options: referees, isClearable: true },
			{ name: "_video_referee", type: "Select", options: referees, isClearable: true }
		];
		return (
			<Form>
				<div className="form-card grid">
					<h6>Basics</h6>
					{processFormFields(mainFields, validationSchema)}
					<h6>Venue</h6>
					{processFormFields(venueFields, validationSchema)}
					<h6>Media</h6>
					{processFormFields(mediaFields, validationSchema)}
					<h6>Referees</h6>
					{processFormFields(refereeFields, validationSchema)}

					<div className="buttons">
						<button type="clear">Clear</button>
						<button type="submit">Submit</button>
					</div>
				</div>
			</Form>
		);
	}

	render() {
		const requireToRender = ["competitionSegmentList", "groundList", "peopleList"];
		let stopRender = false;
		for (const prop of requireToRender) {
			if (!this.state[prop]) {
				stopRender = true;
				break;
			}
		}

		if (stopRender) {
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
function mapStateToProps({ games, teams, competitions, grounds, people }, ownProps) {
	const { teamTypes, teamList } = teams;
	const { competitionSegmentList } = competitions;
	const { groundList } = grounds;
	const { peopleList } = people;

	return { teamTypes, teamList, competitionSegmentList, groundList, peopleList, ...ownProps };
}
// export default form;
export default connect(
	mapStateToProps,
	{
		fetchAllCompetitionSegments,
		fetchAllGrounds,
		fetchPeopleList,
		updateGameBasics
	}
)(AdminGameOverview);
