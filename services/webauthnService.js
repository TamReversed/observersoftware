// Ensure Web Crypto API is available globally
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = require('crypto');
  globalThis.crypto = webcrypto;
}

const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const { rpName } = config.webauthn;

// Helper to get rpID from origin
function getRpIDFromOrigin(originUrl) {
  try {
    const url = new URL(originUrl);
    return url.hostname;
  } catch (e) {
    return config.webauthn.rpID || 'localhost';
  }
}

// Helper to get origin from request
function getOriginFromRequest(req) {
  // Check for Railway's public domain env var first
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return process.env.RAILWAY_PUBLIC_DOMAIN.startsWith('http') 
      ? process.env.RAILWAY_PUBLIC_DOMAIN 
      : `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  
  // Fall back to request origin
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const host = req.headers.host || req.get('host');
  return `${protocol}://${host}`;
}

/**
 * Generate registration options for a new passkey
 * @param {string} userId - User ID
 * @param {string} username - Username
 * @param {Array} existingCredentials - Existing WebAuthn credentials for this user
 * @param {string} origin - Origin URL for the request
 * @returns {Promise<Object>} Registration options
 */
async function generateRegistrationOptionsForUser(userId, username, existingCredentials = [], origin) {
  try {
    // Convert userId string to Buffer
    // If userId is a UUID string, we need to convert it properly
    let userIDBuffer;
    try {
      // Try to parse as UUID first (if it's a standard UUID format)
      if (userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Remove dashes and convert hex to buffer
        const hexString = userId.replace(/-/g, '');
        userIDBuffer = Buffer.from(hexString, 'hex');
      } else {
        // Fallback to UTF-8 encoding
        userIDBuffer = Buffer.from(userId, 'utf8');
      }
    } catch (e) {
      // If all else fails, use UTF-8
      userIDBuffer = Buffer.from(userId, 'utf8');
    }

    // Map existing credentials for exclusion
    const excludeCredentials = existingCredentials.map(cred => {
      try {
        return {
          id: Buffer.from(cred.id, 'base64url'),
          type: 'public-key',
          transports: cred.transports || []
        };
      } catch (e) {
        console.error('Error mapping credential:', e);
        return null;
      }
    }).filter(Boolean); // Remove any null entries

    // Get rpID from origin
    const rpID = getRpIDFromOrigin(origin || config.webauthn.origin);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userIDBuffer,
      userName: username,
      timeout: 60000,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform',
        userVerification: 'preferred',
        requireResidentKey: false
      },
      supportedAlgorithmIDs: [-7, -257] // ES256 and RS256
    });

    return options;
  } catch (error) {
    console.error('Error generating registration options:', error);
    throw error;
  }
}

/**
 * Verify a registration response
 * @param {Object} options - Original registration options
 * @param {Object} response - Registration response from client
 * @param {string} expectedOrigin - Expected origin
 * @returns {Promise<Object>} Verification result with credential info
 */
async function verifyRegistration(options, response, expectedOrigin) {
  if (!expectedOrigin) {
    expectedOrigin = config.webauthn.origin;
  }
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
 * @param {string} origin - Origin URL for the request
 * @returns {Promise<Object>} Authentication options
 */
async function generateAuthenticationOptionsForUser(userId, credentials = [], origin) {
  if (credentials.length === 0) {
    throw new Error('No credentials found for user');
  }

  // Get rpID from origin
  const rpID = getRpIDFromOrigin(origin || config.webauthn.origin);

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
async function verifyAuthentication(options, response, credential, expectedOrigin) {
  if (!expectedOrigin) {
    expectedOrigin = config.webauthn.origin;
  }
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

