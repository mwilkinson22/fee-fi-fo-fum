const identityFields = {
	name: {
		long: { type: String, required: true },
		short: { type: String, required: true }
	},
	colours: {
		main: { type: String, required: true },
		trim1: { type: String, required: true },
		trim2: { type: String, required: true },
		text: { type: String, required: true },
		pitchColour: { type: String, default: null },
		statBarColour: { type: String, default: null }
	},
	hashtagPrefix: { type: String, required: true },
	images: {
		main: { type: String, required: true },
		light: { type: String, default: null },
		dark: { type: String, default: null }
	},
	nickname: { type: String, required: true },
	playerNickname: { type: String, default: null }
};

export default identityFields;
