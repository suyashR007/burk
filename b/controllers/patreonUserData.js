var url = require("url");
var patreon = require("patreon");
var patreonAPI = patreon.patreon;
var patreonOAuth = patreon.oauth;

var patreonOAuthClient = patreonOAuth(
	process.env.CLIENT_ID,
	process.env.CLIENT_SECRET
);

var redirectURL = "http://localhost:2020/oauth/redirect";

exports.handleOAuthRedirectRequest = (request, response) => {
	var oauthGrantCode = url.parse(request.url, true).query.code;
	patreonOAuthClient
		.getTokens(oauthGrantCode, redirectURL)
		.then(function (tokensResponse) {
			var patreonAPIClient = patreonAPI(tokensResponse.access_token);
			return patreonAPIClient("/current_user");
		})
		.then(function (result) {
			const { rawJson } = result;
			const user_id = rawJson.data.id;
			const user_email = rawJson.data.attributes.email;
			const user_name = rawJson.data.attributes.full_name;
			fetch(`http://localhost:2020/getPatrons`)
				.then(r => r.json())
				.then(allPatrons => {
					if (
						allPatrons.map(p => parseInt(p.user_id)).includes(parseInt(user_id))
					)
						response.json({
							message: `Congrats! You're a patron!`,
							tier: allPatrons.map(p => {
								if (p.user_id == user_id) return p.tier;
							}),
							patreon_email: user_email,
							patreon_name: user_name,
						});
					else response.json("Not a Patron. Subscribe Now!");
				})
				.catch(console.log);
		})
		.catch(function (err) {
			console.log("error!", err);
			response.json(err);
		});
};

exports.loginButtonClicked = (req, res) => {
	res.redirect(
		`https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${redirectURL}`
	);
};
