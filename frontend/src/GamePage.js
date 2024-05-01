import React, { useState, useEffect } from 'react';
import { baseUrl } from './Settings';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchWrapper, getUsername } from './Helpers';
import { createTheme, ThemeProvider, TextField, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Paper } from '@mui/material';
import io from 'socket.io-client';
import Toast from './Toast';
import HowToPlayDialog from './HowToPlayDialog';
import './GamePage.css';

const theme = createTheme({
    palette: {
        background: {
            default: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
        },
        primary: {
            main: '#ff1744',
        },
        secondary: {
            main: '#2979ff',
        },
        text: {
            primary: '#333',
            secondary: '#555',
        }
    },
    components: {
        MuiTableCell: {
            styleOverrides: {
                root: {
                    border: '2px solid black',
                    borderRadius: '5px',
                    backgroundColor: 'white'
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: 'lightblue',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 8px 16px 0 rgba(0,0,0,0.2)'
                }
            }
        }
    }
});

function label(rowIndex, columnIndex) {
    let rowLabel = String.fromCharCode(65 + rowIndex);
    let colLabel = columnIndex + 1;
    return `${rowLabel}${colLabel}`;
}

function CurrentClue({ game, username }) {
    let clue = game?.clue;
    if (!clue) return null;
    const isMine = clue.username === username;
    const className = `clue ${isMine ? 'mine' : ''}`;

    return (
        <div className={className}>
            <Typography variant="h4">Current clue{isMine ? ' (yours)' : ''}: {clue.text}</Typography>
        </div>
    )
}

