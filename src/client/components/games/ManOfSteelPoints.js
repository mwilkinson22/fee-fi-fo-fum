//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import PersonImage from "../people/PersonImage";

//Helpers
import { getGameStarStats } from "~/helpers/gameHelper";

class ManOfSteelPoints extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { localTeam, teamTypes } = nextProps;
		const { _teamType, manOfSteel, eligiblePlayers } = nextProps.game;
		const newState = {};

		//Process Players
		newState.players = _.chain(eligiblePlayers)
			.map((players, _team) => {
				return players
					.filter(p => manOfSteel.find(m => m._player == p._id))
					.map(p => ({
						_team,
						points: manOfSteel.find(m => m._player == p._id).points,
						...p
					}));
			})
			.flatten()
			.orderBy(["points"], ["desc"])
			.value();

		//Get Player For Image
		const localPlayers = newState.players.filter(
			p => p._team == localTeam && p.images && (p.images.main || p.images.player)
		);
		if (localPlayers.length) {
			newState.playerForImage = localPlayers[0]._player;
		}

		//Get Gender for title
		newState.gender = teamTypes[_teamType].gender;

		return newState;
	}

	renderRow(player) {
		const { localTeam, fullTeams, game } = this.props;
		let teamObject;
		if (player._team === localTeam) {
			teamObject = fullTeams[localTeam].colours;
		} else {
			teamObject = game._opposition;
		}
		const { colours } = teamObject;

		//Set Content Array, start with # of points
		const content = [
			<div
				key={player._id + "pts"}
				style={{
					background: colours.main,
					color: colours.text,
					borderColor: colours.trim1
				}}
				className="points"
			>
				{player.points}
			</div>
		];

		//Create Props for main column
		const mainProps = {
			key: player._id,
			style: {
				background: colours.main,
				color: colours.text
			},
			children: [<span key={player._id + "name"}>{player.name.full}</span>]
		};

		//Check for Gamestar stats, and add to mainProps.children if necessary
		if (!game._competition.instance.scoreOnly && game.status === 3) {
			const gameStarStats = getGameStarStats(game, player, {
				T: 1,
				G: 1,
				DG: 1,
				TA: 1,
				TK: 25
			});
			if (gameStarStats.length) {
				const statList = gameStarStats
					.map(({ label, value }) => {
						return `${value} ${label}`;
					})
					.join(", ");
				mainProps.children.push(
					<div key="stats" className="stats">
						{statList}
					</div>
				);
			}
		}

		//Push main column to content array
		if (player._team == localTeam) {
			content.push(<Link to={`/players/${player.slug}`} {...mainProps} />);
		} else {
			content.push(<div {...mainProps} />);
		}

		return content;
	}

	render() {
		const { players, gender, playerForImage } = this.state;

		//Render Rows
		const content = players.map(p => this.renderRow(p));

		//Get Player Image
		let playerImage;
		if (playerForImage) {
			playerImage = (
				<Link to={`/players/${playerForImage.slug}`} className="player-image-wrapper">
					<PersonImage person={playerForImage} size="medium" />
				</Link>
			);
		}

		return (
			<section className={`man-of-steel ${playerImage ? "with-image" : ""}`}>
				<div className="container">
					<h2>{gender == "F" ? "Woman" : "Man"} of Steel Points</h2>
					<div className="man-of-steel-wrapper">
						{playerImage}
						<div className="man-of-steel-table card">{content}</div>
					</div>
				</div>
			</section>
		);
	}
}

ManOfSteelPoints.propTypes = {
	game: PropTypes.object.isRequired
};

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams, teamTypes } = teams;
	return { localTeam, fullTeams, teamTypes };
}

export default connect(mapStateToProps)(ManOfSteelPoints);
