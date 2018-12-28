import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchGame } from "../../actions/gamesActions";
import LoadingPage from "../../components/LoadingPage";
import "datejs";
import * as colourHelper from "../../utils/colourHelper";
import Countdown from "./Countdown";

class GamePage extends Component {
	async componentWillMount() {
		if (!this.props.game) {
			await this.props.fetchGame(this.props.match.params.slug);
		}
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
					src={`https://www.giantsfanzine.co.uk/resources/images/tv/${game.tv}.svg`}
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
							<div
								style={{ backgroundImage: `url('${team.image}')` }}
								className="team-badge"
							/>
							{team.name.short}
						</h4>
					</div>
				</div>
			);
		}
		return elements;
	}

	generateCountdown() {
		const date = Date.parse(new Date(this.props.game.date));
		if (date > new Date()) {
			return (
				<section className="countdown">
					<div className="container">
						<h3>Countdown to Kickoff</h3>
						<Countdown
							date={date}
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

	render() {
		const { game } = this.props;
		if (!game) {
			return <LoadingPage />;
		} else {
			return (
				<div className="game-page">
					<section
						className="header"
						style={{ backgroundImage: `url(${game._ground.image})` }}
					>
						<div className="game-details">
							<div className="container">{this.generateHeaderInfoBar()}</div>
						</div>
						<div className="team-banners">{this.generateTeamBanners()}</div>
					</section>
					{this.generateCountdown()}
					<ul>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
						<li>Test</li>
					</ul>
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
