const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const { rpID, rpName, origin } = config.webauthn;

/**
 * Generate registration options for a new passkey
 * @param {string} userId - User ID
 * @param {string} username - Username
 * @param {Array} existingCredentials - Existing WebAuthn credentials for this user
 * @returns {Promise<Object>} Registration options
 */
async function generateRegistrationOptionsForUser(userId, username, existingCredentials = []) {
  const user = {
    id: userId,
    name: username,
    displayName: username
  };

  // Convert userId string to Buffer (UUID)
  const userIDBuffer = Buffer.from(userId, 'utf8');

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: userIDBuffer,
    userName: username,
    timeout: 60000,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map(cred => ({
      id: Buffer.from(cred.id, 'base64url'),
      type: 'public-key',
      transports: cred.transports || []
    })),
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform',
      userVerification: 'preferred',
      requireResidentKey: false
    },
    supportedAlgorithmIDs: [-7, -257] // ES256 and RS256
  });

  return options;
}

/**
 * Verify a registration response
 * @param {Object} options - Original registration options
 * @param {Object} response - Registration response from client
 * @param {string} expectedOrigin - Expected origin
 * @returns {Promise<Object>} Verification result with credential info
 */
async function verifyRegistration(options, response, expectedOrigin = origin) {
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: options.challenge,
    expectedOrigin,
    expectedRPID: rpID
  });

  if (verification.verified && verification.registrationInfo) {
    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    return {
      verified: true,
      credential: {
        id: Buffer.from(credentialID).toString('base64url'),
        publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter: counter || 0,
        deviceName: 'Passkey', // Default name, can be updated later
        registeredAt: new Date().toISOString()
      }
    };
  }

  return { verified: false };
}

/**
 * Generate authentication options for login
 * @param {string} userId - User ID
 * @param {Array} credentials - User's registered credentials
 * @returns {Promise<Object>} Authentication options
 */
async function generateAuthenticationOptionsForUser(userId, credentials = []) {
  if (credentials.length === 0) {
    throw new Error('No credentials found for user');
  }

  const options = await generateAuthenticationOptions({
    rpID,
    timeout: 60000,
    allowCredentials: credentials.map(cred => ({
      id: Buffer.from(cred.id, 'base64url'),
      type: 'public-key',
      transports: cred.transports || []
    })),
    userVerification: 'preferred'
  });

  return options;
}

/**
 * Verify an authentication response
 * @param {Object} options - Original authentication options
 * @param {Object} response - Authentication response from client
 * @param {Object} credential - Stored credential to verify against
 * @param {string} expectedOrigin - Expected origin
 * @returns {Promise<Object>} Verification result with updated counter
 */
async function verifyAuthentication(options, response, credential, expectedOrigin = origin) {
  const credentialPublicKey = Buffer.from(credential.publicKey, 'base64url');
  const credentialID = Buffer.from(credential.id, 'base64url');

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: options.challenge,
    expectedOrigin,
    expectedRPID: rpID,
    credential: {
      id: credentialID,
      publicKey: credentialPublicKey,
      counter: credential.counter || 0
    },
    requireUserVerification: false
  });

  if (verification.verified) {
    return {
      verified: true,
      newCounter: verification.authenticationInfo.newCounter
    };
  }

  return { verified: false };
}

module.exports = {
  generateRegistrationOptionsForUser,
  verifyRegistration,
  generateAuthenticationOptionsForUser,
  verifyAuthentication
};

