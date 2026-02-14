
export enum ShapeType {
  CIRCLE = 'CIRCLE',
  SQUARE = 'SQUARE',
  HORIZONTAL = 'HORIZONTAL',
  VERTICAL = 'VERTICAL'
}

export interface AppSettings {
  shape: ShapeType;
  zoom: number;
  opacity: number;
  alwaysOnTop: boolean;
  activeDeviceId: string | null;
  cameraEnabled: boolean;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}
