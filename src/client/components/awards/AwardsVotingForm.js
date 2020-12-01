//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

//Components
import AwardsStatueImage from "./AwardsStatueImage";
import PersonImage from "../people/PersonImage";
import GameImage from "../games/GameHeaderImage";
import HeadToHeadStatsTable from "../games/HeadToHeadStatsTable";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";

//Helpers
import { getTotalsAndAverages, statToString } from "~/helpers/statsHelper";

//Actions
import { submitVotes } from "~/client/actions/awardActions";

class AwardsVotingForm extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { currentAwards } = nextProps;
		const newState = { currentAwards };

		//Validation Schema
		const validationSchema = _.fromPairs(
			currentAwards.categories.map(c => [
				c._id,
				Yup.string()
					.required()
					.label(c.name)
			])
		);
		newState.validationSchema = Yup.object().shape(validationSchema);

		return newState;
	}

	getDefaults() {
		const { categories, votes } = this.state.currentAwards;
		let defaults = _.fromPairs(categories.map(c => [c._id, ""]));
		if (votes) {
			defaults = _.mapValues(defaults, (def, categoryId) => {
				const currentVote = votes.choices.find(c => c.categoryId == categoryId);

				//If the user has voted on this already
				if (currentVote) {
					//Check their choice is still valid
					const voteIsValid = categories
						.find(c => c._id == categoryId)
						.nominees.find(n => n.nominee == currentVote.choice);

					if (voteIsValid) {
						return currentVote.choice;
					}
				}

				//If no other value is found, revert to default
				return def;
			});
		}

		return defaults;
	}

	async handleSubmit(values) {
		const { submitVotes, onComplete } = this.props;
		const { currentAwards } = this.state;
		await submitVotes(currentAwards._id, values);
		onComplete();
	}

	getPlayerElements(nomineeObject) {
		const { fullPeople, fullGames } = this.props;
		const { currentAwards } = this.state;
		const player = fullPeople[nomineeObject.nominee];

		const elements = {};

		elements.name = [
			<span key="first" className="alt-colour">
				{player.name.first}&nbsp;
			</span>,
			<span key="last">{player.name.last}</span>
		];

		elements.image = (
			<div className="image player">
				<PersonImage
					person={player}
					useWebp={true}
					variant="player"
					size="medium"
					className="player-image"
				/>
			</div>
		);
		const { stats } = nomineeObject;
		if (stats && stats.length) {
			//Get Games
			const rawStats = _.chain(player.playedGames)
				//Filter to just the relevant games
				.filter(
					g =>
						!g.pregameOnly &&
						g.forLocalTeam &&
						new Date(g.date).getFullYear() == currentAwards.year
				)
				//Get the corresponding stats
				.map(g =>
					fullGames[g._id].playerStats
						.filter(({ _player }) => _player == nomineeObject.nominee)
						.map(s => s.stats)
				)
				.flatten()
				.value();

			//Get Stats
			const summedStats = getTotalsAndAverages(rawStats);
			const renderedStats = nomineeObject.stats.map(key => {
				let averageSpan;
				if (!playerStatTypes[key].isAverage) {
					averageSpan = (
						<span className="average">
							({statToString(key, summedStats[key].average)} per game)
						</span>
					);
				}
				return (
					<div key={key}>
						<span className="value">
							{key === "M"
								? summedStats[key].total
								: statToString(key, summedStats[key].total)}
						</span>
						&nbsp;
						<span className="label">{playerStatTypes[key].plural}</span>
						{averageSpan}
					</div>
				);
			});

			elements.stats = <div className="player-stats">{renderedStats}</div>;
		}

		return elements;
	}

	getGameElements(nomineeObject) {
		const { fullGames } = this.props;
		const game = fullGames[nomineeObject.nominee];

		const elements = {};

		elements.name = [
			<span className="alt-colour" key="opp">
				{game._opposition.name.short} ({game.isAway ? "A" : "H"})&nbsp;
			</span>,
			<span key="date">{game.date.toString("dS MMMM")}</span>,
			<span className="subtitle" key="subtitle">
				{game.title}
			</span>
		];

		elements.image = (
			<div className="image game">
				<GameImage game={game} useWebp={true} className="game-image" />
			</div>
		);

		const { stats } = nomineeObject;
		if (stats && stats.length) {
			elements.stats = <HeadToHeadStatsTable game={game} header="Stats" statTypes={stats} />;
		}

		return elements;
	}

	renderField(category, nomineeObject) {
		let elements = {};

		switch (category.awardType) {
			case "player": {
				elements = this.getPlayerElements(nomineeObject);
				break;
			}
			case "game": {
				elements = this.getGameElements(nomineeObject);
				break;
			}
			default:
				elements.name = <span>{nomineeObject.nominee}</span>;
				break;
		}

		//Description
		if (nomineeObject.description) {
			elements.description = (
				<div className="nominee-description">{nomineeObject.description}</div>
			);
		}

		return (
			<Field key={category._id + nomineeObject._id}>
				{({ form }) => {
					return (
						<div
							className={`nominee ${
								form.values[category._id] == nomineeObject.nominee ? "selected" : ""
							}`}
							onClick={() => form.setFieldValue(category._id, nomineeObject.nominee)}
						>
							{elements.image}
							<h4>{elements.name}</h4>
							{elements.description}
							{elements.stats}
						</div>
					);
				}}
			</Field>
		);
	}

	renderChosenValues(values) {
		const { currentAwards } = this.state;
		const { fullGames, fullPeople } = this.props;

		return _.map(values, (val, cat) => {
			const category = currentAwards.categories.find(({ _id }) => cat == _id);

			let valueName;
			if (val == "") {
				//No value set
				valueName = "-";
			} else {
				switch (category.awardType) {
					case "player":
						valueName = fullPeople[val].name.full;
						break;
					case "game": {
						const { _opposition, date } = fullGames[val];
						valueName = `${_opposition.name.short} (${date.toString("dS MMMM")})`;
						break;
					}
					default:
						valueName = val;
				}
			}

			return [
				<label key={`${cat}-label`}>{category.name}</label>,
				<span key={`${cat}-value`}>{valueName}</span>
			];
		});
	}

	renderErrors(errors, touched) {
		const errorCount = _.filter(errors, (err, key) => touched[key]);
		if (errorCount.length) {
			return <span className="error">Please select an option for each category</span>;
		}
	}

	render() {
		const { currentAwards, validationSchema } = this.state;
		return (
			<Formik
				enableReinitialize={true}
				initialValues={this.getDefaults()}
				validationSchema={validationSchema}
				onSubmit={values => this.handleSubmit(values)}
			>
				{({ values, errors, touched }) => {
					const categories = currentAwards.categories.map(c => {
						const { _id, name, awardType, description, nominees } = c;
						return (
							<div
								className={`form-card no-padding award-category ${awardType}-award`}
								key={_id}
							>
								<h2>
									<AwardsStatueImage />
									{name}
								</h2>
								{description && (
									<div className="category-description">{description}</div>
								)}
								<div
									className={`nominees ${values[_id] !== "" ? "has-value" : ""}`}
								>
									{nominees.map(n => this.renderField(c, n))}
								</div>
							</div>
						);
					});
					return (
						<Form>
							{categories}
							<div className="form-card grid">
								{this.renderChosenValues(values)}
								{this.renderErrors(errors, touched)}
								<div className="buttons">
									<button type="reset">Reset</button>
									<button type="submit" className="success">
										Submit Votes
									</button>
								</div>
							</div>
						</Form>
					);
				}}
			</Formik>
		);
	}
}

function mapStateToProps({ awards, games, people }) {
	const { currentAwards } = awards;
	const { fullGames, gameList } = games;
	const { fullPeople } = people;
	return { currentAwards, fullPeople, fullGames, gameList };
}

export default connect(mapStateToProps, { submitVotes })(AwardsVotingForm);
