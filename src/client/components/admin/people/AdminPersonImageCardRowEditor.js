//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import BasicForm from "~/client/components/admin/BasicForm";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Actions
import { fetchPersonImageCard, postPersonImageCard } from "~/client/actions/peopleActions";

class AdminPersonImageCardRowEditor extends Component {
	constructor(props) {
		super(props);

		const { mainColour, trimColour } = props;

		//Create Options
		const options = {};
		options.colour = [
			{ label: "White", value: "#FFFFFF" },
			{ label: "Black", value: "#000000" },
			{ label: "Main", value: mainColour },
			{ label: "Trim", value: trimColour }
		];
		options.font = [
			{ label: "Monstro", value: "Monstro" },
			{ label: "Montserrat", value: "Montserrat Semibold" },
			{ label: "Montserrat Bold", value: "Montserrat Bold" }
		];

		//Create initial state
		this.state = { options };
	}

	getFieldGroups(values) {
		const { enforceSize } = this.props;
		const { options } = this.state;
		//Here we return an array of objects. One contains the core fields, the other has the colour buttons
		const nestedFieldGroups = values.segments.map((segment, i) => {
			const rootName = `segments.${i}`;

			//Construct Fields
			const fields = [
				{ name: `${rootName}.text`, type: fieldTypes.text },
				{ name: `${rootName}.font`, type: fieldTypes.radio, options: options.font }
			];
			if (!enforceSize) {
				fields.push({ name: `${rootName}.size`, type: fieldTypes.number });
			}
			fields.push({ name: `${rootName}.colour`, type: fieldTypes.colour });

			//Return array
			return [
				{ label: `Segment ${i + 1}`, fields },
				{
					render: (values, formik) => {
						const buttons = options.colour.map(({ label, value }) => (
							<button
								type="button"
								key={label}
								onClick={() => formik.setFieldValue(`${rootName}.colour`, value)}
							>
								{label}
							</button>
						));

						return <div className="buttons colour-buttons">{buttons}</div>;
					}
				},
				{
					fields: [
						{
							name: "segments",
							type: fieldTypes.fieldArray,
							render: ({ move, remove }) => {
								const content = [];
								if (values.segments.length > 1) {
									const buttons = [
										<button
											key="move-up"
											onClick={() => move(i, i - 1)}
											disabled={i === 0}
											type="button"
										>
											&#9650;
										</button>,
										<button
											key="move-down"
											onClick={() => move(i, i + 1)}
											disabled={i === values.segments.length - 1}
											type="button"
										>
											&#9660;
										</button>,
										<button key="delete" className="delete" type="button" onClick={() => remove(i)}>
											Delete
										</button>
									];
									content.unshift(
										<div key="buttons" className="full-span">
											{buttons}
										</div>
									);
								}

								content.push(<hr key="divider" />);

								return content;
							}
						}
					]
				}
			];
		});

		//We then flatten these nested values
		const fieldGroups = _.flatten(nestedFieldGroups);

		//And finally include an "add" button
		fieldGroups.push({
			fields: [
				{
					name: "segments",
					type: fieldTypes.fieldArray,
					render: ({ push }) => {
						let newSegmentValues = {};
						if (values.segments.length) {
							newSegmentValues = values.segments[values.segments.length - 1];
						}
						return (
							<div className="buttons" key="add-button">
								<button type="button" onClick={() => push(this.getNewSegmentValues(newSegmentValues))}>
									Add Segment
								</button>
							</div>
						);
					}
				}
			]
		});
		return fieldGroups;
	}

	getNewSegmentValues(overwriteValues = {}) {
		const { options } = this.state;

		return {
			size: 20,
			font: options.font[0].value,
			colour: options.colour[0].value,
			...overwriteValues,
			text: "" //We always want blank text to be returned
		};
	}

	render() {
		const { discardButton, initialValues, onSubmit, rowNumber } = this.props;

		//Get initial values
		const segments = initialValues;
		if (!segments.length) {
			segments.push(this.getNewSegmentValues());
		}

		const validationSchema = Yup.object().shape({
			segments: Yup.array()
				.of(
					Yup.object().shape({
						text: Yup.string()
							.required()
							.label("Text"),
						font: Yup.string()
							.required()
							.label("Font"),
						size: Yup.number()
							.required()
							.label("Size"),
						colour: Yup.string()
							.required()
							.label("Colour")
					})
				)
				.min(1)
		});

		return (
			<div className="row-editor">
				<div className="form-card">
					<h6>{rowNumber ? `Edit Row ${rowNumber}` : "Add New Row"}</h6>
				</div>
				<BasicForm
					fieldGroups={values => this.getFieldGroups(values)}
					initialValues={{ segments }}
					isInitialValid={true}
					itemType={"Row"}
					isNew={!rowNumber}
					onSubmit={({ segments }) => onSubmit(segments)}
					replaceResetButton={discardButton}
					useTwoColumnGrid={true}
					validationSchema={validationSchema}
				/>
			</div>
		);
	}
}

AdminPersonImageCardRowEditor.propTypes = {
	discardButton: PropTypes.node.isRequired,
	enforceSize: PropTypes.number,
	onSubmit: PropTypes.func.isRequired,
	initialValues: PropTypes.arrayOf(
		PropTypes.shape({
			text: PropTypes.string.isRequired,
			font: PropTypes.string.isRequired,
			colour: PropTypes.string.isRequired,
			size: PropTypes.number.isRequired
		})
	).isRequired,
	rowNumber: PropTypes.number
};

function mapStateToProps({ config }) {
	const { mainColour, trimColour } = config;
	return { mainColour, trimColour };
}

export default connect(mapStateToProps, { fetchPersonImageCard, postPersonImageCard })(AdminPersonImageCardRowEditor);
