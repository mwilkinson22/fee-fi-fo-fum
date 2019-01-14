import React, { Component } from "react";
import { connect } from "react-redux";

class SingleStatBox extends Component {
	render() {
		const { statKey, statValues, statType } = this.props;
		const { total, average, best } = statValues;
		const { singular, plural, unit } = statType;
		const rootClassName = "single-stat-box card";
		switch (statKey) {
			case "TS":
			case "KS":
				return (
					<div className={`${rootClassName} percentage`}>
						<svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
							<circle
								className="donut-ring"
								cx="21"
								cy="21"
								r="15.91549430918954"
								fill="transparent"
								stroke="#d2d3d4"
								strokeWidth="3"
							/>
							<circle
								className="donut-segment"
								cx="21"
								cy="21"
								r="15.91549430918954"
								fill="transparent"
								strokeWidth="3"
								strokeDasharray={`${total} ${100 - total}`}
								strokeDashoffset="25"
							/>
							<text className="total" x="50%" y="57%">
								{total}%
							</text>
						</svg>
						<div className="name">{singular}</div>
					</div>
				);
			default:
				return (
					<div className={`${rootClassName}`}>
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
}

function mapStateToProps({ stats }, ownProps) {
	const { playerStatTypes } = stats;
	return { ...ownProps, statType: playerStatTypes[ownProps.statKey] };
}

export default connect(mapStateToProps)(SingleStatBox);
