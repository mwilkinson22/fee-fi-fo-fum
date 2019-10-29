//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "~/client/components/admin/BasicForm";
import LoadingPage from "~/client/components/LoadingPage";

//Actions
import { fetchCompetitionSegments } from "~/client/actions/competitionActions";
import {
	fetchGameList,
	previewFixtureListImage,
	postFixtureListImage
} from "~/client/actions/gamesActions";
import { fetchProfiles } from "~/client/actions/socialActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helper
function getTweetText(year) {
	let message = `Here they are, Giants fans, your ${year} fixtures!`;
	const caretPoint = message.length;
	message += "\n\n#COYG #CowbellArmy";
	return { caretPoint, message };
}

class AdminFixtureListImagePage extends BasicForm {
	constructor(props) {
		super(props);

		const {
			gameList,
			fetchGameList,
			profiles,
			fetchProfiles,
			competitionSegmentList,
			fetchCompetitionSegments
		} = props;

		//Get Games
		if (!gameList) {
			fetchGameList();
		}

		if (!profiles) {
			fetchProfiles();
		}

		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		//Validation Schema
		const validationSchema = Yup.object().shape({
			_competitions: Yup.array()
				.of(Yup.mixed())
				.min(1)
				.label("Competitions"),
			_profile: Yup.mixed()
				.required()
				.label("Profile"),
			tweet: Yup.string()
				.required()
				.label("Tweet")
		});

		this.state = { validationSchema, isLoading: true };
	}

	static getDerivedStateFromProps(nextProps) {
		const { gameList, profiles, competitionSegmentList, teamTypes } = nextProps;
		const newState = {};

		newState.isLoading = !gameList || !competitionSegmentList || !profiles;

		if (!newState.isLoading) {
			newState.year = _.chain(gameList)
				.map(({ date }) => date.getFullYear())
				.sort()
				.value()
				.pop();

			newState.competitions = _.chain(gameList)
				.filter(({ date }) => date.getFullYear() == newState.year)
				.groupBy("_teamType")
				.map((games, _teamType) => {
					const teamType = teamTypes[_teamType];
					const options = _.chain(games)
						.map("_competition")
						.uniq()
						.map(c => {
							const {
								_parentCompetition,
								appendCompetitionName,
								name
							} = competitionSegmentList[c];
							const titleArr = [_parentCompetition.name];
							if (appendCompetitionName) {
								titleArr.push(name);
							}
							return { value: c, label: titleArr.join(" ") };
						})
						.sortBy("label")
						.value();
					return { label: teamType.name, options, sortOrder: teamType.sortOrder };
				})
				.sortBy("sortOrder")
				.value();

			newState.profiles = _.chain(profiles)
				.reject("archived")
				.map(({ name, _id }) => ({ label: name, value: _id }))
				.sortBy("label")
				.value();
		}
		return newState;
	}

	getInitialValues() {
		const { profiles, competitions, year } = this.state;
		const { defaultProfile, competitionSegmentList } = this.props;

		const { message } = getTweetText(year);

		return {
			tweet: message,
			_competitions: competitions[0].options.filter(
				({ value }) => competitionSegmentList[value].type !== "Friendly"
			),
			_profile: profiles.find(p => p.value == defaultProfile) || profiles[0]
		};
	}

	async generatePreview(values) {
		const { year } = this.state;
		const { previewFixtureListImage } = this.props;
		this.setState({ previewImage: false, isSubmitting: true });
		const image = await previewFixtureListImage(
			year,
			values._competitions.map(({ value }) => value).join(",")
		);
		this.setState({ previewImage: image, isSubmitting: false });
	}

	async onSubmit(fValues) {
		const { year } = this.state;
		this.setState({ isSubmitting: true });
		const { postFixtureListImage } = this.props;
		const values = _.cloneDeep(fValues);
		values._competitions = values._competitions.map(({ value }) => value);
		values._profile = values._profile = values._profile.value;
		values.year = year;
		await postFixtureListImage(values);
		this.setState({ isSubmitting: false });
	}

	renderForm() {
		const {
			year,
			isLoading,
			profiles,
			competitions,
			validationSchema,
			isSubmitting
		} = this.state;
		if (!isLoading) {
			const { caretPoint } = getTweetText(year);
			const fields = [
				{
					name: "_profile",
					type: fieldTypes.select,
					options: profiles,
					isSearchable: false
				},
				{
					name: "_competitions",
					type: fieldTypes.select,
					options: competitions,
					isMulti: true
				},
				{ name: "tweet", type: fieldTypes.tweet, autoFocus: true, caretPoint }
			];
			return (
				<section className="main-form">
					<Formik
						initialValues={this.getInitialValues()}
						validationSchema={validationSchema}
						onSubmit={values => this.onSubmit(values)}
						render={({ values }) => {
							return (
								<Form>
									<div className="container">
										<div className="form-card grid">
											{this.renderFieldGroup(fields)}
											<div className="buttons">
												<button
													type="button"
													disabled={isSubmitting}
													onClick={() => this.generatePreview(values)}
												>
													Preview Image
												</button>
												<button type="submit" disabled={isSubmitting}>
													Post Image
												</button>
											</div>
										</div>
									</div>
								</Form>
							);
						}}
					/>
				</section>
			);
		} else {
			return <LoadingPage />;
		}
	}

	renderPreview() {
		const { previewImage } = this.state;
		if (previewImage) {
			return (
				<section className="preview-image">
					<div className="container">
						<img src={previewImage} className="preview-image" />
					</div>
				</section>
			);
		} else if (previewImage === false) {
			return <LoadingPage />;
		} else {
			return null;
		}
	}

	render() {
		const { year } = this.state;
		return (
			<div className="admin-fixture-list-image">
				<section className="page-header">
					<h1>{year ? `year ` : ""}Fixture Graphic</h1>
				</section>
				{this.renderForm()}
				{this.renderPreview()}
			</div>
		);
	}
}

function mapStateToProps({ competitions, games, social, teams }) {
	const { competitionSegmentList } = competitions;
	const { gameList, postFixtureListImage } = games;
	const { profiles, defaultProfile } = social;
	const { teamTypes } = teams;
	return {
		competitionSegmentList,
		gameList,
		postFixtureListImage,
		profiles,
		defaultProfile,
		teamTypes
	};
}

export default connect(
	mapStateToProps,
	{
		fetchGameList,
		fetchProfiles,
		previewFixtureListImage,
		postFixtureListImage,
		fetchCompetitionSegments
	}
)(AdminFixtureListImagePage);
