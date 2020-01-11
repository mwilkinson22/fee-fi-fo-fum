import React, { Component } from "react";
import PropTypes from "prop-types";

class Countdown extends Component {
	constructor(props) {
		super(props);
		this.state = this.getCountdownValues();
		this.interval = setInterval(() => {
			this.setState(this.getCountdownValues());
		}, 1000);
	}

	componentWillUnmount() {
		clearInterval(this.interval);
	}

	getCountdownValues() {
		const timeDiff = this.props.date - Date.parse(new Date());
		if (timeDiff < 0) {
			clearInterval(this.interval);
			if (this.props.onFinish) {
				this.props.onFinish();
			}
		}

		return {
			seconds: this.addLeadingZeroes(Math.floor(timeDiff / 1000) % 60),
			minutes: this.addLeadingZeroes(Math.floor(timeDiff / 1000 / 60) % 60),
			hours: this.addLeadingZeroes(Math.floor(timeDiff / 1000 / 60 / 60) % 24),
			days: this.addLeadingZeroes(Math.floor(timeDiff / 1000 / 60 / 60 / 24))
		};
	}

	addLeadingZeroes(num) {
		return num < 10 ? "0" + num.toString() : num.toString();
	}

	render() {
		const elements = [];

		//Don't show 0 days, etc
		let valueFound = false;
		["Days", "Hours", "Minutes", "Seconds"].forEach(segment => {
			const value = this.state[segment.toLowerCase()] || null;

			if (Number(value)) {
				valueFound = true;
			} else if (!valueFound) {
				return false;
			}

			elements.push(
				<span className="group" key={segment}>
					<span
						className="value"
						style={{
							backgroundColor: this.props.background,
							color: this.props.colour
						}}
					>
						{value}
					</span>
					<span className="label">{segment}</span>
				</span>
			);
		});

		return <span className="game-countdown">{elements}</span>;
	}
}

Countdown.propTypes = {
	background: PropTypes.string,
	colour: PropTypes.string,
	date: PropTypes.instanceOf(Date).isRequired,
	onFinish: PropTypes.func
};

Countdown.defaultProps = {
	background: "#751432",
	colour: "#FFFFFF"
};

export default Countdown;
