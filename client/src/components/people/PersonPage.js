import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import PlayerStatsHelper from "../../helperClasses/PlayerStatsHelper";
import LoadingPage from "../LoadingPage";
import Parser from "html-react-parser";
// import { Link } from "react-router-dom";
import { personImagePath, layoutImagePath } from "../../extPaths";
import {
	fetchPersonBySlug,
	fetchPlayerStatYears,
	fetchPlayerStats
} from "../../actions/peopleActions";
import { fetchPlayerStatTypes } from "../../actions/statsActions";
import { Helmet } from "react-helmet";
import { localUrl } from "../../extPaths";
import "datejs";
import GameFilters from "../games/GameFilters";
import SingleStatBox from "../stats/SingleStatBox";

class PersonPage extends Component {
	constructor(props) {
		super(props);
		const { person, playerStatTypes, fetchPlayerStatTypes } = this.props;
		if (!playerStatTypes) {
			fetchPlayerStatTypes();
		}

		if (!person) {
			this.props.fetchPersonBySlug(this.props.match.params.slug);
		}

		this.state = { activeFilters: {} };
	}

	static getDerivedStateFromProps(newProps, prevState) {
		const newState = {};
		const { person } = newProps;

		if (!person) {
			return {};
		}

		//Handle playerStats
		if (person.playerStats) {
			//Active Year
			if (!prevState.playerStatYear) {
				newState.playerStatYear = _.chain(person.playerStats)
					.keys(person.playerStats)
					.map(Number)
					.max()
					.value();
			}
		}

		return newState;
	}

	getSocial() {
		const social = [];
		const { twitter, instagram } = this.props.person;
		if (twitter) {
			social.push(
				<a
					key="twitter"
					href={`https://www.twitter.com/${twitter}`}
					className="twitter"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img src={`${layoutImagePath}twitter.svg`} alt="Twitter Logo" />@{twitter}
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
					<img src={`${layoutImagePath}instagram.svg`} alt="Instagram Logo" />@{instagram}
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
		const { person } = this.props;
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
		const { person } = this.props;
		const { playerDetails } = person;
		const data = {};
		if (person.dateOfBirth) {
			const dob = new Date(person.dateOfBirth);
			const today = new Date();
			const age = Math.abs(today.getTime() - dob.getTime());

			data["Date of Birth"] = dob.toString("dS MMMM yyyy");
			data["Age"] = Math.floor(age / (1000 * 3600 * 24 * 365));
		}

		if (person.nickname) {
			data["AKA"] = person.nickname;
		}

		if (person._hometown) {
			const town = person._hometown;
			data["From"] = `${town.name}, ${town._country.name}`;
		}

		if (person._represents) {
			data["Represents"] = person._represents.name;
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
		const { person } = this.props;
		if (person.description) {
			return <div className="description">{Parser(person.description)}</div>;
		} else {
			return null;
		}
	}

	getPlayerStats() {
		const { person, fetchPlayerStatYears, fetchPlayerStats } = this.props;
		if (!person && !person.isPlayer) {
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
					value={this.state.playerStatYear}
					onChange={ev => this.setState({ playerStatYear: ev.target.value })}
				>
					{years.map(year => (
						<option key={year}>{year}</option>
					))}
				</select>
			);
		}
		const header = <h1>{yearSelector} Playing Stats</h1>;

		//Get Stats
		const games = person.playerStats[this.state.playerStatYear];
		const content = [];
		if (!games) {
			fetchPlayerStats(person._id, this.state.playerStatYear);
			content.push(<LoadingPage key="loading" />);
		} else {
			//Game Filters
			const filters = (
				<div className="container" key="filters">
					<GameFilters
						games={games}
						onFilterChange={activeFilters => this.setState(activeFilters)}
						activeFilters={this.state.activeFilters}
					/>
				</div>
			);
			content.push(filters);

			//Appearances

			//Stat Boxes
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
					.filter(
						key =>
							totalStats[key].total > 0 ||
							!this.props.playerStatTypes[key].moreIsBetter
					)
					.map(key => (
						<SingleStatBox key={key} statKey={key} statValues={totalStats[key]} />
					))
					.value();
				if (boxes.length) {
					return (
						<div key={header}>
							{header}
							<div className="single-stat-boxes">{boxes}</div>
						</div>
					);
				} else {
					return null;
				}
			});

			content.push(<div className="container">{statBoxes}</div>);
		}

		return (
			<section className="player-stats">
				{header}
				{content}
			</section>
		);
	}

	render() {
		const { person } = this.props;
		if (person) {
			return (
				<div className={`person-page`}>
					<Helmet>
						<title>
							{person.name.first} {person.name.last} - Fee Fi Fo Fum
						</title>
						<link
							rel="canonical"
							href={`${localUrl}/${person.isCoach ? "coaches" : "players"}/${
								person.slug
							}`}
						/>
					</Helmet>
					<section className="header">
						<div className="background" />
						<div className="container">
							<img
								className="image"
								src={`${personImagePath}${person.image}`}
								alt={`${person.name.first} ${person.name.last}`}
							/>
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
		} else {
			return <LoadingPage />;
		}
	}
}

function mapStateToProps({ people, stats }, ownProps) {
	const { slug } = ownProps.match.params;
	const { playerStatTypes } = stats;
	return { person: people[slug], playerStatTypes, ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchPersonBySlug, fetchPlayerStats, fetchPlayerStatYears, fetchPlayerStatTypes }
)(PersonPage);
