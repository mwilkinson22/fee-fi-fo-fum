import React, { Component } from "react";
import { connect } from "react-redux";

class SingleStatBox extends Component {
	componentDidMount() {}

	static getDerivedStateFromProps(nextProps, prevState) {}

	render() {
		const { statValues, statType } = this.props;
		const { total, average, best } = statValues;
		const { singular, plural, unit } = statType;

		return (
			<div className="single-stat-box card">
				<div className="total">
					{total}
					{unit}
				</div>
				<div className="name">{total === 1 ? singular : plural}</div>
				<div className="average">
					Average per game: {average.toFixed(2)}
					{unit}
				</div>
				<div className="best">
					Best game: {best}
					{unit}
				</div>
			</div>
		);
	}
}

function mapStateToProps({ stats }, ownProps) {
	const { playerStatTypes } = stats;
	return { ...ownProps, statType: playerStatTypes[ownProps.statKey] };
}

export default connect(mapStateToProps)(SingleStatBox);
