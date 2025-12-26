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
        // Try 'cross-platform' first to explicitly request QR code/cross-device flow
        // This should show QR code option for phone authentication
        // If this doesn't work, the browser will fall back to platform authenticators
        authenticatorAttachment: 'cross-platform',
        // Use 'preferred' to allow Face ID/Touch ID on phones via cross-device
        userVerification: 'preferred',
        // requireResidentKey: true allows passkeys to be stored on the authenticator
        // This is required for cross-device authenticators
        requireResidentKey: true
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
  
  // Use rpID from options (which should be set from the origin)
  const rpID = options.rpID || getRpIDFromOrigin(expectedOrigin);
  
  // Validate response structure
  if (!response) {
    throw new Error('Registration response is required');
  }
  
  if (!response.id) {
    throw new Error('Registration response missing id field');
  }
  
  if (!response.type || response.type !== 'public-key') {
    throw new Error(`Invalid response type: ${response.type || 'missing'}. Expected 'public-key'`);
  }
  
  if (!response.response) {
    throw new Error('Registration response missing response object');
  }
  
  if (!response.response.clientDataJSON) {
    throw new Error('Registration response missing clientDataJSON');
  }
  
  if (!response.response.attestationObject) {
    throw new Error('Registration response missing attestationObject');
  }
  
  if (!options.challenge) {
    throw new Error('Challenge is required for verification');
  }
  
  console.log('Verifying registration:', {
    rpID,
    expectedOrigin,
    hasChallenge: !!options.challenge,
    challengeLength: options.challenge?.length,
    challengePreview: options.challenge ? options.challenge.substring(0, 20) + '...' : 'MISSING',
    responseId: response?.id,
    responseType: response?.type,
    hasResponse: !!response,
    hasClientDataJSON: !!response?.response?.clientDataJSON,
    hasAttestationObject: !!response?.response?.attestationObject,
    responseKeys: response ? Object.keys(response) : [],
    responseResponseKeys: response?.response ? Object.keys(response.response) : []
  });
  
  try {
    // Log response details for debugging
    if (response?.response?.authenticatorData) {
      // Decode authenticator data to check flags
      try {
        const authData = Buffer.from(response.response.authenticatorData, 'base64url');
        // The flags byte is at position 32 (after rpIdHash)
        if (authData.length >= 33) {
          const flags = authData[32];
          const userPresent = !!(flags & 0x01);
          const userVerified = !!(flags & 0x04);
          console.log('Authenticator data flags:', {
            userPresent,
            userVerified,
            flags: flags.toString(2).padStart(8, '0')
          });
        }
      } catch (e) {
        console.log('Could not parse authenticator data:', e.message);
      }
    }
    
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: options.challenge,
      expectedOrigin,
      expectedRPID: rpID
    });

    console.log('Verification result:', {
      verified: verification.verified,
      hasRegistrationInfo: !!verification.registrationInfo,
      registrationInfoKeys: verification.registrationInfo ? Object.keys(verification.registrationInfo) : [],
      fullVerification: JSON.stringify(verification, (key, value) => {
        if (value instanceof Buffer) {
          return `<Buffer: ${value.length} bytes>`;
        }
        if (value && typeof value === 'object' && value.type === 'Buffer') {
          return `<Buffer: ${value.data?.length || 0} bytes>`;
        }
        return value;
      }, 2)
    });

    // Log the actual structure of registrationInfo (handling Buffers)
    if (verification.registrationInfo) {
      const info = verification.registrationInfo;
      console.log('RegistrationInfo structure:', {
        keys: Object.keys(info),
        credentialID: info.credentialID ? (Buffer.isBuffer(info.credentialID) ? `<Buffer: ${info.credentialID.length} bytes>` : typeof info.credentialID) : 'MISSING',
        credentialPublicKey: info.credentialPublicKey ? (Buffer.isBuffer(info.credentialPublicKey) ? `<Buffer: ${info.credentialPublicKey.length} bytes>` : typeof info.credentialPublicKey) : 'MISSING',
        counter: info.counter,
        fmt: info.fmt,
        aaguid: info.aaguid,
        allValues: Object.keys(info).reduce((acc, key) => {
          const val = info[key];
          if (Buffer.isBuffer(val)) {
            acc[key] = `<Buffer: ${val.length} bytes>`;
          } else {
            acc[key] = typeof val;
          }
          return acc;
        }, {})
      });
    } else {
      console.error('registrationInfo is missing even though verified is true!');
    }

    if (verification.verified && verification.registrationInfo) {
      const registrationInfo = verification.registrationInfo;
      
      // SimpleWebAuthn returns credentialID and credentialPublicKey as Buffers
      // Check for both the expected names and alternative names
      let credentialID = registrationInfo.credentialID || registrationInfo.credentialId;
      let credentialPublicKey = registrationInfo.credentialPublicKey || registrationInfo.publicKey;

      // If credentialID is still missing, try to get it from the response object
      if (!credentialID && response?.id) {
        console.log('credentialID not in registrationInfo, using response.id');
        credentialID = response.id;
      }

      // Try to get publicKey from response if missing from registrationInfo
      if (!credentialPublicKey && response?.response?.publicKey) {
        console.log('credentialPublicKey not in registrationInfo, using response.response.publicKey');
        credentialPublicKey = response.response.publicKey;
      }

      // Validate that we have the required data
      if (!credentialID) {
        console.error('credentialID is missing from both registrationInfo and response:', {
          registrationInfoKeys: Object.keys(registrationInfo),
          responseId: response?.id,
          responseKeys: response ? Object.keys(response) : []
        });
        throw new Error('Registration verification failed: credentialID is missing');
      }
      if (!credentialPublicKey) {
        console.error('credentialPublicKey is missing from both registrationInfo and response:', {
          registrationInfoKeys: Object.keys(registrationInfo),
          registrationInfoValues: Object.keys(registrationInfo).reduce((acc, key) => {
            acc[key] = typeof registrationInfo[key];
            return acc;
          }, {}),
          responseKeys: response ? Object.keys(response) : [],
          responseResponseKeys: response?.response ? Object.keys(response.response) : []
        });
        throw new Error('Registration verification failed: credentialPublicKey is missing');
      }

      console.log('Registration info received:', {
        hasCredentialID: !!credentialID,
        credentialIDType: credentialID?.constructor?.name,
        credentialIDIsBuffer: Buffer.isBuffer(credentialID),
        credentialIDLength: credentialID?.length,
        hasCredentialPublicKey: !!credentialPublicKey,
        credentialPublicKeyType: credentialPublicKey?.constructor?.name,
        credentialPublicKeyIsBuffer: Buffer.isBuffer(credentialPublicKey),
        credentialPublicKeyLength: credentialPublicKey?.length
      });

      // Convert credentialID to Buffer if needed
      // If it came from response.id, it's already base64url, so we need to decode it first
      let credentialIDBuffer;
      if (Buffer.isBuffer(credentialID)) {
        credentialIDBuffer = credentialID;
      } else if (typeof credentialID === 'string') {
        // If it's a string, it might be base64url (from response.id) or need to be converted
        // Try to decode as base64url first, if that fails, treat as raw string
        try {
          credentialIDBuffer = Buffer.from(credentialID, 'base64url');
        } catch (e) {
          // If base64url decode fails, try as UTF-8
          credentialIDBuffer = Buffer.from(credentialID, 'utf8');
        }
      } else {
        // Convert to string first, then to buffer
        const idString = String(credentialID);
        try {
          credentialIDBuffer = Buffer.from(idString, 'base64url');
        } catch (e) {
          credentialIDBuffer = Buffer.from(idString, 'utf8');
        }
      }

      // Convert credentialPublicKey to Buffer if needed
      const credentialPublicKeyBuffer = Buffer.isBuffer(credentialPublicKey)
        ? credentialPublicKey
        : Buffer.from(credentialPublicKey);

      return {
        verified: true,
        credential: {
          id: credentialIDBuffer.toString('base64url'),
          publicKey: credentialPublicKeyBuffer.toString('base64url'),
          counter: registrationInfo.counter || 0,
          deviceName: 'Passkey', // Default name, can be updated later
          registeredAt: new Date().toISOString()
        }
      };
    }

    console.error('Verification failed - not verified or no registrationInfo', {
      verified: verification.verified,
      hasRegistrationInfo: !!verification.registrationInfo
    });
    return { verified: false };
  } catch (error) {
    console.error('Error in verifyRegistration:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      rpID,
      expectedOrigin,
      challengeLength: options.challenge?.length,
      responseType: response?.type,
      responseId: response?.id
    });
    throw error;
  }
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

  // Map credentials, handling potential format issues
  const allowCredentials = credentials.map((cred, index) => {
    try {
      if (!cred.id) {
        throw new Error(`Credential at index ${index} is missing id field`);
      }
      
      // Log the credential ID format for debugging
      console.log(`Processing credential at index ${index}:`, {
        idType: typeof cred.id,
        idIsBuffer: Buffer.isBuffer(cred.id),
        idIsArray: Array.isArray(cred.id),
        idValue: typeof cred.id === 'string' ? cred.id.substring(0, 20) + '...' : (Array.isArray(cred.id) ? `[Array: ${cred.id.length} items]` : String(cred.id).substring(0, 20)),
        idLength: cred.id?.length,
        idConstructor: cred.id?.constructor?.name
      });
      
      // cred.id should be a base64url string, convert to Buffer
      // Handle all possible formats defensively
      let credentialID;
      
      if (Buffer.isBuffer(cred.id)) {
        credentialID = cred.id;
      } else if (Array.isArray(cred.id)) {
        // If it's an array (like [1,2,3] from JSON), convert to Buffer directly
        // This happens when JSON serializes a Buffer as an array
        credentialID = Buffer.from(cred.id);
      } else if (typeof cred.id === 'string') {
        // It's a string - convert to Buffer
        const idStr = String(cred.id).trim();
        if (!idStr) {
          throw new Error(`Credential at index ${index} has empty id string`);
        }
        
        // Ensure it's a real string primitive with replace method
        // Create a new string to ensure it's a primitive
        const cleanId = '' + idStr;
        
        // Try to decode as base64url
        // Use try-catch to handle any encoding issues
        try {
          // First try base64url (which requires .replace method)
          // If that fails due to replace issue, fall back to manual decoding
          if (typeof cleanId.replace === 'function') {
            credentialID = Buffer.from(cleanId, 'base64url');
          } else {
            // Manual base64url decode
            const base64 = cleanId.replace(/-/g, '+').replace(/_/g, '/');
            const padding = '='.repeat((4 - base64.length % 4) % 4);
            credentialID = Buffer.from(base64 + padding, 'base64');
          }
        } catch (e) {
          // If base64url fails, try regular base64
          try {
            credentialID = Buffer.from(cleanId, 'base64');
          } catch (e2) {
            // Last resort: treat as raw bytes
            credentialID = Buffer.from(cleanId, 'utf8');
          }
        }
      } else {
        // For other types, try to convert to string first, then to Buffer
        const idStr = String(cred.id);
        try {
          credentialID = Buffer.from(idStr, 'base64url');
        } catch (e) {
          try {
            credentialID = Buffer.from(idStr, 'base64');
          } catch (e2) {
            credentialID = Buffer.from(idStr, 'utf8');
          }
        }
      }
      
      if (!credentialID || !Buffer.isBuffer(credentialID)) {
        throw new Error(`Credential at index ${index} could not be converted to Buffer. Type: ${typeof cred.id}, IsArray: ${Array.isArray(cred.id)}, Value: ${JSON.stringify(cred.id)}`);
      }

      // SimpleWebAuthn expects credential ID as a Uint8Array or Buffer
      // But it validates it as a string first, so we need to ensure it's the right format
      // Convert Buffer to Uint8Array if needed, or keep as Buffer
      let credentialIDForOptions;
      if (Buffer.isBuffer(credentialID)) {
        // Convert Buffer to Uint8Array (which SimpleWebAuthn can handle)
        credentialIDForOptions = new Uint8Array(credentialID);
      } else if (credentialID instanceof Uint8Array) {
        credentialIDForOptions = credentialID;
      } else {
        // If it's still a string, convert to Uint8Array via Buffer
        const tempBuffer = Buffer.from(String(credentialID), 'base64url');
        credentialIDForOptions = new Uint8Array(tempBuffer);
      }

      return {
        id: credentialIDForOptions,
        type: 'public-key',
        transports: cred.transports || []
      };
    } catch (error) {
      console.error(`Error processing credential at index ${index}:`, error);
      console.error('Credential data:', cred);
      throw error;
    }
  });

  console.log('Generating authentication options:', {
    rpID,
    credentialCount: allowCredentials.length,
    credentialIDs: allowCredentials.map(c => c.id.toString('base64url').substring(0, 20) + '...')
  });

  const options = await generateAuthenticationOptions({
    rpID,
    timeout: 60000,
    allowCredentials,
    // Use 'preferred' to allow Face ID/Touch ID on phones via cross-device
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
  
  // Use rpID from options (which should be set from the origin)
  const rpID = options.rpID || getRpIDFromOrigin(expectedOrigin);
  
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
  verifyAuthentication,
  getRpIDFromOrigin,
  getOriginFromRequest
};

