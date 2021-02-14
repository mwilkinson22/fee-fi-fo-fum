//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

//Components
import BooleanSlider from "../../fields/BooleanSlider";
import LoadingPage from "../../LoadingPage";

class CalendarTeamTypeSelector extends Component {
	constructor(props) {
		super(props);

		const { initialShowAll, initialTeamTypes, teamTypes } = props;

		//Get selected team types from initialTeamTypes
		const selectedTeamTypes = _.mapValues(teamTypes, t => {
			if (initialTeamTypes) {
				return Boolean(initialTeamTypes.find(id => id == t._id));
			} else {
				return true;
			}
		});

		this.state = { selectedTeamTypes, showAll: initialShowAll };
	}

	handleNext() {
		const { onNext } = this.props;
		const { selectedTeamTypes, showAll } = this.state;

		//Convert selected team types to array
		const teamTypesAsArray = Object.keys(selectedTeamTypes).filter(id => selectedTeamTypes[id]);

		//Return to parent component state
		onNext(teamTypesAsArray, showAll);
	}

	renderList() {
		const { teamTypes } = this.props;
		const { selectedTeamTypes, showAll } = this.state;

		//Render list of team types
		const list = _.chain(teamTypes)
			.sortBy("sortOrder")
			.map(teamType => {
				//Get id and name
				const { _id, name } = teamType;

				//Create Change Event
				let changeEvent;
				if (showAll) {
					changeEvent = () => {};
				} else {
					changeEvent = () =>
						this.setState({
							selectedTeamTypes: {
								...selectedTeamTypes,
								[_id]: !selectedTeamTypes[_id]
							}
						});
				}

				//Render list item
				return (
					<li className={showAll ? "disabled" : ""} onClick={changeEvent} key={_id}>
						<BooleanSlider
							name={_id}
							value={selectedTeamTypes[_id]}
							onChange={changeEvent}
						/>
						<span>{name}</span>
					</li>
				);
			})
			.value();

		return [
			<ul key="list" className="clickable">
				<li onClick={() => this.setState({ showAll: !showAll })}>
					<BooleanSlider name="show-all" value={showAll} onChange={() => {}} />
					<span>Include all team types</span>
				</li>
				{list}
			</ul>
		];
	}

	renderButtons() {
		const { onBack } = this.props;
		const { selectedTeamTypes, showAll } = this.state;
		const disableButton = _.filter(selectedTeamTypes, _.identity).length === 0 && !showAll;
		return (
			<div className="buttons">
				<button type="button" onClick={onBack}>
					Back
				</button>
				<button
					className={disableButton ? "" : "confirm"}
					type="button"
					disabled={disableButton}
					onClick={() => this.handleNext()}
				>
					Next
				</button>
			</div>
		);
	}

	render() {
		const { isLoading } = this.state;

		//Wait for competitions
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<div>
				<p>First, select at least one team type from the list below</p>
				{this.renderList()}
				{this.renderButtons()}
			</div>
		);
	}
}

CalendarTeamTypeSelector.propTypes = {
	initialTeamTypes: PropTypes.array,
	initialShowAll: PropTypes.bool,
	onBack: PropTypes.func.isRequired,
	onNext: PropTypes.func.isRequired
};

CalendarTeamTypeSelector.defaultProps = {
	initialShowAll: true
};

function mapStateToProps({ teams }) {
	const { activeTeamType, teamTypes } = teams;
	return { activeTeamType, teamTypes };
}

export default connect(mapStateToProps)(CalendarTeamTypeSelector);
