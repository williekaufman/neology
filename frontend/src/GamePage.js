import React, { useState, useEffect } from "react";
import { baseURL } from "./Settings";
import { useParams, useNavigate } from "react-router-dom";
import { fetchWrapper, getUsername, getDisplayName } from "./Helpers";
import {
  createTheme,
  ThemeProvider,
  TextField,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button as MuiButton,
  Paper,
  useMediaQuery,
} from "@mui/material";
import io from "socket.io-client";
import Toast from "./Toast";
import HowToPlayDialog from "./HowToPlayDialog";
import "./GamePage.css";

function Button(props) {
  let isSmallScreen = useMediaQuery("(max-width:600px)");
  isSmallScreen = true;
  const size = isSmallScreen ? "small" : undefined;
  return <MuiButton {...props} size={size} />;
}

function label(rowIndex, columnIndex) {
  let rowLabel = String.fromCharCode(65 + rowIndex);
  let colLabel = columnIndex + 1;
  return `${rowLabel}${colLabel}`;
}

function CurrentClue({ game, username, isSmallScreen }) {
  let clue = game?.clue;
  if (!clue) return null;
  const isMine = clue.username === username;
  const className = `clue ${isMine ? "mine" : ""}`;
  const displayName = getDisplayName(clue.username);

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      gap={2}
      className={className}
      marginTop={2}
    >
      <Typography size={isSmallScreen ? "small" : "medium"}>
        {displayName || "Someone else"}'s clue{isMine ? " (yours)" : ""}:{" "}
        {clue.text}
      </Typography>
    </Box>
  );
}
function GameGrid({ game, guess, username, disableGuesses, isSmallScreen }) {
  let words = game.words;
  let currentCard = game.outstanding.filter(
    (clue) => clue.username === username,
  )?.[0]?.square;

  const handleButtonClick = (row, col) => {
    if (!disableGuesses) {
      guess(row, col);
    }
  };

  function isMyCard(rowIndex, columnIndex) {
    return (
      currentCard && currentCard.x === columnIndex && currentCard.y === rowIndex
    );
  }

  function isUsed(rowIndex, columnIndex) {
    return (
      game.correct.filter(
        (square) => square.x === columnIndex && square.y === rowIndex,
      ).length > 0
    );
  }

  let isMyClue = game?.clue?.username === username;

  function isDisabled(rowIndex, columnIndex) {
    return (
      disableGuesses ||
      !game.clue ||
      isUsed(rowIndex, columnIndex) ||
      isMyCard(rowIndex, columnIndex) ||
      isMyClue
    );
  }
  const theme = createTheme({
    palette: {
      background: {
        default: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
      },
      primary: {
        main: "#ff1744",
      },
      secondary: {
        main: "#2979ff",
      },
      text: {
        primary: "#333",
        secondary: "#555",
      },
    },
    components: {
      MuiTableCell: {
        styleOverrides: {
          root: {
            border: "2px solid black",
            borderRadius: "5px",
            backgroundColor: "white",
          },
        },
      },
      MuiPaper: {
        styleOverrides: isSmallScreen
          ? { root: { backgroundColor: "inherit" } }
          : {
              root: {
                backgroundColor: "lightblue",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 8px 16px 0 rgba(0,0,0,0.2)",
              },
            },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <TableContainer component={Paper} className="table-container">
        <Table aria-label="word grid">
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                sx={{ border: "none", visibility: "hidden" }}
              />
              {words.horizontal.map((word, index) => (
                <TableCell
                  key={index}
                  align="center"
                  sx={{
                    minWidth: isSmallScreen ? "40px" : "80px",
                    borderRadius: "5px",
                    backgroundColor: "orange",
                    fontWeight: "bold",
                  }}
                >
                  {word}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {words.vertical.map((word, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell
                  component="th"
                  scope="row"
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    borderRadius: "5px",
                    backgroundColor: "orange",
                  }}
                >
                  {word}
                </TableCell>
                {Array.from({ length: 5 }).map((_, colIndex) => (
                  <TableCell
                    key={colIndex}
                    align="center"
                    className="button-cell"
                    sx={{
                      borderRadius: "5px",
                      backgroundColor: isMyCard(rowIndex, colIndex)
                        ? "red"
                        : isUsed(rowIndex, colIndex)
                          ? "lightgreen"
                          : "white",
                      padding: "0px",
                    }}
                  >
                    <Button
                      onClick={() => handleButtonClick(rowIndex, colIndex)}
                      disabled={isDisabled(rowIndex, colIndex)}
                      sx={{
                        color: "black",
                        height: "100%",
                        padding: isSmallScreen ? "4px" : "8px",
                        fontSize: isSmallScreen ? "12px" : "inherit",
                      }}
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
}

function ClueUI({ game, giveClue, isSmallScreen }) {
  let [clue, setClue] = useState("");

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
    setClue("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        gap={2}
        marginTop={2}
      >
        <TextField
          size={isSmallScreen ? "small" : "medium"}
          variant="outlined"
          value={clue}
          onChange={handleChange}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!clue}
        >
          Give Clue
        </Button>
      </Box>
    </form>
  );
}

function Game({
  backToLobby,
  game,
  username,
  refresh,
  guess,
  drawCard,
  giveClue,
  isSmallScreen,
}) {
  let [remainingTime, setRemainingTime] = useState(game?.remainingTime);
  let [backgroundColor, setBackgroundColor] = useState("inherit");
  let [disableGuesses, setDisableGuesses] = useState(false);
  let [fadeClass, setFadeClass] = useState("");

  useEffect(() => {
    let interval = setInterval(() => {
      setRemainingTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (game?.remainingTime === undefined) return;
    setRemainingTime(game?.remainingTime);
  }, [game?.remainingTime]);

  useEffect(() => {
    if (game?.clue && game.clue.username !== username) {
      setFadeClass("fade-background");
      setDisableGuesses(true);
      setTimeout(() => {
        setFadeClass("");
        setDisableGuesses(false);
      }, 3000);
    }
  }, [game?.clue, username]);

  if (!game) {
    return null;
  }

  let displayTime =
    game?.remainingTime !== 0 && !game?.remainingTime
      ? ""
      : remainingTime <= 0
        ? "0:00"
        : !remainingTime
          ? ""
          : Math.floor(remainingTime / 60) +
            ":" +
            ("0" + Math.floor(remainingTime % 60)).slice(-2);

  if (game.finalScore !== undefined) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        <Typography variant="h4">Game Over</Typography>
        <Typography variant="h5">Score: {game.finalScore}</Typography>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Button variant="contained" onClick={refresh}>
            Play Again
          </Button>
          <Button variant="contained" onClick={backToLobby}>
            Back to Lobby
          </Button>
        </div>
        <GameGrid
          game={game}
          guess={guess}
          username={username}
          disableGuesses={disableGuesses}
          isSmallScreen={isSmallScreen}
        />
      </div>
    );
  }

  let myCard = game.outstanding.filter(
    (clue) => clue.username === username,
  )?.[0]?.square;

  return (
    <div className={`game-container ${fadeClass}`} style={{ backgroundColor }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button
          disabled={!!myCard}
          variant="contained"
          onClick={drawCard}
          style={{
            margin: isSmallScreen ? "0px" : "10px",
            color: !!myCard ? "black" : "white",
          }}
        >
          {myCard ? `${label(myCard.y, myCard.x)}` : "Draw Card"}
          {` (${game?.deck?.squares?.length} remaining)`}
        </Button>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <Typography
            variant="h4"
            style={{
              minWidth: isSmallScreen ? "50px" : "100px",
              textAlign: "center",
              color: displayTime === "0:00" ? "red" : "black",
            }}
          >
            {displayTime}
          </Typography>
          {displayTime === "0:00" && (
            <Button variant="contained" onClick={refresh}>
              Start New Game
            </Button>
          )}
        </div>
      </div>
      <CurrentClue
        game={game}
        username={username}
        isSmallScreen={isSmallScreen}
      />
      <ClueUI
        game={game}
        username={username}
        giveClue={giveClue}
        isSmallScreen={isSmallScreen}
      />
      <GameGrid
        game={game}
        guess={guess}
        username={username}
        isSmallScreen={isSmallScreen}
        disableGuesses={disableGuesses}
      />
    </div>
  );
}

export default function GamePage() {
  let { id } = useParams();
  let [socket, setSocket] = useState(null);
  let [game, setGame] = useState(null);
  let [message, setMessage] = useState("");
  let [error, setError] = useState(null);
  let [howToPlayOpen, setHowToPlayOpen] = useState(false);
  let navigate = useNavigate();
  let isSmallScreen = useMediaQuery("(max-width:600px)");
  isSmallScreen = true;

  function backToLobby() {
    navigate("/");
  }

  let username = getUsername(setHowToPlayOpen);

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
      setSocket(io.connect(baseURL));
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.emit("join", { room: id });
      socket.on("disconnect", () => {
        setSocket(null);
      });
      socket.on("update", (data) => {
        setGame(data.game);
        if (data.correct !== undefined) {
          if (data.correct) {
            showMessage(`Correct guess!`, false);
          } else {
            showMessage(`Incorrect guess!`, true);
          }
        }
      });
    }

    return () => {
      if (socket) {
        socket.emit("leave", { room: id });
        socket.off("disconnect");
        socket.off("update");
      }
    };
  }, [socket, id]);

  useEffect(() => {
    fetchWrapper("/game", { id }, "GET").then((response) => {
      if (response.success) {
        setGame(response.game);
      } else {
        showMessage(response.error, true);
      }
    });
  }, [id]);

  function guess(row, col) {
    fetchWrapper("/guess", { id, row, col, username }).then((response) => {
      if (response.success) {
        setGame(response.game);
      } else {
        showMessage(response.error, true);
      }
    });
  }

  function drawCard() {
    fetchWrapper("/draw_card", { id, username }).then((response) => {
      if (response.success) {
        setGame(response.game);
      } else {
        showMessage(response.error, true);
      }
    });
  }

  function giveClue(clue) {
    fetchWrapper("/give_clue", { id, username, clue }).then((response) => {
      if (response.success) {
        setGame(response.game);
      } else {
        showMessage(response.error, true);
      }
    });
  }

  function refresh() {
    fetchWrapper("/refresh", { id }, "POST").then((response) => {
      if (response.success) {
        setGame(response.game);
      } else {
        showMessage(response.error, true);
      }
    });
  }

  const handleToastClick = () => {
    setMessage("");
    setError(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isSmallScreen ? "10px" : "20px",
      }}
    >
      {error && (
        <Toast
          message={error}
          isError={true}
          size={isSmallScreen ? "small" : "medium"}
          onClick={handleToastClick}
        />
      )}
      {message && (
        <Toast
          message={message}
          isError={false}
          size={isSmallScreen ? "small" : "medium"}
          onClick={handleToastClick}
        />
      )}
      <Game
        game={game}
        guess={guess}
        drawCard={drawCard}
        giveClue={giveClue}
        username={username}
        refresh={refresh}
        backToLobby={backToLobby}
        isSmallScreen={isSmallScreen}
      />
      <HowToPlayDialog
        open={howToPlayOpen}
        onClose={() => setHowToPlayOpen(false)}
      />
    </div>
  );
}