function GameGrid({ game, guess, username }) {
    let words = game.words;
    let currentCard = game.outstanding.filter(clue => clue.username === username)?.[0]?.square;

    const handleButtonClick = (row, col) => {
        guess(row, col);
    };

    function isMyCard(rowIndex, columnIndex) {
        return currentCard && currentCard.x === columnIndex && currentCard.y === rowIndex;
    }

    function isUsed(rowIndex, columnIndex) {
        return game.correct.filter(square => square.x === columnIndex && square.y === rowIndex).length > 0;
    }

    let isMyClue = game?.clue?.username === username;

    function isDisabled(rowIndex, columnIndex) {
        return !game.clue || isUsed(rowIndex, columnIndex) || isMyCard(rowIndex, columnIndex) || isMyClue;
    }

    return (
        <ThemeProvider theme={theme}>
            <TableContainer component={Paper} className="table-container">
                <Table aria-label="word grid">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" sx={{ border: 'none', visibility: 'hidden' }} />
                            {words.horizontal.map((word, index) => (
                                <TableCell key={index} align="center" style={{ minWidth: '80px', borderRadius: '5px', backgroundColor: 'orange', fontWeight: 'bold' }}>{word}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {words.vertical.map((word, rowIndex) => (
                            <TableRow key={rowIndex}>
                                <TableCell component="th" scope="row" align="center" style={{ fontWeight: 'bold', borderRadius: '5px', backgroundColor: 'orange' }}>{word}</TableCell>
                                {Array.from({ length: 5 }).map((_, colIndex) => (
                                    <TableCell key={colIndex} align="center" className="button-cell" sx={{
                                        borderRadius: '5px',
                                        backgroundColor: isMyCard(rowIndex, colIndex) ? 'red' : isUsed(rowIndex, colIndex) ? 'lightgreen' : 'white',
                                        padding: '0px', 
                                    }}>
                                        <Button
                                            onClick={() => handleButtonClick(rowIndex, colIndex)}
                                            disabled={isDisabled(rowIndex, colIndex)}
                                            style={{ color: 'black', height: '100%', padding: '16px' }}
                                            fullWidth
                                            className="no-hover"
                                        >
                                            {label(rowIndex, colIndex)}
                                        </Button>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </ThemeProvider>
    );
};

function ClueUI({ game, giveClue }) {
    let [clue, setClue] = useState('');

    let currentClue = game.clue;

    if (currentClue) {
        return null;
    }

    function handleChange(event) {
        setClue(event.target.value);
    }

    function handleSubmit(event) {
        event.preventDefault();
        giveClue(clue);
        setClue('');
    }

    return (
        <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="row" alignItems="center" justifyContent="center" gap={2} marginTop={2}>
                <TextField
                    variant="outlined"
                    value={clue}
                    onChange={handleChange}
                />
                <Button type="submit" variant="contained" color="primary">
                    Give Clue
                </Button>
            </Box>
        </form>
    );
}

function Game({ backToLobby, setHowToPlayOpen, game, username, refresh, guess, drawCard, giveClue }) {
    if (!game) {
        return null
    }

    if (game.finalScore !== undefined) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                <Typography variant="h4">Game Over</Typography>
                <Typography variant="h5">Score: {game.finalScore}</Typography>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Button variant="contained" onClick={refresh}>Play Again</Button>
                    <Button variant="contained" onClick={backToLobby}>Back to Lobby</Button>
                </div>
                <GameGrid game={game} guess={guess} username={username} />
            </div>
        )
    }

    let myCard = game.outstanding.filter(clue => clue.username === username)?.[0]?.square;

    return (
        <div className="game-container">
            <CurrentClue game={game} username={username} />
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Button disabled={!!myCard} variant="contained" onClick={drawCard} style={{ margin: '10px', color: !!myCard ? 'black' : 'white' }}>
                    {myCard ? `${label(myCard.y, myCard.x)}` : 'Draw Card'}
                    {` (${game?.deck?.squares?.length} remaining)`}
                </Button>
                <Button variant="contained" onClick={() => setHowToPlayOpen(true)} style={{ margin: '10px' }}>
                    How to Play
                </Button>
            </div>
            <ClueUI game={game} username={username} giveClue={giveClue} />
            <GameGrid game={game} guess={guess} username={username} />
        </div>

    )

}

export default function GamePage() {
    let { id } = useParams();
    let [socket, setSocket] = useState(null);
    let [game, setGame] = useState(null);
    let [message, setMessage] = useState('');
    let [error, setError] = useState(null);
    let [howToPlayOpen, setHowToPlayOpen] = useState(false);
    let navigate = useNavigate();

    function backToLobby() {
        navigate('/');
    }

    let username = getUsername(setHowToPlayOpen);

    function showMessage(text, isError = false) {
        console.log(text, isError)
        if (isError) {
            setError(text);
            setTimeout(() => setError(null), 3000);
        } else {
            setMessage(text);
            setTimeout(() => setMessage(null), 3000);
        }
    }

    useEffect(() => {
        if (!socket) {
            setSocket(io.connect(baseUrl))
        }
    }, [socket]);

    useEffect(() => {
        if (socket) {
            socket.emit('join', { room: id })
            socket.on('disconnect', () => {
                setSocket(null);
            });
            socket.on('update', (data) => {
                setGame(data.game);
                if (data.correct !== undefined) {
                    if (data.correct) {
                        showMessage(`Correct guess!`, false)
                    } else {
                        showMessage(`Incorrect guess!`, true)
                    }
                }
            }
            )
        }

        return () => {
            if (socket) {
                socket.emit('leave', { room: id });
                socket.off('disconnect');
                socket.off('update');
            }
        }
    }, [socket, id]);

    useEffect(() => {
        fetchWrapper('/game', { id }, 'GET')
            .then(response => {
                if (response.success) {
                    setGame(response.game);
                } else {
                    showMessage(response.error, true);
                }
            })
    }, [id]);

    function guess(row, col) {
        fetchWrapper('/guess', { id, row, col, username })
            .then(response => {
                if (response.success) {
                    setGame(response.game);
                } else {
                    showMessage(response.error, true);
                }
            })
    }

    function drawCard() {
        fetchWrapper('/draw_card', { id, username })
            .then(response => {
                if (response.success) {
                    setGame(response.game);
                } else {
                    showMessage(response.error, true);
                }
            })
    }

    function giveClue(clue) {
        fetchWrapper('/give_clue', { id, username, clue })
            .then(response => {
                if (response.success) {
                    setGame(response.game);
                } else {
                    showMessage(response.error, true);
                }
            })
    }

    function refresh() {
        fetchWrapper('/refresh', { id }, 'POST')
            .then(response => {
                if (response.success) {
                    setGame(response.game);
                } else {
                    showMessage(response.error, true);
                }
            });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {error && <Toast message={error} isError={true} />}
            {message && <Toast message={message} isError={false} />}
            <Game game={game} guess={guess} drawCard={drawCard} giveClue={giveClue} username={username} refresh={refresh} setHowToPlayOpen={setHowToPlayOpen} backToLobby={backToLobby}/>
            <HowToPlayDialog open={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />
        </div>
    )
}