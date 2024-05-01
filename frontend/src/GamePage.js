import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchWrapper, getUsername } from './Helpers';
import { TextField, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Paper } from '@mui/material';
import io from 'socket.io-client';
import Toast from './Toast';
import './GamePage.css';

function label(rowIndex, columnIndex) {
    let rowLabel = String.fromCharCode(65 + rowIndex);
    let colLabel = columnIndex + 1;
    return `${rowLabel}${colLabel}`;
}

function CurrentClue({ game, username }) {
    let currentClue = game.clue;

    if (!currentClue) {
        return null;
    }

    let isMine = currentClue.username === username;

    let style = {
        backgroundColor: isMine ? 'pink' : 'white',
        padding: '10px',
        margin: '10px',
        textAlign: 'center',
    }

    return (
        <Typography variant="h5" style={style}>
            {currentClue.text}
        </Typography>
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

    return (
        <TableContainer component={Paper} sx={{ maxWidth: 800, margin: 'auto', marginTop: 4 }}>
            <Table aria-label="word grid">
                <TableHead>
                    <TableRow>
                        <TableCell align="center" />
                        {words.horizontal.map((word, index) => (
                            <TableCell key={index} align="center">{word}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {words.vertical.map((word, rowIndex) => (
                        <TableRow key={rowIndex}>
                            <TableCell component="th" scope="row" align="center">{word}</TableCell>
                            {Array.from({ length: 5 }).map((_, colIndex) => (
                                <TableCell key={colIndex} align="center">
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleButtonClick(rowIndex, colIndex)}
                                        style={{ backgroundColor: isMyCard(rowIndex, colIndex) ? 'pink' : isUsed(rowIndex, colIndex) ? 'lightgreen' : 'white' }}
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
          label="Give clue"
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

function Game({ game, username, guess, drawCard, giveClue }) {
    if (!game) {
        return null
    }

    let myCard = game.outstanding.filter(clue => clue.username === username)?.[0]?.square;

    return (
        <div className="game-container">
            <CurrentClue game={game} username={username} />
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Button disabled={!!myCard} variant="contained" onClick={drawCard} style={{ margin: '10px' }}>Draw Card</Button>
                {myCard && <Typography variant="h5" style={{ margin: '10px' }}>Your card: {label(myCard.y, myCard.x)}</Typography>}
                <Typography variant="h5" style={{ margin: '10px' }}>Remaining cards: {game.deck.squares.length}</Typography>
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

    let username = getUsername();

    function showMessage(text, isError = false) {
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
            setSocket(io.connect(process.env.REACT_APP_BACKEND_API_URL))
        }
    }, [socket]);

    useEffect(() => {
        if (socket) {
            socket.emit('join', { room: id })
            socket.on('disconnect', () => {
                setSocket(null);
            });
            socket.on('update', (data) => {
                console.log('received update', data);
                setGame(data.game);
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {error && <Toast message={error} isError={true} />}
            {message && <Toast message={message} />}
            <Game game={game} guess={guess} drawCard={drawCard} giveClue={giveClue} username={username} />
        </div>
    )
}