import React from 'react';
import { Typography, createTheme, ThemeProvider, Dialog, DialogContent, DialogTitle, DialogActions, Button } from '@mui/material';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

export default function HowToPlayDialog({ open, onClose }) {
    return (
        <ThemeProvider theme={darkTheme}>
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>How to Play</DialogTitle>
                <DialogContent>
                    <p> There is a 5x5 grid where the rows and columns are labelled with a word. </p>
                    <p> Others can join the game if you share the URL you're playing at, or by typing your game id on the lobby page.</p>
                    <p> Each player will draw a card. At any time, you can give a clue for your intersection. </p>
                    <p> Once someone has given a clue, the other players can discuss and then guess an intersection. They can't clue until they've resolved the current clue. </p>
                    <p> Anyone (besides the player who clued) can guess. You learn if you're right or wrong, but if you're wrong, you don't learn the correct answer. </p>
                    <p> Your goal is to get as many of the 25 cards correct as possible. </p>
                    <Typography variant="h6"> Minutia </Typography>
                    <p> The game technically doesn't require voice communication, but you should almost certainly be on a call or in person to discuss. </p>
                    <p> Traditionally, clues are a single word, cannot include any words on the board, must clue the meaning of the word (rather than things like location), and cannot be any word that has been said so far during the game. None of this is enforced by the game, though, so you can do whatever you agree on. </p>
                    <p> Similarly, the timer isn't enforced. You can keep playing if you want. It starts when someone draws the first card. </p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    )
}
