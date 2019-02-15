import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import PlayerStatsHelper from "../helperClasses/PlayerStatsHelper";
import LoadingPage from "../components/LoadingPage";
import Parser from "html-react-parser";
import { layoutImagePath } from "../extPaths";
import {
	fetchPersonBySlug,
	fetchPlayerStatYears,
	fetchPlayerStats
} from "../actions/peopleActions";
import "datejs";
import GameFilters from "../components/games/GameFilters";
import SingleStatBox from "../components/stats/SingleStatBox";
import StatsTables from "../components/games/StatsTables";
import PersonImage from "../components/people/PersonImage";
import HelmetBuilder from "../components/HelmetBuilder";
import playerStatTypes from "../../constants/playerStatTypes";
import NotFoundPage from "./NotFoundPage";
import { Redirect } from "react-router-dom";

class PersonPage extends Component {
	constructor(props) {
		super(props);
		const { person, fetchPersonBySlug, match } = props;
		const initialState = {};

		if (person === undefined) {
			fetchPersonBySlug(match.params.slug);
		} else {
			initialState.person = person;

			if (person.isPlayer && person.playerStats) {
				initialState.playerStatYear = getInitialPlayerStatYear(_.keys(person.playerStats));
			}
		}

		this.state = { activeFilters: {}, ...initialState };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { person, fetchPlayerStatYears } = nextProps;
		const newState = { person };

		if (person && person.isPlayer) {
			//Get Stat Years, if required
			if (!person.playerStats) {
				fetchPlayerStatYears(person._id);
			} else if (!prevState.playerStatYear) {
				newState.playerStatYear = getInitialPlayerStatYear(_.keys(person.playerStats));
			}
		}

		return newState;
	}

	getSocial() {
		const social = [];
		const { twitter, instagram } = this.state.person;
		if (twitter) {
			social.push(
				<a
					key="twitter"
					href={`https://www.twitter.com/${twitter}`}
					className="twitter"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img src={`${layoutImagePath}icons/twitter.svg`} alt="Twitter Logo" />@{twitter}
				</a>
			);
		}
		if (instagram) {
			social.push(
				<a
					key="insta"
					href={`https://www.instagram.com/${instagram}`}
					className="instagram"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img src={`${layoutImagePath}icons/instagram.svg`} alt="Instagram Logo" />@
					{instagram}
				</a>
			);
		}
		if (social.length) {
			return <div className="social">{social}</div>;
		} else {
			return null;
		}
	}

	getPositions() {
		const { person } = this.state;
		if (person.isPlayer) {
			const { mainPosition, otherPositions } = person.playerDetails;
			const allPositions = _.concat(mainPosition, otherPositions).map(position => {
				return (
					<div key={position} className="position">
						{position}
					</div>
				);
			});
			return <div className="positions">{allPositions}</div>;
		} else {
			return null;
		}
	}

	getInfoTable() {
		const { person } = this.state;
		const { playerDetails, dateOfBirth, nickname, _hometown, _represents } = person;
		const data = {};
		if (dateOfBirth) {
			const dob = new Date(person.dateOfBirth);
			const today = new Date();
			const age = Math.abs(today.getTime() - dob.getTime());

			data["Date of Birth"] = dob.toString("dS MMMM yyyy");
			data["Age"] = Math.floor(age / (1000 * 3600 * 24 * 365));
		}

		if (nickname) {
			data["AKA"] = nickname;
		}

		if (_hometown) {
			data["From"] = `${_hometown.name}, ${_hometown._country.name}`;
		}

		if (_represents) {
			data["Represents"] = _represents.name;
		}

		if (playerDetails.contractEnds && playerDetails.contractEnds >= new Date().getFullYear()) {
			data["Contracted Until"] = playerDetails.contractEnds;
		}

		const rows = _.map(data, (value, field) => {
			return (
				<tr key={field}>
					<th>{field}</th>
					<td>{value}</td>
				</tr>
			);
		});
		return (
			<div className="info-table">
				<table>
					<tbody>{rows}</tbody>
				</table>
			</div>
		);
	}

	getDescription() {
		const { person } = this.state;
		if (person.description) {
			return <div className="description">{Parser(person.description)}</div>;
		} else {
			return null;
		}
	}

	getPlayerStats() {
		const { fetchPlayerStatYears, fetchPlayerStats } = this.props;
		const { person, playerStatYear } = this.state;

		if (!person || !person.isPlayer) {
			return null;
		} else if (!person.playerStats) {
			fetchPlayerStatYears(person._id);
			return <LoadingPage />;
		} else if (Object.keys(person.playerStats).length === 0) {
			return null;
		}

		//Create Header
		const years = _.chain(person.playerStats)
			.keys(person.playerStats)
			.sort()
			.reverse()
			.value();
		let yearSelector;
		if (years.length === 1) {
			yearSelector = years[0];
		} else {
			yearSelector = (
				<select
					value={playerStatYear}
					onChange={ev =>
						this.setState({ playerStatYear: ev.target.value, activeFilters: {} })
					}
				>
					{years.map(year => (
						<option key={year}>{year}</option>
					))}
				</select>
			);
		}
		const header = <h1>{yearSelector} Playing Stats</h1>;
		let filters;

		//Get Stats
		const allGames = person.playerStats[playerStatYear];
		const content = [];
		if (!allGames) {
			fetchPlayerStats(person._id, playerStatYear);
			content.push(<LoadingPage key="loading" />);
		} else {
			//Game Filters
			const { activeFilters } = this.state;
			const games = _.filter(allGames, activeFilters);
			filters = (
				<div className="container" key="filters">
					<GameFilters
						games={allGames}
						onFilterChange={activeFilters => this.setState(activeFilters)}
						activeFilters={this.state.activeFilters}
					/>
				</div>
			);
			if (games.length) {
				content.push(
					<div className="container" key="playerStats">
						{this.getPlayerStatBoxes(games)}
						<StatsTables list="games" games={games} />
					</div>
				);
			} else {
				content.push(
					<div className="container no-games-found" key="no-games-found">
						No game data available
					</div>
				);
			}
		}

		return (
			<section className="player-stats">
				<div className="section-header">
					{header}
					{filters}
				</div>
				<div className="section-content">{content}</div>
			</section>
		);
	}

