import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchGame } from "../../actions/gamesActions";
import LoadingPage from "../../components/LoadingPage";
import "datejs";
import * as colourHelper from "../../utils/colourHelper";
import Countdown from "./Countdown";
import GameHeaderImage from "./GameHeaderImage";
import TeamImage from "../teams/TeamImage";
import { imagePath } from "../../extPaths";

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
		const { teams } = this.props.game;
		const elements = [];
		for (const ha in teams) {
			const team = teams[ha];
			elements.push(
				<div
					key={ha}
					className={`team-banner ${ha}`}
					style={{
						backgroundColor: colourHelper.toRgb(team.colours.main),
						color: colourHelper.toRgb(team.colours.text)
					}}
				>
					<div className={`trim ${ha}`}>
						<span style={{ backgroundColor: colourHelper.toRgb(team.colours.trim1) }} />
						<span style={{ backgroundColor: colourHelper.toRgb(team.colours.trim2) }} />
					</div>
					<div className="container">
						<h4>
							<TeamImage team={team} />
							{team.name.short}
						</h4>
					</div>
				</div>
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

	render() {
		const { game } = this.props;
		if (!game) {
			return <LoadingPage />;
		} else {
			return (
				<div className="game-page">
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

export default connect(
	mapStateToProps,
	{ fetchGame }
)(GamePage);
