
import { CameraDevice } from '../types';

export const getCameraDevices = async (): Promise<CameraDevice[]> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter(device => device.kind === 'videoinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `摄像头 ${device.deviceId.slice(0, 5)}`
      }));
  } catch (error) {
    console.error('获取设备列表失败:', error);
    return [];
  }
};

export const getCameraStream = async (deviceId: string | null): Promise<MediaStream | null> => {
  try {
    const constraints: MediaStreamConstraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('权限被拒绝。请在浏览器设置中允许摄像头访问。');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      throw new Error('未找到摄像头设备。');
    } else {
      throw new Error(`摄像头错误: ${error.message || '未知错误'}`);
    }
  }
};
