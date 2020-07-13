
interface FurboPayload {
     CognitoToken: string;
     AccountId?: string;
     DeviceId?: string;
     Increment?: string;
     LocalTime?: string;
     LastUpdatedTime?: string;
}

interface DeviceInfoResponse {
     DeviceList: DeviceInfo[];
}

interface DeviceInfo {
     BindingCreatedTime?: string;
     BindingRole?: string;
     BindingStatus?: string;
     DeviceHashData?: string;
     DeviceName?: string;
     DeviceStatus?: string;
     DeviceToken?: string;
     DeviceType?: string;
     FirmwareVersion?: string;
     Id?: string;
     LastRegisteredTime?: string;
     LibraryVersion?: string;
     P2PAccessToken?: string;
     P2PAccessTokenTTL?: string;
     P2PAccount?: string;
     P2PPassword?: string;
     P2PUuid?: string;
     P2PVendor?: string;
     Permission?: string;
     ProductId?: string;
}

interface Login {
     Email: string;
     EncPassword: string;
}

interface LoginResponse {
     AccountId?: string;
     CognitoId?: string;
     CognitoToken?: string;
     Email?: string;
     IsInAppSurveyReceived?: boolean;
     Locale?: string;
     Status?: string;
     Type?: string;
}

interface TossResponse {
     TossCounts?: TossCount[];
}

interface TossCount {
     DeviceId?: string;
     TossCount?: number;
}

interface MobileLogin {
     CognitoToken: string;
     SnsToken?: string;
     Platform: string;
     AccountId: string;
     MobileName: string;
     MobileId: string;
}