import _ from "lodash";
import PropTypes from "prop-types";
import * as fieldTypes from "./formFieldTypes";

export const propTypes = {
	alterValuesBeforeSubmit: PropTypes.func,
	className: PropTypes.string,
	enableRedirectBoolean: PropTypes.bool,
	fastFieldByDefault: PropTypes.bool,
	fieldGroups: PropTypes.oneOfType([
		PropTypes.func,
		PropTypes.arrayOf(
			PropTypes.shape({
				label: PropTypes.string,
				fields: PropTypes.arrayOf(
					PropTypes.shape({
						name: PropTypes.string.isRequired,
						type: PropTypes.oneOf(_.values(fieldTypes))
					})
				),
				//IMPORTANT! Fields produced by render will not go through processFields
				render: PropTypes.func //values => <FieldArray />
			})
		)
	]).isRequired,
	initialValues: PropTypes.object.isRequired,
	isInitialValid: PropTypes.bool,
	isNew: PropTypes.bool.isRequired,
	itemType: PropTypes.string.isRequired,
	onDelete: PropTypes.func, // Action
	onReset: PropTypes.func,
	onSubmit: PropTypes.func.isRequired, //values => Action(id, values)
	promptOnExit: PropTypes.bool,
	readOnly: PropTypes.bool,
	redirectOnDelete: PropTypes.string,
	replaceResetButton: PropTypes.node,
	//Either a simple string, or a callback passing in form values and action result
	redirectOnSubmit: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
	submitButtonText: PropTypes.string,
	testMode: PropTypes.bool,
	useGrid: PropTypes.bool,
	useFormCard: PropTypes.bool,
	validationSchema: PropTypes.object.isRequired
};

export const defaultProps = {
	className: "",
	enableRedirectBoolean: false,
	fastFieldByDefault: true,
	isInitialValid: false,
	promptOnExit: true,
	readOnly: false,
	redirectOnDelete: `/admin/`,
	replaceResetButton: null,
	submitButtonText: null,
	testMode: false,
	useGrid: true,
	useFormCard: true
};
