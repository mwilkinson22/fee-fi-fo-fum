//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "~/client/components/admin/BasicForm";
import LoadingPage from "~/client/components/LoadingPage";

//Actions
import { fetchCompetitionSegments } from "~/client/actions/competitionActions";
import { fetchGameListByYear, previewFixtureListImage, postFixtureListImage } from "~/client/actions/gamesActions";
import { fetchProfiles } from "~/client/actions/socialActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { getYearsWithResults } from "~/helpers/gameHelper";

class AdminFixtureListImagePage extends Component {
	constructor(props) {
		super(props);

		const {
			gameYears,
			fetchGameListByYear,
			profiles,
			fetchProfiles,
			competitionSegmentList,
			fetchCompetitionSegments
		} = props;

		//Update game list
		//This is only really used to work out what competitions we need,
		//all the rendering is server side. Setting this year & fixtures is sufficient
		const lastYearWithResults = getYearsWithResults(gameYears)[0];
		if (!gameYears[lastYearWithResults]) {
			fetchGameListByYear(lastYearWithResults);
		}
		if (gameYears.fixtures === false) {
			fetchGameListByYear("fixtures");
		}

		if (!profiles) {
			fetchProfiles();
		}

		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		//Validation Schema
		const validationSchema = Yup.object().shape({
			_competitions: Yup.array().of(Yup.mixed()).min(1).label("Competitions"),
			_profile: Yup.mixed().required().label("Profile"),
			tweet: Yup.string().required().label("Tweet"),
			fixturesOnly: Yup.bool().label("Fixtures Only?"),
			dateBreakdown: Yup.bool().label("Include Date Breakdown")
		});

		this.state = { lastYearWithResults, validationSchema };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { gameList, gameYears, profiles, competitionSegmentList, teamTypes } = nextProps;
		const newState = { isLoading: false };

		if (
			gameYears.fixtures === undefined ||
			!gameYears[prevState.lastYearWithResults] ||
			!competitionSegmentList ||
			!profiles
		) {
			newState.isLoading = true;
			return newState;
		}

		//Get year based on game list
		newState.year = _.chain(gameList)
			.map(({ date }) => date.getFullYear())
			.sort()
			.value()
			.pop();

		//Dropdown options
		newState.options = {};

		//Get competitions to include
		newState.options.competitions = _.chain(gameList)
			.filter(({ date }) => date.getFullYear() == newState.year)
			.groupBy("_teamType")
			.map((games, _teamType) => {
				const teamType = teamTypes[_teamType];
				const options = _.chain(games)
					.map("_competition")
					.uniq()
					.map(c => {
						return { value: c, label: competitionSegmentList[c].basicTitle };
					})
					.sortBy("label")
					.value();
				return { label: teamType.name, options, sortOrder: teamType.sortOrder };
			})
			.sortBy("sortOrder")
			.value();

		//Social Profiles
		newState.options.profiles = _.chain(profiles)
			.reject("archived")
			.map(({ name, _id }) => ({ label: name, value: _id }))
			.sortBy("label")
			.value();

		return newState;
	}

	getInitialValues() {
		const { options, year } = this.state;
		const { defaultProfile, competitionSegmentList } = this.props;

		const { message } = this.getInitialTweetText(year);

		return {
			tweet: message,
			_competitions: options.competitions[0].options
				.filter(({ value }) => competitionSegmentList[value].type !== "Friendly")
				.map(o => o.value),
			_profile: defaultProfile || options.profiles[0].value,
			fixturesOnly: true,
			dateBreakdown: true
		};
	}

	getInitialTweetText(year) {
		const { fullTeams, localTeam } = this.props;
		let message = `Here they are, ${fullTeams[localTeam].nickname} fans, your ${year} fixtures!`;
		const caretPoint = message.length;
		message += "\n\n#COYG #CowbellArmy";
		return { caretPoint, message };
	}

	getFieldGroups() {
		const { options, previewImage, year } = this.state;
		const { caretPoint } = this.getInitialTweetText(year);
		return [
			{
				fields: [
					{
						name: "_profile",
						type: fieldTypes.select,
						options: options.profiles,
						isSearchable: false
					},
					{
						name: "_competitions",
						type: fieldTypes.select,
						options: options.competitions,
						isMulti: true,
						isNested: true
					},
					{
						name: "fixturesOnly",
						type: fieldTypes.boolean
					},
					{
						name: "dateBreakdown",
						type: fieldTypes.boolean
					},
					{
						name: "tweet",
						type: fieldTypes.tweet,
						autoFocus: true,
						caretPoint
					}
				]
			},
			{
				render: values => {
					let preview;
					if (previewImage) {
						preview = <img src={previewImage} className="preview-image" alt="Preview" />;
					} else if (previewImage === false) {
						preview = <LoadingPage />;
					}

					return (
						<div key="preview" className="full-span">
							<div className="buttons">
								<button type="button" onClick={() => this.getPreview(values)}>
									Preview Image
								</button>
							</div>
							{preview}
						</div>
					);
				}
			}
		];
	}

	async getPreview(values) {
		const { year } = this.state;
		const { previewFixtureListImage } = this.props;

		//Set previewImage to false, to enforce LoadingPage
		this.setState({ previewImage: false });

		//Get the image
		const image = await previewFixtureListImage(
			year,
			values._competitions.join(","),
			values.fixturesOnly,
			values.dateBreakdown
		);
		this.setState({ previewImage: image });
	}

	async handleSubmit(values, { setSubmitting }) {
		const { year } = this.state;
		const { postFixtureListImage } = this.props;

		//Post Image
		values.year = year;
		await postFixtureListImage(values);

		//Remove preview
		this.setState({ previewImage: undefined });

		//Enable resubmission
		setSubmitting(false);
	}

	render() {
		const { isLoading, year, validationSchema } = this.state;

		//Await all required data
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<div className="admin-fixture-list-image">
				<section className="page-header">
					<h1>{year ? `${year} ` : ""}Fixture Graphic</h1>
				</section>
				<section className="form">
					<div className="container">
						<BasicForm
							fieldGroups={this.getFieldGroups()}
							initialValues={this.getInitialValues()}
							isInitialValid={true}
							isNew={false}
							itemType="Image"
							onSubmit={(values, formik) => this.handleSubmit(values, formik)}
							submitButtonText="Post Image"
							validationSchema={validationSchema}
						/>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ config, competitions, games, social, teams }) {
	const { localTeam } = config;
	const { competitionSegmentList } = competitions;
	const { gameList, postFixtureListImage, gameYears } = games;
	const { profiles, defaultProfile } = social;
	const { fullTeams, teamTypes } = teams;
	return {
		competitionSegmentList,
		gameList,
		localTeam,
		postFixtureListImage,
		profiles,
		defaultProfile,
		fullTeams,
		teamTypes,
		gameYears
	};
}

export default connect(mapStateToProps, {
	fetchGameListByYear,
	fetchProfiles,
	previewFixtureListImage,
	postFixtureListImage,
	fetchCompetitionSegments
})(AdminFixtureListImagePage);
