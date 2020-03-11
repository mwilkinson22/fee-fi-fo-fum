//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

//Components
import HeadToHeadStatsTable from "./HeadToHeadStatsTable";

//Constants
import playerStatTypes from "~/constants/playerStatTypes";

class HeadToHeadStats extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { game } = nextProps;
		const newState = { game };
		return newState;
	}

	render() {
		const { game } = this.state;
		const statGroups = _.chain(playerStatTypes)
			.map((s, key) => ({ ...s, key }))
			.groupBy("type")
			.mapValues(arr => _.map(arr, "key"))
			.value();

		return (
			<section className="head-to-head">
				<h2>Head To Head</h2>
				<div className="container">
					{_.map(statGroups, (statTypes, type) => (
						<HeadToHeadStatsTable
							key={type}
							game={game}
							statTypes={statTypes}
							header={type}
						/>
					))}
				</div>
			</section>
		);
	}
}

HeadToHeadStats.propTypes = {
	game: PropTypes.object.isRequired
};

HeadToHeadStats.defaultProps = {};

function mapStateToProps({ config }) {
	const { localTeam } = config;
	return { localTeam };
}

export default connect(mapStateToProps)(HeadToHeadStats);
