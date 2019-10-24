//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import Countdown from "../components/games/Countdown";
import LoadingPage from "../components/LoadingPage";
import HelmetBuilder from "../components/HelmetBuilder";
import AwardsVotingForm from "../components/awards/AwardsVotingForm";
import AwardsStatueImage from "../components/awards/AwardsStatueImage";

//Constants
import { imagePath } from "../extPaths";

//Actions
import { fetchGames } from "~/client/actions/gamesActions";
import { fetchPeople } from "~/client/actions/peopleActions";

class AwardPage extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { currentAwards, fullPeople, fetchPeople, fullGames, fetchGames } = nextProps;
		const { finishedLoading } = prevState;
		const newState = { isLoading: false, currentAwards };

		//Check we actually need to display anything
		const loadData = currentAwards && (!currentAwards.votes || prevState.editingEnabled);

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
					.map(({ nominee }) =>
						fullPeople[nominee].playedGames
							.filter(
								g =>
									!g.pregameOnly &&
									g.forLocalTeam &&
									new Date(g.date).getFullYear() == currentAwards.year
							)
							.map(g => g._id)
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
		const { currentAwards, editingEnabled } = this.state;
		let content;

		if (!currentAwards) {
			content = (
				<div className="form-card intro">There are currently no awards open for voting</div>
			);
		} else if (currentAwards.votes && !editingEnabled) {
			content = (
				<div className="form-card intro">
					<p>
						Thank you for voting. Please give us a follow on our social media to be the
						first to find out the winners!
					</p>
					<p>
						Changed your mind?&nbsp;
						<span
							className="edit-link"
							onClick={() => this.setState({ editingEnabled: true })}
						>
							Click Here
						</span>{" "}
						to edit your selections
					</p>
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
					<div className="form-card intro">
						Welcome to the voting page for the {currentAwards.year} Fee Fi Fo Fum Fan
						Awards! Vote in each category below and make sure to follow our social media
						to see the results!
					</div>
					<AwardsVotingForm onComplete={() => this.setState({ editingEnabled: false })} />
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
							<AwardsStatueImage />
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

function mapStateToProps({ awards, games, people }) {
	const { currentAwards } = awards;
	const { fullGames } = games;
	const { fullPeople } = people;
	return { currentAwards, fullPeople, fullGames };
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchGames, fetchPeople }
	)(AwardPage)
};
