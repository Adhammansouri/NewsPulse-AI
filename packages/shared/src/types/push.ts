export type PushSubscribeRequest = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushUnsubscribeRequest = {
  endpoint: string;
};

export type PushVapidKeyData = {
  publicKey: string;
  configured: boolean;
};

export type PushSubscribeData = {
  subscribed: boolean;
};

export type PushUnsubscribeData = {
  unsubscribed: boolean;
};

export type PushTestData = {
  sent: number;
};
