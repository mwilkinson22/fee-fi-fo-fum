//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import Select from "react-select";

//Components
import AdminAwardCategoryForm from "./AdminAwardCategoryForm";
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";

//Constants
import selectStyling from "~/constants/selectStyling";
import playerStatTypes from "~/constants/playerStatTypes";

//Actions
import { fetchGameList } from "~/client/actions/gamesActions";

class AdminAwardCategories extends BasicForm {
	constructor(props) {
		super(props);

		const { gameList, fetchGameList } = props;

		if (!gameList) {
			fetchGameList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const {
			awardsList,
			match,
			location,
			fullTeams,
			localTeam,
			gameList,
			teamTypes,
			teamList
		} = nextProps;
		const { _id, categoryId } = match.params;

		const newState = { isNew: false };
		newState.award = awardsList[_id];

		//Clear out redirect
		if (prevState.redirect && prevState.redirect == location.pathname) {
			newState.redirect = null;
		}

		if (newState.award && categoryId) {
			if (categoryId === "new") {
				newState.isNew = true;
				newState.category = undefined;
			} else {
				newState.category =
					newState.award.categories.find(c => c._id == categoryId) || false;
			}
		} else {
			newState.category = undefined;
		}

		if (gameList && !prevState.options) {
			newState.options = {};

			//Get Stats
			newState.options.stats = _.chain(playerStatTypes)
				.mapValues((stat, value) => ({
					value,
					label: stat.plural,
					group: stat.type
				}))
				.groupBy("group")
				.map((options, label) => ({ label, options: _.sortBy(options, "label") }))
				.value();

			//Get Player Options
			const squads = fullTeams[localTeam].squads.filter(
				s => s.year == newState.award.year || s.year == newState.award.year + 1
			);
			newState.options.player = _.chain(squads)
				.map("players")
				.flatten()
				.map("_player")
				.uniqBy("_id")
				.map(({ name, _id }) => ({ label: name.full, value: _id }))
				.sortBy("label")
				.value();

			//Get Game Options
			newState.options.game = _.chain(gameList)
				.filter(g => g.date.getFullYear() == newState.award.year)
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

	getDefaults() {
		const { award } = this.state;

		//Set basics for new teams:
		let defaults = {};

		if (award) {
			defaults = _.mapValues(defaults, (val, key) => {
				switch (key) {
					default:
						return award[key] || "";
				}
			});
		}

		return defaults;
	}

	renderCategorySelect() {
		const { award, category, isNew } = this.state;
		const options = [{ label: "Add a category", value: "new" }];
		award.categories.forEach(c => {
			options.push({ label: c.name, value: c._id });
		});

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
				onChange={({ value }) =>
					this.setState({ redirect: `/admin/awards/${award._id}/categories/${value}` })
				}
				value={options.find(({ value }) => value == currentValue)}
			/>
		);
	}

	render() {
		const { isNew, award, category, redirect, options } = this.state;

		if (redirect) {
			return <Redirect to={redirect} />;
		}

		let content;
		if (category || isNew) {
			content = options ? (
				<AdminAwardCategoryForm award={award} category={category} options={options} />
			) : (
				<LoadingPage />
			);
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
	const { gameList } = games;
	const { fullTeams, teamList, teamTypes } = teams;
	return { awardsList, localTeam, gameList, fullTeams, teamList, teamTypes };
}
// export default form;
export default connect(
	mapStateToProps,
	{ fetchGameList }
)(AdminAwardCategories);
