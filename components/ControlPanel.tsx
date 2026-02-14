
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
  onExit
}) => {
  return (
    <div 
      className="w-60 bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 text-sm text-gray-800"
      style={{ WebkitAppRegion: 'no-drag' as any }} // 关键：控件区域不能触发拖拽
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b pb-2">
        <span className="font-bold text-gray-900 tracking-tight">控制面板</span>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">开启摄像头</span>
        <button 
          onClick={() => onUpdate({ cameraEnabled: !settings.cameraEnabled })}
          className={`w-9 h-5 rounded-full transition-all relative ${settings.cameraEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.cameraEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">切换设备</label>
        <select 
          className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          value={settings.activeDeviceId || ''}
          onChange={(e) => onUpdate({ activeDeviceId: e.target.value })}
        >
          {devices.length === 0 && <option value="">未找到设备</option>}
          {devices.map(d => (
            <option key={d.deviceId} value={d.deviceId}>{d.label || '默认摄像头'}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">画面形状</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: ShapeType.CIRCLE, label: '圆形' },
            { id: ShapeType.SQUARE, label: '方形' },
            { id: ShapeType.HORIZONTAL, label: '宽屏' },
            { id: ShapeType.VERTICAL, label: '纵屏' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => onUpdate({ shape: s.id as ShapeType })}
              className={`px-2 py-2 rounded-lg text-xs border transition-all ${settings.shape === s.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 hover:border-blue-400'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">透明度</label>
          <span className="text-[10px] font-mono">{Math.round(settings.opacity * 100)}%</span>
        </div>
        <input 
          type="range" min="0.1" max="1" step="0.05" 
          value={settings.opacity} 
          onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-xs font-medium">窗口置顶</span>
        <button 
          onClick={() => onUpdate({ alwaysOnTop: !settings.alwaysOnTop })}
          className={`w-9 h-5 rounded-full transition-all relative ${settings.alwaysOnTop ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.alwaysOnTop ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      <button 
        onClick={onExit}
        className="w-full mt-2 text-center py-2 rounded-lg hover:bg-red-50 text-red-500 text-xs font-bold transition-colors flex items-center justify-center gap-2"
      >
        退出 VisionCraft
      </button>
    </div>
  );
};

export default ControlPanel;
