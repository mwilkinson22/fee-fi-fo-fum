import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchGame } from "../actions/gamesActions";
import LoadingPage from "../components/LoadingPage";
import "datejs";
import * as colourHelper from "../utils/colourHelper";
import Countdown from "../components/games/Countdown";
import GameHeaderImage from "../components/games/GameHeaderImage";
import TeamImage from "../components/teams/TeamImage";
import { imagePath } from "../extPaths";
import HelmetBuilder from "../components/HelmetBuilder";
import { Redirect } from "react-router-dom";
import NotFoundPage from "./NotFoundPage";
import TeamBanner from "../components/teams/TeamBanner";

class GamePage extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	componentDidMount() {
		const { game } = this.props;
		if (game) {
			this.setStateFromGame(game);
		} else {
			this.props.fetchGame(this.props.match.params.slug);
		}
	}

	setStateFromGame(game) {
		if (game) {
			const date = Date.parse(new Date(game.date));
			this.setState({ date, isFixture: date > new Date() });
		}
	}

	componentWillReceiveProps(nextProps, nextContext) {
		const { game } = nextProps;
		this.setStateFromGame(game);
	}

	generateHeaderInfoBar() {
		const { game } = this.props;
		const fields = [
			<span>
				{game._ground.name}, {game._ground.address._city.name}
			</span>,
			<span>{new Date(this.props.game.date).toString("dddd dS MMM yyyy H:mm")}</span>,
			<span>{game.title}</span>
		];

		if (game.tv)
			fields.push(
				<img
					src={`${imagePath}layout/icons/${game.tv}.svg`}
					className="tv-logo"
					alt={`${game.tv} Logo`}
				/>
			);
		let i = 0;
		return (
			<ul>
				{fields.map(field => (
					<li key={i++}>{field}</li>
				))}
			</ul>
		);
	}

	generateTeamBanners() {
		const { teams, scores } = this.props.game;
		const elements = [];
		for (const ha in teams) {
			const team = teams[ha];
			elements.push(
				<TeamBanner
					key={ha}
					className={ha}
					team={team}
					score={scores ? scores[team._id] : null}
				/>
			);
		}
		return elements;
	}

	generateCountdown() {
		if (this.state.isFixture) {
			return (
				<section className="countdown">
					<div className="container">
						<h3>Countdown to Kickoff</h3>
						<Countdown
							date={this.state.date}
							onFinish={() => {
								const section = document.querySelector(".game-page .countdown");
								section.className = section.className + " completed";
							}}
						/>
					</div>
				</section>
			);
		} else {
			return null;
		}
	}

	generateForm() {
		if (this.state.isFixture) {
			return (
				<section className="form">
					<div className="container" />
				</section>
			);
		} else {
			return null;
		}
	}

	getPageTitle() {
		const { game } = this.props;
		const { isAway, scores, _opposition, date } = game;
		let strings;
		if (scores) {
			strings = [
				"Huddersfield Giants",
				" ",
				scores["5c041478e2b66153542b3742"],
				"-",
				scores[_opposition._id],
				" ",
				_opposition.name.long
			];
		} else {
			strings = ["Huddersfield Giants", " vs ", _opposition.name.long];
		}
		if (isAway) {
			strings = strings.reverse();
		}

		return strings.join("") + " - " + new Date(date).toString("dd/MM/yyyy");
	}

	render() {
		const { game } = this.props;
		if (game === undefined) {
			return <LoadingPage />;
		} else if (game.redirect) {
			return <Redirect to={`/games/${game.slug}`} />;
		} else if (!game) {
			return <NotFoundPage message="Game not found" />;
		} else {
			return (
				<div className="game-page">
					<HelmetBuilder title={this.getPageTitle()} canonical={`games/${game.slug}`} />
					<section className="header">
						<GameHeaderImage game={game} className="game-header-image" />
						<div className="game-details">
							<div className="container">{this.generateHeaderInfoBar()}</div>
						</div>
						<div className="team-banners">{this.generateTeamBanners()}</div>
					</section>
					{this.generateCountdown()}
					{this.generateForm()}
				</div>
			);
		}
	}
}

function mapStateToProps({ games }, ownProps) {
	const { slug } = ownProps.match.params;
	const { fullGames } = games;
	return { game: fullGames[slug] };
}

function loadData(store, path) {
	const slug = path.split("/")[2];
	return store.dispatch(fetchGame(slug));
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchGame }
	)(GamePage),
	loadData
};
