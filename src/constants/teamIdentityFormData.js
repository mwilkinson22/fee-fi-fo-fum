import _ from "lodash";
import * as Yup from "yup";
import * as fieldTypes from "~/constants/formFieldTypes";

export default {
	validationSchema: {
		name: Yup.object().shape({
			long: Yup.string().required().label("Full Name"),
			short: Yup.string().required().label("Short Name")
		}),
		colours: Yup.object().shape({
			main: Yup.string().required().label("Main"),
			text: Yup.string().required().label("Text"),
			trim1: Yup.string().required().label("Trim 1"),
			trim2: Yup.string().required().label("Trim 2"),
			customPitchColour: Yup.boolean().label("Custom Pitch Colour?"),
			customStatBarColour: Yup.boolean().label("Custom Stat Bar Colour?"),
			pitchColour: Yup.string().label("Pitch"),
			statBarColour: Yup.string().label("Stat Bar")
		}),
		hashtagPrefix: Yup.string().required().length(3).label("Hashtag Prefix"),
		images: Yup.object().shape({
			main: Yup.string().required().label("Main"),
			light: Yup.string().label("Light Variant"),
			dark: Yup.string().label("Dark Variant")
		}),
		nickname: Yup.string().required().label("Nickname"),
		playerNickname: Yup.string().label("Single Player Nickname")
	},
	getInitialValues: currentValues => {
		const defaultValues = {
			name: {
				short: "",
				long: ""
			},
			nickname: "",
			playerNickname: "",
			hashtagPrefix: "",
			images: {
				main: "",
				light: "",
				dark: ""
			},
			colours: {
				main: "#BB0000",
				text: "#FFFFFF",
				trim1: "#FFFFFF",
				trim2: "#000000",
				pitchColour: "#BB0000",
				statBarColour: "#BB0000",
				customPitchColour: false,
				customStatBarColour: false
			}
		};

		if (currentValues == null) {
			return defaultValues;
		} else {
			return _.mapValues(defaultValues, (defaultValue, key) => {
				let value;
				switch (key) {
					//Handle nested objects
					case "name":
					case "images":
					case "colours":
						value = _.mapValues(currentValues[key], (currentValue, subkey) => {
							let value;

							switch (`${key}.${subkey}`) {
								//If null, default to main colour
								case `colours.pitchColour`:
								case `colours.statBarColour`:
									value = currentValue || currentValues.colours.main;
									break;

								default:
									value = currentValue;
							}

							return value != null ? value : defaultValue[subkey];
						});

						//We've looped through the team properties above, not the default values,
						//so we need to add in the custom colour booleans here
						value.customPitchColour = Boolean(currentValues.colours.pitchColour);
						value.customStatBarColour = Boolean(currentValues.colours.statBarColour);
						break;
					default:
						value = currentValues[key];
						break;
				}

				return value != null ? value : defaultValue;
			});
		}
	},
	getFieldGroups: (values, fieldPrefix = null, defaultImageUploadName = null) => {
		const setName = name => (fieldPrefix ? `${fieldPrefix}.${name}` : name);

		//Get Colour Fields
		const colourFields = [
			{ name: setName("colours.main"), type: fieldTypes.colour },
			{ name: setName("colours.text"), type: fieldTypes.colour },
			{ name: setName("colours.trim1"), type: fieldTypes.colour },
			{ name: setName("colours.trim2"), type: fieldTypes.colour }
		];

		//Add Stat Bar
		colourFields.push({
			name: setName("colours.customStatBarColour"),
			type: fieldTypes.boolean,
			fastField: false
		});
		if (values.colours.customStatBarColour) {
			colourFields.push({
				name: setName("colours.statBarColour"),
				type: fieldTypes.colour,
				fastField: false
			});
		}

		//Add Pitch Colour
		colourFields.push({
			name: setName("colours.customPitchColour"),
			type: fieldTypes.boolean,
			fastField: false
		});
		if (values.colours.customPitchColour) {
			colourFields.push({
				name: setName("colours.pitchColour"),
				type: fieldTypes.colour,
				fastField: false
			});
		}

		//Get Image field template
		const imageField = {
			type: fieldTypes.image,
			path: "images/teams/",
			acceptSVG: true,
			defaultUploadName: defaultImageUploadName,
			resize: {
				medium: { width: 80 },
				small: { height: 30 }
			}
		};

		return [
			{
				fields: [
					{ name: setName("name.long"), type: fieldTypes.text },
					{ name: setName("name.short"), type: fieldTypes.text },
					{ name: setName("nickname"), type: fieldTypes.text },
					{ name: setName("playerNickname"), type: fieldTypes.text },
					{ name: setName("hashtagPrefix"), type: fieldTypes.text }
				]
			},
			{
				label: "Colours",
				fields: colourFields
			},
			{
				label: "Images",
				fields: [
					{
						...imageField,
						name: setName("images.main")
					},
					{
						...imageField,
						name: setName("images.dark"),
						defaultUploadName: imageField.defaultUploadName + "-dark"
					},
					{
						...imageField,
						name: setName("images.light"),
						defaultUploadName: imageField.defaultUploadName + "-light"
					}
				]
			}
		];
	},
	alterValuesBeforeSubmit: values => {
		if (!values.colours.customPitchColour) {
			values.colours.pitchColour = null;
		}
		if (!values.colours.customStatBarColour) {
			values.colours.statBarColour = null;
		}

		delete values.colours.customStatBarColour;
		delete values.colours.customPitchColour;
	}
};
