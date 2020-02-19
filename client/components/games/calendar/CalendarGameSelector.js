//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

//Components
import BooleanField from "../../admin/fields/Boolean";
import LoadingPage from "../../LoadingPage";

class CalendarGameSelector extends Component {
	constructor(props) {
		super(props);

		const { competitions, gameList, initialGames } = props;

		//Create an object of the games
		const games = _.chain(gameList)
			.filter(g => g.date > new Date() && competitions.find(c => c == g._competition))
			.map(g => {
				let selectedByDefault;
				if (initialGames) {
					//If initialGames is passed in, check to see
					//if this competition has been added in
					selectedByDefault = Boolean(initialGames.find(id => id == g._id));
				} else {
					//Otherwise, we just select everything
					selectedByDefault = true;
				}

				return [g._id, selectedByDefault];
			})
			.fromPairs()
			.value();

		//Check the games object to see if we can check "selectAll" by default
		const selectAll = !_.reject(games, _.identity).length;

		//Set State
		this.state = { games, selectAll };
	}

	handleNext() {
		const { onNext } = this.props;
		const { games, selectAll } = this.state;

		//Filter out selected competitions
		const selectedGames = _.chain(games)
			.map((val, id) => (val || selectAll ? id : null))
			.filter(_.identity)
			.value();

		//Return to parent component state
		onNext(selectedGames);
	}

	renderList() {
		const { competitionSegmentList, gameList, teamList } = this.props;
		const { games } = this.state;

		return (
			_.chain(games)
				//Map to game object
				.map((val, id) => gameList[id])
				//Group By Competition
				.groupBy("_competition")
				//Convert to collection
				.map((gamesByComp, _competition) => ({
					gamesByComp,
					competition: competitionSegmentList[_competition]
				}))
				//Order groups by competition name
				.sortBy(({ competition }) => competition.name)
				//Render to JSX
				.map(({ competition, gamesByComp }) => {
					//Create Header
					const teamTypeHeader = <h6 key={competition._id}>{competition.basicTitle}</h6>;

					//List Competitions
					const list = _.chain(gamesByComp)
						//Sort By Date
						.sortBy("date")
						//Convert to li elements
						.map(g => {
							const changeEvent = () =>
								this.setState({
									games: {
										...games,
										[g._id]: !games[g._id]
									}
								});
							return (
								<li key={g._id} onClick={changeEvent}>
									<BooleanField
										name={g._id}
										value={games[g._id]}
										onChange={() => {}}
									/>
									<span>
										{teamList[g._opposition].name.short}{" "}
										{g.date.toString("dS MMMM")}
									</span>
								</li>
							);
						})
						.value();

					return [
						teamTypeHeader,
						<ul key="list" className="clickable">
							{list}
						</ul>
					];
				})
				.value()
		);
	}

	renderButtons() {
		const { games, selectAll } = this.state;
		const disableButton = !selectAll && _.filter(games, _.identity).length === 0;
		return (
			<div className="buttons" key="buttons">
				<button type="button" onClick={() => this.props.onBack()}>
					Back
				</button>
				<button type="button" disabled={disableButton} onClick={() => this.handleNext()}>
					Next
				</button>
			</div>
		);
	}

	render() {
		const { isLoading, selectAll } = this.state;

		//Wait for games
		if (isLoading) {
			return <LoadingPage />;
		}

		return [
			<ul key="select-all">
				<li onClick={() => this.setState({ selectAll: !selectAll })}>
					<BooleanField name="select-all" onChange={() => {}} value={selectAll} />
					<span>Include all games</span>
				</li>
			</ul>,
			<div className={`scrollable ${selectAll ? "disabled" : ""}`} key="game-list">
				{this.renderList()}
			</div>,
			this.renderButtons()
		];
	}
}

CalendarGameSelector.propTypes = {
	competitions: PropTypes.array,
	initialGames: PropTypes.array,
	onBack: PropTypes.func.isRequired,
	onNext: PropTypes.func.isRequired
};

function mapStateToProps({ competitions, games, teams }) {
	const { competitionSegmentList } = competitions;
	const { gameList } = games;
	const { teamList, teamTypes } = teams;
	return { competitionSegmentList, gameList, teamList, teamTypes };
}

export default connect(mapStateToProps)(CalendarGameSelector);
