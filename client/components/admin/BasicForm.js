//Modules
import { Component } from "react";

//Helpers
import { renderFieldGroup as rFG } from "~/helpers/formHelper";

export default class BasicForm extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	renderFieldGroup(fields, disableFastField = false) {
		const { validationSchema } = this.state;
		return rFG(fields, validationSchema, !disableFastField);
	}

	render() {
		return null;
	}
}
