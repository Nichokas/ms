// src/components/ReactionGame.jsx
import React, { useState, useEffect, useCallback } from 'react';

const GameStates = {
    IDLE: 'idle',
    WAITING: 'waiting',
    READY: 'ready'
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

    const handleInteraction = useCallback((e) => {
        if (e?.target?.tagName === 'BUTTON') {
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