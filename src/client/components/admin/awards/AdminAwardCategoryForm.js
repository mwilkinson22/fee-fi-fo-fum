//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { FieldArray } from "formik";
import { withRouter } from "react-router-dom";
import * as Yup from "yup";

//Actions
import { addCategory, updateCategory, deleteCategory } from "~/client/actions/awardActions";

//Components
import BasicForm from "../BasicForm";
import DeleteButtons from "../../fields/DeleteButtons";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminAwardCategories extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		//Check for URL update
		const newState = _.pick(nextProps, ["award", "category"]);

		//Get validation schema
		const validationSchema = {
			name: Yup.string().required().label("Name"),
			awardType: Yup.string().required().label("Type"),
			description: Yup.string().label("Description"),
			nominees: Yup.array()
				.of(
					Yup.object().shape({
						description: Yup.string().label("Description"),
						nominee: Yup.string().required().label("Nominee"),
						stats: Yup.array().of(Yup.string()).label("Stats")
					})
				)
				.min(2, "Please provide at least two nominees")
		};

		newState.validationSchema = Yup.object().shape(validationSchema);
		return newState;
	}

	getInitialValues() {
		const { category } = this.state;

		const defaultValues = {
			name: "",
			awardType: "",
			description: "",
			nominees: [
				{ description: "", nominee: "", stats: [] },
				{ description: "", nominee: "", stats: [] }
			]
		};
		if (!category) {
			return defaultValues;
		} else {
			return _.mapValues(defaultValues, (defaultValue, key) => category[key] || defaultValue);
		}
	}

	getFieldGroups(values) {
		//If the award type isn't set yet, we do so before defining the fields
		if (!values.awardType) {
			return [
				{
					fields: [
						{
							name: "awardType",
							type: fieldTypes.radio,
							options: [
								{ label: "Game", value: "game" },
								{ label: "Player", value: "player" },
								{ label: "Custom", value: "custom" }
							]
						}
					]
				}
			];
		}

		//Main Category Fields
		const mainFieldGroup = {
			fields: [
				{ name: "name", type: fieldTypes.text },
				{ name: "description", type: fieldTypes.textarea }
			]
		};

		//Get all the current nominees
		const nomineeGroups = this.getNomineeFields(values);

		//And finally a group to add new nominees
		const addNomineeGroup = {
			render: () => (
				<FieldArray name="nominees" key="add-nominee">
					{({ push }) => [
						<div className="buttons" key="buttons">
							<button type="button" onClick={() => push({ description: "", nominee: "" })}>
								Add Nominee
							</button>
						</div>,
						<hr key="hr" />
					]}
				</FieldArray>
			)
		};

		return [mainFieldGroup, ...nomineeGroups, addNomineeGroup];
	}

	getNomineeFields(values) {
		const { options } = this.props;
		const { awardType, nominees } = values;
		//Create a standard, reusable field to
		//select each nominee
		const nomineeField = {};

		if (awardType == "custom") {
			nomineeField.type = fieldTypes.text;
		} else {
			nomineeField.type = fieldTypes.select;

			if (awardType == "game") {
				nomineeField.isNested = true;
			}

			nomineeField.options = options[awardType];
		}

		//Each nominee is rendered as two 'groups',
		//one for main fields, one for the FieldArray
		//and then we flatten the result
		return _.flatten(
			nominees.map((nominee, i) => {
				//Name of the value object
				//in which other fields are contained
				const baseName = `nominees.${i}`;

				//Nominee selector & description
				const fields = [
					{ name: `${baseName}.nominee`, ...nomineeField },
					{ name: `${baseName}.description`, type: fieldTypes.textarea, rows: 3 }
				];

				//Stats field, when necessary
				if (awardType !== "custom") {
					fields.push({
						name: `${baseName}.stats`,
						type: fieldTypes.select,
						options: options.stats,
						isMulti: true,
						isNested: true
					});
				}

				//Render array fields
				const arrayFields = this.renderArrayFields(i, nominees);

				//Return field groups
				return [
					{
						label: `Nominee ${i + 1}`,
						fields
					},
					{
						render: () => arrayFields
					}
				];
			})
		);
	}

	renderArrayFields(i, nominees) {
		return [
			<FieldArray key={`array-fields-${i}`} name="nominees">
				{({ move, remove }) => [
					<div key="move" className="move-buttons">
						<button
							type="button"
							className="down"
							disabled={i == nominees.length - 1}
							onClick={() => move(i, i + 1)}
						>
							&#9660;
						</button>
						<button type="button" className="up" disabled={i == 0} onClick={() => move(i, i - 1)}>
							&#9650;
						</button>
					</div>,
					<DeleteButtons key="delete" onDelete={() => remove(i)} deleteText="Remove Nominee" />
				]}
			</FieldArray>,

			<hr key={`hr${i}`} />
		];
	}

	render() {
		const { addCategory, updateCategory, deleteCategory } = this.props;
		const { award, category, validationSchema } = this.state;

		//Handle props specifically for create/update
		let formProps;
		if (category) {
			formProps = {
				onDelete: () => deleteCategory(award._id, category._id),
				onSubmit: values => updateCategory(award._id, category._id, values),
				redirectOnDelete: `/admin/awards/${award._id}/categories`
			};
		} else {
			formProps = {
				onSubmit: values => addCategory(award._id, values),
				redirectOnSubmit: id => `/admin/awards/${award._id}/categories/${id}`
			};
		}

		return (
			<div className="container">
				<BasicForm
					fieldGroups={values => this.getFieldGroups(values)}
					initialValues={this.getInitialValues()}
					isNew={!category}
					itemType="Category"
					validationSchema={validationSchema}
					{...formProps}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ awards }) {
	const { awardsList } = awards;
	return { awardsList };
}
// export default form;
export default withRouter(
	connect(mapStateToProps, { addCategory, updateCategory, deleteCategory })(AdminAwardCategories)
);
