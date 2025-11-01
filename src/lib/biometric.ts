// Real biometric authentication using WebAuthn API
export class BiometricService {
  private rpName = 'Light Wallet';
  private rpID = window.location.hostname;

  async isAvailable(): Promise<boolean> {
    if (!('credentials' in navigator) || !window.PublicKeyCredential) {
      return false;
    }
    
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  async register(userId: string): Promise<boolean> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // Generate challenge (in production, get this from server)
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: this.rpName,
          id: this.rpID,
        },
        user: {
          id: Uint8Array.from(userId, c => c.charCodeAt(0)),
          name: userId,
          displayName: userId,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },  // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Store credential ID as base64
      const credentialIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem('biometric_credential_id', credentialIdBase64);
      return true;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      return false;
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return false;
      }

      const credentialId = localStorage.getItem('biometric_credential_id');
      if (!credentialId) {
        throw new Error('No biometric credential registered');
      }

      // Generate challenge (in production, get this from server)
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: this.rpID,
        allowCredentials: [{
          type: 'public-key',
          id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
        }],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      });

      return assertion !== null;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  async unregister(): Promise<void> {
    localStorage.removeItem('biometric_credential_id');
  }

  hasRegisteredCredential(): boolean {
    return localStorage.getItem('biometric_credential_id') !== null;
  }
}

export const biometricService = new BiometricService();
