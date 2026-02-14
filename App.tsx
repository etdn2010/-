
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ShapeType, AppSettings, CameraDevice } from './types';
import { getCameraDevices, getCameraStream } from './services/cameraService';
import ControlPanel from './components/ControlPanel';

const isElectron = typeof window !== 'undefined' && !!(window as any).process && !!(window as any).process.type;

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    shape: ShapeType.CIRCLE,
    zoom: 1.0,
    opacity: 1.0,
    alwaysOnTop: true,
    activeDeviceId: null,
    cameraEnabled: true,
  });

  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // 计算当前摄像头的物理尺寸
  const cameraSize = useMemo(() => {
    const base = 300 * settings.zoom;
    let w = base;
    let h = base;
    if (settings.shape === ShapeType.HORIZONTAL) h = base * (9/16);
    if (settings.shape === ShapeType.VERTICAL) h = base * (4/3);
    return { width: w, height: h };
  }, [settings.zoom, settings.shape]);

  // 同步窗口大小到主进程
  useEffect(() => {
    if (isElectron) {
      const { ipcRenderer } = (window as any).require('electron');
      // 传递面板状态，如果面板开启，需要更大的窗口空间
      ipcRenderer.send('resize-window', { 
        width: cameraSize.width, 
        height: cameraSize.height + (showPanel ? 400 : 0) 
      });
    }
  }, [cameraSize, showPanel]);

  const refreshDevices = useCallback(async () => {
    const cameraDevices = await getCameraDevices();
    setDevices(cameraDevices);
    if (cameraDevices.length > 0 && !settings.activeDeviceId) {
      setSettings(prev => ({ ...prev, activeDeviceId: cameraDevices[0].deviceId }));
    }
  }, [settings.activeDeviceId]);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (settings.cameraEnabled) {
      try {
        const stream = await getCameraStream(settings.activeDeviceId);
        if (stream) {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (err: any) {
        setCameraError(err.message || '访问失败');
      }
    } else {
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  }, [settings.cameraEnabled, settings.activeDeviceId]);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    if (isElectron) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('set-always-on-top', settings.alwaysOnTop);
    }
  }, [settings.alwaysOnTop]);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setSettings(prev => ({
      ...prev,
      zoom: Math.min(Math.max(prev.zoom + delta, 0.4), 4.0)
    }));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPanelPos({ x: 20, y: cameraSize.height + 20 });
    setShowPanel(true);
  };

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const handleExit = () => {
    if (isElectron) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('exit-app');
    } else {
      window.close();
    }
  };

  const getShapeClasses = () => {
    switch (settings.shape) {
      case ShapeType.CIRCLE: return 'rounded-full aspect-square';
      case ShapeType.SQUARE: return 'rounded-none aspect-square';
      case ShapeType.HORIZONTAL: return 'rounded-2xl aspect-video';
      case ShapeType.VERTICAL: return 'rounded-2xl aspect-[3/4]';
      default: return 'rounded-full aspect-square';
    }
  };

  return (
    <div className="w-screen h-screen bg-transparent p-4 flex flex-col items-start overflow-hidden">
      {/* 摄像头区域：使用 -webkit-app-region: drag 实现极致流畅拖拽 */}
      <div
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        className={`relative shadow-2xl border border-white/20 overflow-hidden bg-black flex items-center justify-center cursor-move transition-all duration-200 ease-out ${getShapeClasses()}`}
        style={{
          width: `${cameraSize.width}px`,
          height: `${cameraSize.height}px`,
          opacity: settings.opacity,
          // 关键：启用原生拖拽
          WebkitAppRegion: 'drag' as any 
        }}
      >
        {settings.cameraEnabled && !cameraError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover pointer-events-none mirror scale-x-[-1] will-change-transform"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4 text-gray-500 select-none">
            <p className="text-[10px]">{cameraError || '已关闭'}</p>
          </div>
        )}
        
        {/* 缩放指示器 */}
        <div className="absolute bottom-2 right-2 bg-black/40 text-[8px] text-white px-1 rounded pointer-events-none">
          {Math.round(settings.zoom * 100)}%
        </div>
      </div>

      {showPanel && (
        <div 
          className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ WebkitAppRegion: 'no-drag' as any }}
        >
          <ControlPanel
            settings={settings}
            devices={devices}
            onUpdate={updateSettings}
            onClose={() => setShowPanel(false)}
            onExit={handleExit}
            position={{ x: 0, y: 0 }} // 面板位置现在相对于容器
          />
        </div>
      )}
      
      {/* 操作说明：在小窗口模式下默认隐藏，只有右键才显示控制台 */}
      {!showPanel && (
        <div className="fixed bottom-1 left-2 text-white/30 text-[8px] pointer-events-none">
          右键设置 • 滚轮缩放
        </div>
      )}
    </div>
  );
};

export default App;
