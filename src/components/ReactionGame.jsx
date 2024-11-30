// src/components/ReactionGame.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const GameStates = {
    IDLE: 'idle',
    WAITING: 'waiting',
    READY: 'ready',
    UPDATING: 'updating'
};

const Colors = {
    BLUE: '#2196f3',
    YELLOW: '#ffeb3b',
    GREEN: '#4caf50',
    RED: '#f44336'
};

export default function ReactionGame() {
    const [gameState, setGameState] = useState(GameStates.IDLE);
    const [startTime, setStartTime] = useState(null);
    const [result, setResult] = useState('');
    const [timeoutId, setTimeoutId] = useState(null);
    const [updateStatus, setUpdateStatus] = useState('');
    const [downloadProgress, setDownloadProgress] = useState(0);

    // Función para manejar actualizaciones
    const checkForUpdates = async () => {
        try {
            const update = await check();
            if (update) {
                setGameState(GameStates.UPDATING);
                setUpdateStatus(`Nueva actualización disponible: ${update.version}`);

                let downloaded = 0;
                let contentLength = 0;

                await update.downloadAndInstall((event) => {
                    switch (event.event) {
                        case 'Started':
                            contentLength = event.data.contentLength;
                            setUpdateStatus('Iniciando descarga...');
                            break;
                        case 'Progress':
                            downloaded += event.data.chunkLength;
                            const progress = (downloaded / contentLength) * 100;
                            setDownloadProgress(progress);
                            setUpdateStatus(`Descargando: ${progress.toFixed(1)}%`);
                            break;
                        case 'Finished':
                            setUpdateStatus('Descarga completada. Reiniciando...');
                            break;
                    }
                });

                setUpdateStatus('Actualización instalada. Reiniciando...');
                await relaunch();
            }
        } catch (error) {
            console.error('Error al buscar actualizaciones:', error);
        }
    };

    useEffect(() => {
        checkForUpdates();
    }, []);

    const handleInteraction = useCallback((e) => {
        if (e?.target?.tagName === 'BUTTON' || gameState === GameStates.UPDATING) {
            return;
        }

        if (gameState === GameStates.WAITING) {
            if (timeoutId) clearTimeout(timeoutId);
            setGameState(GameStates.IDLE);
            document.body.style.backgroundColor = Colors.RED;
            setResult('¡Demasiado pronto! Inténtalo de nuevo');
        } else if (gameState === GameStates.READY) {
            const reactionTime = Date.now() - startTime;
            setGameState(GameStates.IDLE);
            document.body.style.backgroundColor = Colors.BLUE;
            setResult(`Tiempo de reacción: ${reactionTime}ms`);
        }
    }, [gameState, startTime, timeoutId]);

    const startGame = (e) => {
        e.stopPropagation();
        setGameState(GameStates.WAITING);
        setResult('');
        document.body.style.backgroundColor = Colors.YELLOW;

        const delay = 1000 + Math.random() * 3000;
        const newTimeoutId = setTimeout(() => {
            setGameState(GameStates.READY);
            document.body.style.backgroundColor = Colors.GREEN;
            setStartTime(Date.now());
        }, delay);

        setTimeoutId(newTimeoutId);
    };

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'z' || e.key === 'x') {
                handleInteraction();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [handleInteraction, timeoutId]);

    if (gameState === GameStates.UPDATING) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
                <div className="text-2xl mb-4">{updateStatus}</div>
                {downloadProgress > 0 && (
                    <div className="w-64 bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${downloadProgress}%` }}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer"
            onClick={handleInteraction}
        >
            {gameState === GameStates.IDLE ? (
                <button
                    onClick={startGame}
                    className="px-8 py-4 text-lg font-semibold text-white bg-blue-500 border-none rounded-lg cursor-pointer hover:bg-blue-600 transition-colors duration-200"
                >
                    Comenzar
                </button>
            ) : (
                <div className="text-center pointer-events-none">
                    <div className="text-6xl mb-5">
                        {gameState === GameStates.WAITING ? '⌛' : '🎯'}
                    </div>
                    <div className="text-2xl font-medium">
                        {gameState === GameStates.WAITING ? 'Espera...' : '¡YA!'}
                    </div>
                </div>
            )}

            {result && (
                <div className="mt-6 text-2xl font-medium pointer-events-none">
                    {result}
                </div>
            )}

            <div className="fixed bottom-4 text-sm text-gray-600 pointer-events-none">
                Haz clic o presiona Z/X para reaccionar
            </div>
        </div>
    );
}