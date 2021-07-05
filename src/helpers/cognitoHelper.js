import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';

const AWS = require('aws-sdk');

const cognitoUserModifiedInfo = (userData) => new CognitoUser(userData);

const signUp = (username, password, poolData, info) => {
  const userPool = new CognitoUserPool(poolData);
  const attributeList = [];
  const firstName = { Name: 'name', Value: info.firstName };
  const lastName = { Name: 'given_name', Value: info.lastName };
  const middleName = { Name: 'middle_name', Value: info.lastName };
  const phoneNumber = { Name: 'phone_number', Value: info.phone };
  const address1 = { Name: 'custom:address1', Value: info.address1 };
  const address2 = { Name: 'custom:address2', Value: info.address2 };
  const city = { Name: 'custom:city', Value: info.city };
  const state = { Name: 'custom:state', Value: info.state };
  const zip = { Name: 'custom:zip', Value: info.zip };
  const attributeFirstName = new CognitoUserAttribute(firstName);
  const attributeLastName = new CognitoUserAttribute(lastName);
  const attributeMiddleName = new CognitoUserAttribute(middleName);
  const attributePhoneNumber = new CognitoUserAttribute(phoneNumber);
  const attributeAddress1 = new CognitoUserAttribute(address1);
  const attributeAddress2 = new CognitoUserAttribute(address2);
  const attributeCity = new CognitoUserAttribute(city);
  const attributeState = new CognitoUserAttribute(state);
  const attributeZip = new CognitoUserAttribute(zip);
  attributeList.push(attributeFirstName);
  attributeList.push(attributeLastName);
  attributeList.push(attributePhoneNumber);
  attributeList.push(attributeAddress1);
  attributeList.push(attributeAddress2);
  attributeList.push(attributeCity);
  attributeList.push(attributeState);
  attributeList.push(attributeZip);
  attributeList.push(attributeMiddleName);
  return new Promise((resolve, reject) => {
    userPool.signUp(username, password, attributeList, null, (err, result) => {
      if (err) {
        reject(err.message || JSON.stringify(err));
      } else {
        resolve(result);
      }
    });
  });
};

const signIn = (Username, Password, poolData) =>
  new Promise((resolve, reject) => {
    const userPool = new CognitoUserPool(poolData);
    const user = cognitoUserModifiedInfo({ Username, Pool: userPool });
    user.setAuthenticationFlowType('USER_PASSWORD_AUTH');
    const authDetails = new AuthenticationDetails({ Username, Password });
    user.authenticateUser(authDetails, {
      onSuccess(result) {
        const accessToken = result.getAccessToken().getJwtToken();
        const refreshToken = result.getRefreshToken().token;
        const idToken = result.getIdToken().getJwtToken();
        resolve({
          accessToken,
          refreshToken,
          idToken,
        });
      },
      onFailure(err) {
        reject(err.message || JSON.stringify(err));
      },
    });
  });

const cognitoIdentityServiceProvider = async (cognitoSecrets) => {
  const credentials = process.env.S3_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      }
    : null;
  return new AWS.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-18',
    region: cognitoSecrets.cognitoRegion,
    credentials,
  });
};

export default {
  signUp,
  signIn,
  cognitoIdentityServiceProvider,
};
