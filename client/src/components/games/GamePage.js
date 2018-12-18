import React, { Component } from "react";
import { connect } from "react-redux";

class GamePage extends Component {
	render() {
		return <h1>{this.props.match.params.slug}</h1>;
	}
}

function mapStateToProps() {
	return {};
}

export default connect(mapStateToProps)(GamePage);
