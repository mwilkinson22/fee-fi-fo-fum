import React from "react";

const LinkIcon = ({ internal }) => {
	let arrowPoints = internal
		? "11.418,12.874 16.556,12.871 14.695,11.012 22.705,3.002 21.291,1.588 13.281,9.598 11.421,7.737 "
		: "22.705,1.588 17.567,1.59 19.428,3.45 11.418,11.46 12.832,12.874 20.842,4.864 22.702,6.725 ";

	return (
		<svg width="24" height="24" viewBox="0 0 24 24">
			<path
				d="M18.875,9.659v9.216H5.125V5.125h9.8l2-2h-12.8c-0.552,0-1,0.448-1,1v15.75c0,0.553,0.448,1,1,1h15.75c0.553,0,1-0.447,1-1 V7.659L18.875,9.659z"
				fill="currentColor"
				fillRule="evenodd"
			/>
			<polygon fill="currentColor" points={arrowPoints} />
		</svg>
	);
};

export default LinkIcon;
