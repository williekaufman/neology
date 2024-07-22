import React, { useState, useEffect } from "react";
import { Button, TextField } from "@mui/material";
import Toast from "./Toast";
import { fetchWrapper, getUsername } from "./Helpers";
import { useNavigate } from "react-router-dom";
import HowToPlayDialog from "./HowToPlayDialog";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";

function TimerDropdown({ timer, setTimer }) {
  return (
    <FormControl>
      <InputLabel id="timer-select-label">Timer (minutes)</InputLabel>
      <Select
        labelId="timer-select-label"
        id="timer-select"
        value={timer}
        label="Timer (minutes)"
        onChange={(e) => setTimer(e.target.value)}
        style={{
          minWidth: "150px",
        }}
      >
        <MenuItem value={0}>No timer</MenuItem>
        {Array.from({ length: 10 }, (_, i) => 5 + i).map((value) => (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function LobbyPage() {
  let [gameId, setGameId] = useState("");
  let [message, setMessage] = useState(null);
  let [error, setError] = useState(null);
  let [howToPlayOpen, setHowToPlayOpen] = useState(false);
  let [timer, setTimer] = useState(9);
  let navigate = useNavigate();

  useEffect(() => {
    getUsername(setHowToPlayOpen, true);
  }, []);

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
    fetchWrapper("/new_game", { id, timer: timer * 60 }, "POST").then(
      (response) => {
        if (response.success) {
          navigate(`/game/${response.game.id}`);
        } else {
          showMessage(response.error, true);
        }
      },
    );
  }

  function joinGame(id) {
    fetchWrapper("/game", { id }, "GET").then((response) => {
      if (response.success) {
        navigate(`/game/${id}`);
      } else {
        showMessage(response.error, true);
      }
    });
  }

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        position: "fixed",
        left: 0,
        top: 10,
      }}
    >
      {error && <Toast message={error} onClose={() => setError(null)} />}
      {message && (
        <Toast
          message={message}
          onClose={() => setMessage(null)}
          isError={false}
        />
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
          <TextField
            label="Game ID"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
          />
          <TimerDropdown timer={timer} setTimer={setTimer} />
        </div>
        <Button variant="contained" onClick={() => setHowToPlayOpen(true)}>
          How to Play
        </Button>
        <Button variant="contained" onClick={() => newGame(gameId)}>
          New Game
        </Button>
        <Button variant="contained" onClick={() => joinGame(gameId)}>
          Join Game
        </Button>
      </div>
      <HowToPlayDialog
        open={howToPlayOpen}
        onClose={() => setHowToPlayOpen(false)}
      />
    </div>
  );
}
