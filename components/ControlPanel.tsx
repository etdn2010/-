
import React from 'react';
import { ShapeType, AppSettings, CameraDevice } from '../types';

interface ControlPanelProps {
  settings: AppSettings;
  devices: CameraDevice[];
  onUpdate: (updates: Partial<AppSettings>) => void;
  onClose: () => void;
  onExit: () => void;
  position: { x: number; y: number };
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  devices,
  onUpdate,
  onClose,
  onExit,
  position
}) => {
  // 确保菜单不会超出屏幕边界
  const adjustedX = Math.min(position.x, window.innerWidth - 240);
  const adjustedY = Math.min(position.y, window.innerHeight - 450);

  const shapeLabels: Record<ShapeType, string> = {
    [ShapeType.CIRCLE]: '圆形',
    [ShapeType.SQUARE]: '方形',
    [ShapeType.HORIZONTAL]: '横向长方',
    [ShapeType.VERTICAL]: '纵向长方'
  };

  return (
    <div 
      className="fixed z-[200] w-60 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-xl shadow-2xl p-4 flex flex-col gap-4 text-sm text-gray-800"
      style={{ left: adjustedX, top: adjustedY }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b pb-2">
        <span className="font-bold text-gray-900">控制面板</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 摄像头开关 */}
      <div className="flex items-center justify-between">
        <span>开启摄像头</span>
        <button 
          onClick={() => onUpdate({ cameraEnabled: !settings.cameraEnabled })}
          className={`w-10 h-5 rounded-full transition-colors relative ${settings.cameraEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.cameraEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* 设备选择 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500">选择摄像头设备</label>
        <select 
          className="bg-gray-50 border border-gray-200 rounded p-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
          value={settings.activeDeviceId || ''}
          onChange={(e) => onUpdate({ activeDeviceId: e.target.value })}
        >
          {devices.length === 0 && <option value="">未检测到摄像头</option>}
          {devices.map(d => (
            <option key={d.deviceId} value={d.deviceId}>{d.label || '默认摄像头'}</option>
          ))}
        </select>
      </div>

      {/* 形状选择 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500">画面形状</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.values(ShapeType) as ShapeType[]).map(s => (
            <button
              key={s}
              onClick={() => onUpdate({ shape: s })}
              className={`px-2 py-1.5 rounded text-xs border transition-all ${settings.shape === s ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
              {shapeLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* 透明度 */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <label className="text-xs font-semibold text-gray-500">画面透明度</label>
          <span className="text-xs text-gray-400">{Math.round(settings.opacity * 100)}%</span>
        </div>
        <input 
          type="range" min="0.1" max="1" step="0.01" 
          value={settings.opacity} 
          onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* 窗口置顶 */}
      <div className="flex items-center justify-between">
        <span className="text-xs">浮于所有程序之上</span>
        <button 
          onClick={() => onUpdate({ alwaysOnTop: !settings.alwaysOnTop })}
          className={`w-10 h-5 rounded-full transition-colors relative ${settings.alwaysOnTop ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.alwaysOnTop ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="border-t pt-2 flex flex-col gap-2">
        <button 
          onClick={onExit}
          className="w-full text-left px-2 py-2 rounded hover:bg-red-50 text-red-600 text-xs font-medium flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          退出程序
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
