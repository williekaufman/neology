import React from "react";
import "./Toast.css";
import { Button, Typography } from "@mui/material";

const Toast = ({
  message,
  onClose,
  style,
  isError = true,
  size = "medium",
  onClick,
}) => {
  return (
    <div
      className={isError ? "error-toast" : "happy-toast"}
      style={style}
      onClick={onClick}
    >
      <div className="error-toast-content">
        <Typography
          className="error-toast-message"
          sx={{ fontSize: size === "small" ? "0.75rem" : "1rem" }}
        >
          {message}
        </Typography>
        <Button className="error-toast-close no-hover" onClick={onClose}>
          &times;
        </Button>
      </div>
    </div>
  );
};

export default Toast;
