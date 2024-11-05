export interface IToasterModel {
  message: string;
  messageType: string;
  timeoutInSeconds?: number;
}
export interface IToasterInfo {
  INFO: IInfo;
  ERROR: IInfo;
  SUCCESS: IInfo;
  WARNING: IInfo;
}
export interface IInfo {
  className: string;
  svgIcon: string;
  timeoutInSeconds?: number;
}