	getPlayerStatBoxes(games) {
		const positions = _.chain(games)
			.map(game => {
				switch (game.playerStats[0].position) {
					case 1:
						return "Fullback";
					case 2:
					case 5:
						return "Wing";
					case 3:
					case 4:
						return "Centre";
					case 6:
						return "Stand Off";
					case 7:
						return "Scrum Half";
					case 8:
					case 10:
						return "Prop";
					case 9:
						return "Hooker";
					case 11:
					case 12:
						return "Second Row";
					case 13:
						return "Loose Forward";
					default:
						return "Interchange";
				}
			})
			.groupBy()
			.map((arr, position) => ({ position, count: arr.length }))
			.sortBy("count")
			.reverse()
			.value();

		const maxPosition = _.map(positions)[0].count;
		const positionCards = _.map(positions, ({ count, position }) => (
			<tr key={position}>
				<th>{position}</th>
				<td>
					<span
						className="position-bar"
						style={{ width: `${(count / maxPosition) * 100}%` }}
					>
						{count}
					</span>
				</td>
			</tr>
		));

		const statBoxStats = {
			Scoring: ["T", "TA", "PT", "G", "KS"],
			Attack: ["M", "C", "AG", "TB", "CB", "E", "DR", "FT", "OF"],
			Defence: ["TK", "MT", "TS", "P"]
		};

		const totalStats = PlayerStatsHelper.sumStats(
			_.map(games, game => game.playerStats[0].stats)
		);

		const statBoxes = _.map(statBoxStats, (keys, category) => {
			const header = <h2 key={category}>{category}</h2>;
			const boxes = _.chain(keys)
				.filter(key => totalStats[key])
				.filter(key => totalStats[key].total > 0 || !playerStatTypes[key].moreIsBetter)
				.map(key => <SingleStatBox key={key} statKey={key} statValues={totalStats[key]} />)
				.value();
			if (boxes.length) {
				return (
					<div key={category}>
						{header}
						<div className="single-stat-boxes">{boxes}</div>
					</div>
				);
			} else {
				return null;
			}
		});

		return (
			<div className="container">
				<h2>Games</h2>
				<div className="single-stat-boxes positions">
					<div className="single-stat-box card">
						<div className="total">{games.length}</div>
						<div className="name">Games</div>
					</div>
					<div className="single-stat-box card">
						<table>
							<tbody>{positionCards}</tbody>
						</table>
					</div>
				</div>
				{statBoxes}
			</div>
		);
	}

	render() {
		const { match } = this.props;
		const { person } = this.state;
		const role = match.url.split("/")[1]; //players or coaches
		// console.log(person);
		if (person === undefined) {
			return <LoadingPage />;
		} else if (person && person.redirect) {
			return <Redirect to={`/${role}/${person.slug}`} />;
		} else if (
			!person ||
			(role === "players" && !person.isPlayer) ||
			(role === "coaches" && !person.isCoach)
		) {
			return (
				<NotFoundPage message={`${role === "players" ? "Player" : "Coach"} not found`} />
			);
		} else {
			return (
				<div className={`person-page`}>
					<HelmetBuilder
						title={`${person.name.first} ${person.name.last}`}
						canonical={`${person.isCoach ? "coaches" : "players"}/${person.slug}`}
					/>
					<section className="header">
						<div className="background" />
						<div className="container">
							<PersonImage person={person} />
							<div className="overlay">
								<h1>
									{person.name.first}
									&nbsp;
									<span>{person.name.last}</span>
								</h1>
								{this.getPositions()}
								{this.getSocial()}
							</div>
						</div>
					</section>
					<section className="person-data">
						<div className="container">
							{this.getInfoTable()}
							{this.getDescription()}
						</div>
					</section>
					{this.getPlayerStats()}
				</div>
			);
		}
	}
}

function getInitialPlayerStatYear(years) {
	return _.chain(years)
		.map(Number)
		.max()
		.value();
}

function mapStateToProps({ people }, ownProps) {
	const { slug } = ownProps.match.params;
	return { person: people[slug], ...ownProps };
}

async function loadData(store, path) {
	const [empty, role, slug] = path.split("/");

	await store.dispatch(fetchPersonBySlug(slug));
	const person = store.getState().people[slug];

	if (person.isPlayer) {
		await store.dispatch(fetchPlayerStatYears(person._id));
		const years = _.keys(store.getState().people[slug].playerStats);
		if (years.length) {
			return store.dispatch(fetchPlayerStats(person._id, getInitialPlayerStatYear(years)));
		}
	}

	return null;
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchPersonBySlug, fetchPlayerStats, fetchPlayerStatYears }
	)(PersonPage),
	loadData
};
