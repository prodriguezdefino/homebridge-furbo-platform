import { AxiosRequestConfig } from 'axios';
import { HttpClient } from './baseHTTPClient';
import { PlatformConfig, Logger } from 'homebridge';

export class FurboAPIClient extends HttpClient {

  private readonly authorization = 'Basic dG9tb2Z1bnJkOmhhcHB5UGV0MTIz'; // ~ echo tomofunrd:happyPet123 | base64
  private sessionInfo: LoginResponse = {};
  private deviceInfo: DeviceInfo = {};
  private readonly accountEmail: string;
  private readonly accountEncPassword: string;
  public readonly initializationPromise:Promise<void>;

  public constructor(
    private readonly config: PlatformConfig,
    public readonly log: Logger
    ) {
    // hardcoded url for the base domain of the API.
    super('https://product.furbo.co');
    
    this.accountEmail = config.email;
    this.accountEncPassword = config.encpass;

    this._initializeRequestInterceptor();

    this.initializationPromise = this._initializeClient();
  }

  private _initializeRequestInterceptor = () => {
    this.instance.interceptors.request.use(
      this._handleRequest,
      this._handleError,
    );
  };

  private _handleRequest = (config: AxiosRequestConfig) => {
    config.headers['authorization'] = this.authorization;

    return config;
  };

  private _initializeClient = async () => {
    const loginInfo = {
      Email: this.accountEmail,
      EncPassword: this.accountEncPassword
    }

    this.sessionInfo = await this._accountLogin(loginInfo);
    this.log.info("session info: " + JSON.stringify(this.sessionInfo));
    let furboPayload: FurboPayload = {
      CognitoToken: this.sessionInfo.CognitoToken || "dummyToken"
    };
    const accountId = this.sessionInfo.AccountId || "dummyAccount";
    const devicesInfo = await this._retrieveDevices(accountId, furboPayload);
    const [device] = devicesInfo.DeviceList;
    this.deviceInfo = device;
    this.log.info("device info: " + JSON.stringify(this.deviceInfo));
    
    furboPayload.AccountId = this.sessionInfo.AccountId;
    furboPayload.LastUpdatedTime = "" + Date.parse(this.deviceInfo.LastRegisteredTime || Date.now().toString()) / 1000;
    const profile = await this._petProfile(furboPayload);
    this.log.info("profile info: " + JSON.stringify(profile));

    const mobileLogin: MobileLogin = {
      AccountId: this.sessionInfo.AccountId || "dummyAccount",
      CognitoToken: this.sessionInfo.CognitoToken || "dummyToken",
      MobileName: "IPhone",
      Platform: "APNS",
      MobileId: this.config.deviceId,
      SnsToken: this.config.snsToken
    };  
    const mobileLoginResponse = await this._mobileLogin(mobileLogin);
    this.log.info("mobile login info: " + JSON.stringify(mobileLoginResponse));

    delete furboPayload.LastUpdatedTime;
    const licensePermission = await this._licensePermission(furboPayload);
    this.log.info("license permission info: " + JSON.stringify(licensePermission));

    const license = await this._license(furboPayload);
    this.log.info("license info: " + JSON.stringify(license));

    const tossCount = await this.tossCount();
    this.log.info("toss count info: " + JSON.stringify(tossCount));

    const redDot = await this._redDot(furboPayload);
    this.log.info("red dot info: " + JSON.stringify(redDot));

    this.log.info("Client initialized");
  }

  private _accountLogin = (login: Login) => this.instance.post<LoginResponse>('/v2/account/login', login);
  private _retrieveDevices = (accountId: string, payload: FurboPayload) => this.instance.post<DeviceInfoResponse>(`/v2/account/${accountId}/device`, payload);
  private _petProfile = (payload: FurboPayload) => this.instance.post(`/v3/pet/profile/get`, payload);
  private _mobileLogin = (payload: MobileLogin) => this.instance.post(`/v2/mobile/login`, payload);
  private _licensePermission = (payload: FurboPayload) => this.instance.post(`/v3/service/license/permission`, payload);
  private _license = (payload: FurboPayload) => this.instance.post(`/v3/service/license`, payload);
  private _redDot = (payload: FurboPayload) => this.instance.post(`/v3/account/red_dot`, payload);
  
  public tossCount = () => {
    let furboPayload: FurboPayload = {
      CognitoToken: this.sessionInfo.CognitoToken || "dummyToken" ,
      AccountId: this.sessionInfo.AccountId
    }
    return this.instance.post('/v3/account/toss_count/get', furboPayload);
  }

  public tossTreat = async () => {
    let furboPayload: FurboPayload = {
      CognitoToken: this.sessionInfo.CognitoToken || "dummyToken" ,
      AccountId: this.sessionInfo.AccountId,
      DeviceId: this.deviceInfo?.Id,
      LocalTime: new Date().toISOString().split('.')[0],
      Increment: "1"
    }
    return await this.instance.post<TossResponse>('/v3/account/toss_count/update', furboPayload);
  }

  public getDeviceId = () => this.deviceInfo.Id || "deviceIdNotAvailable";
  public getDeviceName = () => this.deviceInfo.DeviceName || "deviceNameNotAvailable";
}
