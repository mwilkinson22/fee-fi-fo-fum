import React from "react";

const YouTubeVideo = ({ videoId }) => {
	return (
		<iframe
			allowFullScreen="allowFullScreen"
			src={`https://www.youtube.com/embed/${videoId}?iv_load_policy=3&amp;rel=0`}
		></iframe>
	);
};

export default YouTubeVideo;
