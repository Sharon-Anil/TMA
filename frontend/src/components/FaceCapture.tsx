"use client";
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCamera, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

interface FaceCaptureProps {
  onCapture: (blob: Blob, descriptor: number[] | null) => void;
  onRetake?: () => void;
}

type DetectionStatus = 'idle' | 'loading' | 'no_face' | 'multiple_faces' | 'face_found';

export default function FaceCapture({ onCapture, onRetake }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [phase, setPhase] = useState<'start' | 'live' | 'captured'>('start');
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>('idle');
  const [videoReady, setVideoReady] = useState(false);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  // Load all 3 face-api.js models needed for full recognition
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const faceapi = await import('@vladmandic/face-api');
        const MODEL_URL = '/models';
        const CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        const loadNet = async (net: any) => {
          if (!net.isLoaded) {
            try { await net.loadFromUri(MODEL_URL); }
            catch { await net.loadFromUri(CDN_URL); }
          }
        };
        await Promise.all([
          loadNet(faceapi.nets.tinyFaceDetector),
          loadNet(faceapi.nets.faceLandmark68TinyNet),
          loadNet(faceapi.nets.faceRecognitionNet),
        ]);
        if (!cancelled) setFaceApiLoaded(true);
      } catch (err) {
        console.error('Failed to load face-api models:', err);
        if (!cancelled) setFaceApiLoaded(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Attach stream to video element once both are ready
  useEffect(() => {
    if (phase === 'live' && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.onloadedmetadata = () => video.play();
      video.oncanplay = () => setVideoReady(true);
    }
  }, [phase]);

  // Live face detection loop
  useEffect(() => {
    if (phase !== 'live' || !faceApiLoaded) return;

    const runDetection = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const faceapi = await import('@vladmandic/face-api');
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        );

        if (!overlayCanvasRef.current || !videoRef.current) return;
        const ctx = overlayCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

          if (detections.length === 0) {
            setDetectionStatus('no_face');
          } else if (detections.length > 1) {
            setDetectionStatus('multiple_faces');
          } else {
            setDetectionStatus('face_found');
            // Draw green box around face
            const box = detections[0].box;
            const scaleX = overlayCanvasRef.current.width / videoRef.current.videoWidth;
            const scaleY = overlayCanvasRef.current.height / videoRef.current.videoHeight;
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x * scaleX, box.y * scaleY, box.width * scaleX, box.height * scaleY);
          }
        }
      } catch { /* silently fail on detection errors */ }
    };

    detectionIntervalRef.current = setInterval(runDetection, 400);
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [phase, faceApiLoaded]);

  const startCamera = async () => {
    try {
      setDetectionStatus('loading');
      setVideoReady(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = mediaStream;
      setPhase('live');
      setDetectionStatus('no_face');
    } catch (err) {
      alert('Camera access was denied. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
  };

  const captureImage = useCallback(async () => {
    if (detectionStatus !== 'face_found') {
      alert(detectionStatus === 'multiple_faces'
        ? 'Multiple faces detected. Please ensure only your face is in frame.'
        : 'No face detected. Please position your face clearly in the camera.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    // Generate 128-float face descriptor for recognition (no Python needed)
    let descriptor: number[] | null = null;
    try {
      const faceapi = await import('@vladmandic/face-api');
      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();
      if (detection) {
        descriptor = Array.from(detection.descriptor);
      }
    } catch (err) {
      console.warn('Could not compute face descriptor:', err);
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Failed to capture image. Please try again.');
        return;
      }
      stopCamera();
      const url = URL.createObjectURL(blob);
      setCapturedUrl(url);
      setPhase('captured');
      onCapture(blob, descriptor);
    }, 'image/jpeg', 0.95);
  }, [detectionStatus, onCapture]);


  const handleRetake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setPhase('start');
    setDetectionStatus('idle');
    setVideoReady(false);
    if (onRetake) onRetake();
    setTimeout(startCamera, 100);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, []);

  const statusConfig: Record<DetectionStatus, { color: string; text: string }> = {
    idle:            { color: 'text-gray-400',  text: 'Starting camera...' },
    loading:         { color: 'text-yellow-400', text: 'Starting camera...' },
    no_face:         { color: 'text-red-400',   text: '⚠ No face detected — look at the camera' },
    multiple_faces:  { color: 'text-orange-400', text: '⚠ Multiple faces — only you should be in frame' },
    face_found:      { color: 'text-green-400', text: '✓ Face detected — ready to capture!' },
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">

      {/* === START PHASE === */}
      {phase === 'start' && (
        <button
          type="button"
          onClick={startCamera}
          className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-400 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer text-gray-500 hover:text-purple-600 gap-2"
        >
          <FiCamera size={32} />
          <span className="text-xs font-bold">Enable Camera for Face Authentication</span>
          <span className="text-[10px] text-gray-400">Webcam only — uploads not permitted</span>
        </button>
      )}

      {/* === LIVE CAMERA PHASE === */}
      {phase === 'live' && (
        <div className="w-full flex flex-col gap-2">
          <div className="relative rounded-xl overflow-hidden bg-black w-full aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              onCanPlay={() => setVideoReady(true)}
            />
            {/* Overlay canvas for bounding box */}
            <canvas
              ref={overlayCanvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full"
            />

            {/* Capture button */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={captureImage}
                disabled={detectionStatus !== 'face_found' || !videoReady}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm shadow-lg transition-all ${
                  detectionStatus === 'face_found' && videoReady
                    ? 'bg-green-500 text-white hover:bg-green-400 cursor-pointer'
                    : 'bg-gray-600/70 text-gray-300 cursor-not-allowed'
                }`}
              >
                <FiCamera />
                {detectionStatus === 'face_found' && videoReady ? 'Capture Face' : 'Waiting for Face...'}
              </motion.button>
            </div>
          </div>

          {/* Status bar */}
          <div className={`text-center text-xs font-semibold py-1 px-3 rounded-lg bg-black/5 ${statusConfig[detectionStatus]?.color}`}>
            {statusConfig[detectionStatus]?.text}
            {!faceApiLoaded && phase === 'live' && (
              <span className="text-yellow-500 ml-2">(Live detection loading...)</span>
            )}
          </div>
        </div>
      )}

      {/* === CAPTURED PHASE === */}
      {phase === 'captured' && capturedUrl && (
        <div className="w-full flex flex-col gap-2">
          <div className="relative rounded-xl overflow-hidden w-full aspect-video bg-black">
            <img src={capturedUrl} className="w-full h-full object-cover" alt="Captured face" />
            <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <FiCheckCircle /> Face Captured
            </div>
          </div>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="button"
            onClick={handleRetake}
            className="w-full text-center py-2 text-xs font-bold text-gray-500 hover:text-purple-600 transition-colors cursor-pointer underline"
          >
            Retake Photo
          </motion.button>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
