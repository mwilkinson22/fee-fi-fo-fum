//Modules
import _ from "lodash";
import React from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Actions
import { fetchCompetitionSegments } from "../../../actions/competitionActions";
import { fetchAllGrounds } from "../../../actions/groundActions";
import { fetchPeopleList } from "../../../actions/peopleActions";
import { addGame, updateGameBasics } from "../../../actions/gamesActions";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminGameOverview extends BasicForm {
	constructor(props) {
		super(props);
		const {
			competitionSegmentList,
			fetchCompetitionSegments,
			groundList,
			fetchAllGrounds,
			peopleList,
			fetchPeopleList
		} = props;

		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}
		if (!groundList) {
			fetchAllGrounds();
		}
		if (!peopleList) {
			fetchPeopleList();
		}
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const {
			game,
			teamList,
			teamTypes,
			competitionSegmentList,
			groundList,
			peopleList,
			localTeam
		} = nextProps;
		const newState = {
			game,
			teamList,
			teamTypes,
			competitionSegmentList,
			groundList,
			peopleList
		};

		if (!game || (!prevState.game || game._id != prevState.game._id)) {
			let date, scoreOverride;
			if (game) {
				scoreOverride = Yup.object().shape({
					[localTeam]: Yup.string().label(teamList[localTeam].name.short),
					[game._opposition._id]: Yup.string().label(game._opposition.name.short)
				});
			}
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
			newState.validationSchema = Yup.object().shape({
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
					.nullable(),
				images: Yup.object().shape({
					header: Yup.string().label("Header"),
					midpage: Yup.string().label("Midpage"),
					customLogo: Yup.string().label("Custom Logo")
				}),
				attendance: Yup.number()
					.label("Attendance")
					.nullable(),
				extraTime: Yup.boolean().label("Game went to Extra Time"),
				scoreOverride
			});
		}
		return newState;
	}

	getDefaults() {
		const { game } = this.state;
		const { localTeam } = this.props;
		const {
			teamTypes,
			competitionSegmentList,
			teamList,
			groundList,
			referees
		} = this.getOptions();

		//Get Select Values
		let _teamType,
			_competition,
			_opposition,
			_ground,
			_referee,
			_video_referee,
			images,
			scoreOverride;

		images = {
			header: "",
			midpage: "",
			customLogo: ""
		};

		if (game) {
			_teamType = _.find(teamTypes, type => type.value == game._teamType);
			_competition = _.find(
				competitionSegmentList,
				comp => comp.value == game._competition._id
			);
			_opposition = _.find(teamList, team => team.value == game._opposition._id);
			_ground = _.find(groundList, ground => ground.value == game._ground._id);
			_referee = game._referee ? _.find(referees, ref => ref.value == game._referee._id) : "";
			_video_referee = game._video_referee
				? _.find(referees, ref => ref.value == game._video_referee._id)
				: "";
			images = _.mapValues(game.images, v => v || "");
			scoreOverride = {
				[localTeam]:
					game.scoreOverride[localTeam] == null ? "" : game.scoreOverride[localTeam],
				[game._opposition._id]:
					game.scoreOverride[game._opposition._id] == null
						? ""
						: game.scoreOverride[game._opposition._id]
			};
		}

		return {
			date: game ? new Date(game.date).toString("yyyy-MM-dd") : "",
			time: game ? new Date(game.date).toString("HH:mm:ss") : "",
			_teamType: _teamType || "",
			_competition: _competition || "",
			_opposition: _opposition || "",
			round: (game && game.round) || "",
			customTitle: (game && game.customTitle) || "",
			customHashtags: game && game.customHashtags ? game.customHashtags.join(" ") : "",
			isAway: game ? game.isAway : false,
			_ground: _ground || "",
			tv: (game && game.tv) || "",
			_referee,
			_video_referee,
			attendance: (game && game.attendance) || "",
			extraTime: (game && game.extraTime) || false,
			images,
			scoreOverride
		};
	}

	async onSubmit(values) {
		const { addGame, updateGameBasics, game } = this.props;
		if (game) {
			updateGameBasics(game._id, values);
		} else {
			const newGame = await addGame(values);
			this.setState({ redirect: `/admin/game/${newGame.slug}` });
		}
	}

	getOptions(values) {
		const options = {};
		let { teamTypes, teamList, competitionSegmentList, groundList, peopleList } = this.state;
		const { game } = this.state;
		//Filter
		if (values || game) {
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
			const competitionSegmentId = values ? values._competition.value : game._competition._id;
			const competitionSegment = _.find(
				competitionSegmentList,
				comp => comp.id == competitionSegmentId
			);
			if (!filterYear || !competitionSegment || !competitionSegmentList.length) {
				teamList = [];
			} else {
				//Get Instance
				const competitionInstance = _.find(
					competitionSegment.instances,
					instance => instance.year == filterYear || instance.year == null
				);
				if (competitionInstance.teams) {
					teamList = _.filter(
						teamList,
						team => competitionInstance.teams.indexOf(team._id) > -1
					);
				}
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

	handleDependentFieldChange(formikProps, name, value) {
		const values = { ...formikProps.values, [name]: value };
		const options = this.getOptions(values);

		formikProps.setFieldValue(name, value);
		formikProps.setFieldTouched(name, true);

		if (!_.find(options.competitionSegmentList, o => o.value == values._competition.value)) {
			formikProps.setFieldValue("_competition", "");
		}

		if (!_.find(options.teamList, o => o.value == values._opposition.value)) {
			formikProps.setFieldValue("_opposition", "");
		}
	}

	renderFields(formikProps) {
		const { game } = this.state;
		const { localTeam } = this.props;

		//Options
		const {
			teamTypes,
			competitionSegmentList,
			teamList,
			groundList,
			referees
		} = this.getOptions(formikProps.values);

		const awayOptions = [{ value: false, label: "Home" }, { value: true, label: "Away" }];
		const tvOptions = [
			{ value: "", label: "None" },
			{ value: "sky", label: "Sky" },
			{ value: "bbc", label: "BBC" }
		];

		//Fields
		const mainFields = [
			{
				name: "date",
				type: fieldTypes.date,
				disableFastField: true
			},
			{ name: "time", type: fieldTypes.time },
			{
				name: "_teamType",
				type: fieldTypes.select,
				options: teamTypes,
				disableFastField: true,
				onChange: opt => this.handleDependentFieldChange(formikProps, "_teamType", opt)
			},
			{
				name: "_competition",
				type: fieldTypes.select,
				options: competitionSegmentList,
				disableFastField: true,
				onChange: opt => this.handleDependentFieldChange(formikProps, "_competition", opt)
			},
			{
				name: "_opposition",
				type: fieldTypes.select,
				options: teamList,
				disableFastField: true
			},
			{ name: "round", type: fieldTypes.number }
		];
		const venueFields = [
			{ name: "isAway", type: fieldTypes.radio, options: awayOptions },
			{ name: "_ground", type: fieldTypes.select, options: groundList }
		];
		const mediaFields = [
			{
				name: "customTitle",
				type: fieldTypes.text,
				placeholder: "Auto-generated if left blank"
			},
			{
				name: "customHashtags",
				type: fieldTypes.text,
				placeholder: "Auto-generated if left blank"
			},
			{ name: "tv", type: fieldTypes.radio, options: tvOptions }
		];
		const refereeFields = [
			{ name: "_referee", type: fieldTypes.select, options: referees, isClearable: true },
			{
				name: "_video_referee",
				type: fieldTypes.select,
				options: referees,
				isClearable: true
			}
		];
		const imageFields = [
			{
				name: "images.header",
				type: fieldTypes.image,
				path: "images/games/header/",
				defaultUploadName: game ? game.slug : "",
				acceptSVG: false
			},
			{
				name: "images.midpage",
				type: fieldTypes.image,
				path: "images/games/midpage/",
				defaultUploadName: game ? game.slug : "",
				acceptSVG: false
			},
			{
				name: "images.customLogo",
				type: fieldTypes.image,
				path: "images/games/logo/",
				defaultUploadName: game ? game.slug : ""
			}
		];

		let scoreOverrideSection;
		if (game) {
			let scoreOverrideFields = [
				{ name: `scoreOverride.${localTeam}`, type: fieldTypes.number },
				{ name: `scoreOverride.${game._opposition._id}`, type: fieldTypes.number }
			];
			if (game.isAway) {
				scoreOverrideFields = scoreOverrideFields.reverse();
			}
			scoreOverrideSection = [
				<h6 key="header">Score Override</h6>,
				this.renderFieldGroup(scoreOverrideFields)
			];
		}

		let postGameSection;
		if (game && game.status > 1) {
			const postGameFields = [
				{ name: "attendance", type: fieldTypes.number },
				{ name: "extraTime", type: fieldTypes.boolean }
			];
			postGameSection = [
				<h6 key="header">Post-Match</h6>,
				this.renderFieldGroup(postGameFields)
			];
		}
		return (
			<Form>
				<div className="form-card grid">
					<h6>Basics</h6>
					{this.renderFieldGroup(mainFields)}
					<h6>Venue</h6>
					{this.renderFieldGroup(venueFields)}
					<h6>Media</h6>
					{this.renderFieldGroup(mediaFields)}
					<h6>Referees</h6>
					{this.renderFieldGroup(refereeFields)}
					<h6>Images</h6>
					{this.renderFieldGroup(imageFields)}
					{scoreOverrideSection}
					{postGameSection}

					<div className="buttons">
						<button type="clear">Clear</button>
						<button type="submit">{game ? "Update" : "Add"} Game</button>
					</div>
				</div>
			</Form>
		);
	}

	render() {
		const { redirect, validationSchema } = this.state;
		if (redirect) {
			return <Redirect to={redirect} />;
		}

		const requireToRender = [
			"competitionSegmentList",
			"groundList",
			"peopleList",
			"teamList",
			"validationSchema"
		];
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
					validationSchema={validationSchema}
					onSubmit={values => this.onSubmit(values)}
					initialValues={this.getDefaults()}
					enableReinitialize={true}
					render={formikProps => this.renderFields(formikProps)}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ teams, competitions, grounds, people, config }) {
	const { teamTypes, teamList } = teams;
	const { competitionSegmentList } = competitions;
	const { groundList } = grounds;
	const { peopleList } = people;
	const { localTeam } = config;

	return { teamTypes, teamList, competitionSegmentList, groundList, peopleList, localTeam };
}
// export default form;
export default connect(
	mapStateToProps,
	{
		fetchCompetitionSegments,
		fetchAllGrounds,
		fetchPeopleList,
		addGame,
		updateGameBasics
	}
)(AdminGameOverview);
