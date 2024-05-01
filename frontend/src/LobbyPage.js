import React, { useState } from 'react';
import { Button, TextField } from '@mui/material';
import Toast from './Toast';
import { fetchWrapper, getUsername } from './Helpers';
import { useNavigate } from "react-router-dom";
import HowToPlayDialog from './HowToPlayDialog';

export default function LobbyPage() {
    let [gameId, setGameId] = useState('');
    let [message, setMessage] = useState(null);
    let [error, setError] = useState(null);
    let [howToPlayOpen, setHowToPlayOpen] = useState(false);
    let navigate = useNavigate();
  
    getUsername(setHowToPlayOpen);

    function showMessage(text, isError = false) {
        if (isError) {
            setError(text);
            setTimeout(() => setError(null), 3000);
        } else {
            setMessage(text);
            setTimeout(() => setMessage(null), 3000);
        }
    }

    function newGame(id) {
        fetchWrapper('/new_game', { id }, 'POST')
            .then(response => {
                if (response.success) {
                    navigate(`/game/${response.game.id}`);
                } else {
                    showMessage(response.error, true);
                }
            });
    }

    function joinGame(id) {
        fetchWrapper('/game', { id }, 'GET')
            .then(response => {
                if (response.success) {
                    navigate(`/game/${id}`);
                } else {
                    showMessage(response.error, true);
                }
            })
    }

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'fixed', left: 0, top: 10 }}>
            {error && <Toast message={error} onClose={() => setError(null)} />}
            {message && <Toast message={message} onClose={() => setMessage(null)} isError={false} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <TextField
                    label="Game ID"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                />
                <Button 
                    variant="contained"
                    onClick={() => setHowToPlayOpen(true)}
                >
                    How to Play
                </Button>
                <Button
                    variant="contained"
                    onClick={() => newGame(gameId)}
                >
                    New Game
                </Button>
                <Button
                    variant="contained"
                    onClick={() => joinGame(gameId)}
                >
                    Join Game
                </Button>
            </div>
            <HowToPlayDialog open={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />
        </div>
    );
}