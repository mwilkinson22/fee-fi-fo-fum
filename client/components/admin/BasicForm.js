//Modules
import _ from "lodash";
import { Component } from "react";
import PropTypes from "prop-types";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { renderFieldGroup as rFG } from "~/helpers/formHelper";

class BasicForm extends Component {
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

BasicForm.propTypes = {
	fastFieldByDefault: PropTypes.bool,
	fieldGroups: PropTypes.arrayOf(
		PropTypes.shape({
			label: PropTypes.string,
			fields: PropTypes.arrayOf(
				PropTypes.shape({
					name: PropTypes.string.isRequired,
					type: PropTypes.oneOf(_.values(fieldTypes))
				})
			).isRequired
		})
	).isRequired,
	itemType: PropTypes.string.isRequired,
	initialValues: PropTypes.object.isRequired,
	onSubmit: PropTypes.func.isRequired, //values => Action(id, values)
	onDelete: PropTypes.func, // Action
	//Either be a simple string, or a callback passing in form values and action result
	redirectOnSubmit: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
	redirectOnDelete: PropTypes.string,
	validationSchema: PropTypes.object().isRequired
};

BasicForm.defaultProps = {
	fastFieldByDefault: true,
	redirectOnDelete: `/admin/`
};

export default BasicForm;
