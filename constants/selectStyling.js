export default {
	option: (provided, state) => ({
		...provided,
		background: state.isSelected ? "#751432" : state.isFocused ? "#7514324d" : "transparent",
		":active": {
			backgroundColor: "#7514324d"
		}
	}),
	control: (provided, state) => ({
		...provided,
		borderColor: state.isFocused || state.isSelected ? "#751432" : "#DDD",
		boxShadow: "transparent",
		"&:hover": {
			borderColor: "#751432"
		},
		"&:not(:focus):hover": {
			borderColor: "#BBB"
		}
	}),
	menu: provided => ({
		...provided,
		zIndex: 20
	})
};
