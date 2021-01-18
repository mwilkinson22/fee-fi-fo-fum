//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import LoadingPage from "../../LoadingPage";
import Table from "../../Table";

//Actions
import { fetchGameListByYear } from "~/client/actions/gamesActions";
import { fetchPeopleList } from "~/client/actions/peopleActions";

// noinspection JSCheckFunctionSignatures
class AdminAwardVotes extends Component {
	constructor(props) {
		super(props);
		const {
			awardsList,
			match,
			fetchGameListByYear,
			peopleList,
			fetchPeopleList,
			gameYears
		} = props;

		//Get Award
		const award = awardsList[match.params._id];

		//Define Columns
		const columns = [
			{ key: "nominee", label: "Nominee" },
			{ key: "votes", label: "Votes" },
			{ key: "pc", label: "%" }
		];

		//Work out if we need to load games
		const gameCategories = award.categories.filter(c => c.awardType == "game");

		if (gameCategories.length && gameYears[award.year] === false) {
			fetchGameListByYear(award.year);
		}

		//Work out if we need to load people
		const peopleCategories = award.categories.filter(c => c.awardType == "game");

		if (peopleCategories.length && !peopleList) {
			fetchPeopleList();
		}

		this.state = { award, columns, gameCategories, peopleCategories };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { award, gameCategories, peopleCategories } = prevState;
		const { gameYears, peopleList } = nextProps;

		const newState = { isLoading: false };

		if (
			(gameCategories.length && gameYears[award.year] === false) ||
			(peopleCategories.length && !peopleList)
		) {
			newState.isLoading = true;
		}

		return newState;
	}

	renderCategory(category) {
		const { award, columns } = this.state;
		const { peopleList, teamList, gameList } = this.props;
		const votes = _.chain(award.votes)
			.map("choices")
			.flatten()
			.filter(c => c.categoryId == category._id)
			.value();

		let content;
		if (votes.length) {
			const rows = _.chain(votes)
				.groupBy("choice")
				.map((arr, key) => {
					let nominee = key;
					switch (category.awardType) {
						case "game": {
							const game = gameList[key];
							const team = teamList[game._opposition];
							nominee = `${team.name.short} ${game.date.toString("dS MMMM")}`;
							break;
						}
						case "player": {
							const { name } = peopleList[key];
							nominee = `${name.first} ${name.last}`;
							break;
						}
					}

					return {
						key,
						data: {
							nominee,
							votes: arr.length,
							pc: Math.round((arr.length / votes.length) * 10000) / 100 + "%"
						}
					};
				})
				.value();
			content = (
				<Table
					rows={rows}
					columns={columns}
					defaultSortable={false}
					sortBy={{ key: "votes", asc: false }}
				/>
			);
		} else {
			content = <p>No votes to display</p>;
		}

		return (
			<div key={category._id} className="form-card">
				<h6>{category.name}</h6>
				{content}
			</div>
		);
	}

	render() {
		const { isLoading } = this.state;
		if (isLoading) {
			return <LoadingPage />;
		} else {
			return (
				<div className="container">
					{this.state.award.categories.map(c => this.renderCategory(c))}
				</div>
			);
		}
	}
}

function mapStateToProps({ awards, games, people, teams }) {
	const { awardsList } = awards;
	const { gameList, gameYears } = games;
	const { peopleList } = people;
	const { teamList } = teams;
	return { awardsList, gameList, gameYears, peopleList, teamList };
}

export default connect(mapStateToProps, { fetchGameListByYear, fetchPeopleList })(AdminAwardVotes);
