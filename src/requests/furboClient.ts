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

    this.sessionInfo = await this._login(loginInfo);
    this.log.info("session info: " + JSON.stringify(this.sessionInfo));
    const furboPayload = {
      CognitoToken: this.sessionInfo.CognitoToken || "dummyToken"
    };
    const accountId = this.sessionInfo.AccountId || "dummyAccount";
    const devicesInfo = await this._retrieveDevices(accountId, furboPayload);
    const [device] = devicesInfo.DeviceList;
    this.deviceInfo = device;
    this.log.info("device info: " + JSON.stringify(this.deviceInfo));
    this.log.info("Client initialized");
  }

  private _login = (login: Login) => this.instance.post<LoginResponse>('/v2/account/login', login);

  private _retrieveDevices = (accountId: string, payload: FurboPayload) => this.instance.post<DeviceInfoResponse>(`/v2/account/${accountId}/device`, payload);

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
