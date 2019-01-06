import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../LoadingPage";
// import { Link } from "react-router-dom";
// import { personImagePath } from "../../extPaths";
import { fetchPersonBySlug } from "../../actions/peopleActions";

class PersonCard extends Component {
	constructor(props) {
		super(props);
		const { person } = this.props;
		if (!person) {
			this.props.fetchPersonBySlug(this.props.match.params.slug);
		}
	}

	render() {
		const { person } = this.props;
		if (person) {
			return "Hi";
		} else {
			return <LoadingPage />;
		}
	}
}

function mapStateToProps({ people }, ownProps) {
	const { slug } = ownProps.match.params;
	return { person: people[slug], ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchPersonBySlug }
)(PersonCard);
