//Modules
import React from "react";

//Components
import SocialPostThreader from "~/client/components/social/SocialPostThreader";

function AdminBasicSocialThreadPage() {
	return (
		<section className="basic-social-thread-page">
			<div className="container">
				<SocialPostThreader allowFacebookJoin={true} enforceTwitter={false} />
			</div>
		</section>
	);
}

export default AdminBasicSocialThreadPage;
