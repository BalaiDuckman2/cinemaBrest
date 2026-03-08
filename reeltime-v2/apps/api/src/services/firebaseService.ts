import * as deviceTokenRepository from '../repositories/deviceTokenRepository.js';
import { config } from '../config/index.js';

// Notification payload structure
export interface NotificationPayload {
  notification: {
    title: string;
    body: string;
  };
  data: Record<string, string>;
}

// Firebase state
let messagingInstance: FirebaseMessaging | null = null;
let initAttempted = false;

// Minimal interface for Firebase messaging to avoid tight coupling to types
interface SendResponse {
  success: boolean;
  error?: { code: string; message: string };
}

interface BatchResponse {
  responses: SendResponse[];
  successCount: number;
  failureCount: number;
}

interface FirebaseMessaging {
  sendEachForMulticast(message: {
    tokens: string[];
    notification: { title: string; body: string };
    data: Record<string, string>;
  }): Promise<BatchResponse>;
}

async function initFirebase(): Promise<FirebaseMessaging | null> {
  if (initAttempted) return messagingInstance;
  initAttempted = true;

  if (
    !config.firebaseProjectId ||
    !config.firebaseClientEmail ||
    !config.firebasePrivateKey
  ) {
    return null;
  }

  try {
    // Dynamic import to avoid errors when firebase-admin is not configured
    const admin = await import('firebase-admin');
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebaseProjectId,
        clientEmail: config.firebaseClientEmail,
        privateKey: config.firebasePrivateKey.replace(/\\n/g, '\n'),
      }),
    });
    messagingInstance = admin.messaging(app) as unknown as FirebaseMessaging;
    return messagingInstance;
  } catch {
    return null;
  }
}

/**
 * Send a push notification to specific FCM tokens.
 * Returns an array of token indices that failed (stale tokens).
 */
export async function sendPushNotification(
  tokens: string[],
  payload: NotificationPayload,
): Promise<number[]> {
  const messaging = await initFirebase();
  if (!messaging || tokens.length === 0) return [];

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: payload.notification,
    data: payload.data,
  });

  // Collect indices of failed tokens
  const failedIndices: number[] = [];
  response.responses.forEach((resp: SendResponse, index: number) => {
    if (
      resp.error &&
      (resp.error.code === 'messaging/registration-token-not-registered' ||
        resp.error.code === 'messaging/invalid-registration-token')
    ) {
      failedIndices.push(index);
    }
  });

  return failedIndices;
}

/**
 * Send a push notification to all devices registered for a user.
 * Automatically cleans up stale tokens.
 */
export async function sendToUser(
  userId: string,
  payload: NotificationPayload,
): Promise<{ sent: number; cleaned: number }> {
  const deviceTokens = await deviceTokenRepository.getTokensByUserId(userId);
  if (deviceTokens.length === 0) return { sent: 0, cleaned: 0 };

  const tokens = deviceTokens.map((dt) => dt.token);
  const failedIndices = await sendPushNotification(tokens, payload);

  // Clean up stale tokens
  let cleaned = 0;
  for (const index of failedIndices) {
    try {
      await deviceTokenRepository.deleteTokenByValue(tokens[index]);
      cleaned++;
    } catch {
      // Ignore cleanup errors
    }
  }

  return {
    sent: deviceTokens.length - failedIndices.length,
    cleaned,
  };
}

/**
 * Check if Firebase is configured and available.
 */
export async function isFirebaseConfigured(): Promise<boolean> {
  const messaging = await initFirebase();
  return messaging !== null;
}
