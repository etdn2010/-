
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 100, y: 100 });

  // 通知 Electron 是否忽略鼠标事件
  const setIgnoreMouse = (ignore: boolean, forward = false) => {
    if (isElectron) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('set-ignore-mouse-events', ignore, forward ? { forward: true } : undefined);
    }
  };

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
            setCameraError(null);
          }
        } else {
          setCameraError('无法访问摄像头设备。');
        }
      } catch (err: any) {
        setCameraError(err.message || '访问失败。');
      }
    } else {
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  }, [settings.cameraEnabled, settings.activeDeviceId]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
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
      zoom: Math.min(Math.max(prev.zoom + delta, 0.5), 5.0)
    }));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPanelPos({ x: e.clientX, y: e.clientY });
    setShowPanel(true);
    setIgnoreMouse(false); // 展开面板时必须能点击
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      setIgnoreMouse(false);
    }
  };

  // 全局鼠标移动监听，实现平滑拖动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

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
    <div 
      className="w-full h-screen bg-transparent relative overflow-hidden"
      onMouseDown={() => {
        if (showPanel) {
          setShowPanel(false);
          // 如果点击背景且面板关闭，则重新开启鼠标穿透
          setIgnoreMouse(true, true);
        }
      }}
    >
      <div
        onMouseEnter={() => setIgnoreMouse(false)}
        onMouseLeave={() => {
          if (!isDragging && !showPanel) {
            setIgnoreMouse(true, true);
          }
        }}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        className={`absolute cursor-move transition-all duration-300 shadow-2xl border border-white/20 overflow-hidden bg-black flex items-center justify-center ${getShapeClasses()}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${300 * settings.zoom}px`,
          opacity: settings.opacity,
          zIndex: 100
        }}
      >
        {settings.cameraEnabled && !cameraError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover pointer-events-none mirror scale-x-[-1]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 text-gray-400 gap-4 pointer-events-none">
            {cameraError ? (
              <p className="text-[10px] text-red-400">{cameraError}</p>
            ) : (
              <p className="text-xs">摄像头未开启</p>
            )}
          </div>
        )}
      </div>

      {showPanel && (
        <div onMouseEnter={() => setIgnoreMouse(false)}>
          <ControlPanel
            settings={settings}
            devices={devices}
            onUpdate={updateSettings}
            onClose={() => {
              setShowPanel(false);
              setIgnoreMouse(true, true);
            }}
            onExit={handleExit}
            position={panelPos}
          />
        </div>
      )}

      {/* 操作提示 */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] opacity-60 pointer-events-none select-none">
        滚轮: 缩放 • 右键: 设置 • 左键拖拽: 移动
      </div>
    </div>
  );
};

export default App;
