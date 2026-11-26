// src/components/Products/BarcodeScanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const FORMATS = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
];

const SCANNING = 2; // Html5QrcodeScannerState.SCANNING

const BarcodeScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null);
    const hasScannedRef = useRef(false);
    const onScanRef = useRef(onScan);
    const containerId = useRef(`barcode-reader-${Date.now()}`);
    const [error, setError] = useState(null);
    const [manualCode, setManualCode] = useState('');
    const [isStarting, setIsStarting] = useState(true);
    const [cameraReady, setCameraReady] = useState(false);
    const [scanSuccess, setScanSuccess] = useState(false);

    // Toujours la dernière version de onScan
    useEffect(() => { onScanRef.current = onScan; }, [onScan]);

    const beep = () => {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            const ctx = new AC();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 1200;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.start(); osc.stop(ctx.currentTime + 0.15);
            setTimeout(() => ctx.close(), 200);
        } catch (e) {}
    };

    const stopScanner = async () => {
        const s = scannerRef.current;
        if (!s) return;
        try {
            if (s.getState() === SCANNING) await s.stop();
        } catch (e) {}
        try { s.clear(); } catch (e) {}
    };

    const handleDecoded = (text) => {
        if (hasScannedRef.current) return;
        hasScannedRef.current = true;
        setScanSuccess(true);
        beep();
        navigator.vibrate?.(80);
        stopScanner().then(() => onScanRef.current?.(text));
    };

    const startCamera = async () => {
        try {
            setError(null); setIsStarting(true); setCameraReady(false);
            setScanSuccess(false); hasScannedRef.current = false;
            await stopScanner();

            if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
                throw new Error('La caméra nécessite HTTPS (ou localhost).');
            }

            scannerRef.current = new Html5Qrcode(containerId.current, {
                formatsToSupport: FORMATS,
                experimentalFeatures: { useBarCodeDetectorIfSupported: true },
                verbose: false,
            });

            await scannerRef.current.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    // Pas de qrbox : on analyse toute l'image (meilleur pour les codes 1D)
                    aspectRatio: 1.7778,
                    disableFlip: true,
                    videoConstraints: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                },
                handleDecoded,
                () => {}
            );

            // Mise au point continue si supportée
            try {
                await scannerRef.current.applyVideoConstraints({
                    advanced: [{ focusMode: 'continuous' }],
                });
            } catch (e) {}

            setIsStarting(false);
            setCameraReady(true);
        } catch (err) {
            setIsStarting(false);
            const msg = err?.message || String(err);
            if (msg.includes('Permission') || msg.includes('NotAllowed')) setError('Accès à la caméra refusé.');
            else if (msg.includes('NotFound')) setError('Aucune caméra détectée.');
            else if (msg.includes('NotReadable')) setError('Caméra déjà utilisée par une autre application.');
            else setError(msg);
        }
    };

    useEffect(() => {
        let mounted = true;
        const t = setTimeout(() => { if (mounted) startCamera(); }, 150);
        return () => {
            mounted = false;
            clearTimeout(t);
            stopScanner();
        };
        // eslint-disable-next-line
    }, []);

    const handleManualSubmit = () => {
        const code = manualCode.trim();
        if (!code) return;
        beep();
        stopScanner().then(() => onScanRef.current?.(code));
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title"><i className="fas fa-barcode me-2"></i>Scanner un code-barres</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-3">
                        {error && (
                            <div className="text-center py-2">
                                <div className="alert alert-danger mb-2">{error}</div>
                                <button className="btn btn-outline-primary" onClick={startCamera}>Réessayer</button>
                            </div>
                        )}

                        {/* Toujours monté, sinon html5-qrcode ne trouve pas l'élément */}
                        <div id={containerId.current} style={{
                            width: '100%', minHeight: 320, backgroundColor: '#000',
                            borderRadius: 8, overflow: 'hidden',
                            display: error ? 'none' : 'block',
                            boxShadow: scanSuccess ? '0 0 30px #00ff00' : 'none',
                        }} />

                        {!error && isStarting && <div className="text-center mt-2 small text-muted">Démarrage de la caméra...</div>}
                        {!error && cameraReady && !scanSuccess && (
                            <div className="alert alert-info mt-2 mb-0 text-center small">
                                Tenez le code-barres à 10–15 cm, bien éclairé et immobile
                            </div>
                        )}
                        {scanSuccess && <div className="alert alert-success mt-2 mb-0 text-center small">Code détecté !</div>}

                        <div className="input-group mt-3">
                            <input type="text" className="form-control" placeholder="Ou saisir le code manuellement..."
                                value={manualCode} onChange={(e) => setManualCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()} />
                            <button className="btn btn-outline-secondary" onClick={handleManualSubmit} disabled={!manualCode.trim()}>OK</button>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;