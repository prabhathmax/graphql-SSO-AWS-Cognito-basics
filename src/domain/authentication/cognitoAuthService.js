/* eslint-disable consistent-return */
/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
import request from 'superagent';
import jwkToPem from 'jwk-to-pem';
import jwt from 'jsonwebtoken';
import { CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';

const cognitoAuthService = async (token, services, secrets) => {
  try {
    const cognitoSecrets = await secrets.cognito.get();
    const res = await request
      .get(
        `https://cognito-idp.${cognitoSecrets.cognitoRegion}.amazonaws.com/${cognitoSecrets.cognitoPoolId}/.well-known/jwks.json`,
      )
      .set('Accept', 'application/json');
    if (res.statusCode >= 400) {
      // eslint-disable-next-line no-console
      console.log('Bad Request to cognito api');
      throw new Error('Bad Request');
    }
    const pems = {};
    let pem;
    const { keys } = res.body;
    for (let i = 0; i < keys.length; i++) {
      const key_id = keys[i].kid;
      const modulus = keys[i].n;
      const exponent = keys[i].e;
      const key_type = keys[i].kty;
      const jwk = { kty: key_type, n: modulus, e: exponent };
      pem = jwkToPem(jwk);
      pems[key_id] = pem;
    }
    const decodedJwt = jwt.decode(token, { complete: true });
    const { kid } = decodedJwt.header;
    pem = pems[kid];
    if (!pem) {
      // eslint-disable-next-line no-console
      console.log('Invalid token', kid);
      throw new Error('Invalid token');
    }
    const userInfo = jwt.verify(token, pem);
    if (userInfo && userInfo.email) {
      const userPool = new CognitoUserPool({
        UserPoolId: cognitoSecrets.cognitoPoolId,
        ClientId: cognitoSecrets.cognitoClientId,
      });
      const cognitoUser = new CognitoUser({
        Username: userInfo.email,
        Pool: userPool,
      });
      if (cognitoUser) {
        return userInfo.email;
      }
      return null;
    }
    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to post to cognito auth', error);
    // throw error;
  }
};
export default cognitoAuthService;
