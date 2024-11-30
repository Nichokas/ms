// src/components/PlayerNameInput.jsx
import React, { useState } from 'react';
import { load } from '@tauri-apps/plugin-store';

export default function PlayerNameInput({ onNameSubmit }) {
    const [name, setName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (name.trim()) {
            try {
                const store = await load('settings.json', { autoSave: true });
                await store.set('playerName', name.trim());
                await store.save();
                onNameSubmit(name.trim());
            } catch (error) {
                console.error('Error saving player name:', error);
            }
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Ingresa tu nombre</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tu nombre"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Comenzar
                    </button>
                </form>
            </div>
        </div>
    );
}