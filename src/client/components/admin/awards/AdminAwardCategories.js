//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Select from "react-select";

//Components
import AdminAwardCategoryForm from "./AdminAwardCategoryForm";
import LoadingPage from "../../LoadingPage";

//Constants
import selectStyling from "~/constants/selectStyling";
import playerStatTypes from "~/constants/playerStatTypes";

//Actions
import { fetchGameListByYear } from "~/client/actions/gamesActions";
import { fetchTeam } from "~/client/actions/teamsActions";

class AdminAwardCategories extends Component {
	constructor(props) {
		super(props);

		const { fetchGameListByYear, fullTeams, localTeam, fetchTeam, match, awardsList, gameYears } = props;

		if (!fullTeams[localTeam].fullData) {
			fetchTeam(localTeam, "full");
		}

		//Get the current award (i.e. the current year's award group)
		const award = awardsList[match.params._id];

		if (gameYears[award.year] === false) {
			fetchGameListByYear(award.year);
		}
		this.state = { award };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { match, fullTeams, localTeam, gameList, gameYears, teamTypes, teamList } = nextProps;
		const { award } = prevState;
		const { categoryId } = match.params;
		const newState = { isLoading: false, isNew: false };

		//Wait on games and local squad
		if (gameYears[award.year] === false || !fullTeams[localTeam].fullData) {
			newState.isLoading = true;
			return newState;
		}

		//Get the current category
		if (award && categoryId) {
			if (categoryId === "new") {
				newState.isNew = true;
				newState.category = undefined;
			} else {
				newState.category = award.categories.find(c => c._id == categoryId) || false;
			}
		} else {
			//Either an invalid category, or (more likely) /awards/:_id/categories
			//For the former, we handle 404 in the render method
			newState.category = undefined;
		}

		//Render the options for the form
		//We do this here to prevent the same logic being repeated on category change
		if (gameList && !prevState.options) {
			newState.options = {};

			//Get Stats
			//A list of all stats, grouped by stat type (scoring/attack/defence)
			newState.options.stats = _.chain(playerStatTypes)
				.mapValues((stat, value) => ({
					value,
					label: stat.plural,
					group: stat.type
				}))
				.groupBy("group")
				.map((options, label) => ({ label, options: _.sortBy(options, "label") }))
				.value();

			//A simple list of players across all squads, including those
			//signed for the following year (for "most anticipated")
			const squads = fullTeams[localTeam].squads.filter(s => s.year == award.year || s.year == award.year + 1);
			newState.options.player = _.chain(squads)
				.map("players")
				.flatten()
				.map("_player")
				.uniqBy("_id")
				.map(({ name, _id }) => ({ label: name.full, value: _id }))
				.sortBy("label")
				.value();

			//A list of all games, grouped by team type
			newState.options.game = _.chain(gameList)
				.filter(g => g.date.getFullYear() == award.year)
				.orderBy([({ _teamType }) => teamTypes[_teamType].sortOrder, "date"])
				.map(game => {
					const labelArr = [];
					//Add Date
					labelArr.push(game.date.toString("dS MMMM") + " -");
					//Add Opposition
					labelArr.push(teamList[game._opposition].name.short);
					//Add Venue
					labelArr.push("(" + (game.isAway ? "A" : "H") + ")");
					return {
						label: labelArr.join(" "),
						value: game._id,
						group: teamTypes[game._teamType].name
					};
				})
				.groupBy("group")
				.map((options, label) => ({ options, label }))
				.value();
		}

		return newState;
	}

	renderCategorySelect() {
		let { award, category, isNew } = this.state;

		//New category creation
		const options = [{ label: "Add a category", value: "new" }];

		//Pull dropdown options from current categories
		award.categories.forEach(c => {
			options.push({ label: c.name, value: c._id });
		});

		//Display currently selected category
		let currentValue;
		if (isNew) {
			currentValue = "new";
		} else if (category) {
			currentValue = category._id;
		}

		return (
			<Select
				styles={selectStyling}
				options={options}
				isSearchable={false}
				onChange={({ value }) => this.props.history.replace(`/admin/awards/${award._id}/categories/${value}`)}
				value={options.find(({ value }) => value == currentValue)}
			/>
		);
	}

	render() {
		const { isNew, award, category, isLoading, options } = this.state;

		//Await dependencies
		if (isLoading) {
			return <LoadingPage />;
		}

		//Only show a form if something is selected
		let content;
		if (category || isNew) {
			content = <AdminAwardCategoryForm award={award} category={category} options={options} />;
		}

		return (
			<div className="container">
				<div className="form-card">{this.renderCategorySelect()}</div>
				{content}
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ awards, config, games, teams }) {
	const { awardsList } = awards;
	const { localTeam } = config;
	const { gameList, gameYears } = games;
	const { fullTeams, teamList, teamTypes } = teams;
	return { awardsList, localTeam, gameList, gameYears, fullTeams, teamList, teamTypes };
}
// export default form;
export default withRouter(connect(mapStateToProps, { fetchGameListByYear, fetchTeam })(AdminAwardCategories));
