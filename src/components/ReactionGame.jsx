// src/components/ReactionGame.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { load } from '@tauri-apps/plugin-store';
import Scoreboard from './Scoreboard';
import PlayerNameInput from './PlayerNameInput';

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
    const [showScores, setShowScores] = useState(false);
    const [scores, setScores] = useState([]);
    const [playerName, setPlayerName] = useState('');

    // Cargar el nombre del jugador al inicio
    useEffect(() => {
        const loadPlayerName = async () => {
            try {
                const store = await load('settings.json', { autoSave: true });
                const savedName = await store.get('playerName');
                if (savedName) {
                    setPlayerName(savedName);
                }
            } catch (error) {
                console.error('Error loading player name:', error);
            }
        };

        loadPlayerName();
    }, []);

    // Cargar puntuaciones iniciales
    useEffect(() => {
        const fetchScores = async () => {
            try {
                const scoreData = await invoke('get_score');
                const formattedScores = scoreData.map(player => ({
                    name: player.name,
                    time: player.score
                }));
                setScores(formattedScores);
            } catch (error) {
                console.error('Error al obtener puntuaciones:', error);
            }
        };

        fetchScores();
    }, []);

    const handleNameSubmit = (name) => {
        setPlayerName(name);
    };

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

            const newScore = {
                name: playerName,
                time: reactionTime
            };

            setScores(prevScores => [...prevScores, newScore].sort((a, b) => a.time - b.time));
            console.log('Nueva puntuación:', newScore);
        }
    }, [gameState, startTime, timeoutId, playerName]);

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

    const toggleScores = (e) => {
        e.stopPropagation();
        setShowScores(!showScores);
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

    if (!playerName) {
        return <PlayerNameInput onNameSubmit={handleNameSubmit} />;
    }

    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer"
            onClick={handleInteraction}
        >
            {gameState === GameStates.IDLE && (
                <div className="flex flex-col items-center gap-4">
                    <div className="text-xl mb-4">
                        Bienvenido, {playerName}
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={startGame}
                            className="px-8 py-4 text-lg font-semibold text-white bg-blue-500 border-none rounded-lg cursor-pointer hover:bg-blue-600 transition-colors duration-200"
                        >
                            Comenzar
                        </button>
                        <button
                            onClick={toggleScores}
                            className="px-8 py-4 text-lg font-semibold text-white bg-green-500 border-none rounded-lg cursor-pointer hover:bg-green-600 transition-colors duration-200"
                        >
                            {showScores ? 'Ocultar Puntuaciones' : 'Ver Puntuaciones'}
                        </button>
                    </div>
                </div>
            )}

            {gameState !== GameStates.IDLE && (
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

            {showScores && <Scoreboard scores={scores} />}

            <div className="fixed bottom-4 text-sm text-gray-600 pointer-events-none">
                Haz clic o presiona Z/X para reaccionar
            </div>
        </div>
    );
}