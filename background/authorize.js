/* exported getAccessToken */

var browser = browser || chrome;
const REDIRECT_URL = browser.identity.getRedirectURL();
const SCOPES = ["openid", "email", "profile","https://www.googleapis.com/auth/calendar","https://www.googleapis.com/auth/spreadsheets"];

//console.log("REDIRECT_URL", REDIRECT_URL);
const AUTH_URL =
`https://accounts.google.com/o/oauth2/auth\
?client_id=${CLIENT_ID}\
&response_type=token\
&redirect_uri=${encodeURIComponent(REDIRECT_URL)}\
&scope=${encodeURIComponent(SCOPES.join(' '))}`;

//console.log (AUTH_URL);
const VALIDATION_BASE_URL="https://www.googleapis.com/oauth2/v3/tokeninfo";

function extractAccessToken(redirectUri) {

  let m = redirectUri.match(/[#?](.*)/);
  if (!m || m.length < 1)
    return null;
  let params = new URLSearchParams(m[1].split("#")[0]);
  return params.get("access_token");
}

function validate(redirectURL) {
  const accessToken = extractAccessToken(redirectURL);
  if (!accessToken) {
    throw "Authorization failure";
  }
  const validationURL = `${VALIDATION_BASE_URL}?access_token=${accessToken}`;
  const validationRequest = new Request(validationURL, {
    method: "GET"
  });

  function checkResponse(response) {
    return new Promise((resolve, reject) => {
      if (response.status != 200) {
        reject("Token validation error");
      }
      response.json().then((json) => {
        if (json.aud && (json.aud === CLIENT_ID)) {
          resolve(accessToken);
        } else {
          reject("Token validation error");
        }
      });
    });
  }

  return fetch(validationRequest).then(checkResponse);
}

function authorize(callbackFn, token) {
  if(token){
    callbackFn(token); 
  } else {
    return browser.identity.launchWebAuthFlow({
      interactive: true,
      url: AUTH_URL
    }, function(rq){
      validate(rq).then(callbackFn);
    });
  }
}

function getAccessToken() {
	return authorize();
}
