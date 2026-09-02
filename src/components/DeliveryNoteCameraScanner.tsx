import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  FlipHorizontal, 
  Zap, 
  ZapOff, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  FileText, 
  Sliders, 
  RotateCw, 
  Upload, 
  PenTool, 
  ShieldCheck, 
  AlertCircle, 
  MapPin, 
  User, 
  Sparkles, 
  Eye, 
  Crop,
  Layers,
  ChevronDown,
  Search,
  Check
} from 'lucide-react';
import { Order, DeliveryNoteRecord } from '../types';
import { useTheme } from '../context/ThemeContext';

interface DeliveryNoteCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  deliveryNotes: DeliveryNoteRecord[];
  initialOrder?: Order | null;
  onSaveScannedSignature: (
    orderId: string, 
    signatureDataUrl: string, 
    fullDocumentDataUrl?: string, 
    signerInfo?: { name: string; role: string; location?: string; notes?: string }
  ) => Promise<void> | void;
}

export const DeliveryNoteCameraScanner: React.FC<DeliveryNoteCameraScannerProps> = ({
  isOpen,
  onClose,
  orders,
  deliveryNotes,
  initialOrder,
  onSaveScannedSignature
}) => {
  if (!isOpen) return null;

  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Video and Canvas references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Camera State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'error' | 'unsupported'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);

  // Capture & Processing State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedSignature, setProcessedSignature] = useState<string | null>(null);
  const [activeScanMode, setActiveScanMode] = useState<'signature' | 'full_document'>('signature');
  const [filterMode, setFilterMode] = useState<'auto_ink' | 'high_contrast' | 'original' | 'grayscale'>('auto_ink');
  const [contrastLevel, setContrastLevel] = useState<number>(140);
  const [thresholdLevel, setThresholdLevel] = useState<number>(130);
  const [rotation, setRotation] = useState<number>(0);
  const [isTransparentBg, setIsTransparentBg] = useState<boolean>(true);

  // Order Attachment State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(initialOrder || orders[0] || null);
  const [orderSearchTerm, setOrderSearchTerm] = useState<string>('');
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState<boolean>(false);

  // Signer metadata
  const [signerName, setSignerName] = useState<string>(initialOrder?.customerName || '');
  const [signerRole, setSignerRole] = useState<string>('מנהל עבודה / אתר');
  const [scanNotes, setScanNotes] = useState<string>('');
  const [geoCoordinates, setGeoCoordinates] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);

  // Update selected order when initialOrder prop changes
  useEffect(() => {
    if (initialOrder) {
      setSelectedOrder(initialOrder);
      setSignerName(initialOrder.customerName || '');
    } else if (!selectedOrder && orders.length > 0) {
      setSelectedOrder(orders[0]);
      setSignerName(orders[0].customerName || '');
    }
  }, [initialOrder, orders]);

  // Request native camera stream
  useEffect(() => {
    let currentMediaStream: MediaStream | null = null;

    const startCamera = async () => {
      setCameraStatus('requesting');
      setErrorMessage(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraStatus('unsupported');
          setErrorMessage('הדפדפן אינו תומך בגישה ישירה למצלמה. ניתן להעלות תמונה מקובץ.');
          return;
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 }
          },
          audio: false
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        currentMediaStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
            setCameraStatus('active');
          };
        }

        // Check torch / flash capability
        const track = mediaStream.getVideoTracks()[0];
        if (track) {
          const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
          setHasTorch(Boolean(capabilities.torch));
        }
      } catch (err: any) {
        console.warn('Camera stream error:', err);
        setCameraStatus('error');
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage('הגישה למצלמה נחסמה על ידי המשתמש. נא לאשר הרשאות מצלמה בדפדפן, או להשתמש בהעלאת קובץ.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMessage('לא נמצאה מצלמה מחוברת במכשיר.');
        } else {
          setErrorMessage(`שגיאה בהפעלת מצלמה: ${err.message || 'התקן לא זמין'}`);
        }
      }
    };

    if (isOpen && !capturedImage) {
      startCamera();
    }

    // Try get GPS Location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoCoordinates(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        },
        () => {},
        { timeout: 5000 }
      );
    }

    return () => {
      if (currentMediaStream) {
        currentMediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode, capturedImage]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const newTorchState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: newTorchState }]
        });
        setIsTorchOn(newTorchState);
      } catch (e) {
        console.warn('Torch constraint error:', e);
      }
    }
  };

  // Flip rear / front camera
  const toggleCameraFacing = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame from live video
  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Shutter flash effect
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw full frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(rawDataUrl);

    // Stop active camera stream while previewing
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Handle manual file / gallery upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Process and extract signature ink from captured image
  useEffect(() => {
    if (!capturedImage) {
      setProcessedSignature(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle rotation
      if (rotation === 90 || rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // If signature extraction mode: crop signature region (central/bottom 50% width x 35% height)
      let targetCanvas = canvas;
      if (activeScanMode === 'signature') {
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx) {
          // Centered signature box
          const cropW = Math.round(canvas.width * 0.75);
          const cropH = Math.round(canvas.height * 0.45);
          const cropX = Math.round((canvas.width - cropW) / 2);
          const cropY = Math.round((canvas.height - cropH) / 2 + (canvas.height * 0.1));

          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          targetCanvas = cropCanvas;
        }
      }

      const targetCtx = targetCanvas.getContext('2d');
      if (!targetCtx) return;

      // Pixel-level Ink Filtering & Binarization
      if (filterMode !== 'original') {
        const imgData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
        const data = imgData.data;
        const contrastFactor = (259 * (contrastLevel + 255)) / (255 * (259 - contrastLevel));

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Grayscale luminance
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (filterMode === 'grayscale') {
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          } else if (filterMode === 'auto_ink') {
            // Adaptive Ink Extraction: Pen strokes (darker than threshold) become dark royal blue/black ink
            // Paper background (lighter than threshold) becomes transparent or pure white
            if (gray < thresholdLevel) {
              // Ink stroke: enhance deep crisp blue/black
              data[i] = Math.max(0, Math.min(255, Math.round(gray * 0.3))); // R
              data[i + 1] = Math.max(0, Math.min(255, Math.round(gray * 0.4))); // G
              data[i + 2] = Math.max(0, Math.min(255, Math.round(gray * 0.9 + 20))); // B (rich ink blue)
              data[i + 3] = 255;
            } else {
              if (isTransparentBg) {
                data[i + 3] = 0; // Transparent background for digital stamps
              } else {
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
                data[i + 3] = 255;
              }
            }
          } else if (filterMode === 'high_contrast') {
            // High contrast curve
            const cr = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
            const cg = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
            const cb = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
            data[i] = cr;
            data[i + 1] = cg;
            data[i + 2] = cb;
          }
        }
        targetCtx.putImageData(imgData, 0, 0);
      }

      setProcessedSignature(targetCanvas.toDataURL('image/png'));
    };
    img.src = capturedImage;
  }, [capturedImage, activeScanMode, filterMode, contrastLevel, thresholdLevel, rotation, isTransparentBg]);

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    setProcessedSignature(null);
    setRotation(0);
  };

  // Confirm and save scanned signature to delivery note
  const handleSaveAndAppend = async () => {
    if (!selectedOrder || !processedSignature) return;

    try {
      setIsSaving(true);
      const orderId = selectedOrder.orderId || selectedOrder.orderNumber;
      
      // Post to backend endpoint to persist in Google Sheets
      await fetch('/api/delivery-notes/append-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          signatureBase64: processedSignature,
          fullDocBase64: capturedImage || undefined,
          signerName: signerName || selectedOrder.customerName,
          signerRole,
          location: geoCoordinates || selectedOrder.siteAddress,
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        })
      }).catch(err => console.warn('API sync warning:', err));

      // Call parent handler to update React state
      await onSaveScannedSignature(
        orderId, 
        processedSignature, 
        capturedImage || undefined,
        {
          name: signerName || selectedOrder.customerName,
          role: signerRole,
          location: geoCoordinates || selectedOrder.siteAddress,
          notes: scanNotes
        }
      );

      onClose();
    } catch (err: any) {
      console.error('Error saving scanned signature:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter orders for searchable dropdown
  const filteredOrders = orders.filter(o => 
    (o.orderNumber || '').includes(orderSearchTerm) ||
    (o.customerName || '').toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
    (o.siteAddress || '').toLowerCase().includes(orderSearchTerm.toLowerCase())
  );

  const matchedDeliveryNote = deliveryNotes.find(n => 
    selectedOrder && (n.orderId === selectedOrder.orderId || n.orderId === selectedOrder.orderNumber)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Hidden File Input for fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className={`rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-right border flex flex-col max-h-[92vh] ${
        isLight ? 'bg-white border-sky-200 shadow-sky-200/50' : 'bg-slate-900 border-slate-800 shadow-2xl'
      }`}>
        
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isLight 
            ? 'bg-gradient-to-r from-sky-50 via-white to-blue-50 border-sky-100' 
            : 'bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${
              isLight ? 'bg-sky-100 border-sky-300 text-sky-700' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
            }`}>
              <Camera className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-xl border ${
                  isLight ? 'bg-sky-100 text-sky-900 border-sky-300' : 'bg-cyan-950 text-cyan-400 border-cyan-800'
                }`}>
                  סורק מצלמה מקורי (Live Camera Scanner)
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  טכנולוגיית פענוח והצמדת חתימות נייר לתעודות משלוח
                </span>
              </div>
              <h2 className={`text-lg sm:text-xl font-black font-hebrew-heavy tracking-tight mt-0.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                סריקת חתימה פיזית מתעודת משלוח
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-2xl transition border ${
              isLight ? 'hover:bg-slate-100 text-slate-500 border-slate-200' : 'hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Top Bar: Order & Delivery Note Target Selection */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-500 shrink-0" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  הצמד חתימה לתעודת משלוח / הזמנה:
                </span>
              </div>

              {/* Order Selector Dropdown */}
              <div className="relative flex-1 max-w-md">
                <button
                  type="button"
                  onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between border transition ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 shadow-sm' 
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-cyan-600 dark:text-cyan-400">
                      #{selectedOrder?.orderNumber || selectedOrder?.orderId || 'בחר הזמנה'}
                    </span>
                    <span className="truncate">{selectedOrder?.customerName}</span>
                    <span className="text-[10px] text-slate-400">({selectedOrder?.city})</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {isOrderDropdownOpen && (
                  <div className={`absolute z-30 top-full mt-1.5 w-full rounded-2xl shadow-2xl border overflow-hidden p-2 space-y-1 text-right ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                      <input
                        type="text"
                        value={orderSearchTerm}
                        onChange={(e) => setOrderSearchTerm(e.target.value)}
                        placeholder="חיפוש לפי מספר, לקוח או עיר..."
                        className="w-full pl-2 pr-8 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredOrders.map(order => {
                        const isChosen = selectedOrder?.orderNumber === order.orderNumber;
                        const hasSig = order.signatureReceived || order.signatureImage;

                        return (
                          <button
                            key={order.orderNumber}
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setSignerName(order.customerName || '');
                              setIsOrderDropdownOpen(false);
                            }}
                            className={`w-full p-2 rounded-xl text-xs flex items-center justify-between text-right transition ${
                              isChosen 
                                ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono font-bold">#{order.orderNumber}</span>
                              <span className="truncate">{order.customerName}</span>
                              <span className="text-[10px] text-slate-400">{order.city}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {hasSig && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                  נחתם
                                </span>
                              )}
                              {isChosen && <Check className="w-4 h-4 text-cyan-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Order Summary Chips */}
            {selectedOrder && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  תעודת משלוח: DN-{selectedOrder.orderNumber}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-300">
                  יעד: {selectedOrder.siteAddress}, {selectedOrder.city}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-300">
                  נהג: {selectedOrder.assignedDriver || selectedOrder.driver}
                </span>
                {matchedDeliveryNote?.isSigned && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1 mr-auto">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>כבר קיימת חתימה (סריקה זו תעדכן את הרישום)</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* MAIN CAMERA SCANNER / CAPTURE VIEW */}
          {!capturedImage ? (
            <div className="space-y-4">
              {/* Camera Stream Container with HUD & Viewfinder Overlays */}
              <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 aspect-[4/3] sm:aspect-[16/9] flex items-center justify-center shadow-2xl">
                
                {/* Live Native Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    cameraStatus === 'active' ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Shutter flash animation effect */}
                {flashEffect && (
                  <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />
                )}

                {/* Camera Status Loading / Error Overlay */}
                {cameraStatus === 'requesting' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-6 space-y-3">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    <p className="text-sm font-bold text-white">מאתחל מצלמה מקורית ומבקש הרשאות וידאו...</p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      נא לאשר גישה למצלמה בחלון הקופץ בדפדפן כדי לסרוק תעודות משלוח.
                    </p>
                  </div>
                )}

                {(cameraStatus === 'error' || cameraStatus === 'unsupported') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-center p-6 space-y-4">
                    <AlertCircle className="w-10 h-10 text-amber-400" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">לא ניתן להפעיל שידור חי במצלמה</p>
                      <p className="text-xs text-slate-400 max-w-md">{errorMessage}</p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>צלם או העלה תמונה מהמכשיר</span>
                    </button>
                  </div>
                )}

                {/* HUD Viewfinder Targeting Overlay (When camera is active) */}
                {cameraStatus === 'active' && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-10">
                    {/* Top Status Bar */}
                    <div className="flex items-center justify-between">
                      <div className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>LIVE CAMERA • {facingMode === 'environment' ? 'מצלמה אחורית' : 'מצלמה קדמית'}</span>
                      </div>
                      
                      {geoCoordinates && (
                        <div className="px-2.5 py-1 rounded-full bg-slate-950/70 border border-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>GPS: {geoCoordinates}</span>
                        </div>
                      )}
                    </div>

                    {/* Central Viewfinder Guide / Target Box for Paper Document & Signature */}
                    <div className="relative mx-auto w-4/5 sm:w-3/5 h-44 sm:h-52 border-2 border-dashed border-cyan-400/80 rounded-2xl flex flex-col items-center justify-between p-3 bg-cyan-950/10 backdrop-blur-[1px]">
                      {/* Laser scanning line animation */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[bounce_2.5s_infinite] shadow-[0_0_12px_#38bdf8]" />

                      {/* Corner Target Markers */}
                      <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

                      <span className="px-2.5 py-0.5 rounded bg-slate-950/80 text-[11px] font-bold text-cyan-300 border border-cyan-500/30">
                        📄 כוון את אזור החתימה בתוך המסגרת
                      </span>

                      {/* Bottom target highlight for signature line */}
                      <div className="w-full bg-cyan-500/20 border border-cyan-400/60 rounded-xl p-2 text-center text-[10px] font-mono text-cyan-200">
                        ✍️ מקם את חתימת הלקוח הידנית כאן
                      </div>
                    </div>

                    {/* Bottom Helper */}
                    <div className="text-center">
                      <span className="px-3 py-1 rounded-full bg-slate-950/70 text-slate-300 text-[11px] font-medium backdrop-blur-sm">
                        החזק את המכשיר ביציבות ולחץ על כפתור הצילום
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Interactive Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  {/* Flip Camera */}
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    title="החלף בין מצלמה קדמית לאחורית"
                    className={`p-3 rounded-2xl border font-bold text-xs transition flex items-center gap-1.5 ${
                      isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <FlipHorizontal className="w-4 h-4 text-cyan-500" />
                    <span className="hidden sm:inline">החלף מצלמה</span>
                  </button>

                  {/* Torch Toggle if supported */}
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      title="הדלק/כבה פנס תאורה"
                      className={`p-3 rounded-2xl border font-bold text-xs transition flex items-center gap-1.5 ${
                        isTorchOn 
                          ? 'bg-amber-500 text-slate-950 border-amber-400' 
                          : isLight 
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      {isTorchOn ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4 text-amber-400" />}
                      <span className="hidden sm:inline">{isTorchOn ? 'כבה פנס' : 'הדלק פנס'}</span>
                    </button>
                  )}

                  {/* Upload from Gallery / File fallback */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="בחר תמונה קיימת או השתמש במצלמת המכשיר הרגילה"
                    className={`p-3 rounded-2xl border font-bold text-xs transition flex items-center gap-1.5 ${
                      isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-sky-500" />
                    <span className="hidden sm:inline">העלה מקובץ</span>
                  </button>
                </div>

                {/* GIANT CAPTURE SHUTTER BUTTON */}
                <button
                  type="button"
                  onClick={handleCaptureFrame}
                  disabled={cameraStatus !== 'active'}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-xl shadow-cyan-500/25 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-slate-950" />
                  <span>צלם חתימה מהנייר</span>
                </button>
              </div>
            </div>
          ) : (
            /* PREVIEW, ENHANCEMENT & SIGNATURE CROP EDITING VIEW */
            <div className="space-y-5">
              
              {/* Mode Switcher: Extract Signature Stamp vs Full Document */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveScanMode('signature')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      activeScanMode === 'signature'
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>חיתוך ובידוד חתימה (חתימה דיגיטלית)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScanMode('full_document')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      activeScanMode === 'full_document'
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>סריקת תעודת משלוח מלאה</span>
                  </button>
                </div>

                {/* Retake & Rotate buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRotation(r => (r + 90) % 360)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1"
                    title="סובב ב-90 מעלות"
                  >
                    <RotateCw className="w-4 h-4 text-cyan-400" />
                    <span>סובב</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>צלם מחדש</span>
                  </button>
                </div>
              </div>

              {/* Side-by-Side: Processed Signature / Document Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left: Original Raw Capture */}
                <div className={`p-4 rounded-3xl border space-y-2 flex flex-col justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">תמונת מקור שצולמה</span>
                    <span className="font-mono text-[10px] text-slate-400">RAW CAPTURE</span>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center">
                    <img
                      src={capturedImage}
                      alt="תמונת מקור"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Right: Extracted & Processed Signature Stamp */}
                <div className={`p-4 rounded-3xl border space-y-2 flex flex-col justify-between ${
                  isLight ? 'bg-sky-50/70 border-sky-200' : 'bg-cyan-950/30 border-cyan-800/80'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-cyan-600 dark:text-cyan-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      חתימה מחולצת ומעובדת (תוצמד לרישום)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                      INK DETECTED
                    </span>
                  </div>
                  
                  {/* Processed Signature Stamp Display */}
                  <div className="relative rounded-2xl overflow-hidden bg-white border-2 border-dashed border-cyan-400/80 aspect-video flex items-center justify-center p-4 shadow-inner">
                    {processedSignature ? (
                      <img
                        src={processedSignature}
                        alt="חתימה מחולצת"
                        className="max-h-full max-w-full object-contain filter drop-shadow-md"
                      />
                    ) : (
                      <div className="text-xs text-slate-400">מעבד חתימה...</div>
                    )}
                    <span className="absolute bottom-1.5 right-2 text-[10px] text-slate-400 font-mono">
                      חתימת מקבל: {selectedOrder?.customerName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ink Enhancement Filters & Sensitivity Controls */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>שיפור איכות וניקוי דיו מהנייר:</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterMode('auto_ink')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      filterMode === 'auto_ink'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>דיו כחול עמוק (מומלץ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('high_contrast')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      filterMode === 'high_contrast'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>ניגודיות מקסימלית</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('grayscale')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      filterMode === 'grayscale'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>גווני אפור (Grayscale)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('original')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      filterMode === 'original'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>תמונת מקור מלאה</span>
                  </button>
                </div>

                {/* Slider for ink threshold */}
                {filterMode === 'auto_ink' && (
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 w-full sm:w-1/2">
                      <span className="text-slate-400 shrink-0 font-medium">רגישות סף הדיו:</span>
                      <input
                        type="range"
                        min="70"
                        max="190"
                        value={thresholdLevel}
                        onChange={(e) => setThresholdLevel(Number(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                      <span className="font-mono text-cyan-400 w-8 text-left">{thresholdLevel}</span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={isTransparentBg}
                        onChange={(e) => setIsTransparentBg(e.target.checked)}
                        className="rounded accent-cyan-500 w-4 h-4"
                      />
                      <span>רקע חתימה שקוף (בול חותמת דיגיטלי)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Signer Details & Confirmation Fields */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <User className="w-4 h-4 text-cyan-500" />
                  <span>פרטי החותם באתר ואישור מסירה:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      שם החותם / מקבל הסחורה:
                    </label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="שם החותם (לדוג' מוחמד / יוסי)..."
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-cyan-500 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      תפקיד / זיקה באתר:
                    </label>
                    <select
                      value={signerRole}
                      onChange={(e) => setSignerRole(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-cyan-500 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    >
                      <option value="מנהל עבודה / אתר">מנהל עבודה / אתר</option>
                      <option value="קבלן מבצע">קבלן מבצע</option>
                      <option value="בעל הנכס / לקוח סופי">בעל הנכס / לקוח סופי</option>
                      <option value="מפקח בנייה">מפקח בנייה</option>
                      <option value="נהג משאית (ח. סבן)">נהג משאית (ח. סבן)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    הערות פריקה (אופציונלי):
                  </label>
                  <input
                    type="text"
                    value={scanNotes}
                    onChange={(e) => setScanNotes(e.target.value)}
                    placeholder="נפרק בשלמות בחזית הבניין, שקי בלה הונחו במפלס כביש..."
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-cyan-500 ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className={`p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition border ${
              isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            ביטול וסגירה
          </button>

          {capturedImage && (
            <button
              type="button"
              onClick={handleSaveAndAppend}
              disabled={isSaving || !processedSignature || !selectedOrder}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>שומר ומצמיד חתימה לרישום...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>אשר והצמד חתימה לתעודת משלוח DN-{selectedOrder?.orderNumber} ✓</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
