//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import Countdown from "../components/games/Countdown";
import LoadingPage from "../components/LoadingPage";
import HelmetBuilder from "../components/HelmetBuilder";

//Constants
import { imagePath } from "../extPaths";

//Actions
import { fetchGames } from "~/client/actions/gamesActions";
import { fetchPeople } from "~/client/actions/peopleActions";

class SquadListPage extends Component {
	constructor(props) {
		super(props);
		const { webP, currentAwards } = this.props;

		//Get Statue Image
		this.statueSrc = `${imagePath}awards/statue.${webP ? "webp" : "png"}`;

		//Check we actually need to display anything
		const loadData = currentAwards && !currentAwards.hasVoted;

		this.state = { loadData, currentAwards };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { currentAwards, fullPeople, fetchPeople, fullGames, fetchGames } = nextProps;
		const { loadData, finishedLoading } = prevState;
		const newState = { isLoading: false };

		if (!loadData) {
			return newState;
		}

		//Only check for data once
		if (!finishedLoading) {
			//Load People
			let { playersRequired } = prevState;
			if (!playersRequired) {
				playersRequired = _.chain(currentAwards.categories)
					.filter(c => c.awardType == "player")
					.map("nominees")
					.flatten()
					.map("nominee")
					.uniq()
					.value();
				newState.playersRequired = playersRequired;
			}

			const playersToLoad = playersRequired.filter(p => !fullPeople[p]);
			if (playersToLoad.length && prevState.isLoading !== "players") {
				fetchPeople(playersToLoad);
				newState.isLoading = "players";
				return newState;
			}

			//Load Games
			let { gamesRequired } = prevState;
			if (!gamesRequired) {
				const nominatedGames = _.chain(currentAwards.categories)
					.filter(c => c.awardType == "game")
					.map("nominees")
					.flatten()
					.map("nominee")
					.value();
				const playerGames = _.chain(currentAwards.categories)
					//Get all players with stats defined
					.filter(c => c.awardType == "player")
					.map("nominees")
					.flatten()
					.filter(n => n.stats && n.stats.length)
					.uniqBy("nominee")
					//Get the ids of all local played games this year
					.map(({ nominee }) => fullPeople[nominee].playedGames)
					.filter(
						g =>
							!g.pregameOnly &&
							g.forLocalTeam &&
							new Date(g.date).getFullYear() == currentAwards.year
					)
					.flatten()
					.value();

				gamesRequired = _.uniq([...nominatedGames, ...playerGames]);
				newState.gamesRequired = gamesRequired;
			}

			const gamesToLoad = gamesRequired.filter(g => !fullGames[g]);
			if (gamesRequired.length && prevState.isLoading !== "games") {
				fetchGames(gamesToLoad);
				newState.isLoading = "games";
				return newState;
			}

			//If we hit this point, everything is loaded
			newState.finishedLoading = true;
		}

		return newState;
	}

	renderContent() {
		const { currentAwards } = this.state;
		let content;
		console.log(currentAwards);

		if (!currentAwards) {
			content = (
				<div className="form-card">There are currently no awards open for voting</div>
			);
		} else if (currentAwards.hasVoted) {
			content = (
				<div className="form-card">
					You have already voted in these awards, check out our social media for the
					results!
				</div>
			);
		} else {
			content = (
				<div>
					<div className="countdown-wrapper">
						<h2>Voting closes</h2>
						<Countdown
							date={new Date(currentAwards.votingEnds)}
							onFinish={() => this.setState({ currentAwards: undefined })}
						/>
					</div>
					<div className="form-card">
						Welcome to the voting page for the {currentAwards.year} Fee Fi Fo Fum Fan
						Awards! Vote in each category below and make sure to follow our social media
						to see the results!
					</div>
				</div>
			);
		}

		return content;
	}

	render() {
		const { isLoading } = this.state;
		const { currentAwards } = this.props;

		const year = currentAwards ? `${currentAwards.year} ` : "";

		return (
			<div className="award-page">
				<HelmetBuilder
					title={`${year}5Fs Awards`}
					description={`Vote in the ${year}Fee Fi Fo Fum Fan Awards!`}
					cardImage={`${imagePath}awards/socialCards/${currentAwards.socialCard ||
						"default.jpg"}`}
				/>
				<section className="page-header">
					<div className="container">
						<h1 className="award-page">
							<img src={this.statueSrc} alt="5Fs Statue" />
							{year.trim()} Awards
						</h1>
					</div>
				</section>
				<section>
					<div className="container">
						{isLoading ? <LoadingPage /> : this.renderContent()}
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ awards, config, games, people }) {
	const { currentAwards } = awards;
	const { webP } = config;
	const { fullGames } = games;
	const { fullPeople } = people;
	return { currentAwards, webP, fullPeople, fullGames };
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchGames, fetchPeople }
	)(SquadListPage)
};
